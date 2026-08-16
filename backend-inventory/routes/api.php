<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\api\AuthController;
use App\Http\Controllers\api\BahanProductController;
use App\Http\Controllers\api\CustomerController;
use App\Http\Controllers\api\DashboardController;
use App\Http\Controllers\api\DistributorController;
use App\Http\Controllers\api\ForgotPasswordController;
use App\Http\Controllers\api\HargaProductController;
use App\Http\Controllers\api\InventoryController;
use App\Http\Controllers\api\JabatanController;
use App\Http\Controllers\api\JenisProductController;
use App\Http\Controllers\api\KaryawanController;
use App\Http\Controllers\api\PembayaranController;
use App\Http\Controllers\api\PesananTransaksiController;
use App\Http\Controllers\api\PlaceController;
use App\Http\Controllers\api\ProductController;
use App\Http\Controllers\api\ProductCustomerController;
use App\Http\Controllers\api\ProductDistributorController;
use App\Http\Controllers\api\ProductInternalController;
use App\Http\Controllers\api\ProductMovementController;
use App\Http\Controllers\api\ProductionController;
use App\Http\Controllers\api\PublicProductController;
use App\Http\Controllers\api\ResetPasswordController;
use App\Http\Controllers\api\StatusTransaksiController;
use App\Http\Controllers\api\StokOpnameController;
use App\Http\Controllers\api\TransaksiController;
use App\Http\Controllers\api\TypeProductController;
use App\Http\Controllers\api\UserController;

// ========================================
// PUBLIC ROUTES (Tanpa Auth)
// ========================================
Route::prefix('public')->group(function () {
    Route::get('/products', [PublicProductController::class, 'index']);
    Route::get('/products/available', [PublicProductController::class, 'available']);
    Route::get('/products/best-seller', [PublicProductController::class, 'bestSeller']);
    Route::get('/products/{id}', [PublicProductController::class, 'show']);
});

// Master data for dropdowns (public read-only)
Route::prefix('master')->group(function () {
    Route::get('/type-products', [TypeProductController::class, 'master']);
    Route::get('/jenis-products', [JenisProductController::class, 'master']);
});

// ========================================
// AUTH ROUTES (Public Authentication)
// ========================================
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink']);
    Route::post('/reset-password', [ResetPasswordController::class, 'reset']);
});

