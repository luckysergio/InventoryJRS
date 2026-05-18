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
  X,
  Calendar, // ✅ TAMBAHKAN: Icon Calendar untuk tanggal
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

// ============ COMPONENT: Customer Filter Bar ============
export const CustomerFilterBar = ({ search, setSearch }) => (
  <div className="flex items-center gap-2 w-full">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Cari customer..."
        className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none transition bg-white"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Cari customer"
      />
      {search && (
        <button
          type="button"
          onClick={() => setSearch("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
          aria-label="Hapus pencarian"
        >
          <X size={14} />
        </button>
      )}
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const [isNavbarSet, setIsNavbarSet] = useState(false);

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

  // FIX: Set navbar content - ONLY in navbar, no inline fallback
  useEffect(() => {
    if (typeof setNavbarContent === "function") {
      const filterBar = (
        <CustomerFilterBar search={search} setSearch={setSearch} />
      );
      setNavbarContent(filterBar);
      setIsNavbarSet(true);
    }
    // Cleanup: clear navbar content when unmounting
    return () => {
      if (typeof setNavbarContent === "function") {
        setNavbarContent(null);
      }
    };
  }, [search, setNavbarContent]);

  // Refresh navbar after loading completes
  useEffect(() => {
    if (!loading && isNavbarSet && typeof setNavbarContent === "function") {
      const filterBar = (
        <CustomerFilterBar search={search} setSearch={setSearch} />
      );
      setNavbarContent(filterBar);
    }
  }, [loading, isNavbarSet, search, setNavbarContent]);

  useEffect(() => {
    setCurrentPage(1);
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
    if (isSubmitting) return;

    setIsSubmitting(true);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    // Tampilkan konfirmasi sebelum menghapus
    const confirmResult = await Swal.fire({
      title: "Yakin ingin menghapus?",
      text: "Data customer akan dihapus secara permanen",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (!confirmResult.isConfirmed) return;

    // Tampilkan loading saat proses delete
    Swal.fire({
      title: "Menghapus...",
      text: "Mohon tunggu sebentar",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await api.delete(`/customers/${id}`);

      // Tutup loading alert
      Swal.close();

      // Cek status response dari API
      if (response.data.status === true) {
        await Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: response.data.message || "Customer berhasil dihapus",
          timer: 2000,
          showConfirmButton: false,
        });
        // Refresh data
        fetchData(search);
      } else {
        // Jika status false (seharusnya tidak terjadi untuk success case)
        throw new Error(response.data.message || "Gagal menghapus customer");
      }
    } catch (error) {
      // Tutup loading alert
      Swal.close();

      // Handle error 422 (Customer memiliki product)
      if (error.response?.status === 422) {
        await Swal.fire({
          icon: "warning",
          title: "Tidak Dapat Menghapus",
          text:
            error.response.data?.message ||
            "Customer tidak dapat dihapus karena masih memiliki product",
          confirmButtonText: "Mengerti",
          confirmButtonColor: "#d33",
        });
      }
      // Handle error 404 (Customer tidak ditemukan)
      else if (error.response?.status === 404) {
        await Swal.fire({
          icon: "error",
          title: "Tidak Ditemukan",
          text: error.response.data?.message || "Customer tidak ditemukan",
          confirmButtonText: "OK",
        });
        // Refresh data untuk menghapus customer yang tidak valid dari state
        fetchData(search);
      }
      // Handle error lainnya (network error, server error, dll)
      else {
        console.error("Delete error details:", error);

        let errorMessage = "Terjadi kesalahan saat menghapus data";
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        await Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          confirmButtonText: "OK",
        });
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

  // FIX #3: Perbaikan qty pada print tagihan - gunakan detail.qty bukan detail.quantity
  const handlePrintTagihan = (customer) => {
    const transaksiDetails = Array.isArray(customer.transaksi_details)
      ? customer.transaksi_details.filter((detail) => {
          if (!detail || !detail.transaksi || !detail.product) return false;
          if (detail.status_transaksi_id === 6) return false;
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

    let totalSubtotal = 0;
    let totalDiscount = 0;
    let totalTagihan = 0;
    let totalDibayar = 0;

    const rowsHtml = transaksiDetails
      .map((detail) => {
        const subtotal = safeParseFloat(detail.subtotal);
        const discount = safeParseFloat(detail.discount);
        const subtotalAsli = subtotal + discount;

        // FIX: Gunakan detail.qty (bukan detail.quantity) sesuai struktur database
        const quantity =
          detail.qty !== undefined && detail.qty !== null
            ? Number(detail.qty)
            : 1;

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
            <td style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align: center; font-size: 10px; vertical-align: middle;">${formatTanggal(detail.transaksi?.tanggal)}</td>
            <td style="padding: 6px 8px; border: 1px solid #e5e7eb; font-size: 10px; vertical-align: middle; max-width: 200px; word-wrap: break-word;">${formatProductName(detail.product)}</td>
            <td style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align: center; font-size: 10px; vertical-align: middle;">${quantity}</td>
            <td style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align: right; font-size: 10px; vertical-align: middle;">Rp ${formatRupiah(subtotalAsli)}</td>
            <td style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align: right; font-size: 10px; vertical-align: middle;">Rp ${formatRupiah(discount)}</td>
            <td style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align: right; font-size: 10px; vertical-align: middle;">Rp ${formatRupiah(totalBayar)}</td>
            <td style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align: right; color: #dc2626; font-weight: 600; font-size: 10px; vertical-align: middle;">Rp ${formatRupiah(sisa)}</td>
          </tr>
        `;
      })
      .join("");

    const sisaTotal = totalTagihan - totalDibayar;

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Surat Tagihan - ${customer.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            * { box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 20mm;
              color: #1f2937;
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              background: #ffffff;
              line-height: 1.4;
              font-size: 10px;
            }
            @media print {
              body { padding: 15mm; }
              @page { margin: 0; size: A4; }
            }
            h1 {
              text-align: center;
              color: #1e40af;
              margin: 0 0 4px 0;
              font-size: 20px;
              font-weight: 700;
            }
            .subtitle {
              text-align: center;
              color: #64748b;
              margin-bottom: 16px;
              font-size: 11px;
            }
            .letter-content { margin: 16px 0; }
            .salutation {
              margin-bottom: 16px;
              font-size: 11px;
              line-height: 1.5;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
              font-size: 10px;
            }
            th {
              background-color: #dbeafe;
              color: #1e40af;
              font-weight: 600;
              padding: 6px 8px;
              text-align: center;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              border: 1px solid #bfdbfe;
              font-size: 9px;
              white-space: nowrap;
            }
            td {
              padding: 6px 8px;
              border: 1px solid #e5e7eb;
              vertical-align: middle;
              font-size: 10px;
            }
            td:nth-child(1) { text-align: center; width: 12%; }
            td:nth-child(2) { text-align: left; width: 35%; word-break: break-word; }
            td:nth-child(3) { text-align: center; width: 8%; }
            td:nth-child(4),
            td:nth-child(5),
            td:nth-child(6),
            td:nth-child(7) { 
              text-align: right; 
              width: 11.25%;
              white-space: nowrap;
            }
            .summary {
              margin-top: 16px;
              padding-top: 12px;
              border-top: 2px solid #cbd5e1;
            }
            .total-due {
              font-size: 13px;
              text-align: center;
              font-weight: 700;
              color: #dc2626;
              margin-top: 6px;
              padding-top: 6px;
              border-top: 1px dashed #e5e7eb;
            }
            .footer {
              margin-top: 24px;
              text-align: center;
              color: #64748b;
              font-size: 9px;
            }
            .company-info {
              margin-top: 20px;
              padding-top: 12px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #4b5563;
              font-size: 10px;
            }
            .highlight {
              color: #1e40af;
              font-weight: 600;
            }
            .page-break { page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <div class="page-break">
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
                    <th>Qty</th>
                    <th>Subtotal</th>
                    <th>Diskon</th>
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
                hour: "2-digit",
                minute: "2-digit",
              })}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
    } else {
      Swal.fire("Error", "Gagal membuka jendela cetak", "error");
    }
  };

  // Pagination Logic (Client-side)
  const filteredCustomers = customers.filter((item) => {
    const searchLower = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(searchLower) ||
      item.phone?.toLowerCase().includes(searchLower) ||
      item.email?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <>
      {/* FIX: Removed inline searchbar fallback - searchbar ONLY in navbar now */}

      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full">
        {/* LOADING */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 text-sm sm:text-base">
              Memuat data customer...
            </p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          /* EMPTY STATE */
          <div className="text-center py-20 px-4">
            <div className="text-gray-300 mb-4">
              <Search size={48} className="mx-auto" />
            </div>
            <p className="text-gray-500 text-sm sm:text-base">
              {search
                ? `Tidak ada customer ditemukan untuk "${search}"`
                : "Tidak ada customer yang ditemukan."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Stats Info - Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
              <p className="text-xs sm:text-sm text-gray-500">
                Menampilkan{" "}
                <span className="font-medium">{paginatedCustomers.length}</span>{" "}
                dari{" "}
                <span className="font-medium">{filteredCustomers.length}</span>{" "}
                customer
              </p>
              {totalPages > 1 && (
                <p className="text-xs sm:text-sm text-gray-400 text-center sm:text-right">
                  Halaman <span className="font-medium">{currentPage}</span>{" "}
                  dari <span className="font-medium">{totalPages}</span>
                </p>
              )}
            </div>

            {/* Grid Customers - Fully Responsive */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {paginatedCustomers.map((item) => {
                const tagihanHarian = Number(
                  item.tagihan_harian_belum_lunas || 0,
                );
                const tagihanPesanan = Number(
                  item.tagihan_pesanan_belum_lunas || 0,
                );
                const hasTagihan = tagihanHarian > 0 || tagihanPesanan > 0;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition border border-gray-100 min-w-0 flex flex-col h-full"
                  >
                    {/* Customer Name */}
                    <h3
                      className="text-sm font-bold text-gray-900 text-center truncate"
                      title={item.name}
                    >
                      {item.name}
                    </h3>

                    {/* Contact Info - Admin Only */}
                    {role === "admin" ? (
                      <>
                        <p
                          className="text-xs text-gray-500 mt-1 text-center truncate"
                          title={item.phone || ""}
                        >
                          📞 {item.phone || "-"}
                        </p>
                        <p
                          className="text-xs text-gray-500 text-center break-words"
                          title={item.email || ""}
                        >
                          ✉️ {item.email || "-"}
                        </p>
                      </>
                    ) : (
                      <div className="text-center mt-2">
                        <p className="text-xs text-gray-400">
                          (kontak hanya untuk admin)
                        </p>
                      </div>
                    )}

                    {/* Tagihan Info */}
                    <div className="mt-3 space-y-1 text-xs min-w-0 flex-1">
                      {tagihanHarian > 0 && (
                        <div
                          className="flex justify-between pt-2 border-t border-gray-100 cursor-pointer hover:bg-orange-50 rounded p-1 gap-1"
                          onClick={() =>
                            openCustomerModal(item.id, item.name, "daily")
                          }
                        >
                          <span
                            className="text-orange-600 font-medium truncate"
                            title="Tagihan Harian"
                          >
                            Harian:
                          </span>
                          <span className="text-orange-600 font-bold shrink-0 whitespace-nowrap">
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
                          <span
                            className="text-purple-600 font-medium truncate"
                            title="Tagihan Pesanan"
                          >
                            Pesanan:
                          </span>
                          <span className="text-purple-600 font-bold shrink-0 whitespace-nowrap">
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

                    {/* Print Button */}
                    {hasTagihan && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handlePrintTagihan(item)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-xs w-full transition active:scale-95"
                        >
                          <Receipt size={14} />
                          <span className="hidden sm:inline">Cetak</span>
                          <span className="sm:hidden">Print</span>
                        </button>
                      </div>
                    )}

                    {/* Action Buttons - Admin Only */}
                    <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
                      {role === "admin" && (
                        <>
                          <button
                            onClick={() => handleEdit(item)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-xs transition active:scale-95"
                            title="Edit customer"
                            aria-label="Edit customer"
                          >
                            <Pencil size={14} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs transition active:scale-95"
                            title="Hapus customer"
                            aria-label="Hapus customer"
                          >
                            <Trash2 size={14} />
                            <span className="hidden sm:inline">Hapus</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls - Responsive */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-6 pb-24 flex-wrap">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-95"
                  }`}
                >
                  ← Prev
                </button>

                <div className="flex items-center gap-1 flex-wrap justify-center">
                  {renderPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs sm:text-sm font-medium transition ${
                        currentPage === pageNum
                          ? "bg-indigo-600 text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-95"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-95"
                  }`}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB Button - Responsive positioning and size */}
      {(role === "admin" || role === "admin_toko") && (
        <button
          onClick={handleTambah}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center justify-center w-12 h-12 sm:w-auto sm:px-5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-full shadow-lg transition active:scale-95"
          aria-label="Tambah Customer"
        >
          <Plus size={20} className="sm:hidden" />
          <span className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium">
            <Plus size={16} /> Tambah
          </span>
        </button>
      )}

      {/* Modal Tambah/Edit Customer - Responsive */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:w-full sm:max-w-md p-4 sm:p-6 rounded-t-2xl sm:rounded-2xl shadow-lg max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 z-10">
              <h2 className="text-lg font-bold text-center flex-1">
                {isEdit ? "Edit Customer" : "Tambah Customer"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="p-2 hover:bg-gray-100 rounded-full transition"
                aria-label="Tutup modal"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Nama Customer *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Masukkan nama"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Masukkan nomor telepon"
                  disabled={isSubmitting}
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
                  className="mt-1 w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Masukkan email"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 rounded-xl text-white flex items-center justify-center gap-2 transition text-sm ${
                    isSubmitting
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    <>{isEdit ? "Update" : "Simpan"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal List Tagihan Customer - Responsive */}
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
            return subtotal - totalBayar > 0;
          });

          return (
            <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-2 sm:p-4">
              <div className="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-gray-800 truncate">
                      Tagihan {customerModal.customerName}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {customerModal.jenisFilter === "daily"
                        ? "Transaksi Harian"
                        : customerModal.jenisFilter === "pesanan"
                          ? "Transaksi Pesanan"
                          : "Semua Tagihan Belum Lunas"}
                    </p>
                  </div>
                  <button
                    onClick={() => setCustomerModal(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition flex-shrink-0"
                    aria-label="Kembali"
                  >
                    <ArrowLeft size={20} />
                  </button>
                </div>

                <div className="p-4 sm:p-5">
                  {filteredDetails.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        {customerModal.jenisFilter === "daily"
                          ? "Tidak ada tagihan harian yang belum lunas"
                          : customerModal.jenisFilter === "pesanan"
                            ? "Tidak ada tagihan pesanan yang belum lunas"
                            : "Tidak ada tagihan yang belum lunas"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

                        // ✅ FIX #1: Format tanggal transaksi untuk card
                        const tanggalTransaksi = detail.transaksi?.tanggal
                          ? formatTanggal(detail.transaksi.tanggal)
                          : "-";

                        return (
                          <div
                            key={detail.id}
                            className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md cursor-pointer transition active:scale-95"
                            onClick={() =>
                              openDetailModal(
                                detail.id,
                                customerModal.customerName,
                              )
                            }
                          >
                            <div className="flex justify-center items-center mb-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                                  isHarian
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {isHarian ? "Harian" : "Pesanan"}
                              </span>
                            </div>

                            <p
                              className="font-medium text-gray-800 text-xs sm:text-sm text-center truncate"
                              title={detail.product?.kode}
                            >
                              {detail.product?.kode}
                            </p>
                            <p
                              className="text-[10px] sm:text-xs text-gray-600 mb-1 text-center line-clamp-2"
                              title={formatProductName(detail.product)}
                            >
                              {formatProductName(detail.product)}
                            </p>

                            {/* ✅ FIX #1: Tampilkan tanggal transaksi dengan icon Calendar */}
                            <div className="flex items-center justify-center gap-1 mb-2 text-[10px] sm:text-xs text-gray-500">
                              <Calendar size={12} className="flex-shrink-0" />
                              <span>{tanggalTransaksi}</span>
                            </div>

                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">
                                Sisa Tagihan:
                              </span>
                              <span className="font-bold text-red-600 whitespace-nowrap">
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

      {/* Modal Detail Tagihan - Responsive */}
      {detailModal &&
        (() => {
          const transaksiDetail = findTransaksiDetailById(
            customers,
            detailModal.id,
          );
          if (!transaksiDetail) return null;

          const subtotal = safeParseFloat(transaksiDetail.subtotal);
          const totalBayar = Array.isArray(transaksiDetail.pembayarans)
            ? transaksiDetail.pembayarans.reduce(
                (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
                0,
              )
            : 0;
          const sisaTagihan = subtotal - totalBayar;
          const isLunas = sisaTagihan <= 0;

          // ✅ FIX #2: Gunakan 'transaksiDetail' (bukan 'detail') untuk akses tanggal
          const tanggalTransaksi = transaksiDetail.transaksi?.tanggal
            ? formatTanggal(transaksiDetail.transaksi.tanggal)
            : "-";

          return (
            <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-2 sm:p-4">
              <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
                  <h2 className="text-lg font-bold text-gray-800 text-center">
                    Detail Tagihan
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 text-center mt-1 truncate">
                    {detailModal.customerName}
                  </p>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  {transaksiDetail.product && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p
                        className="font-medium text-gray-800 text-sm truncate"
                        title={transaksiDetail.product?.kode}
                      >
                        {transaksiDetail.product?.kode}
                      </p>
                      <p
                        className="text-xs text-gray-600 line-clamp-2"
                        title={formatProductName(transaksiDetail.product)}
                      >
                        {formatProductName(transaksiDetail.product)}
                      </p>

                      {/* ✅ FIX #2: Tampilkan tanggal dengan icon Calendar */}
                      <div className="flex items-center justify-center gap-1 my-2 text-[10px] sm:text-xs text-gray-500">
                        <Calendar size={12} className="flex-shrink-0" />
                        <span>{tanggalTransaksi}</span>
                      </div>

                      <p className="text-[10px] text-gray-500 mt-1">
                        Jenis:{" "}
                        {transaksiDetail.transaksi?.jenis_transaksi === "daily"
                          ? "Harian"
                          : "Pesanan"}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-bold">
                      Rp {formatRupiah(subtotal)}
                    </span>
                  </div>

                  {Array.isArray(transaksiDetail.pembayarans) &&
                    transaksiDetail.pembayarans.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="font-medium text-blue-800 flex items-center gap-1 justify-center text-sm">
                          <Receipt size={14} /> Riwayat Pembayaran:
                        </p>
                        <ul className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                          {transaksiDetail.pembayarans.map((p) => (
                            <li
                              key={p.id}
                              className="text-xs text-gray-700 flex justify-between"
                            >
                              <span>Rp {formatRupiah(p.jumlah_bayar)}</span>
                              <span className="text-gray-500">
                                {formatTanggal(p.tanggal_bayar)}
                              </span>
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
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-2.5 rounded-lg transition active:scale-95 text-sm"
                    >
                      <Wallet size={16} /> Bayar Sekarang
                    </button>
                  )}
                </div>

                <div className="p-4 sm:p-5 border-t border-gray-200 flex justify-center">
                  <button
                    onClick={() => setDetailModal(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition"
                  >
                    Kembali
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Modal Pembayaran - Responsive */}
      {bayarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl">
            <div className="p-4 sm:p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800 text-center">
                Pembayaran Tagihan
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 text-center mt-1 truncate">
                {bayarModal.customerName}
              </p>
            </div>

            <form onSubmit={handleBayar} className="p-4 sm:p-5">
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-center">
                <p
                  className="font-medium text-gray-800 text-sm truncate"
                  title={bayarModal.transaksiDetail.product?.kode}
                >
                  {bayarModal.transaksiDetail.product?.kode}
                </p>
                <p
                  className="text-xs text-gray-600 line-clamp-2"
                  title={formatProductName(bayarModal.transaksiDetail.product)}
                >
                  {formatProductName(bayarModal.transaksiDetail.product)}
                </p>
              </div>

              <div className="space-y-2 mb-4 text-sm">
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

                <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:outline-none text-center text-sm"
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
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg text-sm transition active:scale-95"
                >
                  Bayar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerPage;
