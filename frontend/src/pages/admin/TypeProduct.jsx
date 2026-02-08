import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../../services/api";

const TypeProductPage = () => {
  const [typeData, setTypeData] = useState([]);
  const [jenisData, setJenisData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nama: "",
    jenis_id: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [typeRes, jenisRes] = await Promise.all([
        api.get("/type"),
        api.get("/jenis"),
      ]);

      setTypeData(typeRes.data.data);
      setJenisData(jenisRes.data.data);
    } catch (error) {
      Swal.fire("Error", "Gagal mengambil data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const groupedTypes = jenisData.reduce((acc, jenis) => {
    const types = typeData.filter(
      (type) => Number(type.jenis_id) === Number(jenis.id),
    );

    if (types.length > 0) {
      acc.push({
        jenis: jenis,
        types: types,
      });
    }
    return acc;
  }, []);

  const handleTambah = () => {
    setForm({ nama: "", jenis_id: "" });
    setIsEdit(false);
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setForm({
      nama: item.nama,
      jenis_id: item.jenis?.id || "",
    });
    setSelectedId(item.id);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  // ✅ Fungsi untuk cek duplikasi di frontend
  const isTypeNameDuplicate = (nama, jenis_id, excludeId = null) => {
    return typeData.some(
      (type) =>
        type.jenis_id == jenis_id &&
        type.id !== excludeId &&
        type.nama.toLowerCase() === nama.toLowerCase(),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { nama, jenis_id } = form;

    // Validasi wajib
    if (!nama.trim() || !jenis_id) {
      Swal.fire("Validasi", "Nama dan Jenis wajib diisi", "warning");
      return;
    }

    // ✅ Cek duplikasi di frontend
    const isDuplicate = isTypeNameDuplicate(
      nama.trim(),
      jenis_id,
      isEdit ? selectedId : null,
    );

    if (isDuplicate) {
      const jenisNama =
        jenisData.find((j) => j.id == jenis_id)?.nama || "jenis ini";
      Swal.fire(
        "Duplikasi Data",
        `Nama type "${nama}" sudah ada di ${jenisNama}. Silakan gunakan nama lain.`,
        "warning",
      );
      return;
    }

    try {
      if (isEdit) {
        await api.put(`/type/${selectedId}`, form);
        Swal.fire("Berhasil", "Type Product berhasil diupdate", "success");
      } else {
        await api.post("/type", form);
        Swal.fire("Berhasil", "Type Product berhasil ditambahkan", "success");
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
        await api.delete(`/type/${id}`);
        Swal.fire("Berhasil", "Type Product dihapus", "success");
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
      ) : groupedTypes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Belum ada data type product
        </div>
      ) : (
        <div className="space-y-8">
          {groupedTypes.map((group) => (
            <div
              key={group.jenis.id}
              className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
            >
              {/* JUDUL JENIS */}
              <div className="mb-4 pb-2 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 text-center">
                  Jenis: {group.jenis.nama}
                </h2>
              </div>

              {/* GRID TYPE */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {group.types.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-sm transition"
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
                {isEdit ? "Edit Type Product" : "Tambah Type Product"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Jenis Product *
                </label>
                <select
                  value={form.jenis_id}
                  onChange={(e) =>
                    setForm({ ...form, jenis_id: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  required
                >
                  <option value="">-- Pilih Jenis --</option>
                  {jenisData.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Nama Type *
                </label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Nama Type"
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

export default TypeProductPage;
