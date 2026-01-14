<?php

use App\Http\Controllers\api\PesananTransaksiController;
use App\Http\Controllers\api\StatusProductController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\api\AuthController;
use App\Http\Controllers\api\BahanProductController;
use App\Http\Controllers\api\CustomerController;
use App\Http\Controllers\api\HargaProductController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\api\JabatanController;
use App\Http\Controllers\api\JenisProductController;
use App\Http\Controllers\api\KaryawanController;
use App\Http\Controllers\api\PembayaranController;
use App\Http\Controllers\Api\PlaceController;
use App\Http\Controllers\api\ProductController;
use App\Http\Controllers\Api\ProductionController;
use App\Http\Controllers\Api\ProductMovementController;
use App\Http\Controllers\api\StatusTransaksiController;
use App\Http\Controllers\api\StokOpnameController;
use App\Http\Controllers\api\TransaksiController;
use App\Http\Controllers\api\TypeProductController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::group(['middleware' => ['jwt.auth']], function () {
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);

    Route::get('/karyawans', [KaryawanController::class, 'index']);
    Route::post('/karyawans', [KaryawanController::class, 'store']);
    Route::get('/karyawans/{karyawan}', [KaryawanController::class, 'show']);
    Route::put('/karyawans/{karyawan}', [KaryawanController::class, 'update']);
    Route::delete('/karyawans/{karyawan}', [KaryawanController::class, 'destroy']);

    Route::get('/jabatans', [JabatanController::class, 'index']);
    Route::post('/jabatans', [JabatanController::class, 'store']);
    Route::get('/jabatans/{jabatan}', [JabatanController::class, 'show']);
    Route::put('/jabatans/{jabatan}', [JabatanController::class, 'update']);
    Route::delete('/jabatans/{jabatan}', [JabatanController::class, 'destroy']);

    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);

    // Products
    Route::get('/products/available', [ProductController::class, 'available']);
    Route::get('/products/lowStok', [ProductController::class, 'lowStock']);
    Route::get('/products/best-seller', [ProductController::class, 'bestSeller']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::post('/products/{product}/upload-foto', [ProductController::class, 'uploadFoto']);

    // Jenis Product
    Route::get('/jenis', [JenisProductController::class, 'index']);
    Route::post('/jenis', [JenisProductController::class, 'store']);
    Route::get('/jenis/{id}', [JenisProductController::class, 'show']);
    Route::put('/jenis/{jenisProduct}', [JenisProductController::class, 'update']);
    Route::delete('/jenis/{jenisProduct}', [JenisProductController::class, 'destroy']);

    // Bahan Product
    Route::get('/bahan', [BahanProductController::class, 'index']);
    Route::get('/bahan/{id}', [BahanProductController::class, 'show']);
    Route::post('/bahan', [BahanProductController::class, 'store']);
    Route::put('/bahan/{id}', [BahanProductController::class, 'update']);
    Route::delete('/bahan/{id}', [BahanProductController::class, 'destroy']);

    // // Type Product
    Route::get('/type', [TypeProductController::class, 'index']);
    Route::post('/type', [TypeProductController::class, 'store']);
    Route::get('/type/by-jenis/{jenisId}', [TypeProductController::class, 'getByJenis']);
    Route::get('/type/{id}', [TypeProductController::class, 'show']);
    Route::put('/type/{id}', [TypeProductController::class, 'update']);
    Route::delete('/type/{id}', [TypeProductController::class, 'destroy']);

    // Harga Product
    Route::get('/harga', [HargaProductController::class, 'index']);
    Route::post('/harga', [HargaProductController::class, 'store']);
    Route::get('/harga/{id}', [HargaProductController::class, 'show']);
    Route::put('/harga/{id}', [HargaProductController::class, 'update']);
    Route::delete('/harga/{id}', [HargaProductController::class, 'destroy']);
    Route::get('/harga/by-product/{id}', [HargaProductController::class, 'byProduct']);

    // Status Transaksi
    Route::get('/status-transaksi', [StatusTransaksiController::class, 'index']);
    Route::post('/status-transaksi', [StatusTransaksiController::class, 'store']);
    Route::put('/status-transaksi/{id}', [StatusTransaksiController::class, 'update']);
    Route::delete('/status-transaksi/{id}', [StatusTransaksiController::class, 'destroy']);

    // Transaksi
    Route::get('/transaksi', [TransaksiController::class, 'index']);
    Route::get('/transaksi/aktif', [TransaksiController::class, 'aktif']);
    Route::get('/transaksi/riwayat/all', [TransaksiController::class, 'riwayatAll']);
    Route::get('/transaksi/riwayat/customer/{customerId}', [TransaksiController::class, 'riwayatByCustomer']);
    Route::post('/transaksi', [TransaksiController::class, 'store']);
    Route::get('/transaksi/{id}', [TransaksiController::class, 'show']);
    Route::delete('/transaksi/{id}', [TransaksiController::class, 'destroy']);
    Route::patch('/transaksi-detail/{id}/status', [TransaksiController::class, 'updateStatus']);
    Route::put('/transaksi/{id}', [TransaksiController::class, 'update']);
    Route::post('/transaksi-detail/{detailId}/cancel', [TransaksiController::class, 'cancelDetail']);

    // Transaksi Pesanan
    Route::get('/pesanan', [PesananTransaksiController::class, 'index']);
    Route::get('/pesanan/aktif', [PesananTransaksiController::class, 'aktif']);
    Route::get('/pesanan/{id}', [PesananTransaksiController::class, 'show']);
    Route::post('/pesanan', [PesananTransaksiController::class, 'store']);
    Route::put('/pesanan/{id}', [PesananTransaksiController::class, 'update']);
    Route::delete('/pesanan/{id}', [PesananTransaksiController::class, 'destroy']);
    Route::post('/pesanan/{id}/cancel', [PesananTransaksiController::class, 'cancel']);
    Route::patch('/pesanan/{id}/selesai', [PesananTransaksiController::class, 'selesai']);
    Route::post('/pesanan/detail/{id}/status', [PesananTransaksiController::class, 'updateStatus']);
    Route::get('/pesanan/{id}/print', [PesananTransaksiController::class, 'printNota']);

    // Pembayaran
    Route::get('/pembayaran', [PembayaranController::class, 'index']);
    Route::post('/pembayaran', [PembayaranController::class, 'store']);
    Route::get('/pembayaran/{id}', [PembayaranController::class, 'show']);
    Route::put('/pembayaran/{id}', [PembayaranController::class, 'update']);
    Route::delete('/pembayaran/{id}', [PembayaranController::class, 'destroy']);

    // Place
    Route::get('/places', [PlaceController::class, 'index']);
    Route::post('/places', [PlaceController::class, 'store']);
    Route::get('/places/{id}', [PlaceController::class, 'show']);
    Route::put('/places/{id}', [PlaceController::class, 'update']);
    Route::delete('/places/{id}', [PlaceController::class, 'destroy']);

    // Production
    Route::get('/productions/pesanan', [ProductionController::class, 'pesananDipesan']);
    Route::get('/productions', [ProductionController::class, 'index']);
    Route::post('/productions', [ProductionController::class, 'store']);
    Route::get('/productions/{id}', [ProductionController::class, 'show']);
    Route::put('/productions/{id}', [ProductionController::class, 'update']);
    Route::delete('/productions/{id}', [ProductionController::class, 'destroy']);

    // Product Movement
    Route::get('/product-movements', [ProductMovementController::class, 'index']);
    Route::post('/product-movements', [ProductMovementController::class, 'store']);

    // Inventory
    Route::get('/inventories', [InventoryController::class, 'index']);
    Route::get('/inventories/place/{placeId}', [InventoryController::class, 'byPlace']);
    Route::get('/inventories/product/{productId}', [InventoryController::class, 'byProduct']);
    Route::get('/inventories/product/{productId}/total', [InventoryController::class, 'totalProduct']);

    // Stok Opname
    Route::get('/stok-opname', [StokOpnameController::class, 'index']);
    Route::post('/stok-opname', [StokOpnameController::class, 'store']);
    Route::get('/stok-opname/{id}', [StokOpnameController::class, 'show']);

    Route::post('/stok-opname/{id}/detail', [StokOpnameController::class, 'storeDetail']);
    Route::post('/stok-opname/{id}/selesai', [StokOpnameController::class, 'selesai']);
    Route::post('/stok-opname/{id}/batal', [StokOpnameController::class, 'batalkan']);
});
