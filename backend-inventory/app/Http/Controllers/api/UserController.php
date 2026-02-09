<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::select('id', 'name', 'email', 'role', 'created_at');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderByDesc('created_at')->paginate(10);

        return response()->json([
            'status' => true,
            'data'   => $users
        ]);
    }

    public function show($id)
    {
        $user = User::select('id', 'name', 'email', 'role', 'created_at')->find($id);

        if (!$user) {
            return response()->json([
                'status'  => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data'   => $user
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make(
            $request->all(),
            [
                'name'     => 'required|string|max:100',
                'email'    => 'required|email|unique:users,email',
                'password' => [
                    'required',
                    'string',
                    'min:6',
                    'regex:/[!_]/'
                ],
                'role'     => 'required|in:admin,admin_toko,operator'
            ],
            [
                'password.regex' => 'Password wajib mengandung karakter ! atau _'
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'User berhasil dibuat',
            'data'    => $user->only(['id', 'name', 'email', 'role'])
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status'  => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make(
            $request->all(),
            [
                'name'     => 'sometimes|required|string|max:100',
                'email'    => 'sometimes|required|email|unique:users,email,' . $user->id,
                'password' => [
                    'nullable',
                    'string',
                    'min:6',
                    'regex:/[!_]/'
                ],
                'role'     => 'sometimes|required|in:admin,admin_toko,operator'
            ],
            [
                'password.regex' => 'Password wajib mengandung karakter ! atau _'
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->only(['name', 'email', 'role']);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json([
            'status'  => true,
            'message' => 'User berhasil diperbarui',
            'data'    => $user->only(['id', 'name', 'email', 'role'])
        ]);
    }

    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status'  => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        $userLogin = JWTAuth::parseToken()->authenticate();

        if ($userLogin->id === $user->id) {
            return response()->json([
                'status'  => false,
                'message' => 'Tidak bisa menghapus akun sendiri'
            ], 403);
        }

        $user->delete();

        return response()->json([
            'status'  => true,
            'message' => 'User berhasil dihapus'
        ]);
    }
}
