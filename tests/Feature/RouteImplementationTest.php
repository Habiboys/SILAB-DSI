<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class RouteImplementationTest extends TestCase
{
    public function test_every_registered_controller_route_has_an_implemented_handler(): void
    {
        foreach (Route::getRoutes() as $route) {
            $action = $route->getActionName();
            if (!str_contains($action, '@')) continue;
            [$class, $method] = explode('@', $action, 2);
            $this->assertTrue(method_exists($class, $method), "Route {$route->getName()} points to missing {$action}");
            $this->assertTrue((new \ReflectionMethod($class, $method))->isPublic(), "Route {$route->getName()} handler must be public");
        }
    }
}
