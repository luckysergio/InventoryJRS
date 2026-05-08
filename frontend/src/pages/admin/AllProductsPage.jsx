import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import {
  Search,
  Package,
  Warehouse,
  Truck,
  Tag,
  ImageIcon,
  X,
} from "lucide-react";
import api from "../../services/api";

const formatProductName = (p) => {
  if (!p) return "-";
  return [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran]
    .filter(Boolean)
    .join(" ");
};

const formatRupiah = (value) => {
  if (!value && value !== 0) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const AllProductsPage = ({ setNavbarContent }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJenisId, setSelectedJenisId] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Master data untuk filter
  const [jenis, setJenis] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [filteredTypes, setFilteredTypes] = useState([]);

  // Fetch all products (internal + distributor)
  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      
      const params = {
        page: page,
        per_page: 20
      };
      
      if (searchTerm) params.search = searchTerm;
      if (selectedJenisId) params.jenis_id = selectedJenisId;
      if (selectedTypeId) params.type_id = selectedTypeId;
      
      const res = await api.get("/products", { params });
      
      setProducts(res.data.data || []);
      setLastPage(res.data.meta?.last_page || 1);
      setTotalProducts(res.data.meta?.total || 0);
      
      // Fetch master data untuk filter (hanya sekali)
      if (jenis.length === 0) {
        const [jRes, tRes] = await Promise.all([
          api.get("/jenis"),
          api.get("/type"),
        ]);
        setJenis(jRes.data.data || []);
        setAllTypes(tRes.data.data || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      Swal.fire("Error", "Gagal memuat data produk", "error");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset ke page 1 saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedJenisId, selectedTypeId]);

  // Fetch data saat filter atau page berubah
  useEffect(() => {
    fetchData(currentPage);
  }, [searchTerm, selectedJenisId, selectedTypeId, currentPage]);

  // Update filtered types when jenis changes
  useEffect(() => {
    if (!selectedJenisId) {
      setFilteredTypes([]);
      return;
    }
    
    const filtered = allTypes.filter(
      (t) => String(t.jenis_id) === String(selectedJenisId)
    );
    setFilteredTypes(filtered);
  }, [selectedJenisId, allTypes]);

  // Process products for display
  const processedProducts = useMemo(() => {
    return products.map((p) => ({
      ...p,
      source: p.distributor_id ? "distributor" : "internal",
      harga_jual: p.harga_umum || null,
      isDistributor: !!p.distributor_id,
      distributorName: p.distributor?.nama || null,
    }));
  }, [products]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= lastPage) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderPagination = () => {
    if (lastPage <= 1) return null;
    
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(lastPage, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border disabled:opacity-50 hover:bg-gray-100 transition"
        >
          &laquo; Prev
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-1 rounded border hover:bg-gray-100 transition"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 rounded border transition ${
              page === currentPage
                ? "bg-indigo-600 text-white"
                : "hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ))}
        
        {endPage < lastPage && (
          <>
            {endPage < lastPage - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => handlePageChange(lastPage)}
              className="px-3 py-1 rounded border hover:bg-gray-100 transition"
            >
              {lastPage}
            </button>
          </>
        )}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
          className="px-3 py-1 rounded border disabled:opacity-50 hover:bg-gray-100 transition"
        >
          Next &raquo;
        </button>
      </div>
    );
  };

  // Navbar Filter Component
  useEffect(() => {
    setNavbarContent(
      <div className="flex items-center gap-2 w-full">
        <div className="relative min-w-[140px] sm:min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk..."
            className="w-full pl-10 pr-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-200 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="hidden sm:block py-1.5 px-3 text-xs sm:text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-200 focus:outline-none min-w-[120px]"
          value={selectedJenisId}
          onChange={(e) => {
            setSelectedJenisId(e.target.value);
            setSelectedTypeId("");
          }}
        >
          <option value="">Semua Jenis</option>
          {jenis.map((j) => (
            <option key={j.id} value={j.id}>
              {j.nama}
            </option>
          ))}
        </select>

        <select
          className="hidden sm:block py-1.5 px-3 text-xs sm:text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-200 focus:outline-none min-w-[120px]"
          value={selectedTypeId}
          onChange={(e) => setSelectedTypeId(e.target.value)}
          disabled={!selectedJenisId || filteredTypes.length === 0}
        >
          <option value="">Semua Type</option>
          {filteredTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nama}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setSearchTerm("");
            setSelectedJenisId("");
            setSelectedTypeId("");
            setCurrentPage(1);
          }}
          className="hidden sm:flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition"
          title="Reset Filter"
        >
          <X size={14} />
        </button>
      </div>,
    );
  }, [searchTerm, selectedJenisId, selectedTypeId, jenis, filteredTypes]);

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Memuat data produk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2 md:p-4 max-w-7xl mx-auto">
      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Tidak ada produk ditemukan.</p>
          {(searchTerm || selectedJenisId || selectedTypeId) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedJenisId("");
                setSelectedTypeId("");
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-500">
              Menampilkan {products.length} dari {totalProducts} produk
              {selectedJenisId && " (terfilter)"}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {processedProducts.map((item) => {
              const totalQty = (item.qty_toko || 0) + (item.qty_bengkel || 0);
              const isDistributor = item.isDistributor;
              
              return (
                <div
                  key={item.id}
                  className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4 flex flex-col h-full min-h-[340px] ${
                    isDistributor 
                      ? "border-blue-200 bg-blue-50/30" 
                      : "border-gray-200"
                  }`}
                >
                  {/* Badge Distributor */}
                  {isDistributor && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        <Truck size={10} className="inline mr-1" />
                        Distributor
                      </span>
                    </div>
                  )}
                  
                  {/* Foto Produk */}
                  <div className="flex justify-center gap-2 mb-3 relative">
                    {item.foto_depan && (
                      <img
                        src={`${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_depan}`}
                        alt="Foto Depan"
                        className="w-16 h-16 object-cover rounded cursor-pointer border hover:shadow transition"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    {item.foto_samping && (
                      <img
                        src={`${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_samping}`}
                        alt="Foto Samping"
                        className="w-16 h-16 object-cover rounded cursor-pointer border hover:shadow transition"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    {item.foto_atas && (
                      <img
                        src={`${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_atas}`}
                        alt="Foto Atas"
                        className="w-16 h-16 object-cover rounded cursor-pointer border hover:shadow transition"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    {!item.foto_depan && !item.foto_samping && !item.foto_atas && (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        <ImageIcon className="text-gray-400" size={24} />
                      </div>
                    )}
                  </div>

                  {/* Kode Produk */}
                  <div className="text-center mb-2">
                    <p className="font-semibold text-sm text-gray-800 break-all">
                      {item.kode || "-"}
                    </p>
                  </div>

                  {/* Nama Produk */}
                  <div className="text-center mb-2 min-h-[40px]">
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {formatProductName(item)}
                    </p>
                  </div>

                  {/* Informasi Distributor */}
                  {isDistributor && item.distributorName && (
                    <div className="text-center mb-2">
                      <p className="text-xs text-blue-600 font-medium">
                        <Truck size={10} className="inline mr-1" />
                        {item.distributorName}
                      </p>
                    </div>
                  )}

                  {/* Harga Jual */}
                  {item.harga_jual && (
                    <div className="text-center mb-2 flex items-center justify-center gap-1 text-sm">
                      <Tag size={14} className="text-amber-600 flex-shrink-0" />
                      <span className="font-medium text-amber-700 truncate">
                        {formatRupiah(item.harga_jual)}
                      </span>
                    </div>
                  )}

                  {/* Stok */}
                  <div className="text-center mb-2 text-xs text-gray-600 space-y-0.5">
                    <div className="flex items-center justify-center gap-1">
                      <Warehouse size={12} className="flex-shrink-0" />
                      <span>TOKO: {item.qty_toko || 0}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Warehouse size={12} className="flex-shrink-0" />
                      <span>BENGKEL: {item.qty_bengkel || 0}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 font-medium">
                      <Warehouse size={12} className="flex-shrink-0" />
                      <span>TOTAL: {totalQty}</span>
                    </div>
                  </div>

                  {/* Keterangan */}
                  {item.keterangan && (
                    <div className="text-center mt-2">
                      <p className="text-xs italic text-gray-400 line-clamp-2">
                        {item.keterangan}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default AllProductsPage;