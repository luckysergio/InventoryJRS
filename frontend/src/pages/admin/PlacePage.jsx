import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../../services/api";

const PlacePage = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nama: "",
    kode: "",
    keterangan: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/places");
      setPlaces(res.data.data);
    } catch {
      Swal.fire("Error", "Gagal mengambil data tempat", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTambah = () => {
    setForm({
      nama: "",
      kode: "",
      keterangan: "",
    });
    setIsEdit(false);
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setForm({
      nama: item.nama,
      kode: item.kode,
      keterangan: item.keterangan || "",
    });
    setSelectedId(item.id);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEdit) {
        await api.put(`/places/${selectedId}`, form);
        Swal.fire("Berhasil", "Tempat berhasil diperbarui", "success");
      } else {
        await api.post("/places", form);
        Swal.fire("Berhasil", "Tempat berhasil ditambahkan", "success");
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
    const confirm = await Swal.fire({
      title: "Hapus tempat?",
      text: "Data akan dihapus permanen",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });

    if (confirm.isConfirmed) {
      await api.delete(`/places/${id}`);
      Swal.fire("Berhasil", "Tempat berhasil dihapus", "success");
      fetchData();
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Place</h1>

        <button
          onClick={handleTambah}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl"
        >
          <Plus size={18} />
          Tambah Place
        </button>
      </div>

      {/* CARD LIST */}
      <div className="grid md:grid-cols-3 gap-6">
        {places.map((item) => (
          <div
            key={item.id}
            className="bg-white p-6 rounded-2xl shadow space-y-3"
          >
            <p className="text-center font-bold text-lg">{item.nama}</p>

            <p className="text-center text-sm text-gray-500">
              Kode : <span className="font-semibold">{item.kode}</span>
            </p>

            <p className="text-sm text-gray-600 italic text-center">
              {item.keterangan || "-"}
            </p>

            <div className="flex gap-2 pt-3">
              <button
                onClick={() => handleEdit(item)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-200 text-xs"
              >
                <Pencil size={14} />
                Edit
              </button>

              <button
                onClick={() => handleDelete(item.id)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 text-xs"
              >
                <Trash2 size={14} />
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-6">
              {isEdit ? "Edit Place" : "Tambah Place"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nama</label>
                <input
                  className="w-full border rounded-xl px-4 py-2"
                  value={form.nama}
                  onChange={(e) =>
                    setForm({ ...form, nama: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Kode</label>
                <input
                  className="w-full border rounded-xl px-4 py-2 uppercase"
                  value={form.kode}
                  onChange={(e) =>
                    setForm({ ...form, kode: e.target.value.toUpperCase() })
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Keterangan</label>
                <textarea
                  className="w-full border rounded-xl px-4 py-2"
                  rows={3}
                  value={form.keterangan}
                  onChange={(e) =>
                    setForm({ ...form, keterangan: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-gray-100"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 text-white"
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

export default PlacePage;
