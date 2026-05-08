import { useEffect, useState, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import { Calendar, ArrowDown, ArrowUp, Repeat, Factory, Filter, X } from "lucide-react";
import api from "../../services/api";

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

const badgeType = {
  in: {
    label: "IN",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: <ArrowDown size={12} />,
  },
  out: {
    label: "OUT",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: <ArrowUp size={12} />,
  },
  transfer: {
    label: "TRANSFER",
    className: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <Repeat size={12} />,
  },
  produksi: {
    label: "PRODUKSI",
    className: "bg-purple-100 text-purple-800 border-purple-200",
    icon: <Factory size={12} />,
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
  totalResults,
}) => {
  const hasActiveFilter = filterDari || filterSampai || selectedType;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 w-full flex-wrap">
      {/* Date From */}
      <div className="relative flex-1 min-w-[100px] sm:min-w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          type="date"
          value={filterDari}
          onChange={(e) => setFilterDari(e.target.value)}
          className="w-full pl-8 pr-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 focus:outline-none bg-white"
          placeholder="Dari"
        />
      </div>

      {/* Date To */}
      <div className="relative flex-1 min-w-[100px] sm:min-w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          type="date"
          value={filterSampai}
          onChange={(e) => setFilterSampai(e.target.value)}
          min={filterDari || undefined}
          className="w-full pl-8 pr-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 focus:outline-none bg-white"
          placeholder="Sampai"
        />
      </div>

      {/* Type Filter */}
      <select
        className="flex-1 min-w-[90px] sm:min-w-[120px] py-1.5 px-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 focus:outline-none bg-white"
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value)}
      >
        <option value="">Semua Tipe</option>
        {movementTypes.map((type) => (
          <option key={type.value} value={type.value}>
            {type.icon} {type.label}
          </option>
        ))}
      </select>

      {/* Reset Button */}
      {hasActiveFilter && (
        <button
          onClick={handleReset}
          className="py-1.5 px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs sm:text-sm whitespace-nowrap font-medium transition flex items-center gap-1"
          title="Reset filter"
        >
          <X size={14} /> Reset
        </button>
      )}

      {/* Results Count */}
      <span className="hidden sm:inline-flex items-center px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
        📊 {totalResults} data
      </span>
    </div>
  );
};

const ProductMovementPage = ({ setNavbarContent }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterDari, setFilterDari] = useState("");
  const [filterSampai, setFilterSampai] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const movementTypes = useMemo(
    () => [
      { value: "in", label: "IN", icon: <ArrowDown size={12} /> },
      { value: "out", label: "OUT", icon: <ArrowUp size={12} /> },
      { value: "transfer", label: "TRANSFER", icon: <Repeat size={12} /> },
      { value: "produksi", label: "PRODUKSI", icon: <Factory size={12} /> },
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

  // ✅ PERBAIKAN: Fungsi helper untuk normalisasi tanggal (tanpa timezone issue)
  const normalizeDate = (dateString) => {
    if (!dateString) return null;
    // Parse date string ke format YYYY-MM-DD dan set ke midnight UTC
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  };

  const filteredMovements = useMemo(() => {
    const dariDate = normalizeDate(filterDari);
    const sampaiDate = normalizeDate(filterSampai);
    
    // Jika filter sampai ada, set ke akhir hari (23:59:59) agar termasuk seluruh hari
    const sampaiDateEnd = sampaiDate 
      ? new Date(sampaiDate.getTime() + 24 * 60 * 60 * 1000 - 1) 
      : null;

    return movements.filter((m) => {
      // Parse created_at ke UTC untuk perbandingan yang konsisten
      const movementDate = new Date(m.created_at);
      
      // Filter tanggal Dari
      if (dariDate && movementDate < dariDate) return false;
      
      // Filter tanggal Sampai (include seluruh hari)
      if (sampaiDateEnd && movementDate > sampaiDateEnd) return false;
      
      // Filter tipe
      if (selectedType && m.tipe !== selectedType) return false;
      
      return true;
    });
  }, [movements, filterDari, filterSampai, selectedType]);

  const handleReset = () => {
    setFilterDari("");
    setFilterSampai("");
    setSelectedType("");
  };

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
        totalResults={filteredMovements.length}
      />
    );
  }, [filterDari, filterSampai, selectedType, filteredMovements.length, setNavbarContent, movementTypes]);

  if (loading) {
    return (
      <div className="space-y-6 p-2 md:p-4 max-w-7xl mx-auto pt-16">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Memuat data mutasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2 md:p-4 max-w-7xl mx-auto pt-16">
      {/* Active Filters Info */}
      {(filterDari || filterSampai || selectedType) && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
          <Filter size={12} className="text-purple-600" />
          <span className="font-medium text-purple-700">Filter aktif:</span>
          {filterDari && (
            <span className="px-2 py-0.5 bg-white rounded border border-purple-200">
              Dari: {new Date(filterDari).toLocaleDateString("id-ID")}
            </span>
          )}
          {filterSampai && (
            <span className="px-2 py-0.5 bg-white rounded border border-purple-200">
              Sampai: {new Date(filterSampai).toLocaleDateString("id-ID")}
            </span>
          )}
          {selectedType && (
            <span className="px-2 py-0.5 bg-white rounded border border-purple-200">
              Tipe: {movementTypes.find(t => t.value === selectedType)?.label}
            </span>
          )}
        </div>
      )}

      {filteredMovements.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-lg font-medium">🔍 Tidak ada data mutasi</p>
          <p className="text-sm mt-1">
            {(filterDari || filterSampai || selectedType)
              ? "Coba ubah atau reset filter untuk melihat data lainnya."
              : "Belum ada riwayat mutasi produk."}
          </p>
          {(filterDari || filterSampai || selectedType) && (
            <button
              onClick={handleReset}
              className="mt-4 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Grid Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredMovements.map((m) => {
              const badge = badgeType[m.tipe] || {
                label: m.tipe?.toUpperCase() || "–",
                className: "bg-gray-100 text-gray-800 border-gray-200",
                icon: null,
              };
              const product = m.inventory?.product || null;
              const place = m.inventory?.place?.nama || "–";
              const formattedDate = new Date(m.created_at).toLocaleString("id-ID", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={m.id}
                  className="bg-white border border-gray-200 rounded-xl p-3 hover:border-purple-400 hover:shadow-md transition cursor-pointer group"
                  title={`${formattedDate} - ${place}`}
                >
                  {/* Badge & Date */}
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.className}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                    <span className="text-[9px] text-gray-400 group-hover:text-gray-600 transition">
                      {new Date(m.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Product Name */}
                  <p className="text-[10px] font-medium text-gray-800 line-clamp-2 min-h-[28px] text-center leading-tight">
                    {formatProductName(product)}
                  </p>

                  {/* Place */}
                  <p className="text-[10px] text-gray-500 mt-1 text-center truncate">
                    📍 {place}
                  </p>

                  {/* Qty with Sign */}
                  <p className={`text-lg font-bold mt-2 text-center ${
                    m.tipe === "out" || m.tipe === "transfer" 
                      ? "text-red-600" 
                      : "text-green-600"
                  }`}>
                    {m.tipe === "out" || m.tipe === "transfer" ? "−" : "+"}{m.qty}
                  </p>

                  {/* Keterangan */}
                  {m.keterangan && (
                    <p className="text-[9px] italic text-gray-400 mt-2 line-clamp-2 text-center border-t border-gray-100 pt-2">
                      "{m.keterangan}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Info */}
          <div className="text-center text-xs text-gray-500 pt-2">
            Menampilkan {filteredMovements.length} dari {movements.length} total mutasi
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductMovementPage;