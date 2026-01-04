import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Calendar, TrendingUp } from "lucide-react";
import api from "../../services/api";

const formatTanggal = (tgl) => {
  if (!tgl) return "-";
  const date = new Date(tgl);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const BarangKeluarPage = () => {
  const [produkTerpopuler, setProdukTerpopuler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDari, setFilterDari] = useState("");
  const [filterSampai, setFilterSampai] = useState("");

  const fetchBestSeller = async () => {
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
  };

  useEffect(() => {
    fetchBestSeller();
  }, [filterDari, filterSampai]);

  const handleReset = () => {
    setFilterDari("");
    setFilterSampai("");
  };

  const formatProductName = (p) => {
    if (!p) return "-";
    const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean);
    return parts.join(" ") || p.kode;
  };

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Barang Keluar</h1>
          <p className="text-gray-600 mt-1">
            Produk yang paling sering keluar berdasarkan transaksi
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp size={16} />
          <span>Urut: Total Keluar (Tertinggi)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Dari Tanggal
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={filterDari}
              onChange={(e) => setFilterDari(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Sampai Tanggal
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={filterSampai}
              onChange={(e) => setFilterSampai(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleReset}
            className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : produkTerpopuler.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Tidak ada data barang keluar.
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {produkTerpopuler.map((item, index) => (
              <div
                key={item.id} // ✅ gunakan item.id langsung
                className="bg-white border border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-sm transition"
              >
                <div className="text-center mb-2">
                  <p className="font-bold text-gray-800 text-sm line-clamp-2">
                    {formatProductName(item)} {/* ✅ kirim item langsung */}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Kode: {item.kode}
                  </p>
                </div>

                <div className="text-center mt-2">
                  <p className="text-xs text-gray-600">Total Keluar</p>
                  <p className="font-bold text-green-600 text-lg">
                    {item.total_qty} {/* ✅ akses langsung */}
                  </p>
                </div>

                <p className="text-[10px] text-gray-500 mt-2 text-center">
                  Terakhir: {formatTanggal(item.transaksi_terakhir)} {/* ✅ langsung */}
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
        </div>
      )}
    </div>
  );
};

export default BarangKeluarPage;