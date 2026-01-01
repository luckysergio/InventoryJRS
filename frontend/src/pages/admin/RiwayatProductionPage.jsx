// src/pages/RiwayatProductionPage.jsx
import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { Calendar, Package, User, CheckCircle, XCircle } from "lucide-react";
import api from "../../services/api";

const statusConfig = {
  selesai: {
    label: "Selesai",
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-300",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  batal: {
    label: "Dibatalkan",
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-300",
    icon: <XCircle className="w-4 h-4" />,
  },
};

const RiwayatProductionPage = () => {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/productions");
      // Hanya ambil status selesai atau batal
      const filtered = res.data.data.filter(
        (p) => p.status === "selesai" || p.status === "batal"
      );
      setProductions(filtered);
    } catch {
      Swal.fire("Error", "Gagal mengambil data riwayat produksi", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i).sort(
    (a, b) => b - a
  );

  const months = [
    { value: "1", label: "Januari" },
    { value: "2", label: "Februari" },
    { value: "3", label: "Maret" },
    { value: "4", label: "April" },
    { value: "5", label: "Mei" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "Agustus" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  const filteredProductions = useMemo(() => {
    return productions.filter((p) => {
      const date = new Date(p.created_at || p.updated_at || p.tanggal_mulai);
      const prodYear = date.getFullYear().toString();
      const prodMonth = (date.getMonth() + 1).toString();

      if (selectedYear && prodYear !== selectedYear) return false;
      if (selectedMonth && prodMonth !== selectedMonth) return false;
      return true;
    });
  }, [productions, selectedYear, selectedMonth]);

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatProductName = (p) => {
    if (!p) return "-";
    return [p.jenis?.nama, p.type?.nama, p.ukuran].filter(Boolean).join(" | ");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Riwayat Produksi
        </h1>
        <p className="text-gray-600 mb-6">
          Riwayat produksi yang telah selesai atau dibatalkan
        </p>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Riwayat Produksi</h1>
        <p className="text-gray-600">
          Riwayat produksi yang telah selesai atau dibatalkan
        </p>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap justify-center gap-4">
        {/* Tahun */}
        <div className="w-full sm:w-40">
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">Semua Tahun</option>
            {years.map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Bulan */}
        <div className="w-full sm:w-48">
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">Semua Bulan</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset */}
        <div className="w-full sm:w-40 flex items-end">
          <button
            onClick={() => {
              setSelectedYear("");
              setSelectedMonth("");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {filteredProductions.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block bg-gray-100 rounded-full p-4 mb-3">
            <CheckCircle className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">
            Tidak ada riwayat produksi pada periode ini.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProductions.map((p) => {
            const status = statusConfig[p.status] || statusConfig.selesai;
            return (
              <div
                key={p.id}
                className={`bg-white border ${status.border} rounded-2xl shadow-sm p-6`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {p.product?.kode || "-"}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatProductName(p.product)}
                    </p>
                  </div>
                  <span
                    className={`${status.bg} ${status.text} text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1`}
                  >
                    {status.icon}
                    {status.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <p className="text-sm text-gray-700 truncate">
                    {p.jenis_pembuatan === "pesanan"
                      ? p.transaksi?.customer?.name || "Pesanan"
                      : "Inventory"}
                  </p>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <p className="text-sm text-gray-700">Qty: {p.qty}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600">Mulai</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(p.tanggal_mulai)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600">Selesai</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(p.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RiwayatProductionPage;
