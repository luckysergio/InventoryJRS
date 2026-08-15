<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Models\Customer;
use App\Services\Customer\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function __construct(
        protected CustomerService $customerService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $customers = $this->customerService->getList($request->query('search'));

        return response()->json([
            'status'  => true,
            'message' => 'Berhasil mengambil data customer',
            'data'    => $customers,
        ]);
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = $this->customerService->create($request->validated());

        return response()->json([
            'status'   => true,
            'message'  => 'Customer berhasil dibuat',
            'customer' => $customer,
        ], 201);
    }

    public function show(string|int $id): JsonResponse
    {
        $customer = Customer::find((int) $id);

        if (!$customer) {
            return response()->json(['status' => false, 'message' => 'Customer tidak ditemukan'], 404);
        }

        return response()->json(['status' => true, 'customer' => $customer]);
    }

    public function update(UpdateCustomerRequest $request, string|int $id): JsonResponse
    {
        $customer = Customer::find((int) $id);

        if (!$customer) {
            return response()->json(['status' => false, 'message' => 'Customer tidak ditemukan'], 404);
        }

        $updatedCustomer = $this->customerService->update($customer, $request->validated());

        return response()->json([
            'status'   => true,
            'message'  => 'Customer berhasil diupdate',
            'customer' => $updatedCustomer,
        ]);
    }

    public function destroy(string|int $id): JsonResponse
    {
        $customer = Customer::find((int) $id);

        if (!$customer) {
            return response()->json(['status' => false, 'message' => 'Customer tidak ditemukan'], 404);
        }

        try {
            $result = $this->customerService->delete($customer);
            return response()->json(['status' => true, 'message' => $result['message']]);
        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 422);
        }
    }
}