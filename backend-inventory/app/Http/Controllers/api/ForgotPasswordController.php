<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class ForgotPasswordController extends Controller
{
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $key = 'forgot-password:' . $request->ip() . '|' . strtolower($request->email);

        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages([
                'email' => 'Terlalu banyak percobaan. Silakan coba lagi dalam beberapa menit.'
            ])->status(429);
        }

        RateLimiter::hit($key, 60); // lock selama 60 detik

        Password::sendResetLink(
            $request->only('email')
        );

        return response()->json([
            'message' => 'Jika email terdaftar, link reset password akan dikirim.'
        ]);
    }
}
