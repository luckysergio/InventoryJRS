import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import api from "../../services/api";
import { ArrowDown, ArrowUp, Repeat, Factory, Calendar } from "lucide-react";

const formatProductName = (product) => {
  if (!product) return "-";
  return [product.jenis?.nama, product.type?.nama, product.bahan?.nama,product.ukuran]
    .filter(Boolean)
    .join(" ");
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

  const [filterDari, setFilterDari] = useState("");
  const [filterSampai, setFilterSampai] = useState("");
  const [selectedType, setSelectedType] = useState("");

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

  const movementTypes = [
    { value: "in", label: "IN" },
    { value: "out", label: "OUT" },
    { value: "transfer", label: "TRANSFER" },
    { value: "produksi", label: "PRODUKSI" },
  ];

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const date = new Date(m.created_at);
      const dari = filterDari ? new Date(filterDari) : null;
      const sampai = filterSampai ? new Date(filterSampai) : null;

      if (dari && date < dari) return false;
      if (sampai && date > sampai) return false;
      if (selectedType && m.tipe !== selectedType) return false;
      return true;
    });
  }, [movements, filterDari, filterSampai, selectedType]);

  const handleReset = () => {
    setFilterDari("");
    setFilterSampai("");
    setSelectedType("");
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Product Movement</h1>
          <p className="text-gray-600 mt-1">Riwayat perubahan stok produk</p>
        </div>
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Product Movement</h1>
          <p className="text-gray-600 mt-1">Riwayat perubahan stok produk</p>
        </div>
      </div>

      {/* FILTERS */}
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
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:outline-none"
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
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Tipe Mutasi
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-200 focus:outline-none"
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

      <div className="flex justify-center">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
        >
          Reset Filter
        </button>
      </div>

      {/* CONTENT */}
      {filteredMovements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Tidak ada data mutasi pada periode ini.
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
                  className="bg-white border border-gray-200 rounded-lg p-3 hover:border-purple-300 hover:shadow-sm transition"
                >
                  {/* Badge & Tanggal */}
                  <div className="flex justify-between items-start mb-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full ${badge.className}`}>
                      {badge.icon}
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>

                  {/* Produk */}
                  <p className="text-[10px] font-medium text-gray-800 line-clamp-2 min-h-[28px] text-center">
                    {formatProductName(product)}
                  </p>
                  <p className="text-[12px] text-gray-600 mt-1 text-center">
                    {m.inventory?.place?.nama || "–"}
                  </p>

                  {/* Qty */}
                  <p className="text-lg font-bold text-purple-700 mt-2 text-center">
                    {m.qty} {m.tipe === "out" || m.tipe === "transfer" ? "–" : "+"}
                  </p>

                  {/* Keterangan */}
                  {m.keterangan && (
                    <p className="text-[10px] italic text-gray-500 mt-2 line-clamp-2 text-center">
                      "{m.keterangan}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductMovementPage;