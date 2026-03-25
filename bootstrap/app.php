<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(\App\Http\Middleware\Cors::class);
        $middleware->alias([
            'admin.auth' => \App\Http\Middleware\RequireAdminAuth::class,
        ]);
        $middleware->append(\App\Http\Middleware\RequestIdMiddleware::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $debug = config('app.debug');
                return response()->json([
                    'success' => false,
                    'error'   => [
                        'code'    => 'server_error',
                        'message' => $debug ? $e->getMessage() : 'An unexpected error occurred.',
                        'details' => $debug ? [['field' => 'trace', 'message' => (string) $e]] : [],
                    ],
                ], method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500);
            }
        });
    })->create();
