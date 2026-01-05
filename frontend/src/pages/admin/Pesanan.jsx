import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  Plus,
  Trash2,
  Wallet,
  Receipt,
  CheckCircle,
  XCircle,
  Pencil,
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
  const [statusSelesaiId, setStatusSelesaiId] = useState(null);
  const [statusDiPesanId, setStatusDiPesanId] = useState(null);
  const [jenisProducts, setJenisProducts] = useState([]);
  const [bahanProducts, setBahanProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [typeOptions, setTypeOptions] = useState({});
  const [showProductBaru, setShowProductBaru] = useState({});
  const [hargaOptions, setHargaOptions] = useState({});

  const initialDetail = {
    id: "",
    product_id: "",
    product_baru: {
      kode: "",
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
    details: [{ ...initialDetail }],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const pesananRes = await api.get("/pesanan/aktif");
      setPesanan(pesananRes.data || []);

      const customersRes = await api.get("/customers");
      setCustomers(customersRes.data.data || []);

      const productsRes = await api.get("/products/lowStok");
      setProducts(productsRes.data.data || []);

      const statusRes = await api.get("/status-transaksi");
      const statuses = statusRes.data.data || [];
      setStatusList(statuses);

      const selesai = statuses.find((s) => s.nama.toLowerCase().includes("selesai"));
      const dipesan = statuses.find((s) => s.nama.toLowerCase().includes("di pesan"));
      setStatusSelesaiId(selesai?.id || null);
      setStatusDiPesanId(dipesan?.id || null);

      const jenisRes = await api.get("/jenis");
      setJenisProducts(jenisRes.data.data || []);

      const bahanRes = await api.get("/bahan");
      setBahanProducts(bahanRes.data.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      Swal.fire("Error", "Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchTypeByJenis = async (jenisId, rowIndex) => {
    if (!jenisId || jenisId === "new") {
      setTypeOptions((prev) => ({ ...prev, [rowIndex]: [] }));
      return;
    }
    try {
      const res = await api.get(`/type/by-jenis/${jenisId}`);
      setTypeOptions((prev) => ({ ...prev, [rowIndex]: res.data.data || [] }));
    } catch (err) {
      console.error("Error fetching type:", err);
      Swal.fire("Error", "Gagal memuat tipe produk", "error");
      setTypeOptions((prev) => ({ ...prev, [rowIndex]: [] }));
    }
  };

  const fetchHargaByProduct = async (productId, rowIndex, customerId = null) => {
    if (!productId || productId === "new" || productId === "") {
      setHargaOptions((prev) => ({ ...prev, [rowIndex]: [] }));
      return;
    }
    try {
      const params = customerId ? `?customer_id=${customerId}` : "";
      const res = await api.get(`/harga/by-product/${productId}${params}`);
      setHargaOptions((prev) => ({ ...prev, [rowIndex]: res.data.data || [] }));
    } catch (err) {
      console.error("Error fetching harga:", err);
      Swal.fire("Error", "Gagal memuat harga produk", "error");
      setHargaOptions((prev) => ({ ...prev, [rowIndex]: [] }));
    }
  };

  const addDetailRow = () => {
    const newIndex = form.details.length;
    const newDetail = {
      ...initialDetail,
      status_transaksi_id: statusDiPesanId || "",
    };
    setForm({
      ...form,
      details: [...form.details, newDetail],
    });
    setHargaOptions((prev) => ({ ...prev, [newIndex]: [] }));
    setTypeOptions((prev) => ({ ...prev, [newIndex]: [] }));
    setShowProductBaru((prev) => ({ ...prev, [newIndex]: false }));
  };

  const removeDetailRow = (index) => {
    const updated = [...form.details];
    updated.splice(index, 1);
    setForm({ ...form, details: updated });

    // Clean up auxiliary states
    const newHarga = { ...hargaOptions };
    const newType = { ...typeOptions };
    const newShow = { ...showProductBaru };
    delete newHarga[index];
    delete newType[index];
    delete newShow[index];
    setHargaOptions(newHarga);
    setTypeOptions(newType);
    setShowProductBaru(newShow);
  };

  const handleDetailChange = (index, field, value) => {
    const updated = [...form.details];
    updated[index][field] = value;
    setForm({ ...form, details: updated });

    if (field === "product_id") {
      const isProductBaru = value === "new";
      setShowProductBaru((prev) => ({ ...prev, [index]: isProductBaru }));

      if (!isProductBaru && value) {
        fetchHargaByProduct(value, index, form.customer_id || null);
        updated[index].harga_product_id = "";
        updated[index].harga_baru = { harga: "", tanggal_berlaku: "", keterangan: "" };
      } else {
        updated[index].harga_product_id = "";
        updated[index].harga_baru = { harga: "", tanggal_berlaku: "", keterangan: "" };
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

  const resetForm = (data = null) => {
    if (data) {
      // Determine if customer is new
      const isCustomerBaru = !customers.some((c) => c.id == data.customer_id);

      // Map details
      const details = data.details.map((d) => {
        const isProductBaru = !d.product; // no product relation → assume new product
        let product_baru = {
          kode: "",
          jenis_id: "",
          jenis_nama: "",
          type_id: "",
          type_nama: "",
          bahan_id: "",
          bahan_nama: "",
          ukuran: "",
          keterangan: "",
        };

        if (isProductBaru && d.product_baru) {
          product_baru = {
            kode: d.product_baru.kode || "",
            jenis_id: d.product_baru.jenis_id || "",
            jenis_nama: d.product_baru.jenis_nama || "",
            type_id: d.product_baru.type_id || "",
            type_nama: d.product_baru.type_nama || "",
            bahan_id: d.product_baru.bahan_id || "",
            bahan_nama: d.product_baru.bahan_nama || "",
            ukuran: d.product_baru.ukuran || "",
            keterangan: d.product_baru.keterangan || "",
          };
        }

        return {
          id: d.id || "",
          product_id: isProductBaru ? "new" : d.product_id || "",
          product_baru,
          harga_product_id: d.harga_product_id || "",
          harga_baru: d.harga_baru || { harga: "", tanggal_berlaku: "", keterangan: "" },
          qty: d.qty || "",
          tanggal: d.tanggal || "",
          status_transaksi_id: d.status_transaksi_id || statusDiPesanId || "",
          discount: d.discount || 0,
          catatan: d.catatan || "",
        };
      });

      // Build showProductBaru map
      const newShowProductBaru = {};
      details.forEach((d, i) => {
        newShowProductBaru[i] = d.product_id === "new";
      });

      setForm({
        customer_id: isCustomerBaru ? "" : data.customer_id || "",
        customer_baru: isCustomerBaru
          ? {
              name: data.customer?.name || "",
              phone: data.customer?.phone || "",
              email: data.customer?.email || "",
            }
          : { name: "", phone: "", email: "" },
        details,
      });

      setShowProductBaru(newShowProductBaru);
      setHargaOptions({});
      setTypeOptions({});
      setEditingId(data.id);

      // Fetch harga & type AFTER state is set
      details.forEach((d, i) => {
        if (d.product_id !== "new" && d.product_id) {
          fetchHargaByProduct(d.product_id, i, data.customer_id || null);
        }
        if (d.product_baru.jenis_id && d.product_baru.jenis_id !== "new") {
          fetchTypeByJenis(d.product_baru.jenis_id, i);
        }
      });
    } else {
      // New mode
      setForm({
        customer_id: "",
        customer_baru: { name: "", phone: "", email: "" },
        details: [{ ...initialDetail, status_transaksi_id: statusDiPesanId || "" }],
      });
      setShowProductBaru({});
      setHargaOptions({});
      setTypeOptions({});
      setEditingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate customer
    if (!form.customer_id && !form.customer_baru.name.trim()) {
      Swal.fire("Error", "Nama customer wajib diisi jika membuat customer baru", "warning");
      return;
    }

    // Validate details
    const hasEmpty = form.details.some((d) => {
      if (d.product_id && d.product_id !== "new") {
        return !d.qty || !d.tanggal || d.qty <= 0;
      } else {
        const isJenisBaru = d.product_baru.jenis_id === "new";
        const isBahanBaru = d.product_baru.bahan_id === "new";
        const isTypeBaru = d.product_baru.type_id === "new";
        return (
          !d.product_baru.kode ||
          (!d.product_baru.jenis_id && !isJenisBaru) ||
          (isJenisBaru && !d.product_baru.jenis_nama) ||
          !d.product_baru.ukuran ||
          !d.tanggal ||
          d.qty <= 0 ||
          (!d.product_baru.bahan_id && !isBahanBaru) ||
          (isBahanBaru && !d.product_baru.bahan_nama) ||
          (!d.product_baru.type_id && !isTypeBaru) ||
          (isTypeBaru && !d.product_baru.type_nama)
        );
      }
    });

    if (hasEmpty) {
      Swal.fire("Error", "Lengkapi semua field wajib di detail pesanan", "warning");
      return;
    }

    // Clean and prepare payload
    const cleanedDetails = form.details.map((detail) => {
      const cleaned = { ...detail };

      // Clean discount
      cleaned.discount = Number(detail.discount) || 0;

      // Set status if new detail during edit
      if (editingId && !detail.id) {
        cleaned.status_transaksi_id = statusDiPesanId || "";
        cleaned.transaksi_id = editingId; // Ensure relation
      }

      // Product logic
      if (detail.product_id && detail.product_id !== "new") {
        delete cleaned.product_baru;
      } else {
        const isJenisBaru = detail.product_baru.jenis_id === "new";
        const isBahanBaru = detail.product_baru.bahan_id === "new";
        const isTypeBaru = detail.product_baru.type_id === "new";

        cleaned.product_baru.jenis_id = isJenisBaru ? null : detail.product_baru.jenis_id || null;
        cleaned.product_baru.jenis_nama = isJenisBaru ? detail.product_baru.jenis_nama || "" : undefined;
        cleaned.product_baru.bahan_id = isBahanBaru ? null : detail.product_baru.bahan_id || null;
        cleaned.product_baru.bahan_nama = isBahanBaru ? detail.product_baru.bahan_nama || "" : undefined;
        cleaned.product_baru.type_id = isTypeBaru ? null : detail.product_baru.type_id || null;
        cleaned.product_baru.type_nama = isTypeBaru ? detail.product_baru.type_nama || "" : undefined;
      }

      // Harga logic
      if (detail.harga_product_id && detail.harga_product_id !== "tambah_harga_khusus") {
        delete cleaned.harga_baru;
      } else if (detail.harga_baru.harga) {
        cleaned.harga_baru.harga = unformatRupiah(detail.harga_baru.harga);
      } else {
        delete cleaned.harga_baru;
      }

      // Remove empty id
      if (!cleaned.id) delete cleaned.id;

      return cleaned;
    });

    const payload = {
      customer_id: form.customer_id || null,
      ...(form.customer_id ? {} : { customer_baru: form.customer_baru }),
      details: cleanedDetails,
    };

    try {
      if (editingId) {
        await api.put(`/pesanan/${editingId}`, payload);
        Swal.fire("Berhasil!", "Pesanan berhasil diperbarui", "success");
      } else {
        await api.post("/pesanan", payload);
        Swal.fire("Berhasil!", "Pesanan berhasil dibuat", "success");
      }

      setIsModalOpen(false);
      fetchData();
      resetForm();
    } catch (error) {
      if (error.response?.status === 422) {
        const msg = Object.values(error.response.data.errors)
          .flat()
          .join("<br>");
        Swal.fire({ title: "Validasi Gagal", html: msg, icon: "warning" });
      } else {
        console.error("Submission error:", error);
        Swal.fire("Error", "Terjadi kesalahan pada server", "error");
      }
    }
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
    const pembayarans = Array.isArray(detail.pembayarans) ? detail.pembayarans : [];
    const totalBayar = pembayarans.reduce((sum, p) => sum + safeParseFloat(p.jumlah_bayar), 0);
    return subtotal - totalBayar;
  };

  const getTotalBayar = (detail) => {
    if (!detail) return 0;
    const pembayarans = Array.isArray(detail.pembayarans) ? detail.pembayarans : [];
    return pembayarans.reduce((sum, p) => sum + safeParseFloat(p.jumlah_bayar), 0);
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
        <input type="text" id="jumlahBayar" class="swal2-input" placeholder="Jumlah bayar" value="${formatRupiah(sisa)}">
        <input type="date" id="tanggalBayar" class="swal2-input">
      `,
      preConfirm: () => {
        const jumlah = unformatRupiah(Swal.getPopup().querySelector("#jumlahBayar").value);
        const tanggal = Swal.getPopup().querySelector("#tanggalBayar").value;
        if (!jumlah || jumlah <= 0) {
          Swal.showValidationMessage("Jumlah bayar harus lebih dari 0");
        } else if (jumlah > sisa) {
          Swal.showValidationMessage("Jumlah bayar tidak boleh melebihi sisa tagihan");
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
    if (!status) return { text: "–", bg: "bg-gray-100", textClass: "text-gray-800" };
    const map = {
      "Di pesan": { text: "Di Pesan", bg: "bg-blue-100", textClass: "text-blue-800" },
      "Di buat": { text: "Di Buat", bg: "bg-yellow-100", textClass: "text-yellow-800" },
      "Siap": { text: "Siap", bg: "bg-green-100", textClass: "text-green-800" },
      "Selesai": { text: "Selesai", bg: "bg-emerald-100", textClass: "text-emerald-800" },
    };
    return map[status.nama] || { text: status.nama, bg: "bg-gray-100", textClass: "text-gray-800" };
  };

  const handleChangeDetailStatus = async (detailId, currentStatusId) => {
    const allowedStatuses = statusList.filter((s) =>
      ["Di pesan", "Di buat", "Siap", "Selesai"].includes(s.nama)
    );
    const { value: statusId } = await Swal.fire({
      title: "Ubah Status Detail",
      input: "select",
      inputOptions: allowedStatuses.reduce((acc, status) => {
        acc[status.id] = status.nama;
        return acc;
      }, {}),
      inputPlaceholder: "Pilih status",
      inputValue: currentStatusId,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
    });

    if (statusId && statusId !== currentStatusId) {
      const selesaiStatus = statusList.find((s) => s.nama === "Selesai");
      if (selesaiStatus && statusId == selesaiStatus.id) {
        const detail = pesanan.flatMap((t) => t.details).find((d) => d.id == detailId);
        if (detail && getSisaBayar(detail) > 0) {
          Swal.fire("Peringatan", "Selesaikan pembayaran terlebih dahulu!", "warning");
          return;
        }
      }

      try {
        await api.patch(`/transaksi-detail/${detailId}/status`, {
          status_transaksi_id: statusId,
        });
        Swal.fire("Berhasil!", "Status detail diperbarui", "success");
        fetchData();
      } catch (error) {
        Swal.fire("Error", "Gagal mengubah status", "error");
      }
    }
  };

  const handleEditPesanan = (pesananItem) => {
    resetForm(pesananItem);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pesanan</h1>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-md hover:bg-purple-700 transition"
        >
          <Plus size={18} /> Tambah Pesanan
        </button>
      </div>

      {loading ? (
        <p className="text-center py-8 text-gray-600">Memuat data...</p>
      ) : pesanan.length === 0 ? (
        <p className="text-center py-8 text-gray-500">Tidak ada data pesanan.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pesanan.map((item) => (
            <div
              key={item.id}
              className="p-6 bg-white rounded-xl shadow border border-gray-100 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-700 font-medium">
                    Customer: {item.customer?.name || "Umum"}
                  </p>
                  <p className="text-gray-700 font-bold text-lg">
                    Total: Rp {formatRupiah(item.total)}
                  </p>
                </div>
                <button
                  onClick={() => handleEditPesanan(item)}
                  className="text-purple-600 hover:text-purple-800"
                  title="Edit Pesanan"
                >
                  <Pencil size={18} />
                </button>
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
                      <p>{formatProductName(d.product)}</p>
                      <p>
                        <span className="font-semibold">Qty:</span> {d.qty}
                      </p>
                      <p>
                        <span className="font-semibold">Harga Satuan:</span> Rp {formatRupiah(d.harga)}
                      </p>
                      <p>
                        <span className="font-semibold">Diskon:</span> Rp {formatRupiah(d.discount)}
                      </p>
                      <p>
                        <span className="font-semibold">Tagihan:</span> Rp {formatRupiah(d.subtotal)}
                      </p>
                      <p>
                        <span className="font-semibold">Tanggal:</span> {formatTanggal(d.tanggal)}
                      </p>
                      {d.catatan && <p>{d.catatan}</p>}

                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <p className="text-sm">
                            <span className="font-semibold">Status:</span>{" "}
                            <span className={`${status.textClass}`}>{status.text}</span>
                          </p>
                          <button
                            onClick={() => handleChangeDetailStatus(d.id, d.status_transaksi_id)}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            Ubah
                          </button>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-center">
                            <span
                              className={`font-semibold ${
                                isLunas ? "text-green-600" : "text-orange-600"
                              }`}
                            >
                              {isLunas
                                ? "✅ Lunas"
                                : `⏳ Belum lunas (Sisa: Rp ${formatRupiah(sisaBayar)})`}
                            </span>
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 text-center">
                          Sudah dibayar: Rp {formatRupiah(totalBayar)} dari Rp {formatRupiah(d.subtotal)}
                        </p>

                        {d.pembayarans?.length > 0 && (
                          <div className="mt-2 text-xs text-center">
                            <p className="font-medium flex items-center justify-center gap-1">
                              <Receipt size={12} /> Riwayat Pembayaran:
                            </p>
                            <ul className="list-disc list-inside space-y-1 mt-1 inline-block text-left">
                              {d.pembayarans.map((p) => (
                                <li key={p.id} className="text-gray-700">
                                  Rp {formatRupiah(p.jumlah_bayar)} - {formatTanggal(p.tanggal_bayar)}
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl p-6 rounded-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* CUSTOMER */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="font-semibold block mb-2">Customer *</label>
                <select
                  className="w-full border px-3 py-2 rounded-lg"
                  value={form.customer_id || (form.customer_baru.name ? "baru" : "")}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "baru") {
                      setForm({
                        ...form,
                        customer_id: "",
                        customer_baru: { name: "", phone: "", email: "" },
                      });
                    } else {
                      setForm({
                        ...form,
                        customer_id: val,
                        customer_baru: { name: "", phone: "", email: "" },
                      });
                      // Re-fetch harga for all existing product rows
                      form.details.forEach((d, i) => {
                        if (d.product_id && d.product_id !== "new") {
                          fetchHargaByProduct(d.product_id, i, val);
                        }
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
                  <option value="baru">➕ Buat Customer Baru</option>
                </select>

                {form.customer_id === "" && form.customer_baru.name && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <input
                      type="text"
                      placeholder="Nama *"
                      className="border px-3 py-2 rounded-lg"
                      value={form.customer_baru.name}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          customer_baru: { ...form.customer_baru, name: e.target.value },
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
                          customer_baru: { ...form.customer_baru, phone: e.target.value },
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
                          customer_baru: { ...form.customer_baru, email: e.target.value },
                        })
                      }
                    />
                  </div>
                )}
              </div>

              {/* DETAILS */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Detail Pesanan</h3>
                {form.details.map((d, i) => (
                  <div
                    key={i}
                    className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-4"
                  >
                    <div>
                      <label className="block mb-1 font-medium">Produk *</label>
                      <select
                        className="w-full border px-3 py-2 rounded-lg"
                        value={d.product_id || (showProductBaru[i] ? "new" : "")}
                        onChange={(e) => handleDetailChange(i, "product_id", e.target.value)}
                      >
                        <option value="">Pilih Produk</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {formatProductName(p)}
                          </option>
                        ))}
                        <option value="new">➕ Buat Product Baru</option>
                      </select>

                      {showProductBaru[i] && (
                        <div className="mt-4 space-y-4 p-4 bg-blue-50 rounded-lg">
                          <input
                            type="text"
                            placeholder="Kode Produk *"
                            className="w-full border px-3 py-2 rounded-lg"
                            value={d.product_baru.kode}
                            onChange={(e) => handleProductBaruChange(i, "kode", e.target.value)}
                            required
                          />
                          {/* Jenis */}
                          <div>
                            <label className="block text-sm font-medium mb-1">Jenis Produk *</label>
                            <select
                              className="w-full border px-3 py-2 rounded-lg"
                              value={d.product_baru.jenis_id || ""}
                              onChange={(e) => handleProductBaruChange(i, "jenis_id", e.target.value)}
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
                                className="w-full border px-3 py-2 rounded-lg mt-2"
                                value={d.product_baru.jenis_nama || ""}
                                onChange={(e) =>
                                  handleProductBaruChange(i, "jenis_nama", e.target.value)
                                }
                                required
                              />
                            )}
                          </div>
                          {/* Tipe */}
                          <div>
                            <label className="block text-sm font-medium mb-1">Tipe Produk</label>
                            {d.product_baru.jenis_id === "new" ? (
                              <input
                                type="text"
                                placeholder="Nama Tipe Baru"
                                className="w-full border px-3 py-2 rounded-lg"
                                value={d.product_baru.type_nama || ""}
                                onChange={(e) =>
                                  handleProductBaruChange(i, "type_nama", e.target.value)
                                }
                              />
                            ) : d.product_baru.jenis_id ? (
                              <>
                                <select
                                  className="w-full border px-3 py-2 rounded-lg"
                                  value={d.product_baru.type_id || ""}
                                  onChange={(e) =>
                                    handleProductBaruChange(i, "type_id", e.target.value)
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
                                    className="w-full border px-3 py-2 rounded-lg mt-2"
                                    value={d.product_baru.type_nama || ""}
                                    onChange={(e) =>
                                      handleProductBaruChange(i, "type_nama", e.target.value)
                                    }
                                  />
                                )}
                              </>
                            ) : (
                              <p className="text-sm text-gray-500 italic">Pilih Jenis terlebih dahulu</p>
                            )}
                          </div>
                          {/* Bahan */}
                          <div>
                            <label className="block text-sm font-medium mb-1">Bahan Produk</label>
                            <select
                              className="w-full border px-3 py-2 rounded-lg"
                              value={d.product_baru.bahan_id || ""}
                              onChange={(e) =>
                                handleProductBaruChange(i, "bahan_id", e.target.value)
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
                                className="w-full border px-3 py-2 rounded-lg mt-2"
                                value={d.product_baru.bahan_nama || ""}
                                onChange={(e) =>
                                  handleProductBaruChange(i, "bahan_nama", e.target.value)
                                }
                              />
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Ukuran *"
                              className="border px-3 py-2 rounded-lg"
                              value={d.product_baru.ukuran}
                              onChange={(e) => handleProductBaruChange(i, "ukuran", e.target.value)}
                              required
                            />
                            <input
                              type="text"
                              placeholder="Keterangan"
                              className="border px-3 py-2 rounded-lg"
                              value={d.product_baru.keterangan}
                              onChange={(e) =>
                                handleProductBaruChange(i, "keterangan", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      )}

                      {/* HARGA - Existing Product */}
                      {d.product_id && d.product_id !== "new" && (
                        <div className="mt-4">
                          <label className="block mb-1 font-medium">Pilih Harga</label>
                          <select
                            className="w-full border px-3 py-2 rounded-lg"
                            value={d.harga_product_id || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              const updated = [...form.details];
                              updated[i].harga_product_id = value;
                              updated[i].harga_baru = {
                                harga: "",
                                tanggal_berlaku: "",
                                keterangan: "",
                              };
                              setForm({ ...form, details: updated });
                            }}
                          >
                            <option value="">-- Pilih --</option>
                            <optgroup label="Harga Umum">
                              {(hargaOptions[i] || [])
                                .filter((h) => !h.customer_id)
                                .map((h) => (
                                  <option key={`umum-${h.id}`} value={h.id}>
                                    Rp {formatRupiah(h.harga)} - {h.keterangan || "Tanpa keterangan"} (
                                    {formatTanggal(h.tanggal_berlaku)})
                                  </option>
                                ))}
                            </optgroup>
                            <optgroup label="Harga Khusus Customer">
                              {(hargaOptions[i] || [])
                                .filter((h) => h.customer_id)
                                .map((h) => (
                                  <option key={`khusus-${h.id}`} value={h.id}>
                                    Rp {formatRupiah(h.harga)} - {h.keterangan} (
                                    {formatTanggal(h.tanggal_berlaku)})
                                  </option>
                                ))}
                            </optgroup>
                            <option value="tambah_harga_khusus">+ Tambah Harga Khusus Customer</option>
                          </select>

                          {d.harga_product_id === "tambah_harga_khusus" && (
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
                                  value={d.harga_baru.harga ? formatRupiah(d.harga_baru.harga) : ""}
                                  onChange={(e) => {
                                    const raw = unformatRupiah(e.target.value);
                                    const updated = [...form.details];
                                    updated[i].harga_baru.harga = raw;
                                    setForm({ ...form, details: updated });
                                  }}
                                />
                                <input
                                  type="text"
                                  placeholder="Keterangan Harga"
                                  className="border px-3 py-2 rounded-lg"
                                  value={d.harga_baru.keterangan}
                                  onChange={(e) => {
                                    const updated = [...form.details];
                                    updated[i].harga_baru.keterangan = e.target.value;
                                    setForm({ ...form, details: updated });
                                  }}
                                />
                                <input
                                  type="date"
                                  className="border px-3 py-2 rounded-lg"
                                  value={d.harga_baru.tanggal_berlaku}
                                  onChange={(e) => {
                                    const updated = [...form.details];
                                    updated[i].harga_baru.tanggal_berlaku = e.target.value;
                                    setForm({ ...form, details: updated });
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* HARGA - New Product */}
                      {showProductBaru[i] && (
                        <div className="mt-4">
                          <label className="block mb-2 font-medium">Atau Tambahkan Harga Baru</label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="Harga Baru (Rp)"
                              className="border px-3 py-2 rounded-lg"
                              value={d.harga_baru.harga ? formatRupiah(d.harga_baru.harga) : ""}
                              onChange={(e) => {
                                const raw = unformatRupiah(e.target.value);
                                const updated = [...form.details];
                                updated[i].harga_baru.harga = raw;
                                setForm({ ...form, details: updated });
                              }}
                            />
                            <input
                              type="text"
                              placeholder="Keterangan Harga"
                              className="border px-3 py-2 rounded-lg"
                              value={d.harga_baru.keterangan}
                              onChange={(e) => {
                                const updated = [...form.details];
                                updated[i].harga_baru.keterangan = e.target.value;
                                setForm({ ...form, details: updated });
                              }}
                            />
                            <input
                              type="date"
                              className="border px-3 py-2 rounded-lg"
                              value={d.harga_baru.tanggal_berlaku}
                              onChange={(e) => {
                                const updated = [...form.details];
                                updated[i].harga_baru.tanggal_berlaku = e.target.value;
                                setForm({ ...form, details: updated });
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                      <input
                        type="date"
                        className="border px-3 py-2 rounded-lg"
                        value={d.tanggal}
                        onChange={(e) => handleDetailChange(i, "tanggal", e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty *"
                        className="border px-3 py-2 rounded-lg"
                        value={d.qty}
                        onChange={(e) => handleDetailChange(i, "qty", e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Diskon (Rp)"
                        className="border px-3 py-2 rounded-lg"
                        value={d.discount ? formatRupiah(d.discount) : ""}
                        onChange={(e) => {
                          const raw = unformatRupiah(e.target.value);
                          handleDetailChange(i, "discount", raw);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Catatan (opsional)"
                        className="border px-3 py-2 rounded-lg"
                        value={d.catatan}
                        onChange={(e) => handleDetailChange(i, "catatan", e.target.value)}
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

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={addDetailRow}
                    className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-1"
                  >
                    + Tambah Detail
                  </button>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
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