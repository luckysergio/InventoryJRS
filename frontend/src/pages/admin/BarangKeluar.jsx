import React, { useMemo, useState, useEffect } from "react";
import Swal from "sweetalert2";
import api from "../../services/api";

const formatTanggal = (tgl) => {
  if (!tgl) return "-";
  const date = new Date(tgl);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const BarangKeluarPage = () => {
  const [transaksiData, setTransaksiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBulan, setFilterBulan] = useState("all");
  const [filterTahun, setFilterTahun] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/transaksi");
      setTransaksiData(res.data.data || []);
    } catch (err) {
      Swal.fire("Error", "Gagal memuat data transaksi", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const produkTerpopuler = useMemo(() => {
    const map = {};

    transaksiData.forEach((transaksi) => {
      transaksi.details?.forEach((detail) => {
        if (!detail.product_label || !detail.tanggal) return;

        const d = new Date(detail.tanggal);
        const bulan = String(d.getMonth() + 1).padStart(2, "0");
        const tahun = String(d.getFullYear());

        const matchBulan = filterBulan === "all" || filterBulan === bulan;
        const matchTahun = filterTahun === "all" || filterTahun === tahun;

        if (!matchBulan || !matchTahun) return;

        const key = detail.product_label;

        if (!map[key]) {
          map[key] = {
            label: detail.product_label,
            total_qty: 0,
            transaksi_terakhir: detail.tanggal,
          };
        }

        map[key].total_qty += detail.qty;

        if (detail.tanggal > map[key].transaksi_terakhir) {
          map[key].transaksi_terakhir = detail.tanggal;
        }
      });
    });

    return Object.values(map).sort((a, b) => b.total_qty - a.total_qty);
  }, [transaksiData, filterBulan, filterTahun]);

  const tahunList = Array.from({ length: 6 }, (_, i) => String(2025 + i));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Barang Keluar</h1>
        <p className="text-gray-600 mt-2">
          Produk yang paling sering keluar berdasarkan transaksi
        </p>
      </div>

      <div className="flex justify-center gap-4 flex-wrap">
        <select
          value={filterBulan}
          onChange={(e) => setFilterBulan(e.target.value)}
          className="border rounded-xl px-4 py-2"
        >
          <option value="all">Semua Bulan</option>
          {NAMA_BULAN.map((nama, i) => {
            const bulanValue = String(i + 1).padStart(2, "0");
            return (
              <option key={bulanValue} value={bulanValue}>
                {nama}
              </option>
            );
          })}
        </select>

        <select
          value={filterTahun}
          onChange={(e) => setFilterTahun(e.target.value)}
          className="border rounded-xl px-4 py-2"
        >
          <option value="all">Semua Tahun</option>
          {tahunList.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <p className="text-center text-gray-500">Memuat data...</p>
      )}

      {!loading && produkTerpopuler.length === 0 && (
        <p className="text-center text-gray-500">
          Tidak ada data barang keluar.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {produkTerpopuler.map((produk, index) => (
          <div
            key={produk.label}
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition"
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {produk.label}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Transaksi terakhir:{" "}
                {formatTanggal(produk.transaksi_terakhir)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Total Keluar</p>
              <p className="text-3xl font-bold text-blue-600">
                {produk.total_qty}
              </p>
            </div>

            {index < 3 && (
              <span className="inline-block mt-4 text-xs font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                Top {index + 1}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarangKeluarPage;