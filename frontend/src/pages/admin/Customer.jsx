import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../../services/api";

const safeParseFloat = (value) => {
  if (value == null) return 0;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

const formatRupiah = (value) => {
  const num = safeParseFloat(value);
  return new Intl.NumberFormat("id-ID").format(Math.round(num));
};

const CustomerPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/customers");
      setCustomers(res.data.data);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Gagal mengambil data customer", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTambah = () => {
    setForm({ name: "", phone: "", email: "" });
    setIsEdit(false);
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setForm({ name: item.name, phone: item.phone, email: item.email });
    setSelectedId(item.id);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.put(`/customers/${selectedId}`, form);
        Swal.fire("Berhasil", "Customer berhasil diupdate", "success");
      } else {
        await api.post("/customers", form);
        Swal.fire("Berhasil", "Customer berhasil ditambahkan", "success");
      }
      setIsModalOpen(false);
      fetchData();
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
    const result = await Swal.fire({
      title: "Yakin ingin menghapus?",
      text: "Data tidak bisa dikembalikan",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/customers/${id}`);
        Swal.fire("Berhasil", "Customer berhasil dihapus", "success");
        fetchData();
      } catch (err) {
        Swal.fire("Error", "Gagal menghapus data", "error");
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer</h1>
          <p className="text-gray-600 mt-2">Daftar pelanggan yang terdaftar</p>
        </div>
        <button
          onClick={handleTambah}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition"
        >
          <Plus size={18} />
          Tambah Customer
        </button>
      </div>

      {/* LOADING & KOSONG */}
      {loading ? (
        <p className="text-center text-gray-500">Memuat data...</p>
      ) : customers.length === 0 ? (
        <p className="text-center text-gray-500">Belum ada data</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition"
            >
              <h3 className="text-lg font-bold text-gray-900 text-center">
                {item.name}
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                📞 {item.phone || "-"}
              </p>
              <p className="text-sm text-gray-500">✉️ {item.email || "-"}</p>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaksi Harian:</span>
                  <span className="font-medium">
                    {item.transaksi_harian_count || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaksi Pesanan:</span>
                  <span className="font-medium">
                    {item.transaksi_pesanan_count || 0}
                  </span>
                </div>

                {item.tagihan_harian_belum_lunas > 0 && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-orange-600 font-medium">
                      Tagihan Harian:
                    </span>
                    <span className="text-orange-600 font-bold">
                      Rp {formatRupiah(item.tagihan_harian_belum_lunas)}
                    </span>
                  </div>
                )}

                {item.tagihan_pesanan_belum_lunas > 0 && (
                  <div className="flex justify-between pt-1">
                    <span className="text-purple-600 font-medium">
                      Tagihan Pesanan:
                    </span>
                    <span className="text-purple-600 font-bold">
                      Rp {formatRupiah(item.tagihan_pesanan_belum_lunas)}
                    </span>
                  </div>
                )}

                {item.tagihan_harian_belum_lunas === 0 &&
                  item.tagihan_pesanan_belum_lunas === 0 && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-green-600 font-medium">
                        Tidak ada tagihan
                      </span>
                      <span className="text-green-600">✅</span>
                    </div>
                  )}
              </div>

              {/* AKSI */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-200"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200"
                >
                  <Trash2 size={16} />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {isEdit ? "Edit Customer" : "Tambah Customer"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Nama Customer
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nama"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nomor telepon"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan email"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
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

export default CustomerPage;
