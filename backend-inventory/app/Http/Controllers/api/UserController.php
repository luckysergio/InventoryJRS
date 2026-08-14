<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use App\Services\User\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        protected UserService $userService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 10), 100);
        $page = max((int) $request->input('page', 1), 1);

        $users = $this->userService->getList(
            search: $request->input('search'),
            perPage: $perPage,
            page: $page
        );

        return response()->json([
            'status' => true,
            'data'   => $users,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $user = $this->userService->getDetail($id);

        if (!$user) {
            return response()->json([
                'status'  => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data'   => $user,
        ]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->userService->create($request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'User berhasil dibuat.',
            'data'    => $user->only(['id', 'name', 'email', 'role']),
        ], 201);
    }

    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status'  => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $updatedUser = $this->userService->update($user, $request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'User berhasil diperbarui.',
            'data'    => $updatedUser->only(['id', 'name', 'email', 'role']),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status'  => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $currentUser = $request->user();
        $result = $this->userService->delete($user, $currentUser);

        return response()->json([
            'status'  => $result['success'],
            'message' => $result['message'],
        ], $result['success'] ? 200 : $result['code']);
    }
}