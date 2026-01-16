import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  Plus,
  Calendar,
  Package,
  User,
  Play,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
} from "lucide-react";
import api from "../../services/api";

const statusConfig = {
  antri: {
    label: "Antri",
    bg: "bg-gray-100",
    text: "text-gray-700",
    icon: null,
  },
  produksi: {
    label: "Produksi",
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: <Play size={12} className="text-blue-600" />,
  },
  selesai: {
    label: "Selesai",
    bg: "bg-green-100",
    text: "text-green-700",
    icon: <CheckCircle size={12} className="text-green-600" />,
  },
  batal: {
    label: "Batal",
    bg: "bg-red-100",
    text: "text-red-700",
    icon: <XCircle size={12} className="text-red-600" />,
  },
};

const ProductionPage = () => {
  const [productions, setProductions] = useState([]);
  const [products, setProducts] = useState([]);
  const [pesanan, setPesanan] = useState([]);
  const [karyawans, setKaryawans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    product_id: "",
    qty: 1,
    tanggal_mulai: "",
    tanggal_selesai: "",
    karyawan_id: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 🔹 State untuk modal upload foto
  const [uploadModal, setUploadModal] = useState({ open: false, productionId: null, productId: null });
  const [fotoForm, setFotoForm] = useState({
    foto_depan: null,
    foto_samping: null,
    foto_atas: null,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [p, prod, pes, kary] = await Promise.all([
        api.get("/productions"),
        api.get("/products"),
        api.get("/productions/pesanan"),
        api.get("/karyawans"),
      ]);

      setProductions(p.data.data);
      setProducts(prod.data.data);
      setPesanan(pes.data.data);
      setKaryawans(kary.data.karyawans.data || []);
    } catch {
      Swal.fire("Error", "Gagal mengambil data produksi", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const confirmAction = async (title, text) => {
    const res = await Swal.fire({
      title,
      text,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya",
      cancelButtonText: "Batal",
    });
    return res.isConfirmed;
  };

  const handleSubmitInventory = async (e) => {
    e.preventDefault();

    if (!form.karyawan_id) {
      Swal.fire("Validasi", "Pilih karyawan terlebih dahulu", "warning");
      return;
    }

    const ok = await confirmAction(
      "Buat Produksi?",
      "Produksi inventory akan dibuat"
    );
    if (!ok) return;

    try {
      await api.post("/productions", {
        ...form,
        jenis_pembuatan: "inventory",
      });

      Swal.fire("Berhasil", "Produksi inventory dibuat", "success");
      setIsModalOpen(false);
      resetForm();
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

  const resetForm = () => {
    setForm({
      product_id: "",
      qty: 1,
      tanggal_mulai: "",
      tanggal_selesai: "",
      karyawan_id: "",
    });
  };

  const createFromPesanan = async (detailId) => {
    const { value: karyawanId } = await Swal.fire({
      title: "Pilih Karyawan",
      input: "select",
      inputOptions: karyawans.reduce((acc, k) => {
        acc[k.id] = k.nama;
        return acc;
      }, {}),
      inputPlaceholder: "Pilih karyawan",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return "Karyawan wajib dipilih!";
      },
    });

    if (!karyawanId) return;

    const { value: dates } = await Swal.fire({
      title: "Tanggal Produksi",
      html: `
        <input type="date" id="mulai" class="swal2-input" placeholder="Tanggal Mulai">
        <input type="date" id="selesai" class="swal2-input" placeholder="Tanggal Selesai">
      `,
      focusConfirm: false,
      preConfirm: () => ({
        tanggal_mulai: document.getElementById("mulai").value,
        tanggal_selesai: document.getElementById("selesai").value,
      }),
      showCancelButton: true,
    });

    if (!dates) return;

    try {
      await api.post("/productions", {
        transaksi_detail_id: detailId,
        jenis_pembuatan: "pesanan",
        karyawan_id: karyawanId,
        ...dates,
      });

      Swal.fire("Berhasil", "Produksi pesanan dibuat", "success");
      fetchData();
    } catch (error) {
      if (error.response?.status === 422) {
        const msg = Object.values(error.response.data.errors).join("<br>");
        Swal.fire("Validasi Gagal", msg, "warning");
      } else {
        Swal.fire("Error", "Gagal membuat produksi pesanan", "error");
      }
    }
  };

  // 🔹 Fungsi baru: handle selesai dengan upload foto
  const handleSelesaiWithUpload = async (id, production) => {
    const ok = await confirmAction(
      "Ubah Status?",
      `Status akan diubah menjadi "Selesai"`
    );
    if (!ok) return;

    try {
      await api.put(`/productions/${id}`, { status: "selesai" });
      fetchData();
    } catch (error) {
      if (error.response?.status === 422) {
        const errorMsg = error.response.data.message || "";
        if (errorMsg.includes("foto")) {
          // 🔹 Tampilkan modal upload foto
          setUploadModal({
            open: true,
            productionId: id,
            productId: production.product_id,
          });
        } else {
          const msg = Object.values(error.response.data.errors || { message: errorMsg })
            .flat()
            .join("<br>");
          Swal.fire("Validasi Gagal", msg, "warning");
        }
      } else {
        Swal.fire("Error", "Gagal mengubah status", "error");
      }
    }
  };

  const updateStatus = async (id, status) => {
    if (status === "selesai") {
      // Cari produksi yang sesuai
      const production = productions.find(p => p.id === id);
      if (production) {
        handleSelesaiWithUpload(id, production);
      }
      return;
    }

    const ok = await confirmAction(
      "Ubah Status?",
      `Status akan diubah menjadi "${statusConfig[status].label}"`
    );
    if (!ok) return;

    try {
      await api.put(`/productions/${id}`, { status });
      fetchData();
    } catch (error) {
      if (error.response?.status === 422) {
        const msg = Object.values(error.response.data.errors || { message: error.response.data.message })
          .flat()
          .join("<br>");
        Swal.fire("Validasi Gagal", msg, "warning");
      } else {
        Swal.fire("Error", "Gagal mengubah status", "error");
      }
    }
  };

  // 🔹 Simpan foto produk
  const handleUploadFoto = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    if (fotoForm.foto_depan) formData.append('foto_depan', fotoForm.foto_depan);
    if (fotoForm.foto_samping) formData.append('foto_samping', fotoForm.foto_samping);
    if (fotoForm.foto_atas) formData.append('foto_atas', fotoForm.foto_atas);

    try {
      await api.post(`/products/${uploadModal.productId}/upload-foto`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Swal.fire("Berhasil", "Foto produk berhasil diunggah", "success");
      
      // Setelah upload, coba selesaikan lagi
      await api.put(`/productions/${uploadModal.productionId}`, { status: "selesai" });
      setUploadModal({ open: false, productionId: null, productId: null });
      setFotoForm({ foto_depan: null, foto_samping: null, foto_atas: null });
      fetchData();
    } catch (error) {
      if (error.response?.status === 422) {
        const msg = Object.values(error.response.data.errors).join("<br>");
        Swal.fire("Validasi Gagal", msg, "warning");
      } else {
        Swal.fire("Error", "Gagal mengunggah foto", "error");
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatProductName = (p) => {
    if (!p) return "-";
    return [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran]
      .filter(Boolean)
      .join(" ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Memuat data production...</p>
        </div>
      </div>
    );
  }

  const byStatus = (s) => productions.filter((p) => p.status === s);

  return (
    <div className="space-y-12 p-4 md:p-2 max-w-7xl mx-auto">
      {/* PESANAN MENUNGGU PRODUKSI */}
      {pesanan.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
            Pesanan Menunggu Produksi
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {pesanan.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition"
              >
                <p className="text-sm text-center font-bold text-gray-800 line-clamp-1">
                  {p.product?.kode || "-"}
                </p>
                <p className="text-[11px] text-center text-gray-600 line-clamp-2 min-h-[28px]">
                  {formatProductName(p.product)}
                </p>
                <div className="flex justify-center items-center gap-1 mt-2">
                  <User size={12} className="text-gray-500" />
                  <span className="text-[11px] text-gray-700">
                    {p.transaksi?.customer?.name || "Pesanan"}
                  </span>
                </div>
                <div className="flex justify-center items-center gap-1 mt-1">
                  <Package size={12} className="text-gray-500" />
                  <span className="text-[11px] text-gray-700">
                    Qty: {p.qty}
                  </span>
                </div>
                <button
                  onClick={() => createFromPesanan(p.id)}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] py-1.5 rounded transition"
                >
                  Buat Produksi
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRODUKSI: ANTRI */}
      {byStatus("antri").length > 0 && (
        <div>
          <h2 className="text-xl text-center font-bold text-gray-800 mb-4">Antri</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {byStatus("antri").map((p) => (
              <ProductionCard
                key={p.id}
                p={p}
                updateStatus={updateStatus}
                formatProductName={formatProductName}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* PRODUKSI: DALAM PRODUKSI */}
      {byStatus("produksi").length > 0 && (
        <div>
          <h2 className="text-xl text-center font-bold text-gray-800 mb-4">
            Dalam Produksi
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {byStatus("produksi").map((p) => (
              <ProductionCard
                key={p.id}
                p={p}
                updateStatus={updateStatus}
                formatProductName={formatProductName}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => {
          resetForm();
          setIsModalOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-full shadow-lg transition"
      >
        <Plus size={18} />
      </button>

      {/* MODAL PRODUKSI INVENTORY */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-center">
                Produksi Inventory
              </h2>
            </div>

            <form onSubmit={handleSubmitInventory} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Karyawan *
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.karyawan_id}
                  onChange={(e) =>
                    setForm({ ...form, karyawan_id: e.target.value })
                  }
                  required
                >
                  <option value="">Pilih Karyawan</option>
                  {karyawans.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Produk *
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.product_id}
                  onChange={(e) =>
                    setForm({ ...form, product_id: e.target.value })
                  }
                  required
                >
                  <option value="">Pilih Produk</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.kode} - {formatProductName(p)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Tanggal Mulai *
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.tanggal_mulai}
                    onChange={(e) =>
                      setForm({ ...form, tanggal_mulai: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Tanggal Selesai *
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.tanggal_selesai}
                    onChange={(e) =>
                      setForm({ ...form, tanggal_selesai: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {uploadModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-center">
                Lengkapi Foto Produk
              </h2>
              <p className="text-sm text-gray-600 text-center mt-1">
                Produk harus memiliki foto depan, samping, dan atas.
              </p>
            </div>

            <form onSubmit={handleUploadFoto} className="p-5 space-y-4">
              {['foto_depan', 'foto_samping', 'foto_atas'].map((key) => (
                <div key={key}>
                  <label className="text-sm text-center font-medium text-gray-700 block mb-1">
                    {key === 'foto_depan' ? 'Foto Depan' : 
                     key === 'foto_samping' ? 'Foto Samping' : 'Foto Atas'}
                  </label>
                  <div className="flex justify-center items-center gap-2">
                    <ImageIcon className="text-gray-400" size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      className="text-xs text-gray-600"
                      onChange={(e) => {
                        setFotoForm({ ...fotoForm, [key]: e.target.files[0] });
                      }}
                      required={!fotoForm[key]}
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadModal({ open: false, productionId: null, productId: null })}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
                >
                  Unggah & Selesai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductionCard = ({ p, updateStatus, formatProductName, formatDate }) => {
  const status = statusConfig[p.status] || statusConfig.antri;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition">
      <div className="flex justify-between items-start mb-2">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full ${status.bg} ${status.text}`}
        >
          {status.icon}
          {status.label}
        </span>
        <span className="text-[10px] text-gray-500">
          {formatDate(p.tanggal_mulai)}
        </span>
      </div>

      <p className="text-sm font-bold text-gray-800 line-clamp-1 text-center">
        {p.product?.kode || "-"}
      </p>
      <p className="text-[10px] text-gray-600 line-clamp-2 min-h-[28px] text-center">
        {formatProductName(p.product)}
      </p>

      <div className="flex items-center justify-center gap-1 mt-1 text-center">
        <User size={12} className="text-gray-500" />
        <span className="text-[11px] text-gray-700">
          {p.karyawan?.nama || "-"}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1 mt-1 text-center">
        <Package size={12} className="text-gray-500" />
        <span className="text-[11px] text-gray-700">Qty: {p.qty}</span>
      </div>

      <div className="text-[10px] text-gray-500 mt-1 text-center">
        <span className="font-medium">Estimasi Selesai</span>{" "}
        {formatDate(p.tanggal_selesai)}
      </div>

      <div className="flex gap-1 mt-2">
        {p.status === "antri" && (
          <button
            onClick={() => updateStatus(p.id, "produksi")}
            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-[10px] py-1 rounded transition"
          >
            Mulai
          </button>
        )}

        {p.status === "produksi" && (
          <button
            onClick={() => updateStatus(p.id, "selesai")}
            className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 text-[10px] py-1 rounded transition"
          >
            Selesai
          </button>
        )}

        {p.status !== "selesai" && (
          <button
            onClick={() => updateStatus(p.id, "batal")}
            className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 text-[10px] py-1 rounded transition"
          >
            Batal
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductionPage;