// src/pages/admin/BarangKeluarPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { Calendar } from "lucide-react";
import api from "../../services/api";

const formatTanggal = (tgl) => {
  if (!tgl) return "-";
  const date = new Date(tgl);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

export const BarangKeluarFilterBar = ({
  filterDari,
  setFilterDari,
  filterSampai,
  setFilterSampai,
}) => (
  <div className="flex items-center gap-2 w-full">
    {/* Dari Tanggal */}
    <div className="relative flex-1 min-w-[100px] sm:min-w-[150px]">
      <Calendar className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="date"
        value={filterDari}
        onChange={(e) => setFilterDari(e.target.value)}
        className="w-full pl-8 sm:pl-10 pr-2 py-1 sm:py-1.5 text-[10px] sm:text-xs border border-gray-300 rounded text-gray-700 focus:ring-1 focus:ring-indigo-200 focus:outline-none"
      />
    </div>

    {/* Sampai Tanggal */}
    <div className="relative flex-1 min-w-[100px] sm:min-w-[150px]">
      <Calendar className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="date"
        value={filterSampai}
        onChange={(e) => setFilterSampai(e.target.value)}
        className="w-full pl-8 sm:pl-10 pr-2 py-1 sm:py-1.5 text-[10px] sm:text-xs border border-gray-300 rounded text-gray-700 focus:ring-1 focus:ring-indigo-200 focus:outline-none"
      />
    </div>

    {/* Reset Button */}
    <button
      onClick={() => {
        setFilterDari("");
        setFilterSampai("");
      }}
      className="py-1 px-2 sm:py-1.5 sm:px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[10px] sm:text-xs whitespace-nowrap transition"
    >
      Reset
    </button>
  </div>
);

const BarangKeluarPage = ({ setNavbarContent }) => {
  const [produkTerpopuler, setProdukTerpopuler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDari, setFilterDari] = useState("");
  const [filterSampai, setFilterSampai] = useState("");

  const fetchBestSeller = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterDari) params.dari = filterDari;
      if (filterSampai) params.sampai = filterSampai;

      const res = await api.get("products/best-seller", { params });
      setProdukTerpopuler(res.data.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal memuat data produk terlaris", "error");
      setProdukTerpopuler([]);
    } finally {
      setLoading(false);
    }
  }, [filterDari, filterSampai]);

  useEffect(() => {
    fetchBestSeller();
  }, [fetchBestSeller]);

  const formatProductName = (p) => {
    if (!p) return "-";
    const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(
      Boolean
    );
    return parts.join(" ") || p.kode;
  };

  useEffect(() => {
    setNavbarContent(
      <BarangKeluarFilterBar
        filterDari={filterDari}
        setFilterDari={setFilterDari}
        filterSampai={filterSampai}
        setFilterSampai={setFilterSampai}
      />
    );
  }, [
    filterDari,
    filterSampai,
    setNavbarContent,
    setFilterDari,
    setFilterSampai,
  ]);

  return (
    <div className="space-y-8 p-2 md:p-4 max-w-7xl mx-auto">
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : produkTerpopuler.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Tidak ada data barang keluar.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {produkTerpopuler.map((item, index) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-sm transition"
            >
              <div className="text-center mb-2">
                <p className="font-bold text-gray-800 text-sm line-clamp-2">
                  {formatProductName(item)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Kode: {item.kode}</p>
              </div>

              <div className="text-center mt-2">
                <p className="text-xs text-gray-600">Total Keluar</p>
                <p className="font-bold text-green-600 text-lg">
                  {item.total_qty}
                </p>
              </div>

              <p className="text-[10px] text-gray-500 mt-2 text-center">
                Terakhir: {formatTanggal(item.transaksi_terakhir)}
              </p>

              {index < 3 && (
                <div className="text-center mt-2">
                  <span className="inline-block text-[10px] font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                    Top {index + 1}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BarangKeluarPage;
