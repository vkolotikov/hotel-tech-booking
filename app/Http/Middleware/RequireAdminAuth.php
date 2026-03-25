<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireAdminAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        // Check SaaS auth first
        if ($request->attributes->get('saas_authenticated')) {
            return $next($request);
        }

        // Check gateway headers
        $gatewayUserId = $request->header('X-Saas-User-Id');
        if ($gatewayUserId) {
            $request->attributes->set('saas_authenticated', true);
            $request->attributes->set('saas_user_id', $gatewayUserId);
            $request->attributes->set('saas_user_email', $request->header('X-Saas-User-Email', ''));
            $request->attributes->set('saas_org_id', $request->header('X-Saas-Org-Id', ''));
            return $next($request);
        }

        // Check Bearer JWT (SaaS platform token)
        $authHeader = $request->header('Authorization', '');
        if ($authHeader && str_starts_with(strtolower($authHeader), 'bearer ')) {
            $token = trim(substr($authHeader, 7));
            if ($token !== '') {
                $sdkPath = base_path('../../../../saas/packages/auth-sdk/php/SaasAuth.php');
                if (file_exists($sdkPath)) {
                    require_once $sdkPath;
                    $auth = new \SaasAuth([
                        'platform_url' => config('services.saas.platform_url'),
                        'jwt_secret'   => config('services.saas.jwt_secret'),
                    ]);
                    $result = $auth->verifyToken($token);
                    if ($result['valid'] ?? false) {
                        $request->attributes->set('saas_authenticated', true);
                        $request->attributes->set('saas_user_id', $result['user']['id'] ?? '');
                        $request->attributes->set('saas_user_email', $result['user']['email'] ?? '');
                        return $next($request);
                    }
                }
            }
        }

        // Check session auth
        if (session('admin_user_id')) {
            return $next($request);
        }

        return response()->json(['error' => 'Authentication required'], 401);
    }
}
