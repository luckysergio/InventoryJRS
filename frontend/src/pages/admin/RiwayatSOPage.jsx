// src/pages/admin/RiwayatSOPage.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import { Printer, Calendar } from "lucide-react";
import api from "../../services/api";

const formatProductName = (p) => {
  if (!p) return "-";
  return [p.jenis?.nama, p.type?.nama, p.ukuran].filter(Boolean).join(" | ");
};

// ✅ Komponen Filter untuk Navbar
export const RiwayatSOFilterBar = ({
  tglDari,
  setTglDari,
  tglSampai,
  setTglSampai,
  statusFilter,
  setStatusFilter,
  handleReset,
}) => (
  <div className="flex items-center gap-2 w-full">
    {/* Tanggal Dari */}
    <div className="relative flex-1 min-w-[100px] sm:min-w-[150px]">
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="date"
        value={tglDari}
        onChange={(e) => setTglDari(e.target.value)}
        className="w-full pl-10 pr-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded text-gray-700 focus:ring-1 focus:ring-indigo-200 focus:outline-none"
        placeholder="Dari"
      />
    </div>

    {/* Tanggal Sampai */}
    <div className="relative flex-1 min-w-[100px] sm:min-w-[150px]">
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="date"
        value={tglSampai}
        onChange={(e) => setTglSampai(e.target.value)}
        min={tglDari || undefined}
        className="w-full pl-10 pr-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded text-gray-700 focus:ring-1 focus:ring-indigo-200 focus:outline-none"
        placeholder="Sampai"
      />
    </div>

    {/* Status */}
<select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  className="hidden sm:block py-1.5 px-2 text-xs sm:text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-200 focus:outline-none min-w-[100px] sm:min-w-[120px]"
>
  <option value="">Semua Status</option>
  <option value="selesai">Selesai</option>
  <option value="dibatalkan">Dibatalkan</option>
</select>

{/* Reset Button */}
<button
  onClick={handleReset}
  className="hidden sm:inline-flex py-1.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs sm:text-sm whitespace-nowrap font-medium transition"
>
  Reset
</button>

  </div>
);

const RiwayatSOPage = ({ setNavbarContent }) => {
  const [stokOpnames, setStokOpnames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tglDari, setTglDari] = useState("");
  const [tglSampai, setTglSampai] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const opnameRes = await api.get("/stok-opname");
      setStokOpnames(opnameRes.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      Swal.fire("Error", "Gagal memuat riwayat stok opname", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredOpnames = useMemo(() => {
    return stokOpnames.filter((op) => {
      if (op.status === "draft") return false;

      const opDate = new Date(op.tgl_opname);

      // Filter tanggal
      if (tglDari) {
        const dari = new Date(tglDari);
        if (opDate < dari) return false;
      }
      if (tglSampai) {
        const sampai = new Date(tglSampai);
        sampai.setHours(23, 59, 59, 999); // akhir hari
        if (opDate > sampai) return false;
      }

      // Filter status
      if (statusFilter && op.status !== statusFilter) return false;

      return true;
    });
  }, [stokOpnames, tglDari, tglSampai, statusFilter]);

  const handlePrint = (opname) => {
    const statusMap = {
      draft: "Draft (Belum Selesai)",
      selesai: "Selesai",
      dibatalkan: "Dibatalkan",
    };
    const statusLabel = statusMap[opname.status] || opname.status;

    const printWindow = window.open("", "_blank");
    const content = `
      <html>
        <head>
          <title>Stok Opname #${opname.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
            h1 { text-align: center; color: #4f46e5; margin-bottom: 20px; }
            .header { margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid #eee; }
            .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
            .card-title { font-weight: 600; color: #1f2937; margin-bottom: 8px; }
            .card-row { display: flex; justify-content: space-between; margin: 4px 0; }
            .label { color: #6b7280; }
            .value { font-weight: 500; }
            .selisih.pos { color: #10b981; }
            .selisih.neg { color: #ef4444; }
          </style>
        </head>
        <body>
          <h1>Laporan Stok Opname #${opname.id}</h1>
          <div class="header">
            <div class="card-row"><span class="label">Tanggal:</span> <span class="value">${new Date(
              opname.tgl_opname
            ).toLocaleDateString("id-ID")}</span></div>
            <div class="card-row"><span class="label">Status:</span> <span class="value">${statusLabel}</span></div>
            <div class="card-row"><span class="label">Oleh:</span> <span class="value">${
              opname.user?.name || "–"
            }</span></div>
          </div>
          ${opname.details
            .map(
              (d) => `
              <div class="card">
                <div class="card-title">${formatProductName(
                  d.inventory?.product
                )} | ${d.inventory?.place?.nama || "–"}</div>
                <div class="card-row"><span class="label">Kode:</span> <span>${
                  d.inventory?.product?.kode || "–"
                }</span></div>
                <div class="card-row"><span class="label">Stok Sistem:</span> <span>${
                  d.stok_sistem
                }</span></div>
                <div class="card-row"><span class="label">Stok Fisik:</span> <span>${
                  d.stok_real !== null && d.stok_real !== undefined
                    ? d.stok_real
                    : "–"
                }</span></div>
                <div class="card-row"><span class="label">Selisih:</span> <span class="selisih ${
                  d.selisih > 0 ? "pos" : d.selisih < 0 ? "neg" : ""
                }">${
                d.selisih !== null && d.selisih !== undefined ? d.selisih : "–"
              }</span></div>
                ${
                  d.keterangan
                    ? `<div class="card-row"><span class="label">Keterangan:</span> <span>${d.keterangan}</span></div>`
                    : ""
                }
              </div>
            `
            )
            .join("")}
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  const handleReset = () => {
    setTglDari("");
    setTglSampai("");
    setStatusFilter("");
  };

  // ✅ Kirim filter ke Navbar - HAPUS setNavbarContent dari dependencies
  useEffect(() => {
    setNavbarContent(
      <RiwayatSOFilterBar
        tglDari={tglDari}
        setTglDari={setTglDari}
        tglSampai={tglSampai}
        setTglSampai={setTglSampai}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        handleReset={handleReset}
      />
    );
  }, [tglDari, tglSampai, statusFilter]); // ❌ TIDAK ADA setNavbarContent DI SINI

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-2 md:p-4">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Memuat data riwayat stok opname...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-4 space-y-6">
      {filteredOpnames.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 mb-4">
            <Printer size={28} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Tidak Ada Riwayat</h3>
          <p className="text-gray-600 mt-2">
            Belum ada stok opname yang telah diselesaikan atau dibatalkan dalam rentang tanggal ini.
          </p>
        </div>
      ) : (
        filteredOpnames.map((op) => (
          <div
            key={op.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md"
          >
            <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {op.keterangan || `Opname #${op.id}`}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Tanggal:{" "}
                    <span className="font-medium">
                      {new Date(op.tgl_opname).toLocaleDateString("id-ID")}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Dibuat oleh:{" "}
                    <span className="font-medium">{op.user?.name || "–"}</span>
                  </p>
                  <span
                    className={`inline-block mt-2 px-2.5 py-1 text-xs rounded-full ${
                      op.status === "selesai"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {op.status === "selesai" ? "Selesai" : "Dibatalkan"}
                  </span>
                </div>
                <button
                  onClick={() => handlePrint(op)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-white text-xs rounded-lg hover:bg-gray-800 transition"
                >
                  <Printer size={14} /> Cetak
                </button>
              </div>
            </div>

            <div className="p-4 md:p-5">
              {op.details?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Tidak ada item dalam opname ini.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {op.details.map((d) => (
                    <div
                      key={d.id}
                      className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                    >
                      <div className="font-semibold text-gray-800 text-sm mb-2 text-center">
                        {formatProductName(d.inventory?.product)}
                      </div>
                      <p className="text-xs text-center text-gray-600 mb-1">
                        {d.inventory?.place?.nama || "–"}
                      </p>

                      <div className="space-y-1.5 mt-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Stok Sistem</span>
                          <span className="font-medium">{d.stok_sistem}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Stok Fisik</span>
                          <span className="font-medium">
                            {d.stok_real !== null && d.stok_real !== undefined
                              ? d.stok_real
                              : "–"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Selisih</span>
                          <span
                            className={`font-medium ${
                              d.selisih > 0
                                ? "text-green-600"
                                : d.selisih < 0
                                ? "text-red-600"
                                : "text-gray-500"
                            }`}
                          >
                            {d.selisih !== null && d.selisih !== undefined
                              ? d.selisih
                              : "–"}
                          </span>
                        </div>
                      </div>

                      {d.keterangan && (
                        <p className="text-xs text-center text-gray-600 mt-2">
                          <span className="font-medium"></span> {d.keterangan}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default RiwayatSOPage;