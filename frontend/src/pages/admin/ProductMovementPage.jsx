// src/pages/admin/ProductMovementPage.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import { Calendar, ArrowDown, ArrowUp, Repeat, Factory } from "lucide-react";
import api from "../../services/api";

// Helper: format nama produk
const formatProductName = (product) => {
  if (!product) return "-";
  return [
    product.jenis?.nama,
    product.type?.nama,
    product.bahan?.nama,
    product.ukuran,
  ]
    .filter(Boolean)
    .join(" ");
};

// Badge types
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

export const ProductMovementFilterBar = ({
  filterDari,
  setFilterDari,
  filterSampai,
  setFilterSampai,
  selectedType,
  setSelectedType,
  movementTypes,
  handleReset,
}) => (
  <div className="flex items-center gap-2 w-full">
    {/* Tanggal Dari */}
    <div className="relative flex-1 min-w-[80px] xs:min-w-[90px] sm:min-w-[160px] md:min-w-[180px] lg:min-w-[200px]">
      <Calendar className="absolute left-1 xs:left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 xs:h-4 w-3 xs:w-4 text-gray-400" />
      <input
        type="date"
        value={filterDari}
        onChange={(e) => setFilterDari(e.target.value)}
        className="w-full pl-7 xs:pl-8 sm:pl-10 pr-1 py-[2px] xs:py-1 sm:py-1.5 text-[9px] xs:text-[10px] sm:text-sm border border-gray-300 rounded text-gray-700 focus:ring-1 focus:ring-purple-200 focus:outline-none"
        placeholder="Dari"
      />
    </div>

    {/* Tanggal Sampai */}
    <div className="relative flex-1 min-w-[80px] xs:min-w-[90px] sm:min-w-[160px] md:min-w-[180px] lg:min-w-[200px]">
      <Calendar className="absolute left-1 xs:left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 xs:h-4 w-3 xs:w-4 text-gray-400" />
      <input
        type="date"
        value={filterSampai}
        onChange={(e) => setFilterSampai(e.target.value)}
        min={filterDari || undefined}
        className="w-full pl-7 xs:pl-8 sm:pl-10 pr-1 py-[2px] xs:py-1 sm:py-1.5 text-[9px] xs:text-[10px] sm:text-sm border border-gray-300 rounded text-gray-700 focus:ring-1 focus:ring-purple-200 focus:outline-none"
        placeholder="Sampai"
      />
    </div>

    {/* Select Tipe */}
    <select
      className="flex-1 min-w-[80px] xs:min-w-[100px] sm:min-w-[140px] py-[2px] xs:py-1 sm:py-1.5 px-1 xs:px-2 sm:px-3 text-[9px] xs:text-xs sm:text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-200 focus:outline-none"
      value={selectedType}
      onChange={(e) => setSelectedType(e.target.value)}
    >
      <option value="">Tipe</option>
      {movementTypes.map((type) => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>

    {/* Reset Button */}
    <button
      onClick={handleReset}
      className="py-[2px] xs:py-1 px-2 xs:px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[9px] xs:text-xs sm:text-sm whitespace-nowrap font-medium transition"
    >
      Reset
    </button>
  </div>
);


const ProductMovementPage = ({ setNavbarContent }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterDari, setFilterDari] = useState("");
  const [filterSampai, setFilterSampai] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // ✅ Stable movementTypes
  const movementTypes = useMemo(
    () => [
      { value: "in", label: "IN" },
      { value: "out", label: "OUT" },
      { value: "transfer", label: "TRANSFER" },
      { value: "produksi", label: "PRODUKSI" },
    ],
    []
  );

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // ✅ Use stable movementTypes to prevent infinite loop
  useEffect(() => {
    setNavbarContent(
      <ProductMovementFilterBar
        filterDari={filterDari}
        setFilterDari={setFilterDari}
        filterSampai={filterSampai}
        setFilterSampai={setFilterSampai}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        movementTypes={movementTypes}
        handleReset={handleReset}
      />
    );
  }, [filterDari, filterSampai, selectedType, setNavbarContent, movementTypes]);

  if (loading) {
    return (
      <div className="space-y-6 p-2 md:p-4 max-w-7xl mx-auto pt-16">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-2 md:p-4 max-w-7xl mx-auto pt-16">
      {filteredMovements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Tidak ada data mutasi pada periode ini.
        </div>
      ) : (
        <div className="space-y-6">
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
                  className="bg-white border border-gray-200 rounded-lg p-3 hover:border-purple-300 hover:shadow-sm transition cursor-pointer"
                >
                  {/* Badge & Tanggal */}
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full ${badge.className}`}
                    >
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
                    {m.qty}{" "}
                    {m.tipe === "out" || m.tipe === "transfer" ? "–" : "+"}
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
