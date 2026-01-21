import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import api from "../../services/api";

// 🔹 Komponen Filter Bar untuk Navbar
export const DistributorFilterBar = ({ search, setSearch }) => (
  <div className="flex items-center gap-2 w-full max-w-4xl">
    <div className="relative flex-1 min-w-[150px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Cari distributor..."
        className="w-full pl-10 pr-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  </div>
);

const DistributorPage = ({ setNavbarContent }) => {
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nama: "",
    no_hp: "",
    email: "",
  });
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const fetchData = async (searchTerm = "") => {
    try {
      setLoading(true);
      const res = await api.get("/distributors", {
        params: { search: searchTerm },
      });
      setDistributors(res.data.distributors || []);
    } catch (err) {
      Swal.fire("Error", "Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(search);
  }, [search]);

  useEffect(() => {
    if (typeof setNavbarContent === "function") {
      setNavbarContent(
        <DistributorFilterBar search={search} setSearch={setSearch} />,
      );
    }
  }, [search, setNavbarContent]);

  const resetForm = () => {
    setForm({ nama: "", no_hp: "", email: "" });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/distributors/${editingId}`, form);
        Swal.fire("Berhasil!", "Distributor diperbarui", "success");
      } else {
        await api.post("/distributors", form);
        Swal.fire("Berhasil!", "Distributor ditambahkan", "success");
      }
      setIsModalOpen(false);
      resetForm();
      fetchData(search); // Refresh data dengan pencarian saat ini
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

  const handleEdit = (distributor) => {
    setForm({
      nama: distributor.nama,
      no_hp: distributor.no_hp,
      email: distributor.email,
    });
    setEditingId(distributor.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Hapus Distributor?",
      text: "Data tidak bisa dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/distributors/${id}`);
        Swal.fire("Dihapus!", "Distributor berhasil dihapus", "success");
        fetchData(search);
      } catch (err) {
        Swal.fire("Error", "Gagal menghapus distributor", "error");
      }
    }
  };

  return (
    <div className="p-4">
      {loading ? (
        <p className="text-center py-8">Memuat data...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
          {distributors.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Tidak ada data distributor
            </div>
          ) : (
            distributors.map((d) => (
              <div
                key={d.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition"
              >
                <h3 className="font-bold text-gray-800 text-center text-sm truncate">
                  {d.nama}
                </h3>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  📞 {d.no_hp}
                </p>
                <p className="text-xs text-gray-600 mt-1 text-center truncate">
                  ✉️ {d.email}
                </p>

                <div className="flex gap-2 mt-3">
                  {(role === "admin" || role === "kasir") && (
                    <button
                      onClick={() => handleEdit(d)}
                      className="flex-1 flex items-center justify-center gap-1 bg-yellow-100 text-yellow-700 text-[10px] px-2 py-1 rounded hover:bg-yellow-200"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                  )}

                  {role === "admin" && (
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="flex-1 flex items-center justify-center gap-1 bg-red-100 text-red-700 text-[10px] px-2 py-1 rounded hover:bg-red-200"
                    >
                      <Trash2 size={12} />
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {(role === "admin" || role === "kasir") && (
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition"
        >
          <Plus size={18} />
        </button>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl text-center font-bold mb-4">
              {editingId ? "Edit Distributor" : "Tambah Distributor"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nama *
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    No HP *
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={form.no_hp}
                    onChange={(e) =>
                      setForm({ ...form, no_hp: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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

export default DistributorPage;
