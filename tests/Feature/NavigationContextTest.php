<?php

namespace Tests\Feature;

use App\Http\Middleware\CheckLabAccess;
use App\Http\Middleware\PreserveNavigationContext;
use App\Models\Kegiatan;
use App\Models\KepengurusanLab;
use App\Models\Laboratorium;
use App\Models\Proker;
use App\Models\User;
use App\Services\NavigationContext;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class NavigationContextTest extends TestCase
{
    private function request(string $method = 'POST'): Request
    {
        $request = Request::create('http://localhost/kegiatan/activity', $method);
        $period = new KepengurusanLab(['laboratorium_id' => 'lab-a']);
        $period->id = 'period-a';
        $route = new Route([$method], 'kegiatan/{kegiatan}', fn () => null);
        $route->bind($request);
        $route->setParameter('kegiatan', $period);
        $request->setRouteResolver(fn () => $route);
        $user = new class extends User {
            public function getCurrentLab() { $lab = new Laboratorium(); $lab->id = 'lab-a'; return ['laboratorium' => $lab]; }
        };
        $request->setUserResolver(fn () => $user);
        return $request;
    }

    public function test_context_comes_from_bound_entity_instead_of_query(): void
    {
        $request = $this->request();
        $request->query->set('lab_id', 'lab-b');
        $this->assertSame(['lab_id' => 'lab-a', 'kepengurusan_lab_id' => 'period-a'], NavigationContext::forRequest($request));
    }

    public function test_nested_activity_uses_its_own_proker_and_period(): void
    {
        $period = new KepengurusanLab(['laboratorium_id' => 'lab-b']);
        $period->id = 'period-b';
        $proker = new Proker(['kepengurusan_lab_id' => 'period-b']);
        $proker->setRelation('kepengurusanLab', $period);
        $activity = new Kegiatan();
        $activity->setRelation('proker', $proker);
        $this->assertSame(['lab_id' => 'lab-b', 'kepengurusan_lab_id' => 'period-b'], NavigationContext::forModel($activity));
    }

    public function test_redirect_restores_filters_and_entity_context(): void
    {
        $request = $this->request();
        $request->headers->set('X-Silab-Return-To', '/kegiatan?status=diajukan&page=3&search=robot&lab_id=lab-a');
        $response = (new PreserveNavigationContext())->handle($request, fn () => new RedirectResponse('/kegiatan'));
        parse_str(parse_url($response->getTargetUrl(), PHP_URL_QUERY), $query);
        $this->assertSame(['status' => 'diajukan', 'page' => '3', 'search' => 'robot', 'lab_id' => 'lab-a', 'kepengurusan_lab_id' => 'period-a'], $query);
    }

    public function test_redirect_does_not_copy_another_lab_or_an_external_return_url(): void
    {
        foreach (['/kegiatan?lab_id=lab-b&search=secret', 'https://external.test/kegiatan?search=secret', '//external.test/kegiatan?search=secret'] as $return) {
            $request = $this->request();
            $request->headers->set('X-Silab-Return-To', $return);
            $response = (new PreserveNavigationContext())->handle($request, fn () => new RedirectResponse('/kegiatan'));
            $this->assertStringNotContainsString('search=', $response->getTargetUrl());
            $this->assertStringStartsWith('/kegiatan?', $response->getTargetUrl());
        }
    }

    public function test_get_and_external_redirects_are_unchanged(): void
    {
        $middleware = new PreserveNavigationContext();
        $this->assertSame('/kegiatan', $middleware->handle($this->request('GET'), fn () => new RedirectResponse('/kegiatan'))->getTargetUrl());
        $this->assertSame('https://external.test/', $middleware->handle($this->request(), fn () => new RedirectResponse('https://external.test/'))->getTargetUrl());
    }

    public function test_update_redirect_can_restore_list_beyond_the_detail_origin(): void
    {
        $request = $this->request();
        $request->headers->set('X-Silab-Return-Stack', json_encode(['/kegiatan/activity?lab_id=lab-a', '/kegiatan?lab_id=lab-a&page=4&status=all']));
        $response = (new PreserveNavigationContext())->handle($request, fn () => new RedirectResponse('/kegiatan'));
        $this->assertStringContainsString('page=4', $response->getTargetUrl());
        $this->assertStringContainsString('status=all', $response->getTargetUrl());
    }

    public function test_cross_lab_bound_resource_is_forbidden_even_without_lab_query(): void
    {
        $request = $this->request('GET');
        $period = new KepengurusanLab(['laboratorium_id' => 'lab-b']);
        $period->id = 'period-b';
        $request->route()->setParameter('kegiatan', $period);
        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Unauthorized laboratory access');
        (new CheckLabAccess())->handle($request, fn () => response('ok'));
    }
}