// ========================================
// PROTECTED ROUTES (Wajib Auth + Auto Refresh Token)
// ========================================
Route::middleware(['jwt.auth', 'auto.refresh'])->group(function () {

    // -----------------------------------------------
    // Auth Management (Semua role terautentikasi)
    // -----------------------------------------------
    Route::prefix('auth')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/profile', [AuthController::class, 'profile']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });

    // -----------------------------------------------
    // Dashboard
    // -----------------------------------------------
    Route::prefix('dashboard')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [DashboardController::class, 'index']);
        Route::get('/stats', [DashboardController::class, 'dashboardStats']);
        Route::get('/summary', [DashboardController::class, 'summary']);
    });

    // -----------------------------------------------
    // User Management (Admin only)
    // -----------------------------------------------
    Route::prefix('users')->middleware('role:admin')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/statistics', [UserController::class, 'statistics']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::post('/', [UserController::class, 'store']);
        Route::put('/{id}', [UserController::class, 'update']);
        Route::delete('/{id}', [UserController::class, 'destroy']);
    });

    Route::prefix('karyawans')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [KaryawanController::class, 'index']);
        Route::get('/dropdown', [KaryawanController::class, 'dropdown']);
        Route::get('/statistics', [KaryawanController::class, 'statistics'])->middleware('role:admin');

        Route::post('/', [KaryawanController::class, 'store'])->middleware('role:admin');

        Route::get('/{karyawan}', [KaryawanController::class, 'show'])->middleware('role:admin');
        Route::put('/{karyawan}', [KaryawanController::class, 'update'])->middleware('role:admin');
        Route::delete('/{karyawan}', [KaryawanController::class, 'destroy'])->middleware('role:admin');
    });

    Route::prefix('jabatans')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [JabatanController::class, 'index']);
        Route::get('/dropdown', [JabatanController::class, 'dropdown']);
        Route::get('/statistics', [JabatanController::class, 'statistics'])->middleware('role:admin');
        Route::get('/{jabatan}', [JabatanController::class, 'show'])->middleware('role:admin');
        Route::post('/', [JabatanController::class, 'store'])->middleware('role:admin');
        Route::put('/{jabatan}', [JabatanController::class, 'update'])->middleware('role:admin');
        Route::delete('/{jabatan}', [JabatanController::class, 'destroy'])->middleware('role:admin');
    });

    Route::prefix('customers')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [CustomerController::class, 'index']);
        Route::post('/', [CustomerController::class, 'store'])->middleware('role:admin,admin_toko');
        Route::get('/{id}', [CustomerController::class, 'show']);
        Route::put('/{id}', [CustomerController::class, 'update'])->middleware('role:admin,admin_toko');
        Route::delete('/{id}', [CustomerController::class, 'destroy'])->middleware('role:admin');
    });

    Route::prefix('distributors')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/dropdown', [DistributorController::class, 'dropdown']);

        Route::get('/', [DistributorController::class, 'index']);
        Route::post('/', [DistributorController::class, 'store'])->middleware('role:admin,admin_toko');
        Route::get('/{distributor}', [DistributorController::class, 'show']);
        Route::put('/{distributor}', [DistributorController::class, 'update'])->middleware('role:admin,admin_toko');
        Route::delete('/{distributor}', [DistributorController::class, 'destroy'])->middleware('role:admin');
    });

    Route::prefix('internal-products')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [ProductInternalController::class, 'index']);
        Route::get('/summary', [ProductInternalController::class, 'summary']);
        Route::get('/low-stock', [ProductInternalController::class, 'lowStock']);
        Route::get('/by-jenis/{jenisId}', [ProductInternalController::class, 'byJenis']);
        Route::get('/{id}', [ProductInternalController::class, 'show']);
    });

    Route::prefix('products')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/dropdown', [ProductController::class, 'dropdown']);
        Route::get('/available', [ProductController::class, 'available']);
        Route::get('/lowStok', [ProductController::class, 'lowStock']);
        Route::get('/best-seller', [ProductController::class, 'bestSeller']);

        Route::get('/', [ProductController::class, 'index']);
        Route::post('/', [ProductController::class, 'store'])->middleware('role:admin,admin_toko');
        Route::get('/{product}', [ProductController::class, 'show']);
        Route::put('/{product}', [ProductController::class, 'update'])->middleware('role:admin');
        Route::delete('/{product}', [ProductController::class, 'destroy'])->middleware('role:admin');
        Route::post('/{product}/upload-foto', [ProductController::class, 'uploadFoto']);
    });

    Route::prefix('product-distributors')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [ProductDistributorController::class, 'index']);
        Route::post('/', [ProductDistributorController::class, 'store'])->middleware('role:admin,admin_toko');
        Route::get('/{id}', [ProductDistributorController::class, 'show']);
        Route::put('/{id}', [ProductDistributorController::class, 'update'])->middleware('role:admin');
        Route::delete('/{id}', [ProductDistributorController::class, 'destroy'])->middleware('role:admin');
    });

    Route::prefix('product-customers')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [ProductCustomerController::class, 'index']);
        Route::post('/', [ProductCustomerController::class, 'store'])->middleware('role:admin,admin_toko');
        Route::get('/{id}', [ProductCustomerController::class, 'show']);
        Route::put('/{id}', [ProductCustomerController::class, 'update'])->middleware('role:admin');
        Route::delete('/{id}', [ProductCustomerController::class, 'destroy'])->middleware('role:admin');
    });

    Route::prefix('jenis')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [JenisProductController::class, 'index']);
        Route::get('/dropdown', [JenisProductController::class, 'dropdown']);
        Route::get('/statistics', [JenisProductController::class, 'statistics'])->middleware('role:admin');

        Route::post('/', [JenisProductController::class, 'store'])->middleware('role:admin,admin_toko');
        Route::get('/{jenisProduct}', [JenisProductController::class, 'show']);
        Route::put('/{jenisProduct}', [JenisProductController::class, 'update'])->middleware('role:admin,admin_toko');
        Route::delete('/{jenisProduct}', [JenisProductController::class, 'destroy'])->middleware('role:admin');
    });

    // Bahan Products
    Route::prefix('bahan')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [BahanProductController::class, 'index']);
        Route::get('/dropdown', [BahanProductController::class, 'dropdown']);
        Route::get('/statistics', [BahanProductController::class, 'statistics'])->middleware('role:admin');

        Route::post('/', [BahanProductController::class, 'store'])->middleware('role:admin,admin_toko');
        Route::get('/{bahanProduct}', [BahanProductController::class, 'show']);
        Route::put('/{bahanProduct}', [BahanProductController::class, 'update'])->middleware('role:admin,admin_toko');
        Route::delete('/{bahanProduct}', [BahanProductController::class, 'destroy'])->middleware('role:admin');
    });

    Route::prefix('type')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [TypeProductController::class, 'index']);
        Route::get('/dropdown', [TypeProductController::class, 'dropdown']);
        Route::get('/by-jenis/{jenisId}', [TypeProductController::class, 'getByJenis']);
        Route::get('/statistics', [TypeProductController::class, 'statistics'])->middleware('role:admin');

        Route::post('/', [TypeProductController::class, 'store'])->middleware('role:admin,admin_toko');
        Route::get('/{typeProduct}', [TypeProductController::class, 'show']);
        Route::put('/{typeProduct}', [TypeProductController::class, 'update'])->middleware('role:admin,admin_toko');
        Route::delete('/{typeProduct}', [TypeProductController::class, 'destroy'])->middleware('role:admin');
    });

    // Harga Products
    Route::prefix('harga')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [HargaProductController::class, 'index']);
        Route::get('/by-product/{productId}', [HargaProductController::class, 'byProduct']);
        Route::get('/active/{productId}', [HargaProductController::class, 'activePrice']);

        Route::post('/', [HargaProductController::class, 'store'])->middleware('role:admin,admin_toko');
        Route::get('/{hargaProduct}', [HargaProductController::class, 'show']);
        Route::put('/{hargaProduct}', [HargaProductController::class, 'update'])->middleware('role:admin,admin_toko');
        Route::delete('/{hargaProduct}', [HargaProductController::class, 'destroy'])->middleware('role:admin');
    });

    Route::prefix('status-transaksi')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [StatusTransaksiController::class, 'index']);
        Route::post('/', [StatusTransaksiController::class, 'store'])->middleware('role:admin');
        Route::put('/{id}', [StatusTransaksiController::class, 'update'])->middleware('role:admin');
        Route::delete('/{id}', [StatusTransaksiController::class, 'destroy'])->middleware('role:admin');
    });

    Route::prefix('transaksi')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [TransaksiController::class, 'index']);
        Route::get('/aktif', [TransaksiController::class, 'aktif']);
        Route::get('/riwayat/all', [TransaksiController::class, 'riwayatAll']);
        Route::get('/riwayat/customer/{customerId}', [TransaksiController::class, 'riwayatByCustomer']);
        Route::post('/', [TransaksiController::class, 'store']);
        Route::get('/{id}', [TransaksiController::class, 'show']);
        Route::put('/{id}', [TransaksiController::class, 'update'])->middleware('role:admin,admin_toko');
        Route::delete('/{id}', [TransaksiController::class, 'destroy'])->middleware('role:admin');
        Route::patch('/detail/{id}/status', [TransaksiController::class, 'updateStatus'])->middleware('role:admin,admin_toko');
        Route::post('/detail/{detailId}/cancel', [TransaksiController::class, 'cancelDetail'])->middleware('role:admin');
    });

    Route::prefix('pesanan')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [PesananTransaksiController::class, 'index']);
        Route::get('/aktif', [PesananTransaksiController::class, 'aktif']);
        Route::get('/{id}', [PesananTransaksiController::class, 'show']);
        Route::post('/', [PesananTransaksiController::class, 'store'])->middleware('role:admin,admin_toko');
        Route::put('/{id}', [PesananTransaksiController::class, 'update'])->middleware('role:admin,admin_toko');
        Route::delete('/{id}', [PesananTransaksiController::class, 'destroy'])->middleware('role:admin');
        Route::post('/{id}/cancel', [PesananTransaksiController::class, 'cancel'])->middleware('role:admin');
        Route::patch('/{id}/selesai', [PesananTransaksiController::class, 'selesai'])->middleware('role:admin,admin_toko');
        Route::post('/detail/{id}/status', [PesananTransaksiController::class, 'updateStatus'])->middleware('role:admin');
        Route::get('/{id}/print', [PesananTransaksiController::class, 'printNota'])->middleware('role:admin');
    });

    Route::prefix('pembayaran')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [PembayaranController::class, 'index']);
        Route::post('/', [PembayaranController::class, 'store'])->middleware('role:admin,admin_toko');
        Route::get('/{id}', [PembayaranController::class, 'show']);
        Route::put('/{id}', [PembayaranController::class, 'update'])->middleware('role:admin');
        Route::delete('/{id}', [PembayaranController::class, 'destroy'])->middleware('role:admin');
    });

    Route::prefix('places')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [PlaceController::class, 'index']);
        Route::post('/', [PlaceController::class, 'store'])->middleware('role:admin');
        Route::get('/{id}', [PlaceController::class, 'show']);
        Route::put('/{id}', [PlaceController::class, 'update'])->middleware('role:admin');
        Route::delete('/{id}', [PlaceController::class, 'destroy'])->middleware('role:admin');
    });

    Route::prefix('productions')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/pesanan', [ProductionController::class, 'pesananDipesan']);
        Route::get('/', [ProductionController::class, 'index']);
        Route::post('/', [ProductionController::class, 'store'])->middleware('role:admin,operator');
        Route::get('/{id}', [ProductionController::class, 'show']);
        Route::put('/{id}', [ProductionController::class, 'update'])->middleware('role:admin,operator');
        Route::delete('/{id}', [ProductionController::class, 'destroy'])->middleware('role:admin');
    });

    Route::prefix('product-movements')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [ProductMovementController::class, 'index']);
        Route::post('/', [ProductMovementController::class, 'store']);
    });

    Route::prefix('inventories')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [InventoryController::class, 'index']);
        Route::get('/place/{placeId}', [InventoryController::class, 'byPlace']);
        Route::get('/product/{productId}', [InventoryController::class, 'byProduct']);
        Route::get('/product/{productId}/total', [InventoryController::class, 'totalProduct']);
    });

    Route::prefix('stok-opname')->middleware('role:admin,admin_toko,operator')->group(function () {
        Route::get('/', [StokOpnameController::class, 'index']);
        Route::post('/', [StokOpnameController::class, 'store']);
        Route::get('/{id}', [StokOpnameController::class, 'show']);
        Route::post('/{id}/detail', [StokOpnameController::class, 'storeDetail']);
        Route::post('/{id}/selesai', [StokOpnameController::class, 'selesai'])->middleware('role:admin');
        Route::post('/{id}/batal', [StokOpnameController::class, 'batalkan'])->middleware('role:admin');
    });
});
