import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  Trash2,
  Receipt,
  Wallet,
  XCircle,
  CheckCircle,
  Calendar,
  Search,
  X,
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

const formatTanggal = (tgl) => {
  if (!tgl) return "-";
  return new Date(tgl).toLocaleDateString("id-ID", {
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

export const RiwayatTransaksiFilterBar = ({
  tanggalDari,
  setTanggalDari,
  tanggalSampai,
  setTanggalSampai,
  selectedJenis,
  setSelectedJenis,
  selectedStatus,
  setSelectedStatus,
  selectedCustomer,
  setSelectedCustomer,
  customers,
  handleReset,
}) => (
  <div className="flex items-center gap-2 w-full">
    <div className="hidden sm:flex flex-wrap items-center gap-2 flex-1">
      <div className="relative w-[150px]">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="date"
          value={tanggalDari}
          onChange={(e) => setTanggalDari(e.target.value)}
          className="w-full pl-10 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        />
      </div>
      <div className="relative w-[150px]">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="date"
          value={tanggalSampai}
          onChange={(e) => setTanggalSampai(e.target.value)}
          min={tanggalDari || undefined}
          className="w-full pl-10 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        />
      </div>
      <select
        className="py-1.5 px-3 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none min-w-[120px]"
        value={selectedJenis}
        onChange={(e) => setSelectedJenis(e.target.value)}
      >
        <option value="all">Semua Jenis</option>
        <option value="daily">Harian</option>
        <option value="pesanan">Pesanan</option>
      </select>
      <select
        className="py-1.5 px-3 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none min-w-[140px]"
        value={selectedCustomer}
        onChange={(e) => setSelectedCustomer(e.target.value)}
      >
        <option value="">Semua Customer</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleReset}
        className="py-1.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition"
      >
        Reset
      </button>
    </div>

    <div className="sm:hidden flex flex-wrap items-center gap-2 w-full justify-center">
      <select
        className="py-1 px-2 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none min-w-[100px]"
        value={selectedJenis}
        onChange={(e) => setSelectedJenis(e.target.value)}
      >
        <option value="all">Jenis</option>
        <option value="daily">Harian</option>
        <option value="pesanan">Pesanan</option>
      </select>
      <select
        className="py-1 px-2 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none min-w-[100px]"
        value={selectedCustomer}
        onChange={(e) => setSelectedCustomer(e.target.value)}
      >
        <option value="">Customer</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        className="py-1 px-2 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none min-w-[100px]"
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
      >
        <option value="all">Status</option>
        <option value="selesai">Selesai</option>
        <option value="dibatalkan">Dibatalkan</option>
      </select>
    </div>
  </div>
);

const RiwayatTransaksi = ({ setNavbarContent }) => {
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [tanggalDari, setTanggalDari] = useState("");
  const [tanggalSampai, setTanggalSampai] = useState("");
  const [selectedTransaksi, setSelectedTransaksi] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCustomer) params.append("customer_id", selectedCustomer);
      if (selectedJenis !== "all") params.append("jenis", selectedJenis);

      const res = await api.get(
        `/transaksi/riwayat/all${
          params.toString() ? `?${params.toString()}` : ""
        }`,
      );
      let data = res.data || [];

      // Filter berdasarkan status (masih di detail)
      if (selectedStatus !== "all") {
        const statusIdMap = { selesai: 5, dibatalkan: 6 };
        const targetStatusId = statusIdMap[selectedStatus];
        data = data.filter((item) =>
          item.details.some((d) => d.status_transaksi_id === targetStatusId),
        );
      }

      // Filter berdasarkan tanggal (sekarang di level transaksi)
      if (tanggalDari || tanggalSampai) {
        const dari = tanggalDari ? new Date(tanggalDari) : null;
        const sampai = tanggalSampai
          ? new Date(new Date(tanggalSampai).setHours(23, 59, 59, 999))
          : null;

        data = data.filter((item) => {
          const transaksiDate = new Date(item.tanggal); // ← ambil dari item, bukan detail
          return (
            (!dari || transaksiDate >= dari) &&
            (!sampai || transaksiDate <= sampai)
          );
        });
      }

      setTransaksi(data);

      const customersRes = await api.get("/customers");
      setCustomers(customersRes.data.data || []);
    } catch (err) {
      console.error("Error fetching riwayat transaksi:", err);
      Swal.fire("Error", "Gagal memuat data riwayat transaksi", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    selectedCustomer,
    selectedJenis,
    selectedStatus,
    tanggalDari,
    tanggalSampai,
  ]);

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Hapus Transaksi?",
      text: "Data akan dihapus permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      confirmButtonColor: "#d33",
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/transaksi/${id}`);
        Swal.fire("Berhasil", "Transaksi terhapus", "success");
        fetchData();
      } catch (err) {
        Swal.fire("Error", "Gagal menghapus transaksi", "error");
      }
    }
  };

  const openPaymentModal = (transaksiItem) => {
    setSelectedTransaksi(transaksiItem);
    setIsModalOpen(true);
  };

  const getJenisInfo = (jenis) => {
    if (jenis === "daily") return { text: "Harian", color: "blue" };
    if (jenis === "pesanan") return { text: "Pesanan", color: "purple" };
    return { text: jenis, color: "gray" };
  };

  const getStatusInfo = (statusId) => {
    if (statusId === 5)
      return {
        text: "Selesai",
        bg: "bg-green-100",
        textClass: "text-green-800",
        icon: CheckCircle,
      };
    if (statusId === 6)
      return {
        text: "Dibatalkan",
        bg: "bg-red-100",
        textClass: "text-red-800",
        icon: XCircle,
      };
    return {
      text: "Aktif",
      bg: "bg-blue-100",
      textClass: "text-blue-800",
      icon: Receipt,
    };
  };

  const getInvoiceNumber = (transaksiItem) => {
    const date = new Date(transaksiItem.tanggal || new Date());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `JRS/INV/${year}/${month}/${transaksiItem.id}`;
  };

  const calculateTotalTagihan = (details) => {
    return details.reduce((sum, d) => sum + safeParseFloat(d.subtotal), 0);
  };

  const calculateTotalBayar = (details) => {
    return details.reduce((sum, d) => {
      return (
        sum +
        (d.pembayarans?.reduce(
          (s, p) => s + safeParseFloat(p.jumlah_bayar),
          0,
        ) || 0)
      );
    }, 0);
  };

  const handleReset = () => {
    setSelectedJenis("all");
    setSelectedStatus("all");
    setSelectedCustomer("");
    setTanggalDari("");
    setTanggalSampai("");
  };

  useEffect(() => {
    setNavbarContent(
      <RiwayatTransaksiFilterBar
        tanggalDari={tanggalDari}
        setTanggalDari={setTanggalDari}
        tanggalSampai={tanggalSampai}
        setTanggalSampai={setTanggalSampai}
        selectedJenis={selectedJenis}
        setSelectedJenis={setSelectedJenis}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        customers={customers}
        handleReset={handleReset}
      />,
    );
  }, [
    tanggalDari,
    tanggalSampai,
    selectedJenis,
    selectedStatus,
    selectedCustomer,
    customers,
    setNavbarContent,
  ]);

  return (
    <div className="space-y-6 p-2 md:p-4 max-w-7xl mx-auto">
      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Memuat riwayat transaksi...</p>
          </div>
        </div>
      ) : transaksi.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
            <Receipt size={28} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            Tidak Ada Data
          </h3>
          <p className="text-gray-600 mt-2">
            Tidak ada transaksi yang sesuai dengan filter saat ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {transaksi.map((item) => {
            const jenis = getJenisInfo(item.jenis_transaksi);
            const totalTagihan = calculateTotalTagihan(item.details);
            const totalBayar = calculateTotalBayar(item.details);
            const isLunas = Math.abs(totalTagihan - totalBayar) < 1;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden flex flex-col h-full cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openPaymentModal(item)}
              >
                {/* Header */}
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono text-gray-600 block">
                        {getInvoiceNumber(item)}
                      </span>
                    </div>
                    {role === "admin" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="flex justify-center items-center">
                    <span className="text-sm font-medium text-gray-800 mt-2 truncate">
                      {item.customer?.name || "Customer Umum"} -{" "}
                      {formatTanggal(item.tanggal)}
                    </span>
                  </div>
                  <div className="flex justify-center items-center">
                    <span
                      className={`text-[10px] mt-1 px-2 py-0.5 rounded-full bg-${jenis.color}-100 text-${jenis.color}-800 font-medium`}
                    >
                      {jenis.text}
                    </span>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-700">Total Tagihan:</span>
                    <span className="font-semibold">
                      Rp {formatRupiah(totalTagihan)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px] mt-1">
                    <span className="text-gray-700">Total Bayar:</span>
                    <span
                      className={`font-semibold ${
                        isLunas ? "text-green-600" : "text-orange-600"
                      }`}
                    >
                      Rp {formatRupiah(totalBayar)}
                    </span>
                  </div>
                  {!isLunas && (
                    <div className="flex justify-between text-[11px] mt-1">
                      <span className="text-gray-700">Sisa:</span>
                      <span className="font-semibold text-red-600">
                        Rp {formatRupiah(totalTagihan - totalBayar)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[180px]">
                  {item.details.slice(0, 2).map((d) => {
                    const status = getStatusInfo(d.status_transaksi_id);
                    const StatusIcon = status.icon;
                    return (
                      <div
                        key={d.id}
                        className="text-[11px] flex justify-between"
                      >
                        <span className="truncate max-w-[70%]">
                          {d.product?.kode || "-"}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${status.bg} ${status.textClass}`}
                        >
                          <StatusIcon size={9} />
                        </span>
                      </div>
                    );
                  })}
                  {item.details.length > 2 && (
                    <p className="text-[10px] text-gray-500 italic text-center">
                      +{item.details.length - 2} item lainnya
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && selectedTransaksi && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Detail Transaksi
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Invoice</p>
                    <p className="font-mono font-medium">
                      {getInvoiceNumber(selectedTransaksi)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium">
                      {selectedTransaksi.customer?.name || "Umum"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tanggal</p>
                    <p className="font-medium">
                      {formatTanggal(selectedTransaksi.tanggal)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {selectedTransaksi.details.map((d) => {
                  const status = getStatusInfo(d.status_transaksi_id);
                  const StatusIcon = status.icon;
                  const isDibatalkan = status.text === "Dibatalkan";

                  return (
                    <div
                      key={d.id}
                      className="border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-sm">
                            {formatProductName(d.product)}
                          </h3>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-1 rounded-full flex items-center gap-1 ${status.bg} ${status.textClass}`}
                        >
                          <StatusIcon size={12} />
                          {status.text}
                        </span>
                      </div>

                      {!isDibatalkan && (
                        <>
                          <div className="text-xs mb-3 space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {d.qty} × Rp {formatRupiah(d.harga)}
                              </span>
                              <span>
                                Rp{" "}
                                {formatRupiah(
                                  safeParseFloat(d.qty) *
                                    safeParseFloat(d.harga),
                                )}
                              </span>
                            </div>

                            <div className="flex justify-between text-red-600">
                              <span>Diskon</span>
                              <span>Rp {formatRupiah(d.discount)}</span>
                            </div>

                            <div className="border-t border-gray-200 my-1"></div>

                            <div className="flex justify-between font-semibold">
                              <span>Tagihan</span>
                              <span>
                                Rp{" "}
                                {formatRupiah(
                                  safeParseFloat(d.qty) *
                                    safeParseFloat(d.harga) -
                                    safeParseFloat(d.discount),
                                )}
                              </span>
                            </div>
                          </div>

                          {d.catatan && (
                            <p className="text-xs italic text-gray-700 mb-3">
                              Catatan: {d.catatan}
                            </p>
                          )}

                          {d.pembayarans && d.pembayarans.length > 0 ? (
                            <div>
                              <h4 className="font-medium text-gray-800 mb-2 flex justify-center items-center gap-1 text-sm">
                                <Wallet size={14} /> Riwayat Pembayaran
                              </h4>
                              <div className="space-y-1">
                                {d.pembayarans.map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex justify-between text-xs bg-gray-50 p-1.5 rounded"
                                  >
                                    <span>
                                      {formatTanggal(p.tanggal_bayar)}
                                    </span>
                                    <span className="font-medium">
                                      Rp {formatRupiah(p.jumlah_bayar)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 italic">
                              Belum ada pembayaran
                            </p>
                          )}
                        </>
                      )}

                      {isDibatalkan && (
                        <p className="text-xs text-center text-gray-500 italic">
                          Transaksi ini telah dibatalkan.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiwayatTransaksi;
