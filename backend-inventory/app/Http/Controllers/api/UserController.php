<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\User\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        protected UserService $userService
    ) {
    }

    /**
     * GET /api/users
     * Authorization: Admin only (via route middleware 'role:admin')
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 10), 100);
        $page = max((int) $request->input('page', 1), 1);
        $search = $request->input('search');
        $role = $request->input('role');

        $result = $this->userService->getList(
            search: $search,
            perPage: $perPage,
            page: $page,
            role: $role
        );

        return response()->json([
            'status' => true,
            'data' => UserResource::collection($result['data']),
            'meta' => $result['meta'],
        ]);
    }

    /**
     * GET /api/users/{id}
     */
    public function show(int $id): JsonResponse
    {
        $user = $this->userService->getDetail($id);

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => new UserResource($user),
        ]);
    }

    /**
     * POST /api/users
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->userService->create($request->validated());

        return response()->json([
            'status' => true,
            'message' => 'User berhasil dibuat.',
            'data' => new UserResource($user),
        ], 201);
    }

    /**
     * PUT /api/users/{id}
     */
    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $updatedUser = $this->userService->update($user, $request->validated());

        return response()->json([
            'status' => true,
            'message' => 'User berhasil diperbarui.',
            'data' => new UserResource($updatedUser),
        ]);
    }

    /**
     * DELETE /api/users/{id}
     * Business rules: Cannot delete self, cannot delete admin (handled in UserService)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $currentUser = $request->user();

        $result = $this->userService->delete($user, $currentUser);

        return response()->json([
            'status' => $result['success'],
            'message' => $result['message'],
        ], $result['success'] ? 200 : $result['code']);
    }

    /**
     * GET /api/users/statistics
     * Get user count by role.
     */
    public function statistics(): JsonResponse
    {
        $countByRole = $this->userService->getCountByRole();

        return response()->json([
            'status' => true,
            'data' => [
                'count_by_role' => $countByRole,
                'total_users' => array_sum($countByRole),
            ],
        ]);
    }
}