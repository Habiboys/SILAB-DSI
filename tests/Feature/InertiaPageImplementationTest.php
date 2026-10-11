<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class InertiaPageImplementationTest extends TestCase
{
    public function test_literal_inertia_pages_used_by_registered_handlers_exist(): void
    {
        $checked = [];
        $missing = [];
        $pagesChecked = 0;
        foreach (Route::getRoutes() as $route) {
            $action = $route->getActionName();
            if (!str_contains($action, '@') || isset($checked[$action])) continue;
            $checked[$action] = true;
            [$class, $method] = explode('@', $action, 2);
            if (!method_exists($class, $method)) continue;
            $reflection = new \ReflectionMethod($class, $method);
            $source = implode('', array_slice(file($reflection->getFileName()), $reflection->getStartLine() - 1,
                $reflection->getEndLine() - $reflection->getStartLine() + 1));
            preg_match_all('/Inertia::render\(\s*[\'\"]([^\'\"]+)[\'\"]/', $source, $matches);
            foreach ($matches[1] as $page) {
                $pagesChecked++;
                if (!file_exists(resource_path('js/Pages/'.$page.'.jsx'))) $missing[] = "{$action}: {$page}";
            }
        }
        $this->assertGreaterThan(0, $pagesChecked);
        $this->assertSame([], $missing, 'Registered handlers reference missing Inertia pages');
    }
}
