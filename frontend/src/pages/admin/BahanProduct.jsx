import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../../services/api";

const BahanProductPage = () => {
  const [bahanData, setBahanData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ nama: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/bahan");
      setBahanData(res.data.data);
    } catch (error) {
      Swal.fire("Error", "Gagal mengambil data bahan", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ Fungsi cek duplikasi (case-insensitive)
  const isBahanNameDuplicate = (nama, excludeId = null) => {
    return bahanData.some(
      (bahan) =>
        bahan.id !== excludeId &&
        bahan.nama.toLowerCase() === nama.toLowerCase()
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
      Swal.fire("Validasi", "Nama Bahan wajib diisi", "warning");
      return;
    }

    // ✅ Cek duplikasi di frontend
    const isDuplicate = isBahanNameDuplicate(
      nama.trim(),
      isEdit ? selectedId : null
    );

    if (isDuplicate) {
      Swal.fire(
        "Duplikasi Data",
        `Bahan "${nama}" sudah ada. Silakan gunakan nama lain.`,
        "warning"
      );
      return;
    }

    try {
      if (isEdit) {
        await api.put(`/bahan/${selectedId}`, form);
        Swal.fire("Berhasil", "Bahan Product berhasil diupdate", "success");
      } else {
        await api.post("/bahan", form);
        Swal.fire("Berhasil", "Bahan Product berhasil ditambahkan", "success");
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
        await api.delete(`/bahan/${id}`);
        Swal.fire("Berhasil", "Bahan Product dihapus", "success");
        fetchData();
      } catch {
        Swal.fire("Error", "Gagal menghapus data", "error");
      }
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto">
      {/* CONTENT */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : bahanData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Belum ada data bahan product
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {bahanData.map((item) => (
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

      <button
        onClick={handleTambah}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-full shadow-lg transition"
      >
        <Plus size={18} />
      </button>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-center">
                {isEdit ? "Edit Bahan Product" : "Tambah Bahan Product"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Nama Bahan *
                </label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Nama Bahan"
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

export default BahanProductPage;
