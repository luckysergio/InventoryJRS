import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Trash2, Wallet, Receipt, Pencil } from "lucide-react";
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

const TransaksiPage = () => {
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [statusList, setStatusList] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialDetail = {
    id: "",
    product_id: "",
    harga_product_id: "",
    harga_baru: { harga: "", tanggal_berlaku: "", keterangan: "" },
    qty: "",
    tanggal: "",
    status_transaksi_id: "",
    discount: 0,
  };

  const [form, setForm] = useState({
    customer_id: "",
    customer_baru: { name: "", phone: "", email: "" },
    details: [initialDetail],
  });

  const [hargaOptions, setHargaOptions] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const transaksiRes = await api.get("/transaksi/aktif");
      setTransaksi(transaksiRes.data || []);

      const customersRes = await api.get("/customers");
      setCustomers(customersRes.data.data || []);

      const productsRes = await api.get("/products/available");
      setProducts(productsRes.data.data || []);

      const statusRes = await api.get("/status-transaksi");
      setStatusList(statusRes.data.data || []);
    } catch (err) {
      Swal.fire("Error", "Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchHargaByProduct = async (productId, rowIndex) => {
    if (!productId) {
      setHargaOptions((prev) => ({ ...prev, [rowIndex]: [] }));
      return;
    }
    try {
      const res = await api.get(`/harga/by-product/${productId}`);
      setHargaOptions((prev) => ({ ...prev, [rowIndex]: res.data.data || [] }));
    } catch (err) {
      Swal.fire("Error", "Gagal memuat harga produk", "error");
      setHargaOptions((prev) => ({ ...prev, [rowIndex]: [] }));
    }
  };

  const addDetailRow = () => {
    const newIndex = form.details.length;
    setForm({ ...form, details: [...form.details, { ...initialDetail }] });
    setHargaOptions((prev) => ({ ...prev, [newIndex]: [] }));
  };

  const removeDetailRow = (index) => {
    const updated = [...form.details];
    updated.splice(index, 1);
    setForm({ ...form, details: updated });
    const newHargaOptions = { ...hargaOptions };
    delete newHargaOptions[index];
    setHargaOptions(newHargaOptions);
  };

  const handleDetailChange = (index, field, value) => {
    const updated = [...form.details];
    updated[index][field] = value;
    setForm({ ...form, details: updated });
    if (field === "product_id") {
      fetchHargaByProduct(value, index);
      updated[index].harga_product_id = "";
      updated[index].harga_baru = { harga: "", tanggal_berlaku: "", keterangan: "" };
      setForm({ ...form, details: updated });
    }
  };

  const handleHargaBaruChange = (index, field, value) => {
    const updated = [...form.details];
    updated[index].harga_baru[field] = value;
    setForm({ ...form, details: updated });
  };

  const handleHargaLamaChange = (index, value) => {
    const updated = [...form.details];
    updated[index].harga_product_id = value;
    updated[index].harga_baru = { harga: "", tanggal_berlaku: "", keterangan: "" };
    setForm({ ...form, details: updated });
  };

  const resetForm = () => {
    setForm({
      customer_id: "",
      customer_baru: { name: "", phone: "", email: "" },
      details: [{ ...initialDetail }],
    });
    setHargaOptions({});
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.customer_id && !form.customer_baru.name.trim()) {
      Swal.fire("Error", "Nama customer wajib diisi jika membuat customer baru", "warning");
      return;
    }

    const hasEmpty = form.details.some(
      d => !d.product_id || !d.qty || !d.tanggal || !d.status_transaksi_id || d.qty <= 0
    );
    if (hasEmpty) {
      Swal.fire("Error", "Lengkapi semua field wajib di detail transaksi", "warning");
      return;
    }

    const cleanedDetails = form.details.map((detail) => {
      const cleaned = { ...detail };
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
        const msg = Object.values(error.response.data.errors).flat().join("<br>");
        Swal.fire({ title: "Validasi Gagal", html: msg, icon: "warning" });
      } else {
        Swal.fire("Error", "Terjadi kesalahan pada server", "error");
      }
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Hapus Transaksi?",
      text: "Data akan dihapus permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });
    if (confirm.isConfirmed) {
      await api.delete(`/transaksi/${id}`);
      Swal.fire("Berhasil", "Transaksi terhapus", "success");
      fetchData();
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

  const getTotalHarga = (detail) => {
    if (!detail) return 0;
    const harga = safeParseFloat(detail.harga);
    const qty = parseInt(detail.qty) || 0;
    return harga * qty;
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

  const handleChangeDetailStatus = async (detailId, currentStatusId) => {
    const { value: statusId } = await Swal.fire({
      title: "Ubah Status Detail",
      input: "select",
      inputOptions: statusList.reduce((acc, status) => {
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

  const formatProductName = (p) => {
    if (!p) return "-";
    return [p.jenis?.nama, p.type?.nama, p.ukuran].filter(Boolean).join(" | ");
  };

  // ✅ Fungsi untuk dapatkan stok dari inventory TOKO
  const getStokToko = (product) => {
    if (!product || !product.inventories) return 0;
    const tokoInventory = product.inventories.find(inv => 
      inv.place && inv.place.kode === 'TOKO'
    );
    return tokoInventory ? tokoInventory.qty : 0;
  };

  const findProduct = (id) => {
    return products.find(p => p.id === id) || { id, nama: "Produk tidak ditemukan" };
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transaksi Harian (Daily)</h1>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2"
        >
          <Plus size={18} />
          Tambah Transaksi
        </button>
      </div>

      {/* LIST */}
      {loading ? (
        <p className="text-center py-8 text-gray-600">Memuat data...</p>
      ) : transaksi.length === 0 ? (
        <p className="text-center py-8 text-gray-500">Tidak ada data transaksi.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transaksi.map((item) => (
            <div key={item.id} className="p-6 bg-white rounded-xl shadow space-y-3">
              <p className="text-gray-700 text-center">
                Customer: {item.customer?.name}
              </p>
              <p className="text-gray-700 text-center font-semibold">
                Total: Rp {formatRupiah(item.total)}
              </p>
              <hr className="my-3" />
              <div className="space-y-3">
                {item.details.map((d) => {
                  const sisaBayar = getSisaBayar(d);
                  const isLunas = sisaBayar <= 0;
                  const totalBayar = getTotalBayar(d);
                  return (
                    <div key={d.id} className="p-3 border rounded-lg bg-gray-50 text-sm">
                      <p><span className="font-semibold">Produk:</span> {formatProductName(d.product)}</p>
                      <p><span className="font-semibold">Qty:</span> {d.qty}</p>
                      <p><span className="font-semibold">Harga Satuan:</span> Rp {formatRupiah(d.harga)}</p>
                      <p><span className="font-semibold">Diskon:</span> Rp {formatRupiah(d.discount)}</p>
                      <p><span className="font-semibold">Tagihan:</span> Rp {formatRupiah(d.subtotal)}</p>
                      <p><span className="font-semibold">Tanggal:</span> {formatTanggal(d.tanggal)}</p>

                      <div className="mt-2 pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <p className="text-sm">
                            <span className="font-semibold">Status:</span>{" "}
                            <span className="text-blue-600">{d.status_transaksi?.nama || "–"}</span>
                          </p>
                          <button
                            onClick={() => handleChangeDetailStatus(d.id, d.status_transaksi_id)}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            Ubah
                          </button>
                        </div>

                        <div className="mt-3">
                          <p className="text-sm text-center">
                            <span className={`font-semibold ${isLunas ? "text-green-600" : "text-orange-600"}`}>
                              {isLunas ? "✅ Lunas" : `⏳ Belum lunas (Sisa: Rp ${formatRupiah(sisaBayar)})`}
                            </span>
                          </p>
                        </div>

                        <p className="text-xs text-gray-600 mt-1 text-center">
                          Sudah dibayar: Rp {formatRupiah(totalBayar)} dari Rp {formatRupiah(d.subtotal)}
                        </p>

                        {d.pembayarans && d.pembayarans.length > 0 && (
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

              <button
                onClick={() => handleDelete(item.id)}
                className="w-full flex justify-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-xl hover:bg-red-200"
              >
                <Trash2 size={16} /> Hapus
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl p-6 rounded-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Edit Transaksi" : "Tambah Transaksi"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* CUSTOMER */}
              <div>
                <label className="font-semibold">Customer</label>
                <select
                  className="w-full border px-3 py-2 rounded-lg mt-1"
                  value={form.customer_id}
                  onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                >
                  <option value="">Pilih Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {!form.customer_id && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <input
                      type="text"
                      placeholder="Nama *"
                      className="border px-3 py-2 rounded-lg"
                      value={form.customer_baru.name}
                      onChange={(e) =>
                        setForm({ ...form, customer_baru: { ...form.customer_baru, name: e.target.value } })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      className="border px-3 py-2 rounded-lg"
                      value={form.customer_baru.phone}
                      onChange={(e) =>
                        setForm({ ...form, customer_baru: { ...form.customer_baru, phone: e.target.value } })
                      }
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      className="border px-3 py-2 rounded-lg"
                      value={form.customer_baru.email}
                      onChange={(e) =>
                        setForm({ ...form, customer_baru: { ...form.customer_baru, email: e.target.value } })
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold mb-2">Detail Transaksi</h3>
                {form.details.map((d, i) => (
                  <div key={i} className="p-4 border rounded-xl mb-4 bg-gray-50 space-y-4">
                    <div>
                      <label className="block mb-1 font-medium">Produk *</label>
                      <select
                        className="w-full border px-3 py-2 rounded-lg"
                        value={d.product_id}
                        onChange={(e) => handleDetailChange(i, "product_id", e.target.value)}
                        required
                      >
                        <option value="">Pilih Produk</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {formatProductName(p)} (Stok: {getStokToko(p)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* HARGA */}
                    {d.product_id && (
                      <>
                        <div className="mt-3">
                          <label className="block mb-1 font-medium">
                            Pilih Harga yang Berlaku
                          </label>
                          <select
                            className="w-full border px-3 py-2 rounded-lg"
                            value={d.harga_product_id || ""}
                            onChange={(e) => handleHargaLamaChange(i, e.target.value)}
                          >
                            <option value="">Ambil harga terbaru</option>
                            {(hargaOptions[i] || []).map((h) => (
                              <option key={h.id} value={h.id}>
                                Rp {formatRupiah(h.harga)} - {h.keterangan || "Tanpa keterangan"} ({formatTanggal(h.tanggal_berlaku)})
                              </option>
                            ))}
                          </select>
                        </div>

                        {!d.harga_product_id && (
                          <div className="border-t pt-3">
                            <label className="block mb-2 font-medium">
                              Atau Tambahkan Harga Baru (Opsional)
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Harga Baru (Rp)"
                                className="border px-3 py-2 rounded-lg"
                                value={d.harga_baru.harga ? formatRupiah(d.harga_baru.harga) : ""}
                                onChange={(e) => {
                                  const raw = unformatRupiah(e.target.value);
                                  handleHargaBaruChange(i, "harga", raw);
                                }}
                              />
                              <input
                                type="text"
                                placeholder="Keterangan"
                                className="border px-3 py-2 rounded-lg"
                                value={d.harga_baru.keterangan}
                                onChange={(e) => handleHargaBaruChange(i, "keterangan", e.target.value)}
                              />
                              <input
                                type="date"
                                className="border px-3 py-2 rounded-lg"
                                value={d.harga_baru.tanggal_berlaku}
                                onChange={(e) => handleHargaBaruChange(i, "tanggal_berlaku", e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Qty, Tanggal, Status, Diskon */}
                    <div className="grid grid-cols-4 gap-2">
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
                      <select
                        className="border px-3 py-2 rounded-lg"
                        value={d.status_transaksi_id}
                        onChange={(e) => handleDetailChange(i, "status_transaksi_id", e.target.value)}
                        required
                      >
                        <option value="">Status *</option>
                        {statusList.map((s) => (
                          <option key={s.id} value={s.id}>{s.nama}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeDetailRow(i)}
                      className="w-full mt-3 bg-red-100 text-red-600 py-2 rounded-lg hover:bg-red-200"
                    >
                      <Trash2 className="inline-block" size={16} /> Hapus Detail
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addDetailRow}
                  className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg"
                >
                  + Tambah Detail
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                >
                  {editingId ? "Simpan Perubahan" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransaksiPage;