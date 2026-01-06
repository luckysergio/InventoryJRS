import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Trash2, Receipt, Wallet, XCircle, CheckCircle } from "lucide-react";
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
    month: "long",
    year: "numeric",
  });
};

const formatProductName = (p) => {
  if (!p) return "-";
  return [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran]
    .filter(Boolean)
    .join(" ");
};

const RiwayatTransaksi = () => {
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [tanggalDari, setTanggalDari] = useState("");
  const [tanggalSampai, setTanggalSampai] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (selectedCustomer) params.append("customer_id", selectedCustomer);
      if (selectedJenis !== "all") params.append("jenis", selectedJenis);

      const res = await api.get(
        `/transaksi/riwayat/all${
          params.toString() ? `?${params.toString()}` : ""
        }`
      );
      let data = res.data || [];

      // Filter status
      if (selectedStatus !== "all") {
        const statusIdMap = {
          selesai: 5,
          dibatalkan: 6,
        };
        const targetStatusId = statusIdMap[selectedStatus];
        data = data.filter((item) =>
          item.details.some((d) => d.status_transaksi_id === targetStatusId)
        );
      }

      // Filter rentang tanggal
      if (tanggalDari || tanggalSampai) {
        const dari = tanggalDari ? new Date(tanggalDari) : null;
        const sampai = tanggalSampai
          ? new Date(new Date(tanggalSampai).setHours(23, 59, 59, 999))
          : null;

        data = data.filter((item) =>
          item.details.some((d) => {
            const detailDate = new Date(d.tanggal);
            const afterDari = !dari || detailDate >= dari;
            const beforeSampai = !sampai || detailDate <= sampai;
            return afterDari && beforeSampai;
          })
        );
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
  }, [selectedCustomer, selectedJenis, selectedStatus, tanggalDari, tanggalSampai]);

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

  const getJenisInfo = (jenis) => {
    if (jenis === "daily") return { text: "Transaksi Harian", color: "blue" };
    if (jenis === "pesanan") return { text: "Transaksi Pesanan", color: "purple" };
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
      text: "Lainnya",
      bg: "bg-gray-100",
      textClass: "text-gray-800",
      icon: Receipt,
    };
  };

  const handleReset = () => {
    setSelectedJenis("all");
    setSelectedStatus("all");
    setSelectedCustomer("");
    setTanggalDari("");
    setTanggalSampai("");
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Riwayat Transaksi
        </h1>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={tanggalDari}
              onChange={(e) => setTanggalDari(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={tanggalSampai}
              onChange={(e) => setTanggalSampai(e.target.value)}
              min={tanggalDari || undefined}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jenis Transaksi
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={selectedJenis}
              onChange={(e) => setSelectedJenis(e.target.value)}
            >
              <option value="all">Semua Jenis</option>
              <option value="daily">Harian (Daily)</option>
              <option value="pesanan">Pesanan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="selesai">Selesai</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
          </div>

          <div className="flex items-end lg:col-span-5">
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* LIST */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {transaksi.map((item) => {
            const jenis = getJenisInfo(item.jenis_transaksi);

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden"
              >
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex justify-center items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs text-center px-2 py-1 rounded-full bg-${jenis.color}-100 text-${jenis.color}-800 font-medium`}
                        >
                          {jenis.text}
                        </span>
                      </div>
                      <p className="text-sm text-center font-medium text-gray-800 mt-1">
                        {item.customer?.name || "Customer Umum"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {item.details.map((d) => {
                    const status = getStatusInfo(d.status_transaksi_id);
                    const StatusIcon = status.icon;
                    return (
                      <div
                        key={d.id}
                        className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                      >
                        <div className="flex justify-center items-center mb-2">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 ${status.bg} ${status.textClass}`}
                          >
                            <StatusIcon size={10} />
                            {status.text}
                          </span>
                        </div>
                        <div className="flex justify-center items-center mb-2">
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">
                            {formatProductName(d.product)}
                          </p>
                        </div>

                        {d.status_transaksi_id === 6 ? (
                          <div className="text-center text-xs text-gray-600 italic mt-2">
                            Detail ini telah dibatalkan.
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 mb-2">
                              <p>Qty: {d.qty}</p>
                              <p className="text-right">
                                {formatTanggal(d.tanggal)}
                              </p>
                              <p>Harga: Rp {formatRupiah(d.harga)}</p>
                              <p className="text-right">
                                Diskon: Rp {formatRupiah(d.discount)}
                              </p>
                            </div>

                            {d.pembayarans?.length > 0 && (
                              <div className="mt-3 pt-2 border-t border-gray-200">
                                <p className="text-[10px] font-medium text-gray-700 flex justify-center gap-1">
                                  <Wallet size={10} /> Riwayat Pembayaran
                                </p>
                                <ul className="mt-1 space-y-1">
                                  {d.pembayarans.map((p) => (
                                    <li
                                      key={p.id}
                                      className="text-[10px] text-gray-600 flex justify-between"
                                    >
                                      <span>
                                        {formatTanggal(p.tanggal_bayar)}
                                      </span>
                                      <span>Rp {formatRupiah(p.jumlah_bayar)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-full flex justify-center items-center gap-2 text-xs text-red-600 hover:text-red-800 py-1.5 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 size={14} /> Hapus Transaksi
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RiwayatTransaksi;