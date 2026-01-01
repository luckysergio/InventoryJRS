// src/pages/admin/Dashboard.jsx
import React from "react";

// Dummy data — nanti tinggal diganti API dari Laravel
const transaksiStatusData = {
  sisaPembayaran: 7,       // transaksi yang masih punya hutang / belum lunas
  transaksiSelesai: 32,    // transaksi berstatus selesai
  transaksiBerjalan: 14,   // barang sedang dibuat / sedang diproses
  transaksiPending: 5,     // menunggu konfirmasi / belum diproses
};

// Dummy total pendapatan
const totalPendapatan = 18500000;

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

      {/* CARD TOTAL PENDAPATAN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Total Pendapatan */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pendapatan Toko</h2>
          <p className="text-3xl font-bold text-gray-900">
            {formatRupiah(totalPendapatan)}
          </p>
          <p className="text-gray-500 mt-2">Total akumulasi pendapatan</p>
        </div>

        {/* Ringkasan Status Transaksi */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ringkasan Status</h2>

          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Belum Lunas</span>
              <span className="font-semibold text-yellow-700">
                {transaksiStatusData.sisaPembayaran}
              </span>
            </div>

            <div className="flex justify-between text-gray-700">
              <span>Selesai</span>
              <span className="font-semibold text-green-700">
                {transaksiStatusData.transaksiSelesai}
              </span>
            </div>

            <div className="flex justify-between text-gray-700">
              <span>Berjalan</span>
              <span className="font-semibold text-blue-700">
                {transaksiStatusData.transaksiBerjalan}
              </span>
            </div>

            <div className="flex justify-between text-gray-700">
              <span>Pending</span>
              <span className="font-semibold text-red-700">
                {transaksiStatusData.transaksiPending}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
