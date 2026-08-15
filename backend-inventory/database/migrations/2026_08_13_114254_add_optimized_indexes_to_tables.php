<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Menambahkan dan mengoptimalkan index untuk performa query di production.
     * 
     * Prinsip:
     * 1. Semua foreign key WAJIB di-index untuk performa JOIN
     * 2. Composite index untuk query dengan multi-filter
     * 3. FULLTEXT index untuk text search (MySQL only, 10-100x lebih cepat dari LIKE)
     * 4. Order kolom di composite index: paling selective di kiri
     */
    public function up(): void
    {
        $driver = config('database.connections.' . config('database.default') . '.driver');

        // ========================================
        // 1. USERS - Authentication & Role Management
        // ========================================
        Schema::table('users', function (Blueprint $table) use ($driver) {
            // Composite: Filter role + order by created_at (query list user yang sangat sering)
            $table->index(['role', 'created_at'], 'users_role_created_at_idx');
            
            // FULLTEXT untuk search name + email (MySQL/MariaDB only)
            if ($driver === 'mysql') {
                $table->fullText(['name', 'email'], 'users_name_email_fulltext');
            }
        });

        // ========================================
        // 2. PASSWORD RESET TOKENS - Token Cleanup
        // ========================================
        Schema::table('password_reset_tokens', function (Blueprint $table) {
            // Index untuk cleanup job yang hapus token expired
            $table->index('created_at', 'password_reset_tokens_created_at_idx');
        });

        // ========================================
        // 3. KARYAWANS - Master Data Karyawan
        // ========================================
        Schema::table('karyawans', function (Blueprint $table) {
            // Unique lookup berdasarkan nomor HP
            $table->index('no_hp', 'karyawans_no_hp_idx');
            
            // Foreign key index (WAJIB untuk JOIN ke jabatans)
            $table->index('jabatan_id', 'karyawans_jabatan_id_idx');
        });

        // ========================================
        // 4. DISTRIBUTORS - Master Data Distributor
        // ========================================
        Schema::table('distributors', function (Blueprint $table) {
            // Unique lookup berdasarkan nomor HP
            $table->index('no_hp', 'distributors_no_hp_idx');
        });

        // ========================================
        // 5. CUSTOMERS - Master Data Customer
        // ========================================
        Schema::table('customers', function (Blueprint $table) use ($driver) {
            // Single indexes untuk filter individual
            $table->index('name', 'customers_name_idx');
            $table->index('email', 'customers_email_idx');
            
            // FULLTEXT untuk search name + email sekaligus
            if ($driver === 'mysql') {
                $table->fullText(['name', 'email'], 'customers_name_email_fulltext');
            }
        });

        // ========================================
        // 6. TYPE PRODUCTS - FK Index
        // ========================================
        Schema::table('type_products', function (Blueprint $table) {
            // Foreign key index (WAJIB untuk JOIN ke jenis_products)
            $table->index('jenis_id', 'type_products_jenis_id_idx');
        });

        // ========================================
        // 7. PRODUCTS - Master Data Produk
        // ========================================
        Schema::table('products', function (Blueprint $table) {
            // Semua foreign key WAJIB di-index untuk performa JOIN
            $table->index('jenis_id', 'products_jenis_id_idx');
            $table->index('type_id', 'products_type_id_idx');
            $table->index('bahan_id', 'products_bahan_id_idx');
            $table->index('distributor_id', 'products_distributor_id_idx');
            $table->index('customer_id', 'products_customer_id_idx');
            
            // Composite index: Filter by jenis + distributor (query yang umum)
            $table->index(['jenis_id', 'distributor_id'], 'products_jenis_distributor_idx');
        });

        // ========================================
        // 8. HARGA PRODUCTS - Price History
        // ========================================
        Schema::table('harga_products', function (Blueprint $table) {
            // Composite index: Cari harga aktif untuk produk + customer pada tanggal tertentu
            // Urutan: product_id (paling selective) → customer_id → tanggal_berlaku
            $table->index(
                ['product_id', 'customer_id', 'tanggal_berlaku'], 
                'harga_products_product_customer_tanggal_idx'
            );
            
            // Foreign key indexes
            $table->index('product_id', 'harga_products_product_id_idx');
            $table->index('customer_id', 'harga_products_customer_id_idx');
        });

        // ========================================
        // 9. TRANSAKSIS - Transaction Records
        // ========================================
        Schema::table('transaksis', function (Blueprint $table) {
            // Composite: Riwayat transaksi per customer (filter customer_id + order tanggal)
            $table->index(['customer_id', 'tanggal'], 'transaksis_customer_tanggal_idx');
            
            // Composite: Laporan berdasarkan jenis transaksi (filter jenis + order tanggal)
            $table->index(['jenis_transaksi', 'tanggal'], 'transaksis_jenis_tanggal_idx');
            
            // Single index: Laporan harian tanpa filter
            $table->index('tanggal', 'transaksis_tanggal_idx');
            
            // Foreign key index
            $table->index('customer_id', 'transaksis_customer_id_idx');
        });

        // ========================================
        // 10. TRANSAKSI DETAILS - Transaction Line Items
        // ========================================
        Schema::table('transaksi_details', function (Blueprint $table) {
            // Composite: Laporan penjualan per produk (filter product_id + order created_at)
            $table->index(['product_id', 'created_at'], 'trx_details_product_created_idx');
            
            // Foreign key indexes (WAJIB untuk JOIN ke transaksis)
            $table->index('transaksi_id', 'trx_details_transaksi_id_idx');
            $table->index('product_id', 'trx_details_product_id_idx');
            $table->index('status_transaksi_id', 'trx_details_status_idx');
        });

        // ========================================
        // 11. PEMBAYARANS - Payment Records
        // ========================================
        Schema::table('pembayarans', function (Blueprint $table) {
            // Index untuk laporan arus kas berdasarkan tanggal bayar
            $table->index('tanggal_bayar', 'pembayarans_tanggal_bayar_idx');
            
            // Foreign key index (WAJIB untuk JOIN ke transaksi_details)
            $table->index('transaksi_detail_id', 'pembayarans_transaksi_detail_id_idx');
            
            // Composite: Laporan pembayaran per transaksi detail
            $table->index(['transaksi_detail_id', 'tanggal_bayar'], 'pembayarans_detail_tanggal_idx');
        });

        // ========================================
        // 12. PRODUCTIONS - Production Queue
        // ========================================
        Schema::table('productions', function (Blueprint $table) {
            // Filter berdasarkan status (antrian produksi)
            $table->index('status', 'productions_status_idx');
            
            // Composite: Filter product + status (cek status produksi produk tertentu)
            $table->index(['product_id', 'status'], 'productions_product_status_idx');
            
            // Composite: Filter status + order by tanggal_mulai (antrian produksi aktif)
            $table->index(['status', 'tanggal_mulai'], 'productions_status_tanggal_mulai_idx');
            
            // Single indexes untuk filter tanggal individual
            $table->index('tanggal_mulai', 'productions_tanggal_mulai_idx');
            $table->index('tanggal_selesai', 'productions_tanggal_selesai_idx');
            
            // Foreign key indexes
            $table->index('product_id', 'productions_product_id_idx');
            $table->index('karyawan_id', 'productions_karyawan_id_idx');
            $table->index('transaksi_detail_id', 'productions_transaksi_detail_id_idx');
        });

        // ========================================
        // 13. PRODUCT MOVEMENTS - Inventory Movement Logs
        // ========================================
        Schema::table('product_movements', function (Blueprint $table) {
            // Index tipe pergerakan (in/out/transfer/produksi)
            $table->index('tipe', 'product_movements_tipe_idx');
            
            // Polymorphic index: WAJIB digabung untuk relasi reference() yang cepat
            $table->index(['ref_type', 'ref_id'], 'product_movements_ref_type_id_idx');
            
            // Composite: Riwayat pergerakan per inventory (filter inventory + order created_at)
            $table->index(['inventory_id', 'created_at'], 'product_movements_inventory_created_idx');
            
            // Foreign key index
            $table->index('inventory_id', 'product_movements_inventory_id_idx');
        });

        // ========================================
        // 14. STOK OPNAMES - Stock Opname Records
        // ========================================
        Schema::table('stok_opnames', function (Blueprint $table) {
            // Filter berdasarkan status
            $table->index('status', 'stok_opnames_status_idx');
            
            // Filter berdasarkan tanggal opname
            $table->index('tgl_opname', 'stok_opnames_tgl_opname_idx');
            
            // Composite: Filter status + order by tanggal (cek opname yang belum selesai)
            $table->index(['status', 'tgl_opname'], 'stok_opnames_status_tgl_idx');
            
            // Foreign key index
            $table->index('user_id', 'stok_opnames_user_id_idx');
        });

        // ========================================
        // 15. DETAIL STOK OPNAMES - Stock Opname Line Items
        // ========================================
        Schema::table('detail_stok_opnames', function (Blueprint $table) {
            // Foreign key indexes (WAJIB untuk JOIN)
            $table->index('stok_opname_id', 'detail_stok_opnames_stok_opname_id_idx');
            $table->index('inventory_id', 'detail_stok_opnames_inventory_id_idx');
            
            // Composite: Query detail opname per inventory
            $table->index(['stok_opname_id', 'inventory_id'], 'detail_stok_opnames_opname_inventory_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = config('database.connections.' . config('database.default') . '.driver');

        // 1. Users
        Schema::table('users', function (Blueprint $table) use ($driver) {
            $table->dropIndex('users_role_created_at_idx');
            if ($driver === 'mysql') {
                $table->dropFullText('users_name_email_fulltext');
            }
        });

        // 2. Password Reset Tokens
        Schema::table('password_reset_tokens', function (Blueprint $table) {
            $table->dropIndex('password_reset_tokens_created_at_idx');
        });

        // 3. Karyawans
        Schema::table('karyawans', function (Blueprint $table) {
            $table->dropIndex('karyawans_no_hp_idx');
            $table->dropIndex('karyawans_jabatan_id_idx');
        });

        // 4. Distributors
        Schema::table('distributors', function (Blueprint $table) {
            $table->dropIndex('distributors_no_hp_idx');
        });

        // 5. Customers
        Schema::table('customers', function (Blueprint $table) use ($driver) {
            $table->dropIndex('customers_name_idx');
            $table->dropIndex('customers_email_idx');
            if ($driver === 'mysql') {
                $table->dropFullText('customers_name_email_fulltext');
            }
        });

        // 6. Type Products
        Schema::table('type_products', function (Blueprint $table) {
            $table->dropIndex('type_products_jenis_id_idx');
        });

        // 7. Products
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_jenis_id_idx');
            $table->dropIndex('products_type_id_idx');
            $table->dropIndex('products_bahan_id_idx');
            $table->dropIndex('products_distributor_id_idx');
            $table->dropIndex('products_customer_id_idx');
            $table->dropIndex('products_jenis_distributor_idx');
        });

        // 8. Harga Products
        Schema::table('harga_products', function (Blueprint $table) {
            $table->dropIndex('harga_products_product_customer_tanggal_idx');
            $table->dropIndex('harga_products_product_id_idx');
            $table->dropIndex('harga_products_customer_id_idx');
        });

        // 9. Transaksis
        Schema::table('transaksis', function (Blueprint $table) {
            $table->dropIndex('transaksis_customer_tanggal_idx');
            $table->dropIndex('transaksis_jenis_tanggal_idx');
            $table->dropIndex('transaksis_tanggal_idx');
            $table->dropIndex('transaksis_customer_id_idx');
        });

        // 10. Transaksi Details
        Schema::table('transaksi_details', function (Blueprint $table) {
            $table->dropIndex('trx_details_product_created_idx');
            $table->dropIndex('trx_details_transaksi_id_idx');
            $table->dropIndex('trx_details_product_id_idx');
            $table->dropIndex('trx_details_status_idx');
        });

        // 11. Pembayarans
        Schema::table('pembayarans', function (Blueprint $table) {
            $table->dropIndex('pembayarans_tanggal_bayar_idx');
            $table->dropIndex('pembayarans_transaksi_detail_id_idx');
            $table->dropIndex('pembayarans_detail_tanggal_idx');
        });

        // 12. Productions
        Schema::table('productions', function (Blueprint $table) {
            $table->dropIndex('productions_status_idx');
            $table->dropIndex('productions_product_status_idx');
            $table->dropIndex('productions_status_tanggal_mulai_idx');
            $table->dropIndex('productions_tanggal_mulai_idx');
            $table->dropIndex('productions_tanggal_selesai_idx');
            $table->dropIndex('productions_product_id_idx');
            $table->dropIndex('productions_karyawan_id_idx');
            $table->dropIndex('productions_transaksi_detail_id_idx');
        });

        // 13. Product Movements
        Schema::table('product_movements', function (Blueprint $table) {
            $table->dropIndex('product_movements_tipe_idx');
            $table->dropIndex('product_movements_ref_type_id_idx');
            $table->dropIndex('product_movements_inventory_created_idx');
            $table->dropIndex('product_movements_inventory_id_idx');
        });

        // 14. Stok Opnames
        Schema::table('stok_opnames', function (Blueprint $table) {
            $table->dropIndex('stok_opnames_status_idx');
            $table->dropIndex('stok_opnames_tgl_opname_idx');
            $table->dropIndex('stok_opnames_status_tgl_idx');
            $table->dropIndex('stok_opnames_user_id_idx');
        });

        // 15. Detail Stok Opnames
        Schema::table('detail_stok_opnames', function (Blueprint $table) {
            $table->dropIndex('detail_stok_opnames_stok_opname_id_idx');
            $table->dropIndex('detail_stok_opnames_inventory_id_idx');
            $table->dropIndex('detail_stok_opnames_opname_inventory_idx');
        });
    }
};