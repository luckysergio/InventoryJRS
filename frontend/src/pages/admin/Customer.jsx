// src/pages/admin/CustomerPage.jsx
import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Receipt,
  Wallet,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import api from "../../services/api";

const safeParseFloat = (value) => {
  if (value == null) return 0;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

const formatRupiah = (value) => {
  const num = safeParseFloat(value);
  return new Intl.NumberFormat("id-ID").format(Math.round(num));
};

const unformatRupiah = (str) => {
  if (!str) return 0;
  const clean = String(str).replace(/\D/g, "");
  return clean === "" ? 0 : parseInt(clean, 10);
};

const formatProductName = (p) => {
  if (!p) return "-";
  return [p.jenis?.nama, p.type?.nama, p.ukuran].filter(Boolean).join(" ");
};

const formatTanggal = (tgl) => {
  if (!tgl) return "-";
  return new Date(tgl).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const CustomerFilterBar = ({ search, setSearch }) => (
  <div className="flex items-center gap-2 w-full max-w-4xl">
    <div className="relative flex-1 min-w-[150px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Cari customer..."
        className="w-full pl-10 pr-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  </div>
);

const CustomerPage = ({ setNavbarContent }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); // ✅ Akan diisi dari localStorage
  const [customerModal, setCustomerModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [bayarModal, setBayarModal] = useState(null);
  const [jumlahBayar, setJumlahBayar] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // ✅ Baca nilai search dari localStorage saat komponen dimount
  useEffect(() => {
    const savedSearch = localStorage.getItem("customerSearch") || "";
    setSearch(savedSearch);
  }, []);

  const fetchData = useCallback(async (searchTerm = "") => {
    try {
      setLoading(true);
      const res = await api.get("/customers", {
        params: { search: searchTerm },
      });
      setCustomers(res.data.data);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Gagal mengambil data customer", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Simpan nilai search ke localStorage saat berubah
  useEffect(() => {
    localStorage.setItem("customerSearch", search);
    fetchData(search);
  }, [search, fetchData]);

  useEffect(() => {
    setNavbarContent(
      <CustomerFilterBar search={search} setSearch={setSearch} />
    );
  }, [search, setNavbarContent]);

  const handleTambah = () => {
    setForm({ name: "", phone: "", email: "" });
    setIsEdit(false);
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setForm({ name: item.name, phone: item.phone, email: item.email });
    setSelectedId(item.id);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.put(`/customers/${selectedId}`, form);
        Swal.fire("Berhasil", "Customer berhasil diupdate", "success");
      } else {
        await api.post("/customers", form);
        Swal.fire("Berhasil", "Customer berhasil ditambahkan", "success");
      }
      setIsModalOpen(false);
      fetchData(search);
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
        await api.delete(`/customers/${id}`);
        Swal.fire("Berhasil", "Customer berhasil dihapus", "success");
        fetchData(search);
      } catch (err) {
        Swal.fire("Error", "Gagal menghapus data", "error");
      }
    }
  };

  const openCustomerModal = (customer, jenisFilter = null) => {
    if (!customer.transaksi_details) {
      setCustomerModal({ ...customer, transaksi_details: [], jenisFilter });
      return;
    }

    let filteredDetails = customer.transaksi_details.filter((detail) => {
      if (
        jenisFilter === "daily" &&
        detail.transaksi?.jenis_transaksi !== "daily"
      )
        return false;
      if (
        jenisFilter === "pesanan" &&
        detail.transaksi?.jenis_transaksi !== "pesanan"
      )
        return false;

      const totalBayar =
        detail.pembayarans?.reduce(
          (sum, p) => sum + (p.jumlah_bayar || 0),
          0
        ) || 0;
      const sisaBayar = detail.subtotal - totalBayar;
      return sisaBayar > 0;
    });

    setCustomerModal({
      ...customer,
      transaksi_details: filteredDetails,
      jenisFilter,
    });
  };

  const openDetailModal = (transaksiDetail, customerName) => {
    setDetailModal({ transaksiDetail, customerName });
  };

  const openBayarModal = (transaksiDetail, customerName) => {
    setBayarModal({ transaksiDetail, customerName });
    const totalBayar =
      transaksiDetail.pembayarans?.reduce(
        (sum, p) => sum + (p.jumlah_bayar || 0),
        0
      ) || 0;
    const sisaTagihan = transaksiDetail.subtotal - totalBayar;
    setJumlahBayar(formatRupiah(sisaTagihan));
  };

  const handleJumlahBayarChange = (value) => {
    if (value === "" || /^\d+$/.test(value.replace(/\D/g, ""))) {
      setJumlahBayar(value);
    }
  };

  const handleBayar = async (e) => {
    e.preventDefault();

    if (!bayarModal) return;

    const jumlah = unformatRupiah(jumlahBayar);
    const totalBayar =
      bayarModal.transaksiDetail.pembayarans?.reduce(
        (sum, p) => sum + (p.jumlah_bayar || 0),
        0
      ) || 0;
    const sisaTagihan = bayarModal.transaksiDetail.subtotal - totalBayar;

    if (!jumlah || jumlah <= 0) {
      Swal.fire("Error", "Jumlah bayar harus lebih dari 0", "warning");
      return;
    }

    if (jumlah > sisaTagihan) {
      Swal.fire(
        "Error",
        `Jumlah bayar tidak boleh melebihi sisa tagihan (Rp ${formatRupiah(
          sisaTagihan
        )})`,
        "warning"
      );
      return;
    }

    try {
      await api.post("/pembayaran", {
        transaksi_detail_id: bayarModal.transaksiDetail.id,
        jumlah_bayar: jumlah,
        tanggal_bayar: new Date().toISOString().split("T")[0],
      });

      Swal.fire("Berhasil", "Pembayaran berhasil dicatat", "success");

      setBayarModal(null);
      setDetailModal(null);
      setCustomerModal(null);
      setJumlahBayar("");
      fetchData(search);
    } catch (error) {
      Swal.fire("Error", "Gagal menyimpan pembayaran", "error");
    }
  };

  const getTagihanAmount = (customer, jenis) => {
    if (!customer.transaksi_details) return 0;

    return customer.transaksi_details.reduce((sum, detail) => {
      if (jenis === "daily" && detail.transaksi?.jenis_transaksi !== "daily")
        return sum;
      if (
        jenis === "pesanan" &&
        detail.transaksi?.jenis_transaksi !== "pesanan"
      )
        return sum;

      const totalBayar =
        detail.pembayarans?.reduce(
          (sum, p) => sum + (p.jumlah_bayar || 0),
          0
        ) || 0;
      const sisaBayar = detail.subtotal - totalBayar;
      return sisaBayar > 0 ? sum + sisaBayar : sum;
    }, 0);
  };

  return (
    <div className="space-y-6 p-2 md:p-4 max-w-7xl mx-auto">
      {loading ? (
        <p className="text-center text-gray-500 py-12">Memuat data...</p>
      ) : customers.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          Tidak ada customer yang ditemukan.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {customers.map((item) => {
            const tagihanHarian = getTagihanAmount(item, "daily");
            const tagihanPesanan = getTagihanAmount(item, "pesanan");

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition border border-gray-100"
              >
                <h3 className="text-sm font-bold text-gray-900 text-center line-clamp-1">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  📞 {item.phone || "-"}
                </p>
                <p className="text-xs text-gray-500 text-center">
                  ✉️ {item.email || "-"}
                </p>

                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Harian:</span>
                    <span className="font-medium">
                      {item.transaksi_harian_count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pesanan:</span>
                    <span className="font-medium">
                      {item.transaksi_pesanan_count || 0}
                    </span>
                  </div>

                  {tagihanHarian > 0 && (
                    <div
                      className="flex justify-between pt-2 border-t border-gray-100 cursor-pointer hover:bg-orange-50 rounded p-1"
                      onClick={() => openCustomerModal(item, "daily")}
                    >
                      <span className="text-orange-600 font-medium text-[10px]">
                        Tagihan Harian:
                      </span>
                      <span className="text-orange-600 font-bold text-[10px]">
                        {formatRupiah(tagihanHarian)}
                      </span>
                    </div>
                  )}

                  {tagihanPesanan > 0 && (
                    <div
                      className="flex justify-between pt-1 cursor-pointer hover:bg-purple-50 rounded p-1"
                      onClick={() => openCustomerModal(item, "pesanan")}
                    >
                      <span className="text-purple-600 font-medium text-[10px]">
                        Tagihan Pesanan:
                      </span>
                      <span className="text-purple-600 font-bold text-[10px]">
                        {formatRupiah(tagihanPesanan)}
                      </span>
                    </div>
                  )}

                  {tagihanHarian === 0 && tagihanPesanan === 0 && (
                    <div className="flex justify-between pt-2 border-t border-gray-100">
                      <span className="text-green-600 font-medium text-[10px]">
                        Tidak ada tagihan
                      </span>
                      <span className="text-green-600 text-[10px]">✅</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-[10px]"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-[10px]"
                  >
                    <Trash2 size={12} />
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={handleTambah}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition"
      >
        <Plus size={20} />
      </button>

      {/* MODAL TAMBAH/EDIT CUSTOMER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-center">
              {isEdit ? "Edit Customer" : "Tambah Customer"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Nama Customer
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nama"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nomor telepon"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan email"
                  required
                />
              </div>
              <div className="flex justify-center gap-3 pt-4">
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

      {/* MODAL DAFTAR TAGIHAN CUSTOMER - DENGAN FILTER JENIS */}
      {customerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Tagihan {customerModal.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {customerModal.jenisFilter === "daily"
                    ? "Transaksi Harian"
                    : customerModal.jenisFilter === "pesanan"
                    ? "Transaksi Pesanan"
                    : "Semua Tagihan Belum Lunas"}
                </p>
              </div>
              <button
                onClick={() => setCustomerModal(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft size={20} />
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customerModal.transaksi_details?.map((detail, index) => {
                  const totalBayar =
                    detail.pembayarans?.reduce(
                      (sum, p) => sum + (p.jumlah_bayar || 0),
                      0
                    ) || 0;
                  const sisaBayar = detail.subtotal - totalBayar;
                  const isHarian =
                    detail.transaksi?.jenis_transaksi === "daily";

                  return (
                    <div
                      key={detail.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer transition"
                      onClick={() =>
                        openDetailModal(detail, customerModal.name)
                      }
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isHarian
                              ? "bg-orange-100 text-orange-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {isHarian ? "Harian" : "Pesanan"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTanggal(detail.tanggal)}
                        </span>
                      </div>

                      <p className="font-medium text-gray-800 text-sm text-center">
                        {detail.product?.kode}
                      </p>
                      <p className="text-xs text-gray-600 mb-2 text-center">
                        {formatProductName(detail.product)}
                      </p>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Sisa Tagihan:</span>
                        <span className="font-bold text-red-600">
                          Rp {formatRupiah(sisaBayar)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(!customerModal.transaksi_details ||
                customerModal.transaksi_details.length === 0) && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-500">
                    {customerModal.jenisFilter === "daily"
                      ? "Tidak ada tagihan harian yang belum lunas"
                      : customerModal.jenisFilter === "pesanan"
                      ? "Tidak ada tagihan pesanan yang belum lunas"
                      : "Tidak ada tagihan yang belum lunas"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL TAGIHAN */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 text-center">
                Detail Tagihan
              </h2>
              <p className="text-sm text-gray-600 text-center mt-1">
                {detailModal.customerName}
              </p>
            </div>

            <div className="p-5 space-y-4">
              {detailModal.transaksiDetail.product && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-800 text-center">
                    {detailModal.transaksiDetail.product.kode}
                  </p>
                  <p className="text-sm text-gray-600 text-center">
                    {formatProductName(detailModal.transaksiDetail.product)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Jenis:{" "}
                    {detailModal.transaksiDetail.transaksi?.jenis_transaksi ===
                    "daily"
                      ? "Harian"
                      : "Pesanan"}
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-bold">
                  Rp {formatRupiah(detailModal.transaksiDetail.subtotal)}
                </span>
              </div>

              {detailModal.transaksiDetail.pembayarans?.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="font-medium text-blue-800 flex items-center gap-1 justify-center">
                    <Receipt size={14} /> Riwayat Pembayaran:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {detailModal.transaksiDetail.pembayarans.map((p) => (
                      <li
                        key={p.id}
                        className="text-sm text-gray-700 flex justify-between"
                      >
                        <span>Rp {formatRupiah(p.jumlah_bayar)}</span>
                        <span>{formatTanggal(p.tanggal_bayar)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detailModal.transaksiDetail.pembayarans && (
                <div className="text-center py-2">
                  <p className="text-xs text-gray-600">
                    Sudah dibayar: Rp{" "}
                    {formatRupiah(
                      detailModal.transaksiDetail.pembayarans.reduce(
                        (sum, p) => sum + (p.jumlah_bayar || 0),
                        0
                      )
                    )}{" "}
                    dari Rp {formatRupiah(detailModal.transaksiDetail.subtotal)}
                  </p>
                </div>
              )}

              {detailModal.transaksiDetail.subtotal >
                (detailModal.transaksiDetail.pembayarans?.reduce(
                  (sum, p) => sum + (p.jumlah_bayar || 0),
                  0
                ) || 0) && (
                <button
                  onClick={() =>
                    openBayarModal(
                      detailModal.transaksiDetail,
                      detailModal.customerName
                    )
                  }
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition"
                >
                  <Wallet size={16} /> Bayar Sekarang
                </button>
              )}
            </div>

            <div className="p-5 border-t border-gray-200 flex justify-center">
              <button
                onClick={() => setDetailModal(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PEMBAYARAN */}
      {bayarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 text-center">
                Pembayaran Tagihan
              </h2>
              <p className="text-sm text-gray-600 text-center mt-1">
                {bayarModal.customerName}
              </p>
            </div>

            <form onSubmit={handleBayar} className="p-5">
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="font-medium text-gray-800 text-center">
                  {bayarModal.transaksiDetail.product?.kode}
                </p>
                <p className="text-sm text-gray-600 text-center">
                  {formatProductName(bayarModal.transaksiDetail.product)}
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>
                    Rp {formatRupiah(bayarModal.transaksiDetail.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Sudah Dibayar:</span>
                  <span>
                    Rp{" "}
                    {formatRupiah(
                      bayarModal.transaksiDetail.pembayarans?.reduce(
                        (sum, p) => sum + (p.jumlah_bayar || 0),
                        0
                      ) || 0
                    )}
                  </span>
                </div>

                <div className="flex justify-between font-bold">
                  <span className="text-red-600">Sisa Tagihan:</span>
                  <span className="text-red-600">
                    Rp{" "}
                    {formatRupiah(
                      bayarModal.transaksiDetail.subtotal -
                        (bayarModal.transaksiDetail.pembayarans?.reduce(
                          (sum, p) => sum + (p.jumlah_bayar || 0),
                          0
                        ) || 0)
                    )}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
                  Jumlah Bayar (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none text-center"
                  value={jumlahBayar}
                  onChange={(e) => handleJumlahBayarChange(e.target.value)}
                  placeholder="Masukkan jumlah"
                  required
                />
              </div>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBayarModal(null);
                    setJumlahBayar("");
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Bayar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPage;