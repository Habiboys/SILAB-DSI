<?php

namespace App\Http\Middleware;

use App\Services\NavigationContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\RedirectResponse;

class PreserveNavigationContext
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        if (!$request->user() || $request->isMethod('GET') || !$response instanceof RedirectResponse) {
            return $response;
        }

        $location = $response->getTargetUrl();
        $target = $this->internalParts($location, $request);
        if (!$target || preg_match('#/(?:login|logout|register|password|verify-email)(?:/|$)#', $target['path'] ?? '')) {
            return $response;
        }

        parse_str($target['query'] ?? '', $query);
        $context = NavigationContext::forRequest($request);
        $stack = $request->header('X-Silab-Return-Stack', '[]');
        $candidates = strlen($stack) <= 8192 ? json_decode($stack, true) : [];
        $candidates = is_array($candidates) ? array_slice($candidates, 0, 8) : [];
        $candidates[] = $request->header('X-Silab-Return-To', '');
        $return = null;
        foreach ($candidates as $candidate) {
            if (!is_string($candidate)) {
                continue;
            }
            $parts = $this->internalParts($candidate, $request);
            if ($parts && ($parts['path'] ?? '/') === ($target['path'] ?? '/')) {
                $return = $parts;
                break;
            }
        }
        if ($return && ($return['path'] ?? '/') === ($target['path'] ?? '/')) {
            parse_str($return['query'] ?? '', $previousQuery);
            $compatible = true;
            foreach (['lab_id', 'kepengurusan_lab_id'] as $key) {
                if (isset($context[$key], $previousQuery[$key]) && (string) $context[$key] !== (string) $previousQuery[$key]) {
                    $compatible = false;
                }
            }
            if ($compatible) {
                $query = array_merge($previousQuery, $query);
            }
        }
        foreach ($context as $key => $value) {
            if (!isset($query[$key])) {
                $query[$key] = $value;
            }
        }

        $base = explode('?', explode('#', $location)[0])[0];
        $response->setTargetUrl($base . ($query ? '?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986) : '') . (isset($target['fragment']) ? '#' . $target['fragment'] : ''));
        return $response;
    }

    private function internalParts(string $url, Request $request): ?array
    {
        $parts = parse_url($url);
        if (!$parts || isset($parts['user']) || isset($parts['pass']) || str_starts_with($url, '//')) {
            return null;
        }
        if (isset($parts['host']) && (($parts['scheme'] ?? '') !== $request->getScheme() || $parts['host'] !== $request->getHost() || ($parts['port'] ?? ($parts['scheme'] === 'https' ? 443 : 80)) !== $request->getPort())) {
            return null;
        }
        if (!isset($parts['host']) && !str_starts_with($url, '/')) {
            return null;
        }
        return $parts;
    }
}
