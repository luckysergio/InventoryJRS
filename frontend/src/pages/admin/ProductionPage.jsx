import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Calendar, Package, User } from "lucide-react";
import api from "../../services/api";

const statusConfig = {
  antri: {
    label: "Antri",
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-300",
  },
  produksi: {
    label: "Produksi",
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300",
  },
  selesai: {
    label: "Selesai",
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
  },
  batal: {
    label: "Batal",
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
  },
};

const Section = ({ title, data, render }) => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
    {data.length === 0 ? (
      <div className="text-center py-8">
        <div className="inline-block bg-gray-100 rounded-full p-4 mb-3">
          <Package className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500">Tidak ada data</p>
      </div>
    ) : (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map(render)}
      </div>
    )}
  </div>
);

const ProductionPage = () => {
  const [productions, setProductions] = useState([]);
  const [products, setProducts] = useState([]);
  const [pesanan, setPesanan] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    product_id: "",
    qty: 1,
    tanggal_mulai: "",
    tanggal_selesai: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [p, prod, pes] = await Promise.all([
        api.get("/productions"),
        api.get("/products"),
        api.get("/productions/pesanan"),
      ]);

      setProductions(p.data.data);
      setProducts(prod.data.data);
      setPesanan(pes.data.data);
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
      setForm({
        product_id: "",
        qty: 1,
        tanggal_mulai: "",
        tanggal_selesai: "",
      });
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

  const createFromPesanan = async (detailId) => {
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
        ...dates,
      });

      Swal.fire("Berhasil", "Produksi pesanan dibuat", "success");
      fetchData();
    } catch {
      Swal.fire("Error", "Gagal membuat produksi pesanan", "error");
    }
  };

  const updateStatus = async (id, status) => {
    const ok = await confirmAction(
      "Ubah Status?",
      `Status akan diubah menjadi "${statusConfig[status].label}"`
    );
    if (!ok) return;

    await api.put(`/productions/${id}`, { status });
    fetchData();
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
    return [p.jenis?.nama, p.type?.nama, p.ukuran].filter(Boolean).join(" | ");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  const byStatus = (s) => productions.filter((p) => p.status === s);

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 py-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manajemen Produksi
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola produksi inventory dan pesanan yang sedang berjalan
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition"
        >
          + Produksi Inventory
        </button>
      </div>

      {/* PESANAN MENUNGGU PRODUKSI */}
      <Section
        title="Pesanan Menunggu Produksi"
        data={pesanan}
        render={(p) => (
          <div
            key={p.id}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition p-6"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-900">
                  {p.product?.kode || "-"}
                </h3>
                <p className="text-sm text-gray-600">
                  {formatProductName(p.product)}
                </p>
              </div>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                Pesanan
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {p.transaksi?.customer?.name || "Pesanan"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">Qty: {p.qty}</span>
              </div>
            </div>

            <button
              onClick={() => createFromPesanan(p.id)}
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-xl font-medium hover:shadow-md transition"
            >
              Buat Produksi
            </button>
          </div>
        )}
      />

      {/* PRODUKSI: ANTRI */}
      <Section
        title="Antri"
        data={byStatus("antri")}
        render={(p) => (
          <ProductionCard
            p={p}
            updateStatus={updateStatus}
            formatProductName={formatProductName}
            formatDate={formatDate}
          />
        )}
      />

      {/* PRODUKSI: DALAM PRODUKSI */}
      <Section
        title="Dalam Produksi"
        data={byStatus("produksi")}
        render={(p) => (
          <ProductionCard
            p={p}
            updateStatus={updateStatus}
            formatProductName={formatProductName}
            formatDate={formatDate}
          />
        )}
      />

      {/* MODAL: PRODUKSI INVENTORY */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Produksi Inventory
              </h2>

              <form onSubmit={handleSubmitInventory} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Produk
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.qty}
                    onChange={(e) => setForm({ ...form, qty: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.tanggal_mulai}
                      onChange={(e) =>
                        setForm({ ...form, tanggal_mulai: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.tanggal_selesai}
                      onChange={(e) =>
                        setForm({ ...form, tanggal_selesai: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-md transition"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductionCard = ({ p, updateStatus, formatProductName, formatDate }) => {
  const status = statusConfig[p.status] || statusConfig.antri;

  return (
    <div
      className={`bg-white border ${status.border} rounded-2xl shadow-sm hover:shadow-md transition p-6`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-900">
            {p.product?.kode || "-"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {formatProductName(p.product)}
          </p>
        </div>
        <span
          className={`${status.bg} ${status.text} text-xs px-2.5 py-1 rounded-full font-medium`}
        >
          {status.label}
        </span>
      </div>

      {/* CUSTOMER */}
      <div className="flex items-center gap-2 mb-3">
        <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-gray-700 truncate">
            {p.jenis_pembuatan === "pesanan"
              ? p.transaksi?.customer?.name || "Pesanan"
              : "Inventory"}
          </p>
        </div>
      </div>

      {/* QUANTITY */}
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <p className="text-sm text-gray-700">Qty: {p.qty}</p>
      </div>

      {/* TANGGAL */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div>
            <p className="text-gray-600">Mulai</p>
            <p className="font-medium text-gray-900">
              {formatDate(p.tanggal_mulai)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div>
            <p className="text-gray-600">Selesai</p>
            <p className="font-medium text-gray-900">
              {formatDate(p.tanggal_selesai)}
            </p>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS — Hanya untuk status yang bisa diubah */}
      {updateStatus && (
        <div className="flex gap-2 mt-5">
          {p.status === "antri" && (
            <button
              onClick={() => updateStatus(p.id, "produksi")}
              className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-xl font-medium hover:bg-blue-700 transition"
            >
              Mulai Produksi
            </button>
          )}

          {p.status === "produksi" && (
            <button
              onClick={() => updateStatus(p.id, "selesai")}
              className="flex-1 bg-green-600 text-white text-sm py-2 rounded-xl font-medium hover:bg-green-700 transition"
            >
              Selesai
            </button>
          )}

          {p.status !== "selesai" && (
            <button
              onClick={() => updateStatus(p.id, "batal")}
              className="flex-1 bg-red-600 text-white text-sm py-2 rounded-xl font-medium hover:bg-red-700 transition"
            >
              Batal
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductionPage;