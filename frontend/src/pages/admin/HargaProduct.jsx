// src/pages/admin/HargaProductPage.jsx
import { useEffect, useState, useMemo, useRef } from "react";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2, Globe, User, Search } from "lucide-react";
import api from "../../services/api";

const formatRupiah = (value) => {
  if (!value) return "";
  return new Intl.NumberFormat("id-ID").format(value);
};

const unformatRupiah = (value) => {
  if (!value) return "";
  return value.replace(/\D/g, "");
};

export const HargaFilterBar = ({
  searchKode,
  setSearchKode,
  filterJenis,
  setFilterJenis,
  filterType,
  setFilterType,
  jenis,
  filteredTypes,
}) => (
  <div className="flex items-center gap-2 w-full">
    {/* Search: Selalu tampil */}
    <div className="relative flex-1 min-w-[150px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Cari kode..."
        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm"
        value={searchKode}
        onChange={(e) => setSearchKode(e.target.value)}
      />
    </div>

    {/* Filter lengkap: Hanya di tablet+ */}
    <div className="hidden sm:flex items-center gap-2">
      <select
        className="py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm min-w-[140px]"
        value={filterJenis}
        onChange={(e) => {
          setFilterJenis(e.target.value);
          setFilterType("");
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
        className="py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm min-w-[140px]"
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        disabled={!filterJenis}
      >
        <option value="">Semua Tipe</option>
        {filteredTypes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nama}
          </option>
        ))}
      </select>

      <button
        onClick={() => {
          setSearchKode("");
          setFilterJenis("");
          setFilterType("");
        }}
        className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm whitespace-nowrap font-medium"
      >
        Reset
      </button>
    </div>

    {/* Reset untuk mobile (hanya reset search) */}
    <button
      onClick={() => setSearchKode("")}
      className="sm:hidden py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
    >
      ⓧ
    </button>
  </div>
);

