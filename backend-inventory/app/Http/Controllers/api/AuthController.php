<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\RateLimiter;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:100',
            'email'    => 'required|string|email|unique:users,email',
            'password' => 'required|string|min:6'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password)
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'status'  => true,
            'message' => 'Registrasi berhasil',
            'user'    => $user,
            'token'   => $token
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Data tidak valid'
            ], 422);
        }

        $key = strtolower($request->email) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);

            return response()->json([
                'status'  => false,
                'message' => 'Terlalu banyak percobaan login. Coba lagi dalam '
                            . ceil($seconds / 60) . ' menit.'
            ], 429);
        }

        $credentials = $request->only('email', 'password');

        if (!$token = JWTAuth::attempt($credentials)) {

            RateLimiter::hit($key, 600);
            usleep(500000);

            return response()->json([
                'status'  => false,
                'message' => 'Email atau password salah'
            ], 422);
        }

        RateLimiter::clear($key);

        return response()->json([
            'status'  => true,
            'message' => 'Login berhasil',
            'user'    => JWTAuth::user(),
            'token'   => $token
        ]);
    }

    public function profile()
    {
        return response()->json([
            'status' => true,
            'user'   => JWTAuth::user()
        ]);
    }

    public function logout()
    {
        JWTAuth::invalidate(JWTAuth::getToken());

        return response()->json([
            'status'  => true,
            'message' => 'Logout berhasil'
        ]);
    }

    public function refresh()
    {
        $token = JWTAuth::refresh(JWTAuth::getToken());

        return response()->json([
            'status' => true,
            'token'  => $token
        ]);
    }
}
