<?php

require __DIR__.'/AuditEnvironment.php';
use Illuminate\Support\Facades\Route;

$routes = [];
foreach (Route::getRoutes() as $route) {
    $routes[] = ['domain' => $route->getDomain(), 'method' => implode('|', $route->methods()), 'uri' => $route->uri(),
        'name' => $route->getName(), 'action' => $route->getActionName(), 'middleware' => $route->gatherMiddleware()];
}
file_put_contents(dirname(__DIR__, 2).'/.audit/route-catalog.json', json_encode($routes, JSON_PRETTY_PRINT));
echo count($routes)." registered routes catalogued.\n";
