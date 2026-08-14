<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Distributor\StoreDistributorRequest;
use App\Http\Requests\Distributor\UpdateDistributorRequest;
use App\Models\Distributor;
use App\Services\Distributor\DistributorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DistributorController extends Controller
{
    public function __construct(
        protected DistributorService $distributorService
    ) {}

    public function index(Request $request): JsonResponse
    {
        // ✅ Batasi per_page maksimal 50 untuk mencegah abuse
        $perPage = min((int) $request->input('per_page', 20), 50);
        $page = max((int) $request->input('page', 1), 1);

        $data = $this->distributorService->getList(
            search: $request->input('search'),
            perPage: $perPage,
            page: $page
        );

        return response()->json([
            'status' => true,
            'data'   => $data,
        ]);
    }

    public function show(Distributor $distributor): JsonResponse
    {
        $detail = $this->distributorService->getDetail($distributor->id);

        return response()->json([
            'status' => true,
            'data'   => $detail,
        ]);
    }

    public function store(StoreDistributorRequest $request): JsonResponse
    {
        $distributor = $this->distributorService->create($request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Distributor berhasil dibuat.',
            'data'    => $distributor,
        ], 201);
    }

    public function update(UpdateDistributorRequest $request, Distributor $distributor): JsonResponse
    {
        $updatedDistributor = $this->distributorService->update($distributor, $request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Distributor berhasil diperbarui.',
            'data'    => $updatedDistributor,
        ]);
    }

    public function destroy(Distributor $distributor): JsonResponse
    {
        $result = $this->distributorService->delete($distributor);

        if (!$result['success']) {
            return response()->json([
                'status'  => false,
                'message' => $result['message'],
            ], $result['code']);
        }

        return response()->json([
            'status'  => true,
            'message' => $result['message'],
        ]);
    }
}