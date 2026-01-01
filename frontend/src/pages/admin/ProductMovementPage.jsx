import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import api from "../../services/api";
import { ArrowDown, ArrowUp, Repeat, Factory } from "lucide-react";

// Helper function — konsisten dengan Inventory & Pesanan
const formatProductName = (product) => {
  if (!product) return "-";
  return [product.jenis?.nama, product.type?.nama, product.ukuran]
    .filter(Boolean)
    .join(" | ");
};

const badgeType = {
  in: {
    label: "IN",
    className: "bg-green-100 text-green-800",
    icon: <ArrowDown size={14} />,
  },
  out: {
    label: "OUT",
    className: "bg-red-100 text-red-800",
    icon: <ArrowUp size={14} />,
  },
  transfer: {
    label: "TRANSFER",
    className: "bg-blue-100 text-blue-800",
    icon: <Repeat size={14} />,
  },
  produksi: {
    label: "PRODUKSI",
    className: "bg-purple-100 text-purple-800",
    icon: <Factory size={14} />,
  },
};

const ProductMovementPage = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedType, setSelectedType] = useState(""); // '' = semua

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/product-movements");
      setMovements(res.data.data || []);
    } catch (err) {
      console.error("Error fetching product movements:", err);
      Swal.fire("Error", "Gagal mengambil data mutasi produk", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i + 5); // 5 tahun ke belakang + sekarang + 1 ke depan
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

  const movementTypes = [
    { value: "in", label: "IN" },
    { value: "out", label: "OUT" },
    { value: "transfer", label: "TRANSFER" },
    { value: "produksi", label: "PRODUKSI" },
  ];

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const date = new Date(m.created_at);
      const movementYear = date.getFullYear().toString();
      const movementMonth = (date.getMonth() + 1).toString();

      if (selectedYear && movementYear !== selectedYear) return false;
      if (selectedMonth && movementMonth !== selectedMonth) return false;
      if (selectedType && m.tipe !== selectedType) return false;
      return true;
    });
  }, [movements, selectedYear, selectedMonth, selectedType]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Product Movement</h1>
          <p className="text-gray-500 text-sm">Riwayat perubahan stok produk</p>
        </div>
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Product Movement</h1>
        <p className="text-gray-500 text-sm">Riwayat perubahan stok produk</p>
      </div>

      {/* FILTERS: TAHUN, BULAN, TIPE */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
        {/* Tahun */}
        <div className="w-full sm:w-36">
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none text-center"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">Semua Tahun</option>
            {years.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Bulan */}
        <div className="w-full sm:w-40">
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none text-center"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">Semua Bulan</option>
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tipe Mutasi */}
        <div className="w-full sm:w-44">
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none text-center"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">Semua Tipe</option>
            {movementTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RESET BUTTON (opsional tapi berguna) */}
      <div className="flex justify-center">
        <button
          onClick={() => {
            setSelectedYear("");
            setSelectedMonth("");
            setSelectedType("");
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
        >
          Reset Filter
        </button>
      </div>

      {/* CONTENT */}
      {filteredMovements.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            Tidak ada data mutasi pada periode ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMovements.map((m) => {
            const badge = badgeType[m.tipe] || {
              label: m.tipe?.toUpperCase() || "–",
              className: "bg-gray-100 text-gray-800",
              icon: null,
            };
            const product = m.inventory?.product || null;

            return (
              <div
                key={m.id}
                className="bg-white p-5 rounded-2xl shadow border border-gray-200 space-y-4"
              >
                {/* HEADER: BADGE + TANGGAL */}
                <div className="flex justify-between items-start">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}
                  >
                    {badge.icon}
                    {badge.label}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(m.created_at).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* PRODUCT INFO */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Kode:</span> {product?.kode || "–"}
                  </p>
                  <p className="text-sm font-medium text-gray-800">
                    {formatProductName(product)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Tempat:</span> {m.inventory?.place?.nama || "–"}
                  </p>
                  <p className="text-lg font-bold text-purple-700">
                    {m.qty} {m.tipe === "out" || m.tipe === "transfer" ? "–" : "+"}
                  </p>
                </div>

                {/* KETERANGAN */}
                {m.keterangan && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs italic text-gray-600">{m.keterangan}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductMovementPage;