<?php

use App\Http\Controllers\api\PesananTransaksiController;
use App\Http\Controllers\api\StatusProductController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\api\AuthController;
use App\Http\Controllers\api\BahanProductController;
use App\Http\Controllers\api\CustomerController;
use App\Http\Controllers\api\DistributorController;
use App\Http\Controllers\api\HargaProductController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\api\JabatanController;
use App\Http\Controllers\api\JenisProductController;
use App\Http\Controllers\api\KaryawanController;
use App\Http\Controllers\api\PembayaranController;
use App\Http\Controllers\Api\PlaceController;
use App\Http\Controllers\api\ProductController;
use App\Http\Controllers\api\ProductDistributorController;
use App\Http\Controllers\Api\ProductionController;
use App\Http\Controllers\Api\ProductMovementController;
use App\Http\Controllers\api\StatusTransaksiController;
use App\Http\Controllers\api\StokOpnameController;
use App\Http\Controllers\api\TransaksiController;
use App\Http\Controllers\api\TypeProductController;
use App\Http\Controllers\Api\UserController;


Route::post('/login', [AuthController::class, 'login']);

Route::group(['middleware' => ['jwt.auth']], function () {
    Route::get('/profile', [AuthController::class, 'profile'])->middleware('role:admin,kasir,operator');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('role:admin,kasir,operator');
    Route::post('/refresh', [AuthController::class, 'refresh'])->middleware('role:admin,kasir,operator');

    Route::get('/users', [UserController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::get('/users/{id}', [UserController::class, 'show'])->middleware('role:admin');
    Route::post('/users', [UserController::class, 'store'])->middleware('role:admin');
    Route::put('/users/{id}', [UserController::class, 'update'])->middleware('role:admin');
    Route::delete('/users/{id}', [UserController::class, 'destroy'])->middleware('role:admin');

    Route::get('/karyawans', [KaryawanController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::post('/karyawans', [KaryawanController::class, 'store'])->middleware('role:admin');
    Route::get('/karyawans/{karyawan}', [KaryawanController::class, 'show'])->middleware('role:admin');
    Route::put('/karyawans/{karyawan}', [KaryawanController::class, 'update'])->middleware('role:admin');
    Route::delete('/karyawans/{karyawan}', [KaryawanController::class, 'destroy'])->middleware('role:admin');

    Route::get('/jabatans', [JabatanController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::post('/jabatans', [JabatanController::class, 'store'])->middleware('role:admin');
    Route::get('/jabatans/{jabatan}', [JabatanController::class, 'show'])->middleware('role:admin');
    Route::put('/jabatans/{jabatan}', [JabatanController::class, 'update'])->middleware('role:admin');
    Route::delete('/jabatans/{jabatan}', [JabatanController::class, 'destroy'])->middleware('role:admin');

    // Customers
    Route::get('/customers', [CustomerController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::post('/customers', [CustomerController::class, 'store'])->middleware('role:admin,kasir');
    Route::get('/customers/{id}', [CustomerController::class, 'show'])->middleware('role:admin,kasir,operator');
    Route::put('/customers/{id}', [CustomerController::class, 'update'])->middleware('role:admin,kasir');
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy'])->middleware('role:admin');

    Route::get('/distributors', [DistributorController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::post('/distributors', [DistributorController::class, 'store'])->middleware('role:admin,kasir');
    Route::get('/distributors/{id}', [DistributorController::class, 'show'])->middleware('role:admin,kasir,operator');
    Route::put('/distributors/{id}', [DistributorController::class, 'update'])->middleware('role:admin,kasir');
    Route::delete('/distributors/{id}', [DistributorController::class, 'destroy'])->middleware('role:admin');

    // Products
    Route::get('/products/available', [ProductController::class, 'available'])->middleware('role:admin,kasir,operator');
    Route::get('/products/lowStok', [ProductController::class, 'lowStock'])->middleware('role:admin,kasir,operator');
    Route::get('/products/best-seller', [ProductController::class, 'bestSeller'])->middleware('role:admin,kasir,operator');
    Route::get('/products', [ProductController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::post('/products', [ProductController::class, 'store'])->middleware('role:admin,kasir');
    Route::get('/products/{id}', [ProductController::class, 'show'])->middleware('role:admin,kasir,operator');
    Route::put('/products/{id}', [ProductController::class, 'update'])->middleware('role:admin');
    Route::delete('/products/{id}', [ProductController::class, 'destroy'])->middleware('role:admin');
    Route::post('/products/{product}/upload-foto', [ProductController::class, 'uploadFoto'])->middleware('role:admin,kasir,operator');

    Route::get('/product-distributors', [ProductDistributorController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::post('/product-distributors', [ProductDistributorController::class, 'store'])->middleware('role:admin,kasir');
    Route::get('/product-distributors/{id}', [ProductDistributorController::class, 'show'])->middleware('role:admin,kasir,operator');
    Route::put('/product-distributors/{id}', [ProductDistributorController::class, 'update'])->middleware('role:admin');
    Route::delete('/product-distributors/{id}', [ProductDistributorController::class, 'destroy'])->middleware('role:admin');

    // Jenis Product
    Route::get('/jenis', [JenisProductController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::post('/jenis', [JenisProductController::class, 'store'])->middleware('role:admin,kasir');
    Route::get('/jenis/{id}', [JenisProductController::class, 'show'])->middleware('role:admin,kasir,operator');
    Route::put('/jenis/{jenisProduct}', [JenisProductController::class, 'update'])->middleware('role:admin,kasir');
    Route::delete('/jenis/{jenisProduct}', [JenisProductController::class, 'destroy'])->middleware('role:admin');

    // Bahan Product
    Route::get('/bahan', [BahanProductController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::get('/bahan/{id}', [BahanProductController::class, 'show'])->middleware('role:admin,kasir,operator');
    Route::post('/bahan', [BahanProductController::class, 'store'])->middleware('role:admin,kasir');
    Route::put('/bahan/{id}', [BahanProductController::class, 'update'])->middleware('role:admin,kasir');
    Route::delete('/bahan/{id}', [BahanProductController::class, 'destroy'])->middleware('role:admin');

    // // Type Product
    Route::get('/type', [TypeProductController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::post('/type', [TypeProductController::class, 'store'])->middleware('role:admin,kasir');
    Route::get('/type/by-jenis/{jenisId}', [TypeProductController::class, 'getByJenis'])->middleware('role:admin,kasir,operator');
    Route::get('/type/{id}', [TypeProductController::class, 'show'])->middleware('role:admin,kasir,operator');
    Route::put('/type/{id}', [TypeProductController::class, 'update'])->middleware('role:admin,kasir');
    Route::delete('/type/{id}', [TypeProductController::class, 'destroy'])->middleware('role:admin');

    // Harga Product
    Route::get('/harga', [HargaProductController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::post('/harga', [HargaProductController::class, 'store'])->middleware('role:admin,kasir');
    Route::get('/harga/{id}', [HargaProductController::class, 'show'])->middleware('role:admin,kasir,operator');
    Route::put('/harga/{id}', [HargaProductController::class, 'update'])->middleware('role:admin,kasir');
    Route::delete('/harga/{id}', [HargaProductController::class, 'destroy'])->middleware('role:admin');
    Route::get('/harga/by-product/{id}', [HargaProductController::class, 'byProduct'])->middleware('role:admin,kasir,operator');

    // Status Transaksi
    Route::get('/status-transaksi', [StatusTransaksiController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::post('/status-transaksi', [StatusTransaksiController::class, 'store'])->middleware('role:admin');
    Route::put('/status-transaksi/{id}', [StatusTransaksiController::class, 'update'])->middleware('role:admin');
    Route::delete('/status-transaksi/{id}', [StatusTransaksiController::class, 'destroy'])->middleware('role:admin');

    // Transaksi
    Route::get('/transaksi', [TransaksiController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::get('/transaksi/aktif', [TransaksiController::class, 'aktif'])->middleware('role:admin,kasir,operator');
    Route::get('/transaksi/riwayat/all', [TransaksiController::class, 'riwayatAll'])->middleware('role:admin,kasir,operator');
    Route::get('/transaksi/riwayat/customer/{customerId}', [TransaksiController::class, 'riwayatByCustomer'])->middleware('role:admin,kasir,operator');
    Route::post('/transaksi', [TransaksiController::class, 'store'])->middleware('role:admin,kasir,operator');
    Route::get('/transaksi/{id}', [TransaksiController::class, 'show'])->middleware('role:admin,kasir,operator');
    Route::delete('/transaksi/{id}', [TransaksiController::class, 'destroy'])->middleware('role:admin');
    Route::patch('/transaksi-detail/{id}/status', [TransaksiController::class, 'updateStatus'])->middleware('role:admin,kasir');
    Route::put('/transaksi/{id}', [TransaksiController::class, 'update'])->middleware('role:admin,kasir');
    Route::post('/transaksi-detail/{detailId}/cancel', [TransaksiController::class, 'cancelDetail'])->middleware('role:admin');

    // Transaksi Pesanan
    Route::get('/pesanan', [PesananTransaksiController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::get('/pesanan/aktif', [PesananTransaksiController::class, 'aktif'])->middleware('role:admin,kasir,operator');
    Route::get('/pesanan/{id}', [PesananTransaksiController::class, 'show'])->middleware('role:admin,kasir,operator');
    Route::post('/pesanan', [PesananTransaksiController::class, 'store'])->middleware('role:admin,kasir');
    Route::put('/pesanan/{id}', [PesananTransaksiController::class, 'update'])->middleware('role:admin,kasir');
    Route::delete('/pesanan/{id}', [PesananTransaksiController::class, 'destroy'])->middleware('role:admin');
    Route::post('/pesanan/{id}/cancel', [PesananTransaksiController::class, 'cancel'])->middleware('role:admin');
    Route::patch('/pesanan/{id}/selesai', [PesananTransaksiController::class, 'selesai'])->middleware('role:admin,kasir');
    Route::post('/pesanan/detail/{id}/status', [PesananTransaksiController::class, 'updateStatus'])->middleware('role:admin');
    Route::get('/pesanan/{id}/print', [PesananTransaksiController::class, 'printNota'])->middleware('role:admin');

    // Pembayaran
    Route::get('/pembayaran', [PembayaranController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::post('/pembayaran', [PembayaranController::class, 'store'])->middleware('role:admin,kasir');
    Route::get('/pembayaran/{id}', [PembayaranController::class, 'show'])->middleware('role:admin,kasir,operator');
    Route::put('/pembayaran/{id}', [PembayaranController::class, 'update'])->middleware('role:admin');
    Route::delete('/pembayaran/{id}', [PembayaranController::class, 'destroy'])->middleware('role:admin');

    // Place
    Route::get('/places', [PlaceController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::post('/places', [PlaceController::class, 'store'])->middleware('role:admin');
    Route::get('/places/{id}', [PlaceController::class, 'show'])->middleware('role:admin,kasir,operator');
    Route::put('/places/{id}', [PlaceController::class, 'update'])->middleware('role:admin');
    Route::delete('/places/{id}', [PlaceController::class, 'destroy'])->middleware('role:admin');

    // Production
    Route::get('/productions/pesanan', [ProductionController::class, 'pesananDipesan'])->middleware('role:admin,kasir,operator');
    Route::get('/productions', [ProductionController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::post('/productions', [ProductionController::class, 'store'])->middleware('role:admin,operator');
    Route::get('/productions/{id}', [ProductionController::class, 'show'])->middleware('role:admin,kasir,operator');
    Route::put('/productions/{id}', [ProductionController::class, 'update'])->middleware('role:admin,operator');
    Route::delete('/productions/{id}', [ProductionController::class, 'destroy'])->middleware('role:admin');

    // Product Movement
    Route::get('/product-movements', [ProductMovementController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::post('/product-movements', [ProductMovementController::class, 'store'])->middleware('role:admin,kasir,operator');

    // Inventory
    Route::get('/inventories', [InventoryController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::get('/inventories/place/{placeId}', [InventoryController::class, 'byPlace'])->middleware('role:admin,kasir,operator');
    Route::get('/inventories/product/{productId}', [InventoryController::class, 'byProduct'])->middleware('role:admin,kasir,operator');
    Route::get('/inventories/product/{productId}/total', [InventoryController::class, 'totalProduct'])->middleware('role:admin,kasir,operator');

    // Stok Opname
    Route::get('/stok-opname', [StokOpnameController::class, 'index'])->middleware('role:admin,kasir,operator');
    Route::post('/stok-opname', [StokOpnameController::class, 'store'])->middleware('role:admin');
    Route::get('/stok-opname/{id}', [StokOpnameController::class, 'show'])->middleware('role:admin,kasir,operator');

    Route::post('/stok-opname/{id}/detail', [StokOpnameController::class, 'storeDetail'])->middleware('role:admin,kasir,operator');
    Route::post('/stok-opname/{id}/selesai', [StokOpnameController::class, 'selesai'])->middleware('role:admin');
    Route::post('/stok-opname/{id}/batal', [StokOpnameController::class, 'batalkan'])->middleware('role:admin');
});
