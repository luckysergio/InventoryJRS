<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class ResetPasswordController extends Controller
{
    public function reset(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|confirmed|min:8'
        ]);

        $key = 'reset-password:' . $request->ip() . '|' . strtolower($request->email);

        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages([
                'message' => 'Terlalu banyak percobaan reset password. Silakan coba lagi nanti.'
            ])->status(429);
        }

        RateLimiter::hit($key, 120); // 2 menit cooldown

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->password = Hash::make($password);
                $user->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            RateLimiter::clear($key); // reset limiter jika sukses

            return response()->json([
                'message' => 'Password berhasil direset. Silakan login.'
            ]);
        }

        return response()->json([
            'message' => 'Reset password gagal. Pastikan link valid dan belum kedaluwarsa.'
        ], 400);
    }
}
