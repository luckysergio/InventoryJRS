import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  Plus,
  Trash2,
  Wallet,
  Receipt,
  XCircle,
  Pencil,
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

const PesananPage = () => {
  const [pesanan, setPesanan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [statusDiPesanId, setStatusDiPesanId] = useState(null);
  const [statusSelesaiId, setStatusSelesaiId] = useState(null);
  const [statusDibatalkanId, setStatusDibatalkanId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);

  const [jenisProducts, setJenisProducts] = useState([]);
  const [bahanProducts, setBahanProducts] = useState([]);
  const [typeOptions, setTypeOptions] = useState({});
  const [showProductBaru, setShowProductBaru] = useState({});
  const [hargaOptions, setHargaOptions] = useState({});
  const [showHargaBaru, setShowHargaBaru] = useState({});

  const initialDetail = {
    id: "",
    product_id: null,
    product_baru: {
      jenis_id: "",
      jenis_nama: "",
      type_id: "",
      type_nama: "",
      bahan_id: "",
      bahan_nama: "",
      ukuran: "",
      keterangan: "",
    },
    harga_product_id: "",
    harga_baru: { harga: "", tanggal_berlaku: "", keterangan: "" },
    qty: "",
    tanggal: "",
    status_transaksi_id: "",
    discount: 0,
    catatan: "",
  };

  const [form, setForm] = useState({
    customer_id: "",
    customer_baru: { name: "", phone: "", email: "" },
    details: [{ ...initialDetail, status_transaksi_id: "" }],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const pesananRes = await api.get("/pesanan/aktif");
      setPesanan(pesananRes.data || []);

      const customersRes = await api.get("/customers");
      setCustomers(customersRes.data.data || []);

      const productsRes = await api.get("/products");
      setProducts(productsRes.data.data || []);

      const statusRes = await api.get("/status-transaksi");
      const statuses = statusRes.data.data || [];
      setStatusList(statuses);

      const diPesan = statuses.find((s) => s.nama === "Di Pesan");
      const selesai = statuses.find((s) => s.nama === "Selesai");
      const dibatalkan = statuses.find((s) => s.nama === "Dibatalkan");
      setStatusDiPesanId(diPesan?.id || 1);
      setStatusSelesaiId(selesai?.id || 5);
      setStatusDibatalkanId(dibatalkan?.id || 6);

      const jenisRes = await api.get("/jenis");
      setJenisProducts(jenisRes.data.data || []);

      const bahanRes = await api.get("/bahan");
      setBahanProducts(bahanRes.data.data || []);
    } catch (err) {
      Swal.fire("Error", "Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchTypeByJenis = async (jenisId, rowIndex) => {
    if (!jenisId) {
      setTypeOptions((prev) => ({ ...prev, [rowIndex]: [] }));
      return;
    }
    try {
      const res = await api.get(`/type/by-jenis/${jenisId}`);
      setTypeOptions((prev) => ({ ...prev, [rowIndex]: res.data.data || [] }));
    } catch (err) {
      Swal.fire("Error", "Gagal memuat tipe produk", "error");
      setTypeOptions((prev) => ({ ...prev, [rowIndex]: [] }));
    }
  };

  const fetchHargaByProduct = async (
    productId,
    rowIndex,
    customerId = null
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
        { ...initialDetail, status_transaksi_id: statusDiPesanId },
      ],
    });
    setHargaOptions((prev) => ({ ...prev, [newIndex]: [] }));
    setShowHargaBaru((prev) => ({ ...prev, [newIndex]: false }));
    setShowProductBaru((prev) => ({ ...prev, [newIndex]: false }));
    setTypeOptions((prev) => ({ ...prev, [newIndex]: [] }));
  };

  const removeDetailRow = (index) => {
    const updated = [...form.details];
    updated.splice(index, 1);
    setForm({ ...form, details: updated });

    const newHargaOptions = { ...hargaOptions };
    const newShowHargaBaru = { ...showHargaBaru };
    const newShowProductBaru = { ...showProductBaru };
    const newTypeOptions = { ...typeOptions };
    delete newHargaOptions[index];
    delete newShowHargaBaru[index];
    delete newShowProductBaru[index];
    delete newTypeOptions[index];
    setHargaOptions(newHargaOptions);
    setShowHargaBaru(newShowHargaBaru);
    setShowProductBaru(newShowProductBaru);
    setTypeOptions(newTypeOptions);
  };

  const handleDetailChange = (index, field, value) => {
    const updated = [...form.details];
    updated[index][field] = value;
    setForm({ ...form, details: updated });

    if (field === "product_id") {
      const isProductBaru = value === "new";
      updated[index].product_id = isProductBaru ? null : value;
      setShowProductBaru((prev) => ({ ...prev, [index]: isProductBaru }));

      updated[index].harga_product_id = "";
      updated[index].harga_baru = {
        harga: "",
        tanggal_berlaku: "",
        keterangan: "",
      };

      if (isProductBaru) {
        setShowHargaBaru((prev) => ({ ...prev, [index]: true }));
        setHargaOptions((prev) => ({ ...prev, [index]: [] }));
      } else if (value) {
        fetchHargaByProduct(value, index, form.customer_id || null);
        setShowHargaBaru((prev) => ({ ...prev, [index]: false }));
      }

      setForm({ ...form, details: updated });
    }
  };

  const handleProductBaruChange = (index, field, value) => {
    const updated = [...form.details];
    updated[index].product_baru[field] = value;
    setForm({ ...form, details: updated });

    if (field === "jenis_id") {
      const isJenisBaru = value === "new";
      if (isJenisBaru) {
        updated[index].product_baru.type_id = "";
        updated[index].product_baru.type_nama = "";
        setTypeOptions((prev) => ({ ...prev, [index]: [] }));
      } else {
        fetchTypeByJenis(value, index);
        updated[index].product_baru.type_nama = "";
      }
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

      const details = (data.details || []).map((d) => {
        const isProductBaru = !d.product_id;

        return {
          id: d.id || "",
          product_id: isProductBaru ? null : d.product_id,
          product_baru: { ...initialDetail.product_baru },
          harga_product_id: d.harga_product_id || "",
          harga_baru: { harga: "", tanggal_berlaku: "", keterangan: "" },
          qty: d.qty || "",
          tanggal: d.tanggal || "",
          status_transaksi_id: d.status_transaksi_id || statusDiPesanId,
          discount: d.discount || 0,
          catatan: d.catatan || "",
        };
      });

      const showProductBaruMap = {};
      const showHargaBaruMap = {};
      const typeOptionsMap = {};
      const hargaOptionsMap = {};

      details.forEach((d, i) => {
        const isProductBaru = d.product_id === null;

        showProductBaruMap[i] = isProductBaru;
        showHargaBaruMap[i] = isProductBaru;

        if (!isProductBaru && d.product_id) {
          fetchHargaByProduct(d.product_id, i, data.customer_id || null);
        }
      });

      setForm({
        customer_id: isCustomerBaru ? "" : data.customer_id,
        customer_baru: customerBaru,
        details,
      });

      setIsCreatingNewCustomer(isCustomerBaru);
      setShowProductBaru(showProductBaruMap);
      setShowHargaBaru(showHargaBaruMap);
      setTypeOptions(typeOptionsMap);
      setEditingId(data.id);
    } else {
      /** CREATE MODE */
      setForm({
        customer_id: "",
        customer_baru: { name: "", phone: "", email: "" },
        details: [{ ...initialDetail, status_transaksi_id: statusDiPesanId }],
      });

      setIsCreatingNewCustomer(false);
      setShowProductBaru({});
      setShowHargaBaru({});
      setTypeOptions({});
      setHargaOptions({});
      setEditingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id && !form.customer_baru.name.trim()) {
      Swal.fire("Error", "Nama customer wajib diisi", "warning");
      return;
    }

    const cleanedDetails = form.details.map((detail) => {
      const isExistingProduct =
        detail.product_id !== null && detail.product_id !== "";
      return {
        ...(detail.id ? { id: detail.id } : {}),
        product_id: isExistingProduct ? Number(detail.product_id) : null,
        ...(isExistingProduct
          ? {}
          : {
              product_baru: {
                jenis_id:
                  detail.product_baru.jenis_id === "new"
                    ? null
                    : detail.product_baru.jenis_id
                    ? Number(detail.product_baru.jenis_id)
                    : null,

                jenis_nama:
                  detail.product_baru.jenis_id === "new"
                    ? detail.product_baru.jenis_nama
                    : undefined,

                type_id:
                  detail.product_baru.type_id &&
                  detail.product_baru.type_id !== "new"
                    ? Number(detail.product_baru.type_id)
                    : null,

                type_nama: detail.product_baru.type_nama
                  ? detail.product_baru.type_nama
                  : undefined,

                bahan_id:
                  detail.product_baru.bahan_id &&
                  detail.product_baru.bahan_id !== "new"
                    ? Number(detail.product_baru.bahan_id)
                    : null,

                bahan_nama: detail.product_baru.bahan_nama
                  ? detail.product_baru.bahan_nama
                  : undefined,

                ukuran: detail.product_baru.ukuran,
                keterangan: detail.product_baru.keterangan || "",
              },
            }),
        harga_product_id: detail.harga_product_id
          ? Number(detail.harga_product_id)
          : null,
        ...(detail.harga_product_id
          ? {}
          : detail.harga_baru?.harga
          ? {
              harga_baru: {
                harga: Number(detail.harga_baru.harga),
                keterangan: detail.harga_baru.keterangan || "",
                tanggal_berlaku: detail.harga_baru.tanggal_berlaku || null,
              },
            }
          : {}),
        qty: Number(detail.qty),
        tanggal: detail.tanggal,
        status_transaksi_id:
          Number(detail.status_transaksi_id) || Number(statusDiPesanId),
        discount: Number(detail.discount) || 0,
        catatan: detail.catatan || "",
      };
    });

    const payload = {
      customer_id: form.customer_id ? Number(form.customer_id) : null,
      ...(form.customer_id
        ? {}
        : {
            customer_baru: {
              name: form.customer_baru.name,
              phone: form.customer_baru.phone || "",
              email: form.customer_baru.email || "",
            },
          }),
      details: cleanedDetails,
    };

    try {
      if (editingId) {
        await api.put(`/pesanan/${editingId}`, payload);
        Swal.fire("Berhasil", "Pesanan diperbarui", "success");
      } else {
        await api.post("/pesanan", payload);
        Swal.fire("Berhasil", "Pesanan dibuat", "success");
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      if (error.response?.status === 422) {
        const msg = Object.values(error.response.data.errors)
          .flat()
          .join("<br>");
        Swal.fire({ title: "Validasi Gagal", html: msg, icon: "warning" });
      } else {
        Swal.fire("Error", "Terjadi kesalahan server", "error");
      }
    }
  };
  const transaksi = pesanan;

  const handleSelesaiDetail = async (detailId) => {
    const allDetails = transaksi.flatMap((t) => t.details);
    const detail = allDetails.find((d) => d.id == detailId);
    if (!detail) return;
    const sisa =
      safeParseFloat(detail.subtotal) -
      (detail.pembayarans?.reduce(
        (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
        0
      ) || 0);
    if (sisa > 0) {
      Swal.fire(
        "Peringatan",
        "Selesaikan pembayaran terlebih dahulu!",
        "warning"
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
        await api.patch(`/pesanan/${detailId}/selesai`, {
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
        await api.post(`/pesanan/${detailId}/cancel`);
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
      0
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
      0
    );
  };

  const formatProductName = (p) => {
    if (!p) return "Produk tidak ditemukan";
    return [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran]
      .filter(Boolean)
      .join(" ");
  };

  const handleBayar = (detailId) => {
    const allDetails = pesanan.flatMap((t) => t.details);
    const detail = allDetails.find((d) => d.id === detailId);
    if (!detail) return;
    const sisa = getSisaBayar(detail);
    Swal.fire({
      title: "Input Pembayaran",
      html: `
        <p>Tagihan: Rp ${formatRupiah(detail.subtotal)}</p>
        <p>Sisa: Rp ${formatRupiah(sisa)}</p>
        <input type="text" id="jumlahBayar" class="swal2-input" placeholder="Jumlah bayar" value="${formatRupiah(
          sisa
        )}">
        <input type="date" id="tanggalBayar" class="swal2-input">
      `,
      preConfirm: () => {
        const jumlah = unformatRupiah(
          Swal.getPopup().querySelector("#jumlahBayar").value
        );
        const tanggal = Swal.getPopup().querySelector("#tanggalBayar").value;
        if (!jumlah || jumlah <= 0) {
          Swal.showValidationMessage("Jumlah bayar harus lebih dari 0");
        } else if (jumlah > sisa) {
          Swal.showValidationMessage(
            "Jumlah bayar tidak boleh melebihi sisa tagihan"
          );
        } else if (!tanggal) {
          Swal.showValidationMessage("Tanggal bayar wajib diisi");
        } else {
          return { jumlah, tanggal };
        }
      },
      didOpen: () => {
        const today = new Date().toISOString().split("T")[0];
        Swal.getPopup().querySelector("#tanggalBayar").value = today;
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

  const getStatusInfo = (statusId) => {
    const status = statusList.find((s) => s.id === statusId);
    if (!status)
      return { text: "–", bg: "bg-gray-100", textClass: "text-gray-800" };
    const map = {
      "Di Pesan": {
        text: "Di Pesan",
        bg: "bg-blue-100",
        textClass: "text-blue-800",
      },
      "Di Buat": {
        text: "Di Buat",
        bg: "bg-yellow-100",
        textClass: "text-yellow-800",
      },
      Siap: { text: "Siap", bg: "bg-green-100", textClass: "text-green-800" },
      Selesai: {
        text: "Selesai",
        bg: "bg-emerald-100",
        textClass: "text-emerald-800",
      },
      Dibatalkan: {
        text: "Dibatalkan",
        bg: "bg-red-100",
        textClass: "text-red-800",
      },
    };
    return (
      map[status.nama] || {
        text: status.nama,
        bg: "bg-gray-100",
        textClass: "text-gray-800",
      }
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Pesanan</h1>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-all duration-200"
        >
          <Plus size={18} /> Tambah Pesanan
        </button>
      </div>
      {loading ? (
        <p className="text-center py-8 text-gray-600">Memuat data...</p>
      ) : pesanan.length === 0 ? (
        <p className="text-center py-8 text-gray-500">
          Tidak ada pesanan aktif.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pesanan.map((item) => {
            const isCompletedOrCancelled = item.details.every((d) =>
              [statusSelesaiId, statusDibatalkanId].includes(
                d.status_transaksi_id
              )
            );
            return (
              <div
                key={item.id}
                className="p-6 bg-white rounded-xl shadow-md border border-gray-200 space-y-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-center items-center">
                  <div>
                    <p className="text-gray-700 font-medium text-center">
                      {item.customer?.name || "Umum"}
                    </p>
                    <p className="text-gray-800 font-bold text-lg text-center">
                      Total: Rp {formatRupiah(item.total)}
                    </p>
                  </div>
                </div>
                <hr className="my-3 border-gray-200" />
                <div className="space-y-3">
                  {item.details.map((d) => {
                    const sisaBayar = getSisaBayar(d);
                    const isLunas = sisaBayar <= 0;
                    const totalBayar = getTotalBayar(d);
                    const status = getStatusInfo(d.status_transaksi_id);
                    return (
                      <div
                        key={d.id}
                        className="p-3 border border-gray-200 rounded-lg bg-gray-50 text-sm text-center"
                      >
                        <p className="font-medium">
                          {formatProductName(d.product)}
                        </p>
                        <p>Qty: {d.qty}</p>
                        <p>Harga Satuan: Rp {formatRupiah(d.harga)}</p>
                        <p>Diskon: Rp {formatRupiah(d.discount)}</p>
                        <p>Tagihan: Rp {formatRupiah(d.subtotal)}</p>
                        <p>Tanggal: {formatTanggal(d.tanggal)}</p>
                        {d.catatan && (
                          <p className="text-gray-600 italic">{d.catatan}</p>
                        )}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex justify-center items-center">
                            <p className="text-sm">
                              Status:{" "}
                              <span className={`${status.textClass}`}>
                                {status.text}
                              </span>
                            </p>
                          </div>
                          <p
                            className={`mt-2 font-semibold text-sm ${
                              isLunas ? "text-green-600" : "text-orange-600"
                            }`}
                          >
                            {isLunas
                              ? "✅ Lunas"
                              : `⏳ Belum lunas (Sisa: Rp ${formatRupiah(
                                  sisaBayar
                                )})`}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Sudah bayar: Rp {formatRupiah(totalBayar)}
                          </p>
                          {d.pembayarans && d.pembayarans.length > 0 && (
                            <div className="mt-2 text-xs">
                              <p className="font-medium flex items-center justify-center gap-1">
                                <Receipt size={12} /> Riwayat Pembayaran:
                              </p>
                              <ul className="list-disc list-inside space-y-1 mt-1 text-left inline-block">
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
                              className="mt-2 w-full flex items-center justify-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 text-xs"
                            >
                              <Wallet size={14} /> Bayar Sekarang
                            </button>
                          )}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleSelesaiDetail(d.id)}
                              className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white text-xs px-2 py-1.5 rounded-lg hover:bg-green-700"
                            >
                              <CheckCircle size={14} /> Selesai
                            </button>
                            <button
                              onClick={() => handleCancelDetail(d.id)}
                              className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white text-xs px-2 py-1.5 rounded-lg hover:bg-red-700"
                            >
                              <XCircle size={14} /> Batal
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-3 justify-center">
                  <button
                    onClick={() => handleEditTransaksi(item)}
                    className="flex-1 flex items-center justify-center gap-1 bg-yellow-600 text-white text-xs px-2 py-1.5 rounded-lg hover:bg-yellow-700"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingId ? "Edit Pesanan" : "Tambah Pesanan"}
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
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* CUSTOMER */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="font-semibold block mb-2 text-gray-700">
                  Customer *
                </label>
                <select
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={
                    form.customer_id || (isCreatingNewCustomer ? "new" : "")
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "new") {
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
                        customer_id: val,
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <input
                      type="text"
                      placeholder="Nama *"
                      className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                      className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                      className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
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

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg text-gray-800">
                    Detail Pesanan
                  </h3>
                  <button
                    type="button"
                    onClick={addDetailRow}
                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm hover:bg-green-700"
                  >
                    + Tambah Detail
                  </button>
                </div>
                {form.details.map((d, i) => (
                  <div
                    key={i}
                    className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-4"
                  >
                    <div>
                      <label className="block mb-1 font-medium text-gray-700">
                        Produk *
                      </label>
                      <select
                        value={d.product_id ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleDetailChange(
                            i,
                            "product_id",
                            val === "new" ? "new" : val
                          );
                        }}
                        className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Pilih Produk</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {formatProductName(p)}
                          </option>
                        ))}
                        <option value="new">➕ Produk Baru</option>
                      </select>

                      {showProductBaru[i] && (
                        <div className="mt-4 space-y-4 p-4 bg-blue-50 rounded-lg">
                          {/* Jenis */}
                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">
                              Jenis Produk *
                            </label>
                            <select
                              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                              value={d.product_baru.jenis_id || ""}
                              onChange={(e) =>
                                handleProductBaruChange(
                                  i,
                                  "jenis_id",
                                  e.target.value
                                )
                              }
                              required
                            >
                              <option value="">Pilih Jenis</option>
                              {jenisProducts.map((j) => (
                                <option key={j.id} value={j.id}>
                                  {j.nama}
                                </option>
                              ))}
                              <option value="new">➕ Buat Jenis Baru</option>
                            </select>
                            {d.product_baru.jenis_id === "new" && (
                              <input
                                type="text"
                                placeholder="Nama Jenis Baru *"
                                className="w-full border px-3 py-2 rounded-lg mt-2 focus:ring-2 focus:ring-blue-500"
                                value={d.product_baru.jenis_nama || ""}
                                onChange={(e) =>
                                  handleProductBaruChange(
                                    i,
                                    "jenis_nama",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">
                              Tipe Produk
                            </label>
                            {d.product_baru.jenis_id === "new" ? (
                              <input
                                type="text"
                                placeholder="Nama Tipe Baru"
                                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={d.product_baru.type_nama || ""}
                                onChange={(e) =>
                                  handleProductBaruChange(
                                    i,
                                    "type_nama",
                                    e.target.value
                                  )
                                }
                              />
                            ) : d.product_baru.jenis_id ? (
                              <>
                                <select
                                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  value={d.product_baru.type_id || ""}
                                  onChange={(e) =>
                                    handleProductBaruChange(
                                      i,
                                      "type_id",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="">Pilih Tipe</option>
                                  {(typeOptions[i] || []).map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.nama}
                                    </option>
                                  ))}
                                  <option value="new">➕ Buat Tipe Baru</option>
                                </select>
                                {d.product_baru.type_id === "new" && (
                                  <input
                                    type="text"
                                    placeholder="Nama Tipe Baru"
                                    className="w-full border px-3 py-2 rounded-lg mt-2 focus:ring-2 focus:ring-blue-500"
                                    value={d.product_baru.type_nama || ""}
                                    onChange={(e) =>
                                      handleProductBaruChange(
                                        i,
                                        "type_nama",
                                        e.target.value
                                      )
                                    }
                                  />
                                )}
                              </>
                            ) : (
                              <p className="text-sm text-gray-500 italic">
                                Pilih Jenis terlebih dahulu
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">
                              Bahan Produk
                            </label>
                            <select
                              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                              value={d.product_baru.bahan_id || ""}
                              onChange={(e) =>
                                handleProductBaruChange(
                                  i,
                                  "bahan_id",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Pilih Bahan</option>
                              {bahanProducts.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.nama}
                                </option>
                              ))}
                              <option value="new">➕ Buat Bahan Baru</option>
                            </select>
                            {d.product_baru.bahan_id === "new" && (
                              <input
                                type="text"
                                placeholder="Nama Bahan Baru"
                                className="w-full border px-3 py-2 rounded-lg mt-2 focus:ring-2 focus:ring-blue-500"
                                value={d.product_baru.bahan_nama || ""}
                                onChange={(e) =>
                                  handleProductBaruChange(
                                    i,
                                    "bahan_nama",
                                    e.target.value
                                  )
                                }
                              />
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Ukuran *"
                              className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                              value={d.product_baru.ukuran}
                              onChange={(e) =>
                                handleProductBaruChange(
                                  i,
                                  "ukuran",
                                  e.target.value
                                )
                              }
                              required
                            />
                            <input
                              type="text"
                              placeholder="Keterangan"
                              className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                              value={d.product_baru.keterangan}
                              onChange={(e) =>
                                handleProductBaruChange(
                                  i,
                                  "keterangan",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* HARGA */}
                    {(d.product_id || showProductBaru[i]) && (
                      <div className="mt-3">
                        <label className="block mb-1 font-medium">
                          Pilih Harga
                        </label>
                        {showProductBaru[i] ? (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <label className="block mb-2 font-medium text-blue-800">
                              Harga Khusus Customer Baru
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Harga Baru (Rp)"
                                className="border px-3 py-2 rounded-lg"
                                value={
                                  d.harga_baru.harga
                                    ? formatRupiah(d.harga_baru.harga)
                                    : ""
                                }
                                onChange={(e) => {
                                  const raw = unformatRupiah(e.target.value);
                                  handleHargaBaruChange(i, "harga", raw);
                                }}
                                required
                              />
                              <input
                                type="text"
                                placeholder="Keterangan Harga"
                                className="border px-3 py-2 rounded-lg"
                                value={d.harga_baru.keterangan}
                                onChange={(e) =>
                                  handleHargaBaruChange(
                                    i,
                                    "keterangan",
                                    e.target.value
                                  )
                                }
                              />
                              <input
                                type="date"
                                className="border px-3 py-2 rounded-lg"
                                value={d.harga_baru.tanggal_berlaku}
                                onChange={(e) =>
                                  handleHargaBaruChange(
                                    i,
                                    "tanggal_berlaku",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                        ) : (
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
                        )}

                        {!showProductBaru[i] && showHargaBaru[i] && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <label className="block mb-2 font-medium text-blue-800">
                              Harga Khusus Customer Baru
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Harga Baru (Rp)"
                                className="border px-3 py-2 rounded-lg"
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
                                className="border px-3 py-2 rounded-lg"
                                value={d.harga_baru.keterangan}
                                onChange={(e) =>
                                  handleHargaBaruChange(
                                    i,
                                    "keterangan",
                                    e.target.value
                                  )
                                }
                              />
                              <input
                                type="date"
                                className="border px-3 py-2 rounded-lg"
                                value={d.harga_baru.tanggal_berlaku}
                                onChange={(e) =>
                                  handleHargaBaruChange(
                                    i,
                                    "tanggal_berlaku",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                      <input
                        type="date"
                        className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={d.tanggal}
                        onChange={(e) =>
                          handleDetailChange(i, "tanggal", e.target.value)
                        }
                        required
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty *"
                        className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={d.qty}
                        onChange={(e) =>
                          handleDetailChange(i, "qty", e.target.value)
                        }
                        required
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Diskon (Rp)"
                        className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={d.discount ? formatRupiah(d.discount) : ""}
                        onChange={(e) => {
                          const raw = unformatRupiah(e.target.value);
                          handleDetailChange(i, "discount", raw);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Catatan (opsional)"
                        className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
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

              <div className="flex justify-center gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow transition"
                >
                  {editingId ? "Simpan Perubahan" : "Simpan Pesanan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PesananPage;
