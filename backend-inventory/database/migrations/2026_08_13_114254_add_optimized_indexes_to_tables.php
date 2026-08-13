<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Menambahkan index pada tabel yang sudah ada di production.
     */
    public function up(): void
    {
        // 1. Users (Filter berdasarkan role sering terjadi)
        Schema::table('users', fn (Blueprint $table) => $table->index('role'));

        // 2. Password Reset Tokens (Untuk pengecekan token expired)
        Schema::table('password_reset_tokens', fn (Blueprint $table) => $table->index('created_at'));

        // 3. Master Data (Index untuk pencarian/search)
        Schema::table('karyawans', fn (Blueprint $table) => $table->index('no_hp'));
        Schema::table('distributors', fn (Blueprint $table) => $table->index('no_hp'));
        Schema::table('customers', function (Blueprint $table) {
            $table->index('name');
            $table->index('email');
        });

        // 4. Harga Products (Composite Index: Mencari harga aktif untuk produk & customer tertentu pada tanggal tertentu)
        Schema::table('harga_products', function (Blueprint $table) {
            $table->index(['product_id', 'customer_id', 'tanggal_berlaku'], 'harga_products_product_customer_tgl_idx');
        });

        // 5. Transaksis (Composite Index: Laporan harian & Riwayat transaksi per customer)
        Schema::table('transaksis', function (Blueprint $table) {
            $table->index(['customer_id', 'tanggal'], 'transaksis_customer_tgl_idx');
            $table->index(['jenis_transaksi', 'tanggal'], 'transaksis_jenis_tgl_idx');
        });

        // 6. Transaksi Details (Untuk laporan penjualan per produk / best seller)
        Schema::table('transaksi_details', function (Blueprint $table) {
            $table->index(['product_id', 'created_at'], 'trx_details_product_created_idx');
        });

        // 7. Pembayarans (Laporan arus kas berdasarkan tanggal bayar)
        Schema::table('pembayarans', fn (Blueprint $table) => $table->index('tanggal_bayar'));

        // 8. Productions (Filter antrian produksi dan laporan durasi produksi)
        Schema::table('productions', function (Blueprint $table) {
            $table->index('status');
            $table->index(['product_id', 'status'], 'productions_product_status_idx');
            $table->index('tanggal_mulai');
            $table->index('tanggal_selesai');
        });

        // 9. Product Movements (Polymorphic Index & Riwayat pergerakan stok)
        Schema::table('product_movements', function (Blueprint $table) {
            $table->index('tipe');
            // Polymorphic index wajib digabung agar pencarian relasi reference() cepat
            $table->index(['ref_type', 'ref_id'], 'product_movements_ref_idx'); 
            $table->index(['inventory_id', 'created_at'], 'product_movements_inv_created_idx');
        });

        // 10. Stok Opnames (Filter berdasarkan status dan tanggal)
        Schema::table('stok_opnames', function (Blueprint $table) {
            $table->index('status');
            $table->index('tgl_opname');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropIndex(['role']));
        Schema::table('password_reset_tokens', fn (Blueprint $table) => $table->dropIndex(['created_at']));
        Schema::table('karyawans', fn (Blueprint $table) => $table->dropIndex(['no_hp']));
        Schema::table('distributors', fn (Blueprint $table) => $table->dropIndex(['no_hp']));
        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex(['name']);
            $table->dropIndex(['email']);
        });
        Schema::table('harga_products', fn (Blueprint $table) => $table->dropIndex('harga_products_product_customer_tgl_idx'));
        Schema::table('transaksis', function (Blueprint $table) {
            $table->dropIndex('transaksis_customer_tgl_idx');
            $table->dropIndex('transaksis_jenis_tgl_idx');
        });
        Schema::table('transaksi_details', fn (Blueprint $table) => $table->dropIndex('trx_details_product_created_idx'));
        Schema::table('pembayarans', fn (Blueprint $table) => $table->dropIndex(['tanggal_bayar']));
        Schema::table('productions', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex('productions_product_status_idx');
            $table->dropIndex(['tanggal_mulai']);
            $table->dropIndex(['tanggal_selesai']);
        });
        Schema::table('product_movements', function (Blueprint $table) {
            $table->dropIndex(['tipe']);
            $table->dropIndex('product_movements_ref_idx');
            $table->dropIndex('product_movements_inv_created_idx');
        });
        Schema::table('stok_opnames', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['tgl_opname']);
        });
    }
};