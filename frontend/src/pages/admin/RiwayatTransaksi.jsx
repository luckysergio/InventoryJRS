import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Trash2, Receipt, Filter } from "lucide-react";
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

// ✅ Fungsi format nama produk (sama seperti di TransaksiPage & Pesanan)
const formatProductName = (p) => {
  if (!p) return "-";
  return [p.jenis?.nama, p.type?.nama, p.ukuran].filter(Boolean).join(" | ");
};

const RiwayatTransaksi = () => {
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("all"); // 'all', 'daily', 'pesanan'

  const fetchData = async () => {
    try {
      setLoading(true);

      // ✅ Bangun endpoint berdasarkan filter
      let endpoint = "/transaksi/riwayat/all"; // Asumsi: kita buat endpoint baru

      const params = new URLSearchParams();
      if (selectedCustomer) {
        params.append("customer_id", selectedCustomer);
      }
      if (selectedJenis !== "all") {
        params.append("jenis", selectedJenis);
      }

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const res = await api.get(endpoint);
      setTransaksi(res.data || []);

      const customersRes = await api.get("/customers");
      setCustomers(customersRes.data.data || []);
    } catch (err) {
      console.error("Error fetching ", err);
      Swal.fire("Error", "Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCustomer, selectedJenis]);

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Hapus Transaksi?",
      text: "Data akan dihapus permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
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

  const getTotalHarga = (detail) => {
    if (!detail) return 0;
    return safeParseFloat(detail.harga) * (parseInt(detail.qty) || 0);
  };

  const getSisaBayar = (detail) => {
    if (!detail) return 0;
    const subtotal = safeParseFloat(detail.subtotal);
    const totalBayar = (detail.pembayarans || []).reduce(
      (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
      0
    );
    return subtotal - totalBayar;
  };

  const getTotalBayar = (detail) => {
    return (detail.pembayarans || []).reduce(
      (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
      0
    );
  };

  // ✅ Fungsi untuk dapatkan warna badge berdasarkan jenis
  const getJenisBadge = (jenis) => {
    if (jenis === 'daily') {
      return { text: 'Harian (Daily)', bg: 'bg-blue-100', textClass: 'text-blue-800' };
    } else if (jenis === 'pesanan') {
      return { text: 'Pesanan', bg: 'bg-purple-100', textClass: 'text-purple-800' };
    }
    return { text: jenis, bg: 'bg-gray-100', textClass: 'text-gray-800' };
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Riwayat Transaksi</h1>

        {/* FILTER */}
        <div className="flex gap-4">
          {/* Filter Jenis Transaksi */}
          <div className="w-48">
            <label className="block text-sm font-medium mb-1">Jenis Transaksi</label>
            <select
              className="w-full border px-3 py-2 rounded-lg"
              value={selectedJenis}
              onChange={(e) => setSelectedJenis(e.target.value)}
            >
              <option value="all">Semua Jenis</option>
              <option value="daily">Harian (Daily)</option>
              <option value="pesanan">Pesanan</option>
            </select>
          </div>

          {/* Filter Customer */}
          <div className="w-48">
            <label className="block text-sm font-medium mb-1">Customer</label>
            <select
              className="w-full border px-3 py-2 rounded-lg"
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
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <p className="text-center py-8 text-gray-600">Memuat data...</p>
      ) : transaksi.length === 0 ? (
        <p className="text-center py-8 text-gray-500">Tidak ada riwayat transaksi.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transaksi.map((item) => {
            const badge = getJenisBadge(item.jenis_transaksi);
            return (
              <div key={item.id} className="p-6 bg-white rounded-xl shadow space-y-3">
                <div className="flex justify-center items-center">
                  <div>
                    <span className={`inline-block ${badge.bg} ${badge.textClass} text-xs px-2 py-1 rounded mt-1`}>
                      {badge.text}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 text-center">
                  Customer: {item.customer?.name || "–"}
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
                              <span className="text-green-600">
                                {d.statusTransaksi?.nama || "Selesai"}
                              </span>
                            </p>
                          </div>

                          <p className="text-sm text-center mt-1">
                            <span className={`font-semibold ${isLunas ? "text-green-600" : "text-orange-600"}`}>
                              {isLunas ? "✅ Lunas" : `⏳ Belum lunas (Sisa: Rp ${formatRupiah(sisaBayar)})`}
                            </span>
                          </p>

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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RiwayatTransaksi;