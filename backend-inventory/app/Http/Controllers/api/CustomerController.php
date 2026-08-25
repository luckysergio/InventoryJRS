<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Services\Customer\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CustomerController extends Controller
{
    public function __construct(
        protected CustomerService $customerService
    ) {}

    public function index(Request $request): JsonResponse
    {
        try {
            // ✅ FIXED: Naikkan max limit dari 50 → 100 untuk list page
            $perPage = min((int) $request->input('per_page', 20), 100);
            $page = max((int) $request->input('page', 1), 1);

            $result = $this->customerService->getList(
                search: $request->input('search'),
                perPage: $perPage,
                page: $page
            );

            return response()->json([
                'status' => true,
                'data' => $result['data'],
                'meta' => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Customer index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data customer.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function dropdown(): JsonResponse
    {
        try {
            return response()->json([
                'status' => true,
                'data' => $this->customerService->getForDropdown(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Customer dropdown error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data dropdown customer.',
            ], 500);
        }
    }

    /**
     * ✅ BARU: Endpoint full customers untuk TransaksiForm dropdown.
     * Lightweight - tanpa subquery tagihan, return semua customer.
     * GET /api/customers/full
     */
    public function full(): JsonResponse
    {
        try {
            return response()->json([
                'status' => true,
                'data' => $this->customerService->getFull(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Customer full error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data customer lengkap.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function tagihan(Request $request, Customer $customer): JsonResponse
    {
        try {
            $jenis = $request->input('jenis');

            if ($jenis !== null && !in_array($jenis, ['daily', 'pesanan'], true)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Parameter "jenis" harus "daily" atau "pesanan".',
                ], 422);
            }

            $result = $this->customerService->getTagihan($customer->id, $jenis);

            return response()->json([
                'status'  => true,
                'data'    => $result['details'],
                'summary' => $result['summary'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Customer tagihan error', [
                'customer_id' => $customer->id,
                'jenis'       => $request->input('jenis'),
                'error'       => $e->getMessage(),
                'file'        => $e->getFile(),
                'line'        => $e->getLine(),
            ]);

            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat data tagihan: ' . $e->getMessage(),
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show(Customer $customer): JsonResponse
    {
        try {
            $detail = $this->customerService->getDetail($customer->id);

            if (!$detail) {
                return response()->json([
                    'status' => false,
                    'message' => 'Customer tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data' => new CustomerResource($customer),
            ]);
        } catch (\Throwable $e) {
            Log::error('Customer show error', ['id' => $customer->id, 'error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat detail customer.',
            ], 500);
        }
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        try {
            $customer = $this->customerService->create($request->validated());

            $this->customerService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Customer berhasil dibuat.',
                'data' => new CustomerResource($customer),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Customer store error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal membuat customer.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        try {
            $updated = $this->customerService->update($customer, $request->validated());

            $this->customerService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Customer berhasil diperbarui.',
                'data' => new CustomerResource($updated),
            ]);
        } catch (\Throwable $e) {
            Log::error('Customer update error', [
                'id' => $customer->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memperbarui customer.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy(Customer $customer): JsonResponse
    {
        try {
            $result = $this->customerService->delete($customer);

            if ($result['success']) {
                $this->customerService->invalidateCache();
            }

            return response()->json([
                'status' => $result['success'],
                'message' => $result['message'],
            ], $result['success'] ? 200 : ($result['code'] ?? 400));
        } catch (\Throwable $e) {
            Log::error('Customer destroy error', [
                'id' => $customer->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal menghapus customer.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}