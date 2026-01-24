import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import {
  Search,
  Package,
  Box,
  Building2,
  Warehouse,
  Truck,
  Tag,
  ImageIcon,
} from "lucide-react";
import api from "../../services/api";

const formatProductName = (p) => {
  if (!p) return "-";
  return [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran]
    .filter(Boolean)
    .join(" ");
};

const AllProductsPage = ({ setNavbarContent }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJenisId, setSelectedJenisId] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products");
      setProducts(res.data.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      Swal.fire("Error", "Gagal memuat data produk", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Tentukan source berdasarkan keberadaan distributor
  const allProducts = useMemo(() => {
    return (products || []).map((p) => ({
      ...p,
      source: p.distributor ? "distributor" : "internal",
      // Pastikan harga jual konsisten
      harga_jual: p.harga_umum || null,
    }));
  }, [products]);

  // Ambil daftar jenis & type unik (sebagai string)
  const { jenisList, typeList } = useMemo(() => {
    const jenisSet = new Set();
    const typeSet = new Set();

    allProducts.forEach((p) => {
      if (p.jenis?.nama) {
        jenisSet.add(p.jenis.nama);
      }
      if (p.type?.nama) {
        if (!selectedJenisId || p.jenis?.nama === selectedJenisId) {
          typeSet.add(p.type.nama);
        }
      }
    });

    return {
      jenisList: Array.from(jenisSet).sort(),
      typeList: Array.from(typeSet).sort(),
    };
  }, [allProducts, selectedJenisId]);

  // Filter produk
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    if (selectedJenisId) {
      result = result.filter((p) => p.jenis?.nama === selectedJenisId);
    }

    if (selectedTypeId) {
      result = result.filter((p) => p.type?.nama === selectedTypeId);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((p) => {
        return (
          p.kode?.toLowerCase().includes(term) ||
          formatProductName(p).toLowerCase().includes(term) ||
          (p.merk && p.merk.toLowerCase().includes(term)) ||
          (p.distributor?.nama &&
            p.distributor.nama.toLowerCase().includes(term))
        );
      });
    }

    return result;
  }, [allProducts, selectedJenisId, selectedTypeId, searchTerm]);

  // Navbar Filter
  useEffect(() => {
    setNavbarContent(
      <div className="flex items-center gap-2 w-full">
        <div className="relative min-w-[140px] sm:min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk..."
            className="w-full pl-10 pr-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-200 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="hidden sm:block py-1.5 px-3 text-xs sm:text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-200 focus:outline-none min-w-[120px]"
          value={selectedJenisId}
          onChange={(e) => {
            setSelectedJenisId(e.target.value);
            setSelectedTypeId("");
          }}
        >
          <option value="">Semua Jenis</option>
          {jenisList.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>

        <select
          className="hidden sm:block py-1.5 px-3 text-xs sm:text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-200 focus:outline-none min-w-[120px]"
          value={selectedTypeId}
          onChange={(e) => setSelectedTypeId(e.target.value)}
          disabled={!selectedJenisId}
        >
          <option value="">Semua Type</option>
          {typeList.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setSearchTerm("");
            setSelectedJenisId("");
            setSelectedTypeId("");
          }}
          className="hidden sm:flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition"
          title="Reset"
        >
          ✕
        </button>
      </div>,
    );
  }, [searchTerm, selectedJenisId, selectedTypeId, jenisList, typeList]);

  if (loading) {
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
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Tidak ada produk ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filteredProducts.map((item) => {
            const totalQty = (item.qty_toko || 0) + (item.qty_bengkel || 0);

            return (
              <div
                key={item.id} // ✅ Gunakan ID unik
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4 flex flex-col h-full min-h-[320px]"
              >
                {/* Foto Produk */}
                <div className="flex justify-center gap-2 mb-3">
                  {item.foto_depan && (
                    <img
                      src={`${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_depan}`}
                      alt="Foto Depan"
                      className="w-16 h-16 object-cover rounded cursor-pointer border hover:shadow"
                    />
                  )}
                  {item.foto_samping && (
                    <img
                      src={`${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_samping}`}
                      alt="Foto Samping"
                      className="w-16 h-16 object-cover rounded cursor-pointer border hover:shadow"
                    />
                  )}
                  {item.foto_atas && (
                    <img
                      src={`${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_atas}`}
                      alt="Foto Atas"
                      className="w-16 h-16 object-cover rounded cursor-pointer border hover:shadow"
                    />
                  )}
                  {!item.foto_depan &&
                    !item.foto_samping &&
                    !item.foto_atas && (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        <ImageIcon className="text-gray-400" size={24} />
                      </div>
                    )}
                </div>

                {/* Kode Produk */}
                <div className="text-center mb-2">
                  <p className="font-semibold text-sm text-gray-800 break-all">
                    {item.kode}
                  </p>
                </div>

                {/* Nama Produk */}
                <div className="text-center mb-2 min-h-[24px]">
                  <p className="text-sm text-gray-600">
                    {formatProductName(item)}
                  </p>
                </div>

                {/* Harga Beli (hanya distributor) */}
                {item.source === "distributor" && item.harga_beli && (
                  <div className="text-center mb-2 flex items-center justify-center gap-1 text-sm">
                    <Truck size={14} className="text-blue-600" />
                    <span className="font-medium text-blue-700">
                      Beli: Rp{" "}
                      {new Intl.NumberFormat("id-ID").format(
                        Number(item.harga_beli),
                      )}
                    </span>
                  </div>
                )}

                {/* Harga Jual (semua) */}
                {item.harga_jual && (
                  <div className="text-center mb-2 flex items-center justify-center gap-1 text-sm">
                    <Tag size={14} className="text-amber-600" />
                    <span className="font-medium text-amber-700">
                      Jual: Rp{" "}
                      {new Intl.NumberFormat("id-ID").format(
                        Number(item.harga_jual),
                      )}
                    </span>
                  </div>
                )}

                {/* Stok & Distributor */}
                <div className="text-center mb-2 text-xs text-gray-600 space-y-0.5">
                  <div className="flex items-center justify-center gap-1">
                    <Warehouse size={12} />{" "}
                    <span>TOKO: {item.qty_toko || 0}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Warehouse size={12} />{" "}
                    <span>BENGKEL: {item.qty_bengkel || 0}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Warehouse size={12} /> <span>TOTAL: {totalQty}</span>
                  </div>
                  {item.distributor?.nama && (
                    <div className="flex items-center justify-center gap-1">
                      <Truck size={12} className="text-green-600" />
                      <span className="text-green-700">
                        {item.distributor.nama}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllProductsPage;