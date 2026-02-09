import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import {
  Plus,
  Trash2,
  Wallet,
  Receipt,
  CheckCircle,
  XCircle,
  Pencil,
  Search,
} from "lucide-react";
import api from "../../services/api";
import InvoiceSimplePrint from "../../components/InvoiceSimplePrint";
import { useReactToPrint } from "react-to-print";

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

export const TransaksiFilterBar = ({ search, setSearch }) => (
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

const TransaksiPage = ({ setNavbarContent }) => {
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [statusSelesaiId, setStatusSelesaiId] = useState(null);
  const [statusProsesId, setStatusProsesId] = useState(null);
  const [statusDibatalkanId, setStatusDibatalkanId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const [printTransaksi, setPrintTransaksi] = useState(null);
  const printRef = useRef();

  const getInvoiceNumber = (transaksiItem) => {
    const date = new Date(transaksiItem.tanggal || new Date());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `JRS/INV/${year}/${month}/${transaksiItem.id}`;
  };

  const getSafeFileName = (transaksiItem) => {
    if (!transaksiItem) return "Invoice-JRS";

    const invoiceNum = getInvoiceNumber(transaksiItem);
    const customerName = transaksiItem.customer?.name || "Umum";

    const safeInvoiceNum = invoiceNum.replace(/\//g, "-");
    const safeCustomerName = customerName
      .replace(/[^a-zA-Z0-9\s\-_]/g, "")
      .trim()
      .replace(/\s+/g, "_");

    return `${safeInvoiceNum}-${safeCustomerName}`;
  };

  const handlePrintInvoice = useReactToPrint({
    contentRef: printRef,
    documentTitle: getSafeFileName(printTransaksi),
  });

  const onPrintClick = (transaksiItem) => {
    setPrintTransaksi(transaksiItem);
    setTimeout(() => {
      if (printRef.current) {
        handlePrintInvoice();
      }
    }, 150);
  };

  const initialDetail = {
    id: "",
    product_id: "",
    harga_product_id: "",
    harga_baru: { harga: "", tanggal_berlaku: "", keterangan: "" },
    qty: "",
    status_transaksi_id: "",
    discount: 0,
    catatan: "",
  };

  const [form, setForm] = useState({
    customer_id: "",
    customer_baru: { name: "", phone: "", email: "" },
    tanggal: "",
    details: [{ ...initialDetail }],
  });

  const [hargaOptions, setHargaOptions] = useState({});
  const [showHargaBaru, setShowHargaBaru] = useState({});

  const fetchData = async (searchTerm = "") => {
    try {
      setLoading(true);
      const transaksiRes = await api.get("/transaksi/aktif", {
        params: { search: searchTerm },
      });
      setTransaksi(transaksiRes.data || []);

      const customersRes = await api.get("/customers");
      setCustomers(customersRes.data.data || []);

      const productsRes = await api.get("/products/available");
      setProducts(productsRes.data.data || []);

      const statusRes = await api.get("/status-transaksi");
      const statuses = statusRes.data.data || [];
      setStatusList(statuses);

      const selesai = statuses.find((s) =>
        s.nama.toLowerCase().includes("selesai"),
      );
      const proses = statuses.find((s) =>
        s.nama.toLowerCase().includes("proses"),
      );
      const dibatalkan = statuses.find((s) =>
        s.nama.toLowerCase().includes("dibatalkan"),
      );

      // ✅ Ubah ID menjadi string untuk menghindari masalah perbandingan tipe data
      setStatusSelesaiId(selesai?.id?.toString() || null);
      setStatusProsesId(proses?.id?.toString() || null);
      setStatusDibatalkanId(dibatalkan?.id?.toString() || null);
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
        <TransaksiFilterBar search={search} setSearch={setSearch} />,
      );
    }
  }, [search, setNavbarContent]);

  const getActiveDetails = (details) => {
    return details.filter((d) => d.status_transaksi_id === statusProsesId);
  };

  const fetchHargaByProduct = async (
    productId,
    rowIndex,
    customerId = null,
  ) => {
    if (!productId) {
      setHargaOptions((prev) => ({ ...prev, [rowIndex]: [] }));
      setShowHargaBaru((prev) => ({ ...prev, [rowIndex]: false }));
      return;
    }
    try {
      const params = customerId ? `?customer_id=${customerId}` : "";
      const res = await api.get(`/harga/by-product/${productId}${params}`);
      setHargaOptions((prev) => ({ ...prev, [rowIndex]: res.data.data || [] }));
      setShowHargaBaru((prev) => ({ ...prev, [rowIndex]: false }));
    } catch (err) {
      Swal.fire("Error", "Gagal memuat harga produk", "error");
      setHargaOptions((prev) => ({ ...prev, [rowIndex]: [] }));
      setShowHargaBaru((prev) => ({ ...prev, [rowIndex]: false }));
    }
  };

  const addDetailRow = () => {
    const newIndex = form.details.length;
    setForm({
      ...form,
      details: [
        ...form.details,
        { ...initialDetail, status_transaksi_id: statusProsesId },
      ],
    });
    setHargaOptions((prev) => ({ ...prev, [newIndex]: [] }));
    setShowHargaBaru((prev) => ({ ...prev, [newIndex]: false }));
  };

  const removeDetailRow = (index) => {
    const updated = [...form.details];
    updated.splice(index, 1);
    setForm({ ...form, details: updated });
    const newHargaOptions = { ...hargaOptions };
    const newShowHargaBaru = { ...showHargaBaru };
    delete newHargaOptions[index];
    delete newShowHargaBaru[index];
    setHargaOptions(newHargaOptions);
    setShowHargaBaru(newShowHargaBaru);
  };

  const handleDetailChange = (index, field, value) => {
    const updated = [...form.details];
    updated[index][field] = value;
    setForm({ ...form, details: updated });
    if (field === "product_id") {
      fetchHargaByProduct(value, index, form.customer_id || null);
      updated[index].harga_product_id = "";
      updated[index].harga_baru = {
        harga: "",
        tanggal_berlaku: "",
        keterangan: "",
      };
      setForm({ ...form, details: updated });
    }
  };

  const handleHargaBaruChange = (index, field, value) => {
    const updated = [...form.details];
    updated[index].harga_baru[field] = value;
    setForm({ ...form, details: updated });
  };

  const handleHargaSelection = (index, value) => {
    const updated = [...form.details];
    if (value === "tambah_harga_khusus") {
      updated[index].harga_product_id = "";
      setShowHargaBaru((prev) => ({ ...prev, [index]: true }));
    } else {
      updated[index].harga_product_id = value;
      updated[index].harga_baru = {
        harga: "",
        tanggal_berlaku: "",
        keterangan: "",
      };
      setShowHargaBaru((prev) => ({ ...prev, [index]: false }));
    }
    setForm({ ...form, details: updated });
  };

  const resetForm = (data = null) => {
    if (data) {
      const isCustomerBaru = !customers.some((c) => c.id == data.customer_id);
      const customerBaru = isCustomerBaru
        ? {
            name: data.customer?.name || "",
            phone: data.customer?.phone || "",
            email: data.customer?.email || "",
          }
        : { name: "", phone: "", email: "" };

      const details = (data.details || [])
        .filter((d) => d.status_transaksi_id === statusProsesId)
        .map((d) => ({
          id: d.id || "",
          product_id: d.product_id || "",
          harga_product_id: d.harga_product_id || "",
          harga_baru: d.harga_baru || {
            harga: "",
            tanggal_berlaku: "",
            keterangan: "",
          },
          qty: d.qty || "",
          status_transaksi_id: d.status_transaksi_id,
          discount: d.discount || 0,
          catatan: d.catatan || "",
        }));

      const hargaOpts = {};
      const showHarga = {};
      details.forEach((d, idx) => {
        if (d.harga_baru.harga) {
          showHarga[idx] = true;
        } else {
          showHarga[idx] = false;
          fetchHargaByProduct(d.product_id, idx, data.customer_id);
        }
      });

      setForm({
        customer_id: isCustomerBaru ? "" : data.customer_id,
        customer_baru: customerBaru,
        tanggal: data.tanggal || "",
        details,
      });
      setIsCreatingNewCustomer(isCustomerBaru);
      setHargaOptions(hargaOpts);
      setShowHargaBaru(showHarga);
      setEditingId(data.id);
    } else {
      setForm({
        customer_id: "",
        customer_baru: { name: "", phone: "", email: "" },
        details: [{ ...initialDetail, status_transaksi_id: statusProsesId }],
      });
      setIsCreatingNewCustomer(false);
      setHargaOptions({});
      setShowHargaBaru({});
      setEditingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.customer_id && !form.customer_baru.name.trim()) {
      Swal.fire(
        "Error",
        "Nama customer wajib diisi jika membuat customer baru",
        "warning",
      );
      return;
    }

    if (!form.tanggal) {
      Swal.fire("Error", "Tanggal transaksi wajib diisi", "warning");
      return;
    }

    const hasEmpty = form.details.some(
      (d) => !d.product_id || !d.qty || d.qty <= 0,
    );

    const cleanedDetails = form.details.map((detail) => {
      const cleaned = { ...detail };
      if (!editingId) {
        cleaned.status_transaksi_id = statusProsesId;
      } else {
        if (!cleaned.id) {
          cleaned.status_transaksi_id = statusProsesId;
        }
      }
      if (detail.harga_product_id) {
        delete cleaned.harga_baru;
      } else if (detail.harga_baru.harga) {
        cleaned.harga_baru.harga = unformatRupiah(detail.harga_baru.harga);
      }
      return cleaned;
    });

    const payload = { ...form, details: cleanedDetails };

    try {
      if (editingId) {
        await api.put(`/transaksi/${editingId}`, payload);
        Swal.fire("Berhasil!", "Transaksi berhasil diperbarui", "success");
      } else {
        await api.post("/transaksi", payload);
        Swal.fire("Berhasil!", "Transaksi berhasil dibuat", "success");
      }

      resetForm();
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      if (error.response?.status === 422) {
        const msg = Object.values(error.response.data.errors)
          .flat()
          .join("<br>");
        Swal.fire({ title: "Validasi Gagal", html: msg, icon: "warning" });
      } else {
        Swal.fire("Error", "Terjadi kesalahan pada server", "error");
      }
    }
  };

  const handleSelesaiDetail = async (detailId) => {
    const allDetails = transaksi.flatMap((t) => t.details);
    const detail = allDetails.find((d) => d.id == detailId);
    if (!detail) return;

    const sisa =
      safeParseFloat(detail.subtotal) -
      (detail.pembayarans?.reduce(
        (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
        0,
      ) || 0);
    if (sisa > 0) {
      Swal.fire(
        "Peringatan",
        "Selesaikan pembayaran terlebih dahulu!",
        "warning",
      );
      return;
    }

    const confirm = await Swal.fire({
      title: "Selesaikan Detail Ini?",
      text: "Status akan diubah menjadi 'Selesai' dan detail ini pindah ke riwayat.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Selesaikan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#10b981",
    });

    if (confirm.isConfirmed) {
      try {
        await api.patch(`/transaksi-detail/${detailId}/status`, {
          status_transaksi_id: statusSelesaiId,
        });
        Swal.fire("Berhasil!", "Detail transaksi diselesaikan", "success");
        fetchData();
      } catch (error) {
        Swal.fire("Error", "Gagal menyelesaikan detail", "error");
      }
    }
  };

  const handleCancelDetail = async (detailId) => {
    const confirm = await Swal.fire({
      title: "Batalkan Detail Ini?",
      text: "Stok akan dikembalikan dan detail ini dibatalkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Batalkan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#d33",
    });
    if (confirm.isConfirmed) {
      try {
        await api.post(`/transaksi-detail/${detailId}/cancel`);
        Swal.fire("Berhasil", "Detail transaksi dibatalkan", "success");
        fetchData();
      } catch (err) {
        Swal.fire("Error", "Gagal membatalkan detail", "error");
      }
    }
  };

  const handleEditTransaksi = (transaksiItem) => {
    resetForm(transaksiItem);
    setIsModalOpen(true);
  };

  const formatTanggal = (tgl) => {
    if (!tgl) return "-";
    return new Date(tgl).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getSisaBayar = (detail) => {
    if (!detail) return 0;
    const subtotal = safeParseFloat(detail.subtotal);
    const pembayarans = Array.isArray(detail.pembayarans)
      ? detail.pembayarans
      : [];
    const totalBayar = pembayarans.reduce(
      (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
      0,
    );
    return subtotal - totalBayar;
  };

  const getTotalBayar = (detail) => {
    if (!detail) return 0;
    const pembayarans = Array.isArray(detail.pembayarans)
      ? detail.pembayarans
      : [];
    return pembayarans.reduce(
      (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
      0,
    );
  };

  const handleBayar = (detailId) => {
    const allDetails = transaksi.flatMap((t) => t.details);
    const detail = allDetails.find((d) => d.id === detailId);
    if (!detail) return;

    const sisa = getSisaBayar(detail);
    Swal.fire({
      title: "Input Pembayaran",
      html: `
        <p>Tagihan: Rp ${formatRupiah(detail.subtotal)}</p>
        <p>Sisa: Rp ${formatRupiah(sisa)}</p>
        <input type="text" id="jumlahBayar" class="swal2-input" placeholder="Jumlah bayar" value="">
        <input type="date" id="tanggalBayar" class="swal2-input">
      `,
      preConfirm: () => {
        const jumlah = unformatRupiah(
          Swal.getPopup().querySelector("#jumlahBayar").value,
        );
        const tanggal = Swal.getPopup().querySelector("#tanggalBayar").value;
        if (!jumlah || jumlah <= 0) {
          Swal.showValidationMessage("Jumlah bayar harus lebih dari 0");
        } else if (jumlah > sisa) {
          Swal.showValidationMessage(
            "Jumlah bayar tidak boleh melebihi sisa tagihan",
          );
        } else if (!tanggal) {
          Swal.showValidationMessage("Tanggal bayar wajib diisi");
        } else {
          return { jumlah, tanggal };
        }
      },
      didOpen: () => {
        const today = new Date().toISOString().split("T")[0];
        const tanggalInput = Swal.getPopup().querySelector("#tanggalBayar");
        const jumlahInput = Swal.getPopup().querySelector("#jumlahBayar");

        if (tanggalInput) {
          tanggalInput.value = today;
        }

        if (jumlahInput) {
          jumlahInput.value = formatRupiah(sisa);
          jumlahInput.addEventListener("input", (e) => {
            let value = e.target.value;
            let clean = value.replace(/\D/g, "");
            e.target.value =
              clean === "" ? "" : new Intl.NumberFormat("id-ID").format(clean);
          });
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        api
          .post("/pembayaran", {
            transaksi_detail_id: detailId,
            jumlah_bayar: result.value.jumlah,
            tanggal_bayar: result.value.tanggal,
          })
          .then(() => {
            Swal.fire("Berhasil!", "Pembayaran telah dicatat", "success");
            fetchData();
          })
          .catch((err) => {
            Swal.fire("Error", "Gagal menyimpan pembayaran", "error");
          });
      }
    });
  };

  const formatProductName = (p) => {
    if (!p) return "-";
    return [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran]
      .filter(Boolean)
      .join(" ");
  };

  const getStokToko = (product) => {
    if (!product || !product.inventories) return 0;
    const tokoInventory = product.inventories.find(
      (inv) => inv.place && inv.place.kode === "TOKO",
    );
    return tokoInventory ? tokoInventory.qty : 0;
  };

  const calculateActiveTotal = (details, statusProsesId) => {
    return details
      .filter((d) => d.status_transaksi_id === statusProsesId)
      .reduce((sum, d) => sum + safeParseFloat(d.subtotal), 0);
  };

  return (
    <>
      <div className="space-y-8">
        {loading ? (
          <p className="text-center py-8 text-gray-600">Memuat data...</p>
        ) : transaksi.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            Tidak ada transaksi harian dengan status proses.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {transaksi
              .map((item) => {
                const activeDetails = getActiveDetails(item.details);
                if (activeDetails.length === 0) return null;
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-white rounded-xl shadow border border-gray-100 space-y-3"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono text-gray-600">
                        {getInvoiceNumber(item)}
                      </span>
                      <button
                        onClick={() => onPrintClick(item)}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Receipt size={12} /> Print
                      </button>
                    </div>

                    <div className="flex justify-center items-start">
                      <div>
                        <p className="text-gray-700 font-medium text-center text-sm">
                          {item.customer?.name || "Umum"} –{" "}
                          {formatTanggal(item.tanggal)}
                        </p>
                        <p className="text-gray-700 font-bold text-center text-base mt-1">
                          Rp{" "}
                          {formatRupiah(
                            calculateActiveTotal(item.details, statusProsesId),
                          )}
                        </p>
                      </div>
                    </div>
                    <hr className="my-2 border-gray-200" />
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {activeDetails.map((d) => {
                        const sisaBayar = getSisaBayar(d);
                        const isLunas = sisaBayar <= 0;
                        const totalBayar = getTotalBayar(d);
                        return (
                          <div
                            key={d.id}
                            className="p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-xs text-center"
                          >
                            <p className="font-medium">
                              {formatProductName(d.product)}
                            </p>
                            <p className="mt-1">
                              <span className="font-semibold">Qty</span> {d.qty}
                            </p>
                            <p className="mt-1">
                              <span className="font-semibold">
                                Harga Satuan
                              </span>{" "}
                              Rp {formatRupiah(d.harga)}
                            </p>
                            <p className="mt-1">
                              <span className="font-semibold">Diskon</span> Rp{" "}
                              {formatRupiah(d.discount)}
                            </p>
                            <p className="mt-1">
                              <span className="font-semibold">Tagihan</span> Rp{" "}
                              {formatRupiah(d.subtotal)}
                            </p>

                            {d.catatan && (
                              <p className="mt-1 italic">{d.catatan}</p>
                            )}

                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="mt-1">
                                <p className="text-xs">
                                  <span
                                    className={`font-semibold ${
                                      isLunas
                                        ? "text-green-600"
                                        : "text-orange-600"
                                    }`}
                                  >
                                    {isLunas
                                      ? "✅ Lunas"
                                      : `⏳ Belum lunas (Sisa: Rp ${formatRupiah(
                                          sisaBayar,
                                        )})`}
                                  </span>
                                </p>
                              </div>

                              <p className="text-[10px] text-gray-600 mt-1">
                                Dibayar: Rp {formatRupiah(totalBayar)} dari Rp{" "}
                                {formatRupiah(d.subtotal)}
                              </p>

                              {d.pembayarans && d.pembayarans.length > 0 && (
                                <div className="mt-1 text-[10px]">
                                  <p className="font-medium flex items-center justify-center gap-1">
                                    <Receipt size={10} /> Riwayat:
                                  </p>
                                  <ul className="list-disc list-inside space-y-0.5 mt-0.5">
                                    {d.pembayarans.map((p) => (
                                      <li key={p.id} className="text-gray-700">
                                        Rp {formatRupiah(p.jumlah_bayar)} -{" "}
                                        {formatTanggal(p.tanggal_bayar)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {!isLunas && (
                                <button
                                  onClick={() => handleBayar(d.id)}
                                  className="mt-2 w-full flex items-center justify-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] hover:bg-green-200"
                                >
                                  <Wallet size={12} /> Bayar
                                </button>
                              )}

                              <div className="flex gap-1 mt-2">
                                <button
                                  onClick={() => handleSelesaiDetail(d.id)}
                                  className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white text-[10px] px-1 py-1 rounded hover:bg-green-700"
                                >
                                  <CheckCircle size={12} /> Selesai
                                </button>
                                {role === "admin" && (
                                  <button
                                    onClick={() => handleCancelDetail(d.id)}
                                    className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white text-[10px] px-1 py-1 rounded hover:bg-red-700"
                                  >
                                    <XCircle size={12} /> Batal
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-center mt-2">
                      {role === "admin" && (
                        <button
                          onClick={() => handleEditTransaksi(item)}
                          className="w-full flex items-center justify-center gap-1 bg-yellow-600 text-white text-[10px] px-2 py-1 rounded hover:bg-yellow-700"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
              .filter(Boolean)}
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

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-4xl p-6 rounded-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingId ? "Edit Transaksi" : "Tambah Transaksi"}
                </h2>
                <button
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer */}
                    <div>
                      <label className="font-semibold block mb-2">
                        Customer
                      </label>
                      <select
                        className="w-full border px-3 py-2 rounded-lg"
                        value={
                          form.customer_id ||
                          (isCreatingNewCustomer ? "new" : "")
                        }
                        onChange={(e) => {
                          const selectedValue = e.target.value;
                          if (selectedValue === "new") {
                            setIsCreatingNewCustomer(true);
                            setForm({
                              ...form,
                              customer_id: "",
                              customer_baru: { name: "", phone: "", email: "" },
                            });
                          } else {
                            setIsCreatingNewCustomer(false);
                            setForm({
                              ...form,
                              customer_id: selectedValue,
                              customer_baru: { name: "", phone: "", email: "" },
                            });
                          }
                        }}
                      >
                        <option value="">Pilih Customer</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                        <option value="new">➕ Buat Customer Baru</option>
                      </select>

                      {isCreatingNewCustomer && (
                        <div className="grid grid-cols-1 gap-2 mt-3">
                          <input
                            type="text"
                            placeholder="Nama *"
                            className="border px-3 py-2 rounded-lg"
                            value={form.customer_baru.name}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                customer_baru: {
                                  ...form.customer_baru,
                                  name: e.target.value,
                                },
                              })
                            }
                            required
                          />
                          <input
                            type="text"
                            placeholder="Phone"
                            className="border px-3 py-2 rounded-lg"
                            value={form.customer_baru.phone}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                customer_baru: {
                                  ...form.customer_baru,
                                  phone: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            type="email"
                            placeholder="Email"
                            className="border px-3 py-2 rounded-lg"
                            value={form.customer_baru.email}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                customer_baru: {
                                  ...form.customer_baru,
                                  email: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      )}
                    </div>

                    {/* Tanggal Transaksi */}
                    <div>
                      <label className="font-semibold block mb-2">
                        Tanggal Transaksi *
                      </label>
                      <input
                        type="date"
                        className="w-full border px-3 py-2 rounded-lg"
                        value={form.tanggal}
                        onChange={(e) =>
                          setForm({ ...form, tanggal: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-center items-center">
                    <h3 className="font-bold text-lg">Detail Transaksi</h3>
                  </div>
                  {form.details.map((d, i) => (
                    <div
                      key={i}
                      className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-4"
                    >
                      <div>
                        <label className="block mb-1 font-medium">
                          Produk *
                        </label>
                        <select
                          className="w-full border px-3 py-2 rounded-lg"
                          value={d.product_id}
                          onChange={(e) =>
                            handleDetailChange(i, "product_id", e.target.value)
                          }
                          required
                        >
                          <option value="">Pilih Produk</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.kode} - {formatProductName(p)} (Stok:{" "}
                              {getStokToko(p)})
                            </option>
                          ))}
                        </select>
                      </div>

                      {d.product_id && (
                        <div className="mt-3">
                          <label className="block mb-1 font-medium">
                            Pilih Harga
                          </label>
                          <select
                            className="w-full border px-3 py-2 rounded-lg"
                            value={
                              d.harga_product_id ||
                              (showHargaBaru[i] ? "tambah_harga_khusus" : "")
                            }
                            onChange={(e) =>
                              handleHargaSelection(i, e.target.value)
                            }
                          >
                            <option value="">-- Pilih --</option>
                            <optgroup label="Harga Umum">
                              {(hargaOptions[i] || [])
                                .filter((h) => !h.customer_id)
                                .map((h) => (
                                  <option key={`umum-${h.id}`} value={h.id}>
                                    Rp {formatRupiah(h.harga)} -{" "}
                                    {h.keterangan || "Tanpa keterangan"} (
                                    {formatTanggal(h.tanggal_berlaku)})
                                  </option>
                                ))}
                            </optgroup>
                            <optgroup label="Harga Khusus Customer">
                              {(hargaOptions[i] || [])
                                .filter((h) => h.customer_id)
                                .map((h) => (
                                  <option key={`khusus-${h.id}`} value={h.id}>
                                    Rp {formatRupiah(h.harga)} - {h.keterangan}{" "}
                                    ({formatTanggal(h.tanggal_berlaku)})
                                  </option>
                                ))}
                            </optgroup>
                            <option value="tambah_harga_khusus">
                              + Tambah Harga Khusus Customer
                            </option>
                          </select>

                          {showHargaBaru[i] && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <label className="block mb-2 font-medium text-blue-800">
                                Harga Khusus Customer Baru
                              </label>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="Harga Baru (Rp)"
                                  className="border px-3 h-11 rounded-lg w-full"
                                  value={
                                    d.harga_baru.harga
                                      ? formatRupiah(d.harga_baru.harga)
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const raw = unformatRupiah(e.target.value);
                                    handleHargaBaruChange(i, "harga", raw);
                                  }}
                                />

                                <input
                                  type="text"
                                  placeholder="Keterangan Harga"
                                  className="border px-3 h-11 rounded-lg w-full"
                                  value={d.harga_baru.keterangan}
                                  onChange={(e) =>
                                    handleHargaBaruChange(
                                      i,
                                      "keterangan",
                                      e.target.value,
                                    )
                                  }
                                />

                                <input
                                  type="date"
                                  className="border px-3 h-11 rounded-lg w-full"
                                  value={d.harga_baru.tanggal_berlaku}
                                  onChange={(e) =>
                                    handleHargaBaruChange(
                                      i,
                                      "tanggal_berlaku",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <input
                          type="number"
                          min="1"
                          max="9999"
                          placeholder="Qty *"
                          className="border px-3 py-3 rounded-lg w-full"
                          value={d.qty}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (
                              val === "" ||
                              (Number(val) >= 1 && Number(val) <= 9999)
                            ) {
                              handleDetailChange(i, "qty", val);
                            }
                          }}
                          required
                        />

                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Diskon (Rp)"
                          className="border px-3 py-3 rounded-lg w-full"
                          value={d.discount ? formatRupiah(d.discount) : ""}
                          onChange={(e) => {
                            let raw = unformatRupiah(e.target.value);
                            if (
                              raw === "" ||
                              (Number(raw) >= 0 && Number(raw) <= 999999)
                            ) {
                              handleDetailChange(i, "discount", raw);
                            }
                          }}
                        />

                        <input
                          type="text"
                          placeholder="Catatan (opsional)"
                          className="border px-3 py-3 rounded-lg w-full md:col-span-3 lg:col-span-2"
                          value={d.catatan}
                          onChange={(e) =>
                            handleDetailChange(i, "catatan", e.target.value)
                          }
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeDetailRow(i)}
                        className="w-full mt-2 bg-red-100 text-red-600 py-2 rounded-lg hover:bg-red-200 flex items-center justify-center gap-1"
                      >
                        <Trash2 size={16} /> Hapus Detail
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center items-center">
                  <button
                    type="button"
                    onClick={addDetailRow}
                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm"
                  >
                    + Tambah Detail
                  </button>
                </div>

                <div className="flex justify-center gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {editingId ? "Simpan Perubahan" : "Simpan Transaksi"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: "0",
          width: "210mm",
          padding: "20mm",
          boxSizing: "border-box",
        }}
      >
        <InvoiceSimplePrint ref={printRef} transaksi={printTransaksi} />
      </div>
    </>
  );
};

export default TransaksiPage;
