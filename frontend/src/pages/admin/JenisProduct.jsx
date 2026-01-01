import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../../services/api";

const JenisProductPage = () => {
  const [jenisData, setJenisData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ nama: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/jenis");
      setJenisData(res.data.data);
    } catch (error) {
      Swal.fire("Error", "Gagal mengambil data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fungsi untuk cek duplikasi (case-insensitive)
  const isJenisNameDuplicate = (nama, excludeId = null) => {
    return jenisData.some(
      (jenis) =>
        jenis.id !== excludeId &&
        jenis.nama.toLowerCase() === nama.toLowerCase()
    );
  };

  // Tambah
  const handleTambah = () => {
    setForm({ nama: "" });
    setIsEdit(false);
    setSelectedId(null);
    setIsModalOpen(true);
  };

  // Edit
  const handleEdit = (item) => {
    setForm({ nama: item.nama });
    setSelectedId(item.id);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  // Simpan
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { nama } = form;

    if (!nama.trim()) {
      Swal.fire("Validasi", "Nama Jenis wajib diisi", "warning");
      return;
    }

    // ✅ Cek duplikasi di frontend
    const isDuplicate = isJenisNameDuplicate(
      nama.trim(),
      isEdit ? selectedId : null
    );

    if (isDuplicate) {
      Swal.fire(
        "Duplikasi Data",
        `Jenis "${nama}" sudah ada. Silakan gunakan nama lain.`,
        "warning"
      );
      return;
    }

    try {
      if (isEdit) {
        await api.put(`/jenis/${selectedId}`, form);
        Swal.fire("Berhasil", "Jenis Produk berhasil diupdate", "success");
      } else {
        await api.post("/jenis", form);
        Swal.fire("Berhasil", "Jenis Produk berhasil ditambahkan", "success");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      if (error.response?.status === 422) {
        const msg = Object.values(error.response.data.errors).join("<br>");
        Swal.fire("Validasi Gagal", msg, "warning");
      } else {
        Swal.fire("Error", "Terjadi kesalahan", "error");
      }
    }
  };

  // Hapus
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
        await api.delete(`/jenis/${id}`);
        Swal.fire("Berhasil", "Jenis Produk dihapus", "success");
        fetchData();
      } catch {
        Swal.fire("Error", "Gagal menghapus data", "error");
      }
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Jenis Product</h1>
          <p className="text-gray-600 mt-1">Kategori utama dari product yang tersedia</p>
        </div>

        <button
          onClick={handleTambah}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition"
        >
          <Plus size={18} />
          Tambah Jenis
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : jenisData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Belum ada data jenis product
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {jenisData.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-sm transition bg-white"
            >
              <h3 className="font-medium text-gray-800 text-center truncate">
                {item.nama}
              </h3>

              <div className="flex justify-between gap-1 mt-3">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1.5 rounded-md hover:bg-amber-100 transition"
                  title="Edit"
                >
                  <Pencil size={12} />
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs bg-rose-50 text-rose-700 px-2 py-1.5 rounded-md hover:bg-rose-100 transition"
                  title="Hapus"
                >
                  <Trash2 size={12} />
                </button>
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
                {isEdit ? "Edit Jenis Product" : "Tambah Jenis Product"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Nama Jenis *
                </label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Nama jenis"
                  required
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

export default JenisProductPage;