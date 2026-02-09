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

const findCustomerById = (customers, id) => {
  return customers.find((c) => c.id == id) || null;
};

const findTransaksiDetailById = (customers, id) => {
  for (const customer of customers) {
    if (customer.transaksi_details) {
      const found = customer.transaksi_details.find((d) => d.id == id);
      if (found) return found;
    }
  }
  return null;
};

const CustomerPage = ({ setNavbarContent }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customerModal, setCustomerModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [bayarModal, setBayarModal] = useState(null);
  const [jumlahBayar, setJumlahBayar] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fetchData = useCallback(async (searchTerm = "") => {
    try {
      setLoading(true);
      const res = await api.get("/customers", {
        params: { search: searchTerm },
      });
      let customers = res.data.data || [];

      const hasTagihan = (customer) => {
        const harian = Number(customer.tagihan_harian_belum_lunas) || 0;
        const pesanan = Number(customer.tagihan_pesanan_belum_lunas) || 0;
        return harian > 0 || pesanan > 0;
      };

      const withTagihan = [];
      const withoutTagihan = [];

      customers.forEach((c) => {
        if (hasTagihan(c)) {
          withTagihan.push(c);
        } else {
          withoutTagihan.push(c);
        }
      });

      withTagihan.sort((a, b) => a.name.localeCompare(b.name));
      withoutTagihan.sort((a, b) => a.name.localeCompare(b.name));

      const sortedCustomers = [...withTagihan, ...withoutTagihan];

      setCustomers(sortedCustomers);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Gagal mengambil data customer", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(search);
  }, [search, fetchData]);

  useEffect(() => {
    setNavbarContent(
      <CustomerFilterBar search={search} setSearch={setSearch} />,
    );
  }, [search]);

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

  const openCustomerModal = (customerId, customerName, jenisFilter = null) => {
    setCustomerModal({ customerId, customerName, jenisFilter });
  };

  const openDetailModal = (transaksiDetailId, customerName) => {
    setDetailModal({ id: transaksiDetailId, customerName });
  };

  const openBayarModal = (transaksiDetail, customerName) => {
    setBayarModal({ transaksiDetail, customerName });
    const totalBayar = Array.isArray(transaksiDetail.pembayarans)
      ? transaksiDetail.pembayarans.reduce(
          (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
          0,
        )
      : 0;
    const sisaTagihan = safeParseFloat(transaksiDetail.subtotal) - totalBayar;
    setJumlahBayar(formatRupiah(sisaTagihan));
  };

  const handleJumlahBayarChange = (rawValue) => {
    const cleanValue = rawValue.replace(/\D/g, "");
    const formatted = cleanValue === "" ? "" : formatRupiah(cleanValue);
    setJumlahBayar(formatted);
  };

  const handleBayar = async (e) => {
    e.preventDefault();

    if (!bayarModal) return;

    const jumlah = unformatRupiah(jumlahBayar);
    const totalBayar = Array.isArray(bayarModal.transaksiDetail.pembayarans)
      ? bayarModal.transaksiDetail.pembayarans.reduce(
          (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
          0,
        )
      : 0;
    const sisaTagihan =
      safeParseFloat(bayarModal.transaksiDetail.subtotal) - totalBayar;

    if (!jumlah || jumlah <= 0) {
      Swal.fire("Error", "Jumlah bayar harus lebih dari 0", "warning");
      return;
    }

    if (jumlah > sisaTagihan) {
      Swal.fire(
        "Error",
        `Jumlah bayar tidak boleh melebihi sisa tagihan (Rp ${formatRupiah(
          sisaTagihan,
        )})`,
        "warning",
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

  const handlePrintTagihan = (customer) => {
    // Ambil data transaksi detail dari customer
    const transaksiDetails = Array.isArray(customer.transaksi_details)
      ? customer.transaksi_details.filter((detail) => {
          if (!detail || !detail.transaksi || !detail.product) return false;
          if (detail.status_transaksi_id === 6) return false; // Dibatalkan
          const subtotal = safeParseFloat(detail.subtotal);
          const totalBayar = Array.isArray(detail.pembayarans)
            ? detail.pembayarans.reduce(
                (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
                0,
              )
            : 0;
          return subtotal - totalBayar > 0;
        })
      : [];

    if (transaksiDetails.length === 0) {
      Swal.fire("Info", "Tidak ada tagihan yang perlu dicetak", "info");
      return;
    }

    // Hitung total
    let totalSubtotal = 0;
    let totalDiscount = 0;
    let totalTagihan = 0;
    let totalDibayar = 0;

    const rowsHtml = transaksiDetails
      .map((detail) => {
        const subtotal = safeParseFloat(detail.subtotal);
        const discount = safeParseFloat(detail.discount);
        const subtotalAsli = subtotal + discount;

        const totalBayar = Array.isArray(detail.pembayarans)
          ? detail.pembayarans.reduce(
              (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
              0,
            )
          : 0;
        const sisa = subtotal - totalBayar;

        totalSubtotal += subtotalAsli;
        totalDiscount += discount;
        totalTagihan += subtotal;
        totalDibayar += totalBayar;

        return `
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center; font-size: 11px;">${formatTanggal(detail.transaksi?.tanggal)}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px; white-space: nowrap;">${formatProductName(detail.product)}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; font-size: 11px;">Rp ${formatRupiah(subtotalAsli)}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; font-size: 11px;">Rp ${formatRupiah(discount)}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; font-size: 11px;">Rp ${formatRupiah(subtotal)}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; font-size: 11px;">Rp ${formatRupiah(totalBayar)}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; color: #dc2626; font-weight: bold; font-size: 11px;">Rp ${formatRupiah(sisa)}</td>
        </tr>
      `;
      })
      .join("");

    const sisaTotal = totalTagihan - totalDibayar;

    const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Surat Tagihan - ${customer.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 25mm;
            color: #1f2937;
            width: 210mm;
            margin: 0 auto;
            background: #ffffff;
            line-height: 1.5;
          }
          @media print {
            body { padding: 15mm; }
          }
          h1 {
            text-align: center;
            color: #1e40af;
            margin-bottom: 8px;
            font-size: 26px;
            font-weight: 700;
          }
          .subtitle {
            text-align: center;
            color: #64748b;
            margin-bottom: 20px;
            font-size: 13px;
          }
          .letter-content {
            margin: 20px 0;
          }
          .salutation {
            margin-bottom: 20px;
            font-size: 13px;
            line-height: 1.6;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 11px;
          }
          th {
            background-color: #dbeafe;
            color: #1e40af;
            font-weight: 600;
            padding: 8px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid #bfdbfe;
            font-size: 10px;
          }
          td {
            padding: 8px;
            border: 1px solid #e5e7eb;
            vertical-align: top;
          }
          /* Kolom Tanggal */
          td:nth-child(1) { text-align: center; width: 10%; }
          /* Kolom Produk - diperbesar agar 1 baris */
          td:nth-child(2) { text-align: left; width: 35%; white-space: nowrap; }
          /* Kolom Angka - disamakan ukuran dengan produk */
          td:nth-child(3),
          td:nth-child(4),
          td:nth-child(5),
          td:nth-child(6),
          td:nth-child(7) { 
            text-align: right; 
            width: 11%; 
          }
          tr:last-child td {
            border-bottom: 1px solid #e5e7eb;
          }
          .summary {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px solid #cbd5e1;
          }
          .total-due {
            font-size: 15px;
            text-align: center;
            font-weight: 700;
            color: #dc2626;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed #e5e7eb;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #64748b;
            font-size: 11px;
          }
          .company-info {
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #4b5563;
            font-size: 12px;
          }
          .highlight {
            color: #1e40af;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <h1>SURAT TAGIHAN</h1>
        <div class="subtitle">Jaya Rubber Seal</div>
        
        <div class="letter-content">
          <p class="salutation">
            Kepada Yth.<br>
            <span class="highlight">${customer.name}</span><br><br>
            
            Bersama ini kami dari <strong>Jaya Rubber Seal</strong> ingin mengingatkan bahwa 
            Bapak/Ibu masih memiliki tagihan yang belum dilunasi. Berikut rincian tagihan tersebut:
          </p>

          <table>
            <thead>
              <tr>
                <th>Tgl</th>
                <th>Produk</th>
                <th>Subtotal</th>
                <th>Diskon</th>
                <th>Tagihan</th>
                <th>Dibayar</th>
                <th>Sisa</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="summary">
            <div class="total-due">
              SISA TAGIHAN: Rp ${formatRupiah(sisaTotal)}
            </div>
          </div>

          <div class="company-info">
            <p>
              Mohon untuk segera melakukan pelunasan tagihan tersebut.<br>
              Atas perhatian dan kerja samanya, kami ucapkan terima kasih.
            </p>
          </div>
        </div>

        <div class="footer">
          <p>Surat tagihan ini berlaku tanpa tanda tangan basah.</p>
          <p>Dicetak pada: ${new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}</p>
        </div>
      </body>
    </html>
  `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    } else {
      Swal.fire("Error", "Gagal membuka jendela cetak", "error");
    }
  };

  return (
    <div className="space-y-6 p-2 md:p-4 max-w-7xl mx-auto">
      {/* LOADING & KOSONG */}
      {loading ? (
        <p className="text-center text-gray-500 py-12">Memuat data...</p>
      ) : customers.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          Tidak ada customer yang ditemukan.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {customers.map((item) => {
            const tagihanHarian = Number(item.tagihan_harian_belum_lunas || 0);
            const tagihanPesanan = Number(
              item.tagihan_pesanan_belum_lunas || 0,
            );
            const hasTagihan = tagihanHarian > 0 || tagihanPesanan > 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition border border-gray-100 min-w-0"
              >
                <h3 className="text-sm font-bold text-gray-900 text-center truncate">
                  {item.name}
                </h3>

                <p className="text-xs text-gray-500 mt-1 text-center truncate">
                  📞 {item.phone || "-"}
                </p>

                <p className="text-xs text-gray-500 text-center break-words">
                  ✉️ {item.email || "-"}
                </p>

                <div className="mt-3 space-y-1 text-xs min-w-0">
                  {tagihanHarian > 0 && (
                    <div
                      className="flex justify-between pt-2 border-t border-gray-100 cursor-pointer hover:bg-orange-50 rounded p-1 gap-1"
                      onClick={() =>
                        openCustomerModal(item.id, item.name, "daily")
                      }
                    >
                      <span className="text-orange-600 font-medium truncate">
                        Tagihan Harian:
                      </span>
                      <span className="text-orange-600 font-bold shrink-0">
                        {formatRupiah(tagihanHarian)}
                      </span>
                    </div>
                  )}

                  {tagihanPesanan > 0 && (
                    <div
                      className="flex justify-between pt-1 cursor-pointer hover:bg-purple-50 rounded p-1 gap-1"
                      onClick={() =>
                        openCustomerModal(item.id, item.name, "pesanan")
                      }
                    >
                      <span className="text-purple-600 font-medium truncate">
                        Tagihan Pesanan:
                      </span>
                      <span className="text-purple-600 font-bold shrink-0">
                        {formatRupiah(tagihanPesanan)}
                      </span>
                    </div>
                  )}

                  {tagihanHarian === 0 && tagihanPesanan === 0 && (
                    <div className="flex justify-between pt-2 border-t border-gray-100">
                      <span className="text-green-600 font-medium">
                        Tidak ada tagihan
                      </span>
                      <span className="text-green-600">✅</span>
                    </div>
                  )}
                </div>

                {hasTagihan && (
                  <div className="mt-2">
                    <button
                      onClick={() => handlePrintTagihan(item)}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-xs w-full"
                    >
                      <Receipt size={14} />
                      Cetak
                    </button>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  {(role === "admin" || role === "admin_toko") && (
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-xs"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                  )}

                  {role === "admin" && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs"
                    >
                      <Trash2 size={14} />
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(role === "admin" || role === "admin_toko") && (
        <button
          onClick={handleTambah}
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition"
        >
          <Plus size={20} />
        </button>
      )}

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

      {customerModal &&
        (() => {
          const customer = findCustomerById(
            customers,
            customerModal.customerId,
          );
          if (!customer) return null;

          const STATUS_DIBATALKAN_ID = 6;

          const filteredDetails = (
            Array.isArray(customer.transaksi_details)
              ? customer.transaksi_details
              : []
          ).filter((detail) => {
            if (!detail || !detail.transaksi || !detail.product) return false;

            if (detail.status_transaksi_id === STATUS_DIBATALKAN_ID)
              return false;

            if (
              customerModal.jenisFilter === "daily" &&
              detail.transaksi.jenis_transaksi !== "daily"
            )
              return false;
            if (
              customerModal.jenisFilter === "pesanan" &&
              detail.transaksi.jenis_transaksi !== "pesanan"
            )
              return false;

            const subtotal = safeParseFloat(detail.subtotal);
            const totalBayar = Array.isArray(detail.pembayarans)
              ? detail.pembayarans.reduce(
                  (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
                  0,
                )
              : 0;
            const sisaBayar = subtotal - totalBayar;
            return sisaBayar > 0;
          });

          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Tagihan {customerModal.customerName}
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
                  {filteredDetails.length === 0 ? (
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
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredDetails.map((detail) => {
                        const subtotal = safeParseFloat(detail.subtotal);
                        const totalBayar = Array.isArray(detail.pembayarans)
                          ? detail.pembayarans.reduce(
                              (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
                              0,
                            )
                          : 0;
                        const sisaBayar = subtotal - totalBayar;
                        const isHarian =
                          detail.transaksi?.jenis_transaksi === "daily";

                        return (
                          <div
                            key={detail.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer transition"
                            onClick={() =>
                              openDetailModal(
                                detail.id,
                                customerModal.customerName,
                              )
                            }
                          >
                            <div className="flex justify-center items-center mb-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isHarian
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {isHarian ? "Harian" : "Pesanan"}
                              </span>
                            </div>

                            <p className="font-medium text-gray-800 text-sm text-center">
                              {detail.product?.kode}
                            </p>
                            <p className="text-xs text-gray-600 mb-2 text-center">
                              {formatProductName(detail.product)}
                            </p>

                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                Sisa Tagihan:
                              </span>
                              <span className="font-bold text-red-600">
                                Rp {formatRupiah(sisaBayar)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {/* MODAL DETAIL TAGIHAN — FIX TOTAL BAYAR */}
      {detailModal &&
        (() => {
          const transaksiDetail = findTransaksiDetailById(
            customers,
            detailModal.id,
          );
          if (!transaksiDetail) return null;

          // ✅ Gunakan safeParseFloat di sini juga!
          const subtotal = safeParseFloat(transaksiDetail.subtotal);
          const totalBayar = Array.isArray(transaksiDetail.pembayarans)
            ? transaksiDetail.pembayarans.reduce(
                (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
                0,
              )
            : 0;
          const sisaTagihan = subtotal - totalBayar;
          const isLunas = sisaTagihan <= 0;

          return (
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
                  {transaksiDetail.product && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="font-medium text-gray-800">
                        {transaksiDetail.product.kode}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatProductName(transaksiDetail.product)}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Jenis:{" "}
                        {transaksiDetail.transaksi?.jenis_transaksi === "daily"
                          ? "Harian"
                          : "Pesanan"}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-bold">
                      Rp {formatRupiah(subtotal)}
                    </span>
                  </div>

                  {Array.isArray(transaksiDetail.pembayarans) &&
                    transaksiDetail.pembayarans.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="font-medium text-blue-800 flex items-center gap-1 justify-center">
                          <Receipt size={14} /> Riwayat Pembayaran:
                        </p>
                        <ul className="mt-2 space-y-1">
                          {transaksiDetail.pembayarans.map((p) => (
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

                  <div className="text-center py-2">
                    <p className="text-xs text-gray-600">
                      Sudah dibayar: Rp {formatRupiah(totalBayar)} dari Rp{" "}
                      {formatRupiah(subtotal)}
                    </p>
                  </div>

                  {!isLunas && (
                    <button
                      onClick={() =>
                        openBayarModal(
                          transaksiDetail,
                          detailModal.customerName,
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
          );
        })()}

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
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-center">
                <p className="font-medium text-gray-800">
                  {bayarModal.transaksiDetail.product?.kode}
                </p>
                <p className="text-sm text-gray-600">
                  {formatProductName(bayarModal.transaksiDetail.product)}
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>
                    Rp{" "}
                    {formatRupiah(
                      safeParseFloat(bayarModal.transaksiDetail.subtotal),
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Sudah Dibayar:</span>
                  <span>
                    Rp{" "}
                    {formatRupiah(
                      Array.isArray(bayarModal.transaksiDetail.pembayarans)
                        ? bayarModal.transaksiDetail.pembayarans.reduce(
                            (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
                            0,
                          )
                        : 0,
                    )}
                  </span>
                </div>

                <div className="flex justify-between font-bold">
                  <span className="text-red-600">Sisa Tagihan:</span>
                  <span className="text-red-600">
                    Rp{" "}
                    {formatRupiah(
                      safeParseFloat(bayarModal.transaksiDetail.subtotal) -
                        (Array.isArray(bayarModal.transaksiDetail.pembayarans)
                          ? bayarModal.transaksiDetail.pembayarans.reduce(
                              (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
                              0,
                            )
                          : 0),
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
