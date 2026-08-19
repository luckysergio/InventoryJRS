<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Place\StorePlaceRequest;
use App\Http\Requests\Place\UpdatePlaceRequest;
use App\Http\Resources\PlaceResource;
use App\Models\Place;
use App\Services\Place\PlaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PlaceController extends Controller
{
    public function __construct(
        protected PlaceService $placeService
    ) {}

    /**
     * GET /api/places
     * ✅ FIX: Support pagination + search + meta structure
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = min((int) $request->input('per_page', 20), 50);
            $page = max((int) $request->input('page', 1), 1);
            $search = $request->input('search');

            $result = $this->placeService->getList(
                search: $search,
                perPage: $perPage,
                page: $page
            );

            return response()->json([
                'status' => true,
                'data' => PlaceResource::collection($result['data']),
                'meta' => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Place index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data tempat.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * GET /api/places/dropdown
     */
    public function dropdown(): JsonResponse
    {
        try {
            return response()->json([
                'status' => true,
                'data' => $this->placeService->getForDropdown(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Place dropdown error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data dropdown tempat.',
            ], 500);
        }
    }

    /**
     * GET /api/places/{place}
     */
    public function show(Place $place): JsonResponse
    {
        try {
            return response()->json([
                'status' => true,
                'data' => new PlaceResource($place),
            ]);
        } catch (\Throwable $e) {
            Log::error('Place show error', ['id' => $place->id, 'error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat detail tempat.',
            ], 500);
        }
    }

    /**
     * POST /api/places
     */
    public function store(StorePlaceRequest $request): JsonResponse
    {
        try {
            $place = $this->placeService->create($request->validated());

            $this->placeService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Tempat berhasil dibuat.',
                'data' => new PlaceResource($place),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Place store error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal membuat tempat.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * PUT /api/places/{place}
     */
    public function update(UpdatePlaceRequest $request, Place $place): JsonResponse
    {
        try {
            $updated = $this->placeService->update($place, $request->validated());

            $this->placeService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Tempat berhasil diperbarui.',
                'data' => new PlaceResource($updated),
            ]);
        } catch (\Throwable $e) {
            Log::error('Place update error', ['id' => $place->id, 'error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memperbarui tempat.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * DELETE /api/places/{place}
     */
    public function destroy(Place $place): JsonResponse
    {
        try {
            $result = $this->placeService->delete($place);

            if ($result['success']) {
                $this->placeService->invalidateCache();
            }

            return response()->json([
                'status' => $result['success'],
                'message' => $result['message'],
            ], $result['success'] ? 200 : ($result['code'] ?? 400));
        } catch (\Throwable $e) {
            Log::error('Place destroy error', ['id' => $place->id, 'error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal menghapus tempat.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}