import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import api from "../../services/api";

export const KaryawanFilterBar = ({ search, setSearch }) => (
  <div className="flex items-center gap-2 w-full max-w-4xl">
    <div className="relative flex-1 min-w-[150px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Cari karyawan..."
        className="w-full pl-10 pr-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  </div>
);

const KaryawanPage = ({ setNavbarContent }) => {
  const [karyawans, setKaryawans] = useState([]);
  const [jabatans, setJabatans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nama: "",
    no_hp: "",
    email: "",
    jabatan_id: "",
    jabatan_nama: "",
  });
  const [isCreatingNewJabatan, setIsCreatingNewJabatan] = useState(false);

  const fetchData = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true);
      const res = await api.get("/karyawans", {
        params: {
          search: searchTerm,
          page: page,
        },
      });
      setKaryawans(res.data.karyawans.data || []);
      setJabatans(res.data.jabatans || []);
      setLastPage(res.data.karyawans.last_page || 1);
      setCurrentPage(page);
    } catch (err) {
      Swal.fire("Error", "Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, search);
  }, [currentPage, search]);

  useEffect(() => {
    if (typeof setNavbarContent === "function") {
      setNavbarContent(
        <KaryawanFilterBar search={search} setSearch={setSearch} />
      );
    }
  }, [search, setNavbarContent]);

  const resetForm = () => {
    setForm({
      nama: "",
      no_hp: "",
      email: "",
      jabatan_id: "",
      jabatan_nama: "",
    });
    setEditingId(null);
    setIsCreatingNewJabatan(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nama: form.nama,
        no_hp: form.no_hp,
        email: form.email,
      };

      if (form.jabatan_id && form.jabatan_id !== "new") {
        payload.jabatan_id = form.jabatan_id;
      } else if (isCreatingNewJabatan && form.jabatan_nama.trim()) {
        payload.jabatan_nama = form.jabatan_nama;
      } else {
        Swal.fire(
          "Error",
          "Pilih jabatan atau isi nama jabatan baru",
          "warning"
        );
        return;
      }

      if (editingId) {
        await api.put(`/karyawans/${editingId}`, payload);
        Swal.fire("Berhasil!", "Karyawan diperbarui", "success");
      } else {
        await api.post("/karyawans", payload);
        Swal.fire("Berhasil!", "Karyawan ditambahkan", "success");
      }
      setIsModalOpen(false);
      resetForm();
      fetchData(1, search);
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

  const handleEdit = (karyawan) => {
    setForm({
      nama: karyawan.nama,
      no_hp: karyawan.no_hp,
      email: karyawan.email,
      jabatan_id: karyawan.jabatan_id ? karyawan.jabatan_id.toString() : "",
      jabatan_nama: "",
    });
    setEditingId(karyawan.id);
    setIsCreatingNewJabatan(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Hapus Karyawan?",
      text: "Data tidak bisa dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/karyawans/${id}`);
        Swal.fire("Dihapus!", "Karyawan berhasil dihapus", "success");
        fetchData(currentPage, search);
      } catch (err) {
        Swal.fire("Error", "Gagal menghapus karyawan", "error");
      }
    }
  };

  const handleJabatanChange = (e) => {
    const value = e.target.value;
    if (value === "new") {
      setIsCreatingNewJabatan(true);
      setForm({ ...form, jabatan_id: "", jabatan_nama: "" });
    } else {
      setIsCreatingNewJabatan(false);
      setForm({ ...form, jabatan_id: value, jabatan_nama: "" });
    }
  };

  return (
    <div className="p-4">
      {loading ? (
        <p className="text-center py-8">Memuat data...</p>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {/* 🔹 Tambahkan wrapper dengan overflow-x-auto */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Nama
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      No HP
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Email
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Jabatan
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {karyawans.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        Tidak ada data karyawan
                      </td>
                    </tr>
                  ) : (
                    karyawans.map((k) => (
                      <tr key={k.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-500">
                          {k.nama}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                          {k.no_hp}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                          {k.email}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                          {k.jabatan?.nama || "-"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleEdit(k)}
                              className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(k.id)}
                              className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden px-4 pb-2">
              <p className="text-xs text-gray-500 text-center">
                Geser ke kiri/kanan untuk melihat semua kolom
              </p>
            </div>
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              <button
                onClick={() => fetchData(currentPage - 1, search)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-500"
                    : "bg-white text-gray-700 border"
                }`}
              >
                Sebelumnya
              </button>
              {[...Array(lastPage)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => fetchData(i + 1, search)}
                  className={`px-3 py-1 rounded ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => fetchData(currentPage + 1, search)}
                disabled={currentPage === lastPage}
                className={`px-3 py-1 rounded ${
                  currentPage === lastPage
                    ? "bg-gray-200 text-gray-500"
                    : "bg-white text-gray-700 border"
                }`}
              >
                Selanjutnya
              </button>
            </div>
          )}
        </>
      )}

      <button
        onClick={() => {
          resetForm();
          setIsModalOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition"
      >
        <Plus size={18} />
      </button>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Edit Karyawan" : "Tambah Karyawan"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nama
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
                    No HP
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
                    Email
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Jabatan
                  </label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={isCreatingNewJabatan ? "new" : form.jabatan_id}
                    onChange={handleJabatanChange}
                  >
                    <option value="">Pilih Jabatan</option>
                    {jabatans.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.nama}
                      </option>
                    ))}
                    <option value="new">➕ Tambah Jabatan Baru</option>
                  </select>

                  {isCreatingNewJabatan && (
                    <input
                      type="text"
                      placeholder="Nama jabatan baru"
                      className="mt-2 block w-full border border-gray-300 rounded-md px-3 py-2"
                      value={form.jabatan_nama}
                      onChange={(e) =>
                        setForm({ ...form, jabatan_nama: e.target.value })
                      }
                      required
                    />
                  )}
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

export default KaryawanPage;
