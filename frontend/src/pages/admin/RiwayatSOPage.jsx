import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { Printer } from "lucide-react";
import api from "../../services/api";

const formatProductName = (p) => {
  if (!p) return "-";
  return [p.jenis?.nama, p.type?.nama, p.ukuran].filter(Boolean).join(" | ");
};

const RiwayatSOPage = () => {
  const [stokOpnames, setStokOpnames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulanFilter, setBulanFilter] = useState("");
  const [tahunFilter, setTahunFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i).sort(
    (a, b) => b - a
  );

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredOpnames = useMemo(() => {
    return stokOpnames.filter((op) => {
      if (op.status === "draft") return false;

      const opDate = new Date(op.tgl_opname);
      const opBulan = String(opDate.getMonth() + 1);
      const opTahun = String(opDate.getFullYear());

      // Filter bulan
      if (bulanFilter && opBulan !== bulanFilter) return false;

      // Filter tahun
      if (tahunFilter && opTahun !== tahunFilter) return false;

      // Filter status
      if (statusFilter && op.status !== statusFilter) return false;

      return true;
    });
  }, [stokOpnames, bulanFilter, tahunFilter, statusFilter]);

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
                  d.stok_real
                }</span></div>
                <div class="card-row"><span class="label">Selisih:</span> <span class="selisih ${
                  d.selisih > 0 ? "pos" : d.selisih < 0 ? "neg" : ""
                }">${d.selisih}</span></div>
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Memuat riwayat stok opname...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-800">Riwayat Stok Opname</h1>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Bulan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bulan
            </label>
            <select
              value={bulanFilter}
              onChange={(e) => setBulanFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Semua Bulan</option>
              {Array.from({ length: 12 }, (_, i) => {
                const monthNum = i + 1;
                const monthName = new Date(2000, i, 1).toLocaleDateString(
                  "id-ID",
                  { month: "long" }
                );
                return (
                  <option key={monthNum} value={String(monthNum)}>
                    {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Tahun */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tahun
            </label>
            <select
              value={tahunFilter}
              onChange={(e) => setTahunFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Semua Tahun</option>
              {years.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Semua Status</option>
              <option value="selesai">Selesai</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setBulanFilter("");
                setTahunFilter("");
                setStatusFilter("");
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Daftar Riwayat */}
      {filteredOpnames.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Tidak ada riwayat stok opname yang sesuai filter.
        </p>
      ) : (
        filteredOpnames.map((op) => (
          <div
            key={op.id}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-6"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {op.keterangan}
                </h3>
                <p className="text-sm text-gray-600">
                  Tanggal: {new Date(op.tgl_opname).toLocaleDateString("id-ID")}
                </p>
                <p className="text-sm text-gray-600">
                  Oleh: {op.user?.name || "–"}
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 transition"
              >
                <Printer size={14} /> Cetak
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {op.details?.map((d) => (
                <div
                  key={d.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="font-medium text-gray-800 mb-2">
                    {formatProductName(d.inventory?.product)} |{" "}
                    {d.inventory?.place?.nama}
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">
                        Kode:{" "}
                        <span className="font-medium">
                          {d.inventory?.product?.kode || "–"}
                        </span>
                      </p>
                      <p className="text-gray-600">
                        Stok Sistem:{" "}
                        <span className="font-medium">{d.stok_sistem}</span>
                      </p>
                      <p className="text-gray-600">
                        Stok Fisik:{" "}
                        <span className="font-medium">{d.stok_real}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        Selisih:{" "}
                        <span
                          className={`font-medium ${
                            d.selisih > 0
                              ? "text-green-600"
                              : d.selisih < 0
                              ? "text-red-600"
                              : ""
                          }`}
                        >
                          {d.selisih}
                        </span>
                      </p>
                      {d.keterangan && (
                        <p className="text-gray-600 mt-1">
                          <span className="font-medium">Keterangan:</span>{" "}
                          {d.keterangan}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default RiwayatSOPage;
