import React from "react";

const transaksiStatusData = {
  sisaPembayaran: 7,       // transaksi yang masih punya hutang / belum lunas
  transaksiSelesai: 32,    // transaksi berstatus selesai
  transaksiBerjalan: 14,   // barang sedang dibuat / sedang diproses
  transaksiPending: 5,     // menunggu konfirmasi / belum diproses
};


const formatRupiah = (number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);

const Dashboard = () => {
  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Toko</h1>
          <p className="text-gray-600 mt-2">
            Laporan ringkas pesanan, pembayaran, dan aktivitas pelanggan.
          </p>
        </div>
      </div>

      {/* 4 CARD STATUS TRANSAKSI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Sisa Pembayaran */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50">
          <p className="text-gray-600 text-sm">Customer Belum Lunas</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">
            {transaksiStatusData.sisaPembayaran}
          </p>
          <p className="text-sm text-gray-500 mt-2">Masih ada tunggakan pembayaran</p>
        </div>

        {/* Transaksi Selesai */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50">
          <p className="text-gray-600 text-sm">Transaksi Selesai</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {transaksiStatusData.transaksiSelesai}
          </p>
          <p className="text-sm text-gray-500 mt-2">Pesanan telah selesai seluruhnya</p>
        </div>

        {/* Transaksi Berjalan */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50">
          <p className="text-gray-600 text-sm">Transaksi Berjalan</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            {transaksiStatusData.transaksiBerjalan}
          </p>
          <p className="text-sm text-gray-500 mt-2">Sedang diproses oleh toko</p>
        </div>

        {/* Transaksi Pending */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50">
          <p className="text-gray-600 text-sm">Transaksi Pending</p>
          <p className="text-3xl font-bold text-red-600 mt-1">
            {transaksiStatusData.transaksiPending}
          </p>
          <p className="text-sm text-gray-500 mt-2">Menunggu tindakan admin</p>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
