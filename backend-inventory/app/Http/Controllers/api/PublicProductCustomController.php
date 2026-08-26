<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Services\ProductCustomer\ProductCustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PublicProductCustomController extends Controller
{
    public function __construct(
        protected ProductCustomerService $productCustomerService
    ) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $perPage    = min((int) $request->input('per_page', 15), 50);
            $page       = max((int) $request->input('page', 1), 1);
            $search     = $request->input('search');
            $customerId = $request->input('customer_id') ? (int) $request->input('customer_id') : null;

            $result = $this->productCustomerService->getList(
                search: $search,
                customerId: $customerId,
                perPage: $perPage,
                page: $page,
            );

            return response()->json([
                'status'  => true,
                'message' => 'Berhasil mengambil produk custom',
                'data'    => $result['data'],
                'meta'    => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('PublicProductCustom index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat produk custom',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $item = $this->productCustomerService->getDetail($id);

            if (!$item) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Produk custom tidak ditemukan',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data'   => $item,
            ]);
        } catch (\Throwable $e) {
            Log::error('PublicProductCustom show error', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat detail produk custom',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function forCustomer(int $customerId, Request $request): JsonResponse
    {
        try {
            $perPage = min((int) $request->input('per_page', 15), 50);
            $page    = max((int) $request->input('page', 1), 1);
            $search  = $request->input('search');

            $result = $this->productCustomerService->getList(
                search: $search,
                customerId: $customerId,
                perPage: $perPage,
                page: $page,
            );

            return response()->json([
                'status'  => true,
                'message' => 'Berhasil mengambil produk untuk customer',
                'data'    => $result['data'],
                'meta'    => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('PublicProductCustom forCustomer error', [
                'customer_id' => $customerId,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat produk customer',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}