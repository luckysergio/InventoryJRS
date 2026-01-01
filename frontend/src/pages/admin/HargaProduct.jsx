import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../../services/api";

const formatRupiah = (value) => {
  if (!value) return "";
  return new Intl.NumberFormat("id-ID").format(value);
};

const unformatRupiah = (value) => {
  if (!value) return "";
  return value.replace(/\./g, "");
};

const groupByProduct = (data) => {
  const grouped = {};

  data.forEach((item) => {
    const key = item.product_id;

    if (!grouped[key]) {
      grouped[key] = {
        product: item.product,
        harga: [],
      };
    }

    grouped[key].harga.push(item);
  });

  return Object.values(grouped);
};

const HargaProductPage = () => {
  const [hargaList, setHargaList] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    product_id: "",
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

      const hargaRes = await api.get("/harga");
      const productRes = await api.get("/products");

      setHargaList(groupByProduct(hargaRes.data.data));
      setProducts(productRes.data.data);
    } catch (error) {
      Swal.fire("Error", "Gagal mengambil data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTambah = () => {
    setForm({
      product_id: "",
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

    try {
      const payload = {
        ...form,
        harga: Number(form.harga),
      };

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

  const formatProductLabel = (p) => {
    if (!p) return "-";

    const detail = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran]
      .filter(Boolean)
      .join(" | ");

    return `${p.kode} — ${detail}`;
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Harga Product</h1>
          <p className="text-gray-600 mt-2">
            1 Product dapat memiliki banyak history harga
          </p>
        </div>

        <button
          onClick={handleTambah}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition"
        >
          <Plus size={18} />
          Tambah Harga
        </button>
      </div>

      {/* LOADING */}
      {loading && <p className="text-center text-gray-500">Memuat data...</p>}

      {/* KOSONG */}
      {!loading && hargaList.length === 0 && (
        <p className="text-center text-gray-500">Belum ada harga product</p>
      )}

      {/* GRID 3 KOLOM */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {hargaList.map((group, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition"
          >
            {/* Produk */}
            <h3 className="font-bold text-lg text-gray-900 text-center">
              {[
                group.product?.jenis?.nama,
                group.product?.type?.nama,
                group.product?.ukuran,
              ]
                .filter(Boolean)
                .join(" | ")}
            </h3>

            <p className="text-sm text-gray-500 mb-4 text-center">
              Kode : {group.product?.kode}
            </p>

            {/* History Harga */}
            <div className="space-y-4">
              {group.harga.map((item) => (
                <div key={item.id} className="border rounded-xl p-3 bg-gray-50">
                  <p className="text-sm">
                    <span className="font-semibold">Harga:</span>{" "}
                    <span className="text-green-600 font-bold">
                      Rp {Number(item.harga).toLocaleString("id-ID")}
                    </span>
                  </p>

                  <p className="text-sm">
                    <span className="font-semibold">Tanggal Berlaku:</span>{" "}
                    {item.tanggal_berlaku
                      ? new Date(item.tanggal_berlaku).toLocaleDateString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          }
                        )
                      : "-"}
                  </p>

                  <p className="text-sm">
                    <span className="font-semibold">Keterangan:</span>{" "}
                    {item.keterangan || "-"}
                  </p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-xs"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs"
                    >
                      <Trash2 size={14} />
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-xl p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {isEdit ? "Edit Harga Product" : "Tambah Harga Product"}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <select
                className="col-span-2 border rounded-xl px-4 py-2"
                value={form.product_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    product_id: e.target.value,
                  })
                }
                required
              >
                <option value="">Pilih Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {[p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran]
                      .filter(Boolean)
                      .join(" - ")}
                  </option>
                ))}
              </select>

              <input
                type="text"
                inputMode="numeric"
                placeholder="Harga (Rp)"
                className="col-span-2 border rounded-xl px-4 py-2"
                value={formatRupiah(form.harga)}
                onChange={(e) => {
                  const raw = unformatRupiah(e.target.value);
                  if (!isNaN(raw)) {
                    setForm({ ...form, harga: raw });
                  }
                }}
                required
              />

              <input
                type="date"
                className="border rounded-xl px-4 py-2"
                value={form.tanggal_berlaku}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tanggal_berlaku: e.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="Keterangan"
                className="border rounded-xl px-4 py-2"
                value={form.keterangan}
                onChange={(e) =>
                  setForm({
                    ...form,
                    keterangan: e.target.value,
                  })
                }
              />

              <div className="col-span-2 flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
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