// ✅ Komponen utama
const HargaProductPage = ({ setNavbarContent }) => {
  const [hargaList, setHargaList] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [jenis, setJenis] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchKode, setSearchKode] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterType, setFilterType] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const [form, setForm] = useState({
    product_id: "",
    customer_id: "",
    harga: "",
    tanggal_berlaku: "",
    keterangan: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hargaRes, productRes, customerRes, jenisRes, typeRes] =
        await Promise.all([
          api.get("/harga"),
          api.get("/products"),
          api.get("/customers"),
          api.get("/jenis"),
          api.get("/type"),
        ]);
      setHargaList(hargaRes.data.data);
      setProducts(productRes.data.data);
      setCustomers(customerRes.data.data);
      setJenis(jenisRes.data.data);
      setAllTypes(typeRes.data.data);
    } catch (error) {
      Swal.fire("Error", "Gagal mengambil data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter types berdasarkan jenis yang dipilih
  const filteredTypes = useMemo(() => {
    if (!filterJenis) return [];
    return allTypes.filter((t) => t.jenis_id === Number(filterJenis));
  }, [filterJenis, allTypes]);

  // Filter produk
  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchKode) {
      const term = searchKode.toLowerCase();
      result = result.filter((p) => p.kode.toLowerCase().includes(term));
    }
    if (filterJenis) {
      result = result.filter((p) => p.jenis_id === Number(filterJenis));
    }
    if (filterType) {
      result = result.filter((p) => p.type_id === Number(filterType));
    }
    return result;
  }, [products, searchKode, filterJenis, filterType]);

  // Kelompokkan harga berdasarkan produk yang difilter
  const groupedByProduct = useMemo(() => {
    const productMap = new Map();
    filteredProducts.forEach((p) => productMap.set(p.id, p));

    const hargaByProduct = {};
    hargaList.forEach((h) => {
      if (productMap.has(h.product_id)) {
        if (!hargaByProduct[h.product_id]) {
          hargaByProduct[h.product_id] = [];
        }
        hargaByProduct[h.product_id].push(h);
      }
    });

    return filteredProducts
      .map((p) => ({
        product: p,
        harga: hargaByProduct[p.id] || [],
      }))
      .filter((group) => group.harga.length > 0);
  }, [filteredProducts, hargaList]);

  const handleTambah = () => {
    setForm({
      product_id: "",
      customer_id: "",
      harga: "",
      tanggal_berlaku: "",
      keterangan: "",
    });
    setIsEdit(false);
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setForm({
      product_id: item.product_id,
      customer_id: item.customer_id || "",
      harga: String(item.harga),
      tanggal_berlaku: item.tanggal_berlaku || "",
      keterangan: item.keterangan || "",
    });
    setSelectedId(item.id);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      harga: Number(form.harga),
    };

    try {
      if (isEdit) {
        await api.put(`/harga/${selectedId}`, payload);
        Swal.fire("Berhasil", "Harga berhasil diupdate", "success");
      } else {
        await api.post("/harga", payload);
        Swal.fire("Berhasil", "Harga berhasil ditambahkan", "success");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      if (error.response?.status === 422) {
        const msg =
          error.response.data.message ||
          Object.values(error.response.data.errors).flat().join("<br>");
        Swal.fire("Validasi Gagal", msg, "warning");
      } else {
        Swal.fire("Error", "Terjadi kesalahan", "error");
      }
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Yakin ingin menghapus?",
      text: "Harga akan dihapus permanen",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/harga/${id}`);
        Swal.fire("Berhasil", "Harga berhasil dihapus", "success");
        fetchData();
      } catch (error) {
        Swal.fire("Error", "Gagal menghapus data", "error");
      }
    }
  };

  const formatProductName = (p) => {
    if (!p) return "-";
    const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(
      Boolean
    );
    return parts.join(" ") || p.kode;
  };

  // ✅ Kirim filter ke Navbar
  useEffect(() => {
    setNavbarContent(
      <HargaFilterBar
        searchKode={searchKode}
        setSearchKode={setSearchKode}
        filterJenis={filterJenis}
        setFilterJenis={setFilterJenis}
        filterType={filterType}
        setFilterType={setFilterType}
        jenis={jenis}
        filteredTypes={filteredTypes}
      />
    );
  }, [
    searchKode,
    filterJenis,
    filterType,
    jenis,
    filteredTypes,
    setNavbarContent,
  ]);

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Konten Utama */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : groupedByProduct.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Tidak ada data harga sesuai filter
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByProduct.map((group) => (
            <div
              key={group.product.id}
              className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
            >
              <div className="mb-4 pb-2 border-b border-gray-200 text-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {group.product.kode} | {formatProductName(group.product)}
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {group.harga.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-sm transition bg-white"
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {item.customer_id ? (
                        <User className="text-blue-500 mt-0.5" size={14} />
                      ) : (
                        <Globe className="text-gray-500 mt-0.5" size={14} />
                      )}
                      <span className="text-xs font-medium text-gray-600 line-clamp-1">
                        {item.customer ? item.customer.name : "Harga Umum"}
                      </span>
                    </div>

                    <p className="font-bold text-green-600 text-base text-center">
                      Rp {formatRupiah(item.harga)}
                    </p>

                    {item.tanggal_berlaku && (
                      <p className="text-[10px] text-gray-500 text-center mt-1">
                        {new Date(item.tanggal_berlaku).toLocaleDateString(
                          "id-ID"
                        )}
                      </p>
                    )}

                    {item.keterangan && (
                      <p className="text-[10px] italic text-gray-500 mt-1 line-clamp-2 text-center">
                        "{item.keterangan}"
                      </p>
                    )}

                    <div className="flex justify-between gap-1 mt-2">
                      {(role === "admin" || role === "kasir") && (
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 text-xs font-medium transition-colors duration-200"
                      >
                        <Pencil size={12} />
                      </button>
                    )}

                    {role === "admin" && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-rose-100 text-rose-800 rounded-lg hover:bg-rose-200 text-xs font-medium transition-colors duration-200"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(role === "admin" || role === "kasir") && (
        <button
          onClick={handleTambah}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-full shadow-lg transition"
        >
          <Plus size={18} />
        </button>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-center">
                {isEdit ? "Edit Harga Product" : "Tambah Harga Product"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Product *
                </label>
                <select
                  value={form.product_id}
                  onChange={(e) =>
                    setForm({ ...form, product_id: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  required
                >
                  <option value="">Pilih Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.kode} — {formatProductName(p)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Customer (Kosongkan untuk Harga Umum)
                </label>
                <select
                  value={form.customer_id}
                  onChange={(e) =>
                    setForm({ ...form, customer_id: e.target.value || "" })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Harga Umum</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Harga (Rp) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatRupiah(unformatRupiah(form.harga))}
                  onChange={(e) => {
                    const raw = unformatRupiah(e.target.value);
                    if (!isNaN(raw)) {
                      setForm({ ...form, harga: raw });
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Contoh: 12000"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Tanggal Berlaku
                </label>
                <input
                  type="date"
                  value={form.tanggal_berlaku}
                  onChange={(e) =>
                    setForm({ ...form, tanggal_berlaku: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  value={form.keterangan}
                  onChange={(e) =>
                    setForm({ ...form, keterangan: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Opsional"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isEdit ? "Update" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HargaProductPage;
