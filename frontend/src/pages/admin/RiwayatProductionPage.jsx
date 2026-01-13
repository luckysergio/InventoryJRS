// src/pages/admin/RiwayatProductionPage.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import api from "../../services/api";

const statusConfig = {
  selesai: {
    label: "Selesai",
    bg: "bg-green-100",
    text: "text-green-800",
    icon: <CheckCircle size={12} />,
  },
  batal: {
    label: "Dibatalkan",
    bg: "bg-red-100",
    text: "text-red-800",
    icon: <XCircle size={12} />,
  },
};

export const RiwayatProductionFilterBar = ({
  filterDari,
  setFilterDari,
  filterSampai,
  setFilterSampai,
  handleReset,
}) => (
  <div className="flex items-center gap-2 w-full">
    {/* Tanggal Dari */}
    <div className="relative flex-1 min-w-[100px] sm:min-w-[150px]">
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="date"
        value={filterDari}
        onChange={(e) => setFilterDari(e.target.value)}
        className="w-full pl-10 pr-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded text-gray-700 focus:ring-1 focus:ring-blue-200 focus:outline-none"
        placeholder="Dari"
      />
    </div>

    {/* Tanggal Sampai */}
    <div className="relative flex-1 min-w-[100px] sm:min-w-[150px]">
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="date"
        value={filterSampai}
        onChange={(e) => setFilterSampai(e.target.value)}
        min={filterDari || undefined}
        className="w-full pl-10 pr-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded text-gray-700 focus:ring-1 focus:ring-blue-200 focus:outline-none"
        placeholder="Sampai"
      />
    </div>

    {/* Reset Button */}
    <button
      onClick={handleReset}
      className="py-1.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs sm:text-sm whitespace-nowrap font-medium transition"
    >
      Reset
    </button>
  </div>
);

const RiwayatProductionPage = ({ setNavbarContent }) => {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterDari, setFilterDari] = useState("");
  const [filterSampai, setFilterSampai] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/productions");
      const filtered = res.data.data.filter(
        (p) => p.status === "selesai" || p.status === "batal"
      );
      setProductions(filtered);
    } catch {
      Swal.fire("Error", "Gagal mengambil data riwayat produksi", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  const formatProductName = (p) => {
    if (!p) return "-";
    return [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran]
      .filter(Boolean)
      .join(" ");
  };

  const filteredProductions = useMemo(() => {
    return productions.filter((p) => {
      const date = new Date(p.updated_at || p.tanggal_mulai);
      const dari = filterDari ? new Date(filterDari) : null;
      const sampai = filterSampai ? new Date(filterSampai) : null;

      if (dari && date < dari) return false;
      if (sampai && date > sampai) return false;
      return true;
    });
  }, [productions, filterDari, filterSampai]);

  const handleReset = () => {
    setFilterDari("");
    setFilterSampai("");
  };

  // Kirim filter ke Navbar
  useEffect(() => {
    setNavbarContent(
      <RiwayatProductionFilterBar
        filterDari={filterDari}
        setFilterDari={setFilterDari}
        filterSampai={filterSampai}
        setFilterSampai={setFilterSampai}
        handleReset={handleReset}
      />
    );
    // NOTE: jangan masukkan setNavbarContent ke dependencies
  }, [filterDari, filterSampai]);

  if (loading) {
    return (
      <div className="space-y-6 p-2 md:p-4 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-2 md:p-4 max-w-7xl mx-auto">
      {filteredProductions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Tidak ada riwayat produksi pada periode ini.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredProductions.map((p) => {
              const status = statusConfig[p.status] || statusConfig.selesai;
              return (
                <div
                  key={p.id}
                  className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition"
                >
                  {/* Status */}
                  <div className="flex justify-center items-center mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full ${status.bg} ${status.text}`}
                    >
                      {status.icon}
                      {status.label}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-gray-800 line-clamp-1 text-center">
                    {p.product?.kode || "-"}
                  </p>
                  <p className="text-[11px] text-gray-600 line-clamp-2 min-h-[28px] text-center">
                    {formatProductName(p.product)}
                  </p>

                  <div className="flex items-center justify-center gap-1 mt-2 text-center">
                    <span className="text-[11px] text-gray-700">
                      Qty {p.qty} untuk{" "}
                      {p.jenis_pembuatan === "pesanan"
                        ? p.transaksi?.customer?.name || "Pesanan"
                        : "Inventory"}
                    </span>
                  </div>

                  <div className="text-[10px] text-gray-500 mt-2 text-center">
                    <span className="font-medium">{formatDate(p.tanggal_mulai)}</span>
                    {" - "}
                    {formatDate(p.tanggal_selesai)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiwayatProductionPage;
