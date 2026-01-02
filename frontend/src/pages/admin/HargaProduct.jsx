import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2, Globe, User } from "lucide-react";
import api from "../../services/api";

const formatRupiah = (value) => {
  if (!value) return "";
  return new Intl.NumberFormat("id-ID").format(value);
};

const unformatRupiah = (value) => {
  if (!value) return "";
  return value.replace(/\./g, "");
};

const HargaProductPage = () => {
  const [hargaList, setHargaList] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const [hargaRes, productRes, customerRes] = await Promise.all([
        api.get("/harga"),
        api.get("/products"),
        api.get("/customers"),
      ]);
      setHargaList(hargaRes.data.data);
      setProducts(productRes.data.data);
      setCustomers(customerRes.data.data);
    } catch (error) {
      Swal.fire("Error", "Gagal mengambil data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const groupedByProduct = products.map((product) => {
    const hargaItems = hargaList.filter((h) => h.product_id === product.id);
    return {
      product,
      harga: hargaItems,
    };
  }).filter(group => group.harga.length > 0);

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
      harga: item.harga,
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
        const msg = error.response.data.message || 
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
    const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean);
    return parts.join(" ") || p.kode;
  };

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Harga Product</h1>
          <p className="text-gray-600 mt-1">Kelola harga umum dan harga per customer</p>
        </div>

        <button
          onClick={handleTambah}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition"
        >
          <Plus size={18} />
          Tambah Harga
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : groupedByProduct.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Belum ada data harga</div>
      ) : (
        <div className="space-y-8">
          {groupedByProduct.map((group) => (
            <div
              key={group.product.id}
              className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
            >
              {/* HEADER PRODUK */}
              <div className="mb-4 pb-2 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {group.product.kode} — {formatProductName(group.product)}
                </h2>
              </div>

              {/* ✅ GRID RESPONSIF: 2 → 3 → 4 → 5 kolom */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {group.harga.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-sm transition bg-white"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {item.customer_id ? (
                        <User className="text-blue-500 mt-0.5" size={14} />
                      ) : (
                        <Globe className="text-gray-500 mt-0.5" size={14} />
                      )}
                      <span className="text-xs font-medium text-gray-600 line-clamp-1">
                        {item.customer ? item.customer.name : "Harga Umum"}
                      </span>
                    </div>

                    <p className="font-bold text-green-600 text-base">
                      Rp {formatRupiah(item.harga)}
                    </p>

                    {item.tanggal_berlaku && (
                      <p className="text-[10px] text-gray-500 mt-1">
                        {new Date(item.tanggal_berlaku).toLocaleDateString("id-ID")}
                      </p>
                    )}

                    {item.keterangan && (
                      <p className="text-[10px] italic text-gray-500 mt-1 line-clamp-2">
                        "{item.keterangan}"
                      </p>
                    )}

                    <div className="flex justify-between gap-1 mt-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex-1 flex items-center justify-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-1.5 py-1 rounded-md hover:bg-amber-100 transition"
                        title="Edit"
                      >
                        <Pencil size={10} />
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex-1 flex items-center justify-center gap-1 text-[10px] bg-rose-50 text-rose-700 px-1.5 py-1 rounded-md hover:bg-rose-100 transition"
                        title="Hapus"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
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
                  onChange={(e) => setForm({ ...form, product_id: e.target.value })}
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
                  value={formatRupiah(form.harga)}
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
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
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