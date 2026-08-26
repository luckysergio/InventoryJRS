<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Services\PublicProduct\PublicProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PublicProductController extends Controller
{
    public function __construct(
        protected PublicProductService $publicProductService
    ) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = min((int) $request->input('per_page', 12), 50);
            $page    = max((int) $request->input('page', 1), 1);

            $result = $this->publicProductService->getList(
                search: $request->input('search'),
                jenisId: $request->input('jenis_id') ? (int) $request->input('jenis_id') : null,
                typeId: $request->input('type_id') ? (int) $request->input('type_id') : null,
                perPage: $perPage,
                page: $page,
            );

            return response()->json([
                'status'  => true,
                'message' => 'Berhasil mengambil katalog produk',
                'data'    => $result['data'],
                'meta'    => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('PublicProduct index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat katalog produk',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function available(): JsonResponse
    {
        try {
            $products = $this->publicProductService->getAvailableProducts();

            return response()->json([
                'status'  => true,
                'message' => 'Produk tersedia di TOKO',
                'data'    => $products,
            ]);
        } catch (\Throwable $e) {
            Log::error('PublicProduct available error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat produk tersedia',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function bestSeller(Request $request): JsonResponse
    {
        try {
            $products = $this->publicProductService->getBestSellerProducts(
                limit: (int) $request->get('limit', 6),
                dari: $request->get('dari'),
                sampai: $request->get('sampai'),
                jenis: $request->get('jenis'),
            );

            return response()->json([
                'status'  => true,
                'message' => $products ? 'Produk terlaris' : 'Tidak ada produk terlaris',
                'data'    => $products,
            ]);
        } catch (\Throwable $e) {
            Log::error('PublicProduct bestSeller error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat produk terlaris',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $product = $this->publicProductService->getDetail($id);

            if (!$product) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Produk tidak ditemukan',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data'   => $product,
            ]);
        } catch (\Throwable $e) {
            Log::error('PublicProduct show error', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat detail produk',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}