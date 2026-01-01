import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../../services/api";

const StatusTransaksiPage = () => {
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ nama: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/status-transaksi");
      setStatusData(res.data.data || []);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Gagal mengambil data status transaksi", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Buka modal tambah
  const handleTambah = () => {
    setForm({ nama: "" });
    setIsEdit(false);
    setSelectedId(null);
    setIsModalOpen(true);
  };

  // Buka modal edit
  const handleEdit = (item) => {
    setForm({ nama: item.nama });
    setSelectedId(item.id);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  // Simpan (tambah / edit)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEdit) {
        await api.put(`/status-transaksi/${selectedId}`, form);
        Swal.fire("Berhasil", "Status Transaksi berhasil diupdate", "success");
      } else {
        await api.post("/status-transaksi", form);
        Swal.fire(
          "Berhasil",
          "Status Transaksi berhasil ditambahkan",
          "success"
        );
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

  // Hapus data
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
        await api.delete(`/status-transaksi/${id}`);
        Swal.fire("Berhasil", "Status Transaksi dihapus", "success");
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
          <h1 className="text-3xl font-bold text-gray-900">Status Transaksi</h1>
          <p className="text-gray-600 mt-2">Daftar status alur transaksi</p>
        </div>

        <button
          onClick={handleTambah}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition"
        >
          <Plus size={18} />
          Tambah Status
        </button>
      </div>

      {/* LOADING */}
      {loading && <p className="text-center text-gray-500">Memuat data...</p>}

      {/* DATA KOSONG */}
      {!loading && statusData.length === 0 && (
        <p className="text-center text-gray-500">Belum ada data</p>
      )}

      {/* LIST DATA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statusData.map((item) => (
          <div
            key={item.id}
            className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition"
          >
            <h3 className="text-lg font-bold text-gray-900">{item.nama}</h3>

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

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {isEdit ? "Edit Status Transaksi" : "Tambah Status Transaksi"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Nama Status
                </label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="mt-1 w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Masukkan nama status"
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

export default StatusTransaksiPage;
