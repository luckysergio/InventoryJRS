import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import api from "../../services/api";

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterType, setFilterType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [form, setForm] = useState({
    kode: "",
    jenis_id: "",
    type_id: "",
    bahan_id: "",
    ukuran: "",
    keterangan: "",
  });

  const [jenisInputBaru, setJenisInputBaru] = useState("");
  const [typeInputBaru, setTypeInputBaru] = useState("");
  const [bahanInputBaru, setBahanInputBaru] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [jenis, setJenis] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [filteredTypes, setFilteredTypes] = useState([]);
  const [bahan, setBahan] = useState([]);
  const [filteredTypesForFilter, setFilteredTypesForFilter] = useState([]);

  const fetchData = async (params = {}) => {
    try {
      setLoading(true);
      const res = await api.get("/products", {
        params: {
          ...params,
          page: currentPage,
        },
      });
      setProducts(res.data.data);
      setLastPage(res.data.meta?.last_page || 1);

      const j = await api.get("/jenis");
      const t = await api.get("/type");
      const b = await api.get("/bahan");

      setJenis(j.data.data);
      setAllTypes(t.data.data);
      setBahan(b.data.data);
    } catch {
      Swal.fire("Error", "Gagal mengambil data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ search, jenis_id: filterJenis, type_id: filterType });
  }, [search, filterJenis, filterType, currentPage]);

  useEffect(() => {
    setCurrentPage(1); // Reset ke halaman 1 saat filter berubah
  }, [search, filterJenis, filterType]);

  useEffect(() => {
    if (!filterJenis) {
      setFilteredTypesForFilter([]);
      setFilterType("");
      return;
    }
    const filtered = allTypes.filter((t) => t.jenis_id === Number(filterJenis));
    setFilteredTypesForFilter(filtered);
    setFilterType("");
  }, [filterJenis, allTypes]);

  useEffect(() => {
    if (!form.jenis_id || form.jenis_id === "new") {
      setFilteredTypes([]); // Kosongkan opsi tipe lama
      setForm((prev) => ({ ...prev, type_id: "" }));
      return;
    }
    const filtered = allTypes.filter(
      (t) => t.jenis_id === Number(form.jenis_id)
    );
    setFilteredTypes(filtered);
    setForm((prev) => ({ ...prev, type_id: "" }));
  }, [form.jenis_id, allTypes]);

  const handleTambah = () => {
    setForm({
      kode: "",
      jenis_id: "",
      type_id: "",
      bahan_id: "",
      ukuran: "",
      keterangan: "",
    });
    setJenisInputBaru("");
    setTypeInputBaru("");
    setBahanInputBaru("");
    setIsEdit(false);
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setForm({
      kode: item.kode,
      jenis_id: item.jenis_id,
      type_id: item.type_id || "",
      bahan_id: item.bahan_id || "",
      ukuran: item.ukuran,
      keterangan: item.keterangan || "",
    });
    setJenisInputBaru("");
    setTypeInputBaru("");
    setBahanInputBaru("");
    setSelectedId(item.id);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.kode || !form.ukuran) {
      Swal.fire("Validasi", "Kode dan Ukuran wajib diisi", "warning");
      return;
    }

    try {
      const payload = { ...form };

      if (form.jenis_id === "new") {
        payload.jenis_nama = jenisInputBaru.trim();
        delete payload.jenis_id;
      }

      if (form.type_id === "new") {
        payload.type_nama = typeInputBaru.trim();
        delete payload.type_id;
      }

      if (form.bahan_id === "new") {
        payload.bahan_nama = bahanInputBaru.trim();
        delete payload.bahan_id;
      }

      if (isEdit) {
        await api.put(`/products/${selectedId}`, payload);
        Swal.fire("Berhasil", "Produk berhasil diperbarui", "success");
      } else {
        await api.post("/products", payload);
        Swal.fire("Berhasil", "Produk berhasil ditambahkan", "success");
      }

      setIsModalOpen(false);
      setCurrentPage(1);
      fetchData({ search, jenis_id: filterJenis, type_id: filterType });
    } catch (error) {
      if (error.response?.status === 422) {
        const msg = Object.values(error.response.data.errors)
          .flat()
          .join("<br>");
        Swal.fire("Validasi Gagal", msg, "warning");
      } else {
        Swal.fire("Error", "Terjadi kesalahan", "error");
      }
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Hapus produk?",
      text: "Data akan dihapus permanen",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/products/${id}`);
        Swal.fire("Berhasil", "Produk dihapus", "success");
        fetchData({ search, jenis_id: filterJenis, type_id: filterType });
      } catch {
        Swal.fire("Error", "Gagal menghapus produk", "error");
      }
    }
  };

  const formatProductName = (p) => {
    if (!p) return "-";
    const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(
      (part) => part != null && part !== ""
    );
    return parts.length > 0 ? parts.join(" ") : "-";
  };

  const renderPagination = () => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(lastPage, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-1 mt-6">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          {"<"}
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              className="px-3 py-1 rounded border"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded border ${
              page === currentPage
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < lastPage && (
          <>
            {endPage < lastPage - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => setCurrentPage(lastPage)}
              className="px-3 py-1 rounded border"
            >
              {lastPage}
            </button>
          </>
        )}

        <button
          onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
          disabled={currentPage === lastPage}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          {">"}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Produk
          </h1>
        </div>
        <button
          onClick={handleTambah}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition"
        >
          <Plus size={18} />
          Tambah Produk
        </button>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Cari Kode
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kode..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Jenis
          </label>
          <select
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
          >
            <option value="">Semua Jenis</option>
            {jenis.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nama}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Tipe
          </label>
          <select
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            disabled={!filterJenis}
          >
            <option value="">Semua Tipe</option>
            {filteredTypesForFilter.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setSearch("");
              setFilterJenis("");
              setFilterType("");
            }}
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
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Tidak ada produk ditemukan
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-5 flex flex-col"
              >
                <div className="text-center mb-2">
                  <p className="font-bold text-xl text-gray-800">{item.kode}</p>
                </div>
                <div className="text-center mb-3 min-h-[24px]">
                  <p className="text-sm text-gray-600">
                    {formatProductName(item)}
                  </p>
                </div>
                {item.keterangan && (
                  <div className="text-center mb-4 flex-1">
                    <p className="text-xs italic text-gray-500">
                      "{item.keterangan}"
                    </p>
                  </div>
                )}
                <div className="flex gap-2 mt-auto pt-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 text-sm font-medium transition"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-100 text-rose-800 rounded-lg hover:bg-rose-200 text-sm font-medium transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {lastPage > 1 && renderPagination()}
        </>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {isEdit ? "Edit Produk" : "Tambah Produk"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  value={form.kode}
                  onChange={(e) => setForm({ ...form, kode: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  value={form.jenis_id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, jenis_id: val });
                    if (val !== "new") setJenisInputBaru("");
                  }}
                  required
                >
                  <option value="">Pilih Jenis</option>
                  {jenis.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nama}
                    </option>
                  ))}
                  <option value="new">➕ Tambah Jenis Baru</option>
                </select>
                {form.jenis_id === "new" && (
                  <input
                    type="text"
                    placeholder="Nama jenis baru"
                    className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    value={jenisInputBaru}
                    onChange={(e) => setJenisInputBaru(e.target.value)}
                    required
                  />
                )}
              </div>

              {/* ✅ Perbaikan: Dropdown tipe AKTIF meski jenis baru */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  value={form.type_id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, type_id: val });
                    if (val !== "new") setTypeInputBaru("");
                  }}
                  // ✅ Aktifkan meski jenis baru — karena user bisa pilih "Tambah Tipe Baru"
                  disabled={false}
                >
                  <option value="">Pilih Tipe</option>
                  {/* Hanya tampilkan tipe lama jika jenis_id valid (bukan "new") */}
                  {form.jenis_id &&
                  form.jenis_id !== "new" &&
                  filteredTypes.length > 0
                    ? filteredTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nama}
                        </option>
                      ))
                    : null}
                  <option value="new">➕ Tambah Tipe Baru</option>
                </select>
                {form.type_id === "new" && (
                  <input
                    type="text"
                    placeholder="Nama tipe baru"
                    className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    value={typeInputBaru}
                    onChange={(e) => setTypeInputBaru(e.target.value)}
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bahan
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  value={form.bahan_id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, bahan_id: val });
                    if (val !== "new") setBahanInputBaru("");
                  }}
                >
                  <option value="">Pilih Bahan</option>
                  {bahan.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama}
                    </option>
                  ))}
                  <option value="new">➕ Tambah Bahan Baru</option>
                </select>
                {form.bahan_id === "new" && (
                  <input
                    type="text"
                    placeholder="Nama bahan baru"
                    className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    value={bahanInputBaru}
                    onChange={(e) => setBahanInputBaru(e.target.value)}
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ukuran <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  value={form.ukuran}
                  onChange={(e) => setForm({ ...form, ukuran: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keterangan
                </label>
                <textarea
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  rows={2}
                  value={form.keterangan}
                  onChange={(e) =>
                    setForm({ ...form, keterangan: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
