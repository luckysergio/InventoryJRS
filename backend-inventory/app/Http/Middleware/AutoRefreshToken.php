<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Log;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Symfony\Component\HttpFoundation\Response;

class AutoRefreshToken
{
    private const REFRESH_THRESHOLD = 600; // 10 menit

    public function handle(Request $request, Closure $next): Response
    {
        try {
            $token = JWTAuth::parseToken()->getToken();

            if (!$token) {
                return $next($request);
            }

            $payload = JWTAuth::setToken($token)->getPayload();
            $exp = $payload->get('exp');
            $now = time();
            $timeLeft = $exp - $now;

            if ($timeLeft > 0 && $timeLeft < self::REFRESH_THRESHOLD) {
                $newToken = JWTAuth::refresh($token);

                $newPayload = JWTAuth::setToken($newToken)->getPayload();
                $newTtl = $newPayload->get('exp') - time();

                /** @var Response $response */
                $response = $next($request);

                $response->headers->set('X-Token-Refreshed', 'true');
                $response->headers->set('X-Token-Expires-In', (string) $newTtl);
                $response->headers->set('Authorization', 'Bearer ' . $newToken);


                return $response;
            }

        } catch (TokenExpiredException $e) {
            try {
                $token = JWTAuth::getToken();
                $newToken = JWTAuth::refresh($token);

                $response = $next($request);
                $response->headers->set('X-Token-Refreshed', 'true');
                $response->headers->set('Authorization', 'Bearer ' . $newToken);
                return $response;
            } catch (JWTException $e) {
                Log::warning('AutoRefresh: refresh failed', ['error' => $e->getMessage()]);
            }
        } catch (JWTException $e) {
        }

        return $next($request);
    }
}