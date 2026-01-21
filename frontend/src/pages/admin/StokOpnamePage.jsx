import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import {
  Plus,
  Printer,
  X,
  Edit3,
  CheckCircle,
  XCircle,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import api from "../../services/api";

const formatProductName = (p) => {
  if (!p) return "-";
  return [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran]
    .filter(Boolean)
    .join(" ");
};

const StokOpnamePage = () => {
  const [inventories, setInventories] = useState([]);
  const [places, setPlaces] = useState([]);
  const [stokOpnames, setStokOpnames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formHeader, setFormHeader] = useState({
    tgl_opname: new Date().toISOString().split("T")[0],
    keterangan: "",
  });

  const [selectedInventoryIds, setSelectedInventoryIds] = useState(new Set());
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, placeRes, opnameRes] = await Promise.all([
        api.get("/inventories"),
        api.get("/places"),
        api.get("/stok-opname"),
      ]);
      setInventories(invRes.data.data || []);
      setPlaces(placeRes.data.data || []);
      setStokOpnames(opnameRes.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      Swal.fire("Error", "Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const draftOpnames = useMemo(
    () => stokOpnames.filter((op) => op.status === "draft"),
    [stokOpnames]
  );

  const filteredInventories = useMemo(() => {
    let result = [...inventories];
    if (selectedPlaceId) {
      result = result.filter((inv) => inv.place_id === Number(selectedPlaceId));
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((inv) => {
        const p = inv.product;
        if (!p) return false;
        return (
          p.kode?.toLowerCase().includes(term) ||
          formatProductName(p).toLowerCase().includes(term)
        );
      });
    }
    return result;
  }, [inventories, selectedPlaceId, searchTerm]);

  const toggleInventorySelection = (id) => {
    const newSet = new Set(selectedInventoryIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedInventoryIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedInventoryIds.size === filteredInventories.length) {
      setSelectedInventoryIds(new Set());
    } else {
      const allIds = new Set(filteredInventories.map((inv) => inv.id));
      setSelectedInventoryIds(allIds);
    }
  };

  const handleCreateOpname = async () => {
    if (selectedInventoryIds.size === 0) {
      Swal.fire("Peringatan", "Pilih minimal satu inventory", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        tgl_opname: formHeader.tgl_opname,
        keterangan: formHeader.keterangan,
        inventory_ids: Array.from(selectedInventoryIds),
      };
      await api.post("/stok-opname", payload);
      Swal.fire("Berhasil!", "Stok opname dibuat", "success");
      setIsCreating(false);
      setSelectedInventoryIds(new Set());
      setFormHeader({
        tgl_opname: new Date().toISOString().split("T")[0],
        keterangan: "",
      });
      fetchData();
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Gagal membuat opname",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStokReal = async (
    detailId,
    inventoryId,
    currentReal,
    currentKeterangan
  ) => {
    const { value: result } = await Swal.fire({
      title: "Input Stok Fisik & Keterangan",
      html: `
        <input type="number" id="stokReal" class="swal2-input" placeholder="Stok Fisik" value="${currentReal || ""}">
        <input type="text" id="keterangan" class="swal2-input" placeholder="Keterangan (opsional)" value="${currentKeterangan || ""}">
      `,
      preConfirm: () => {
        const stokRealInput = document.getElementById("stokReal").value;
        const keterangan = document.getElementById("keterangan").value;

        if (stokRealInput === "") {
          return { stokReal: null, keterangan };
        }

        const stokReal = parseInt(stokRealInput, 10);
        if (isNaN(stokReal) || stokReal < 0) {
          Swal.showValidationMessage("Stok fisik harus ≥ 0 atau dikosongkan");
          return false;
        }
        return { stokReal, keterangan };
      },
    });

    if (result && result !== false) {
      try {
        const opname = stokOpnames.find((o) =>
          o.details?.some((d) => d.id === detailId)
        );
        if (!opname) return;
        await api.post(`/stok-opname/${opname.id}/detail`, {
          inventory_id: inventoryId,
          stok_real: result.stokReal,
          keterangan: result.keterangan,
        });
        fetchData();
      } catch (err) {
        Swal.fire("Error", "Gagal menyimpan data", "error");
      }
    }
  };

  const handleSelesaiOpname = async (opnameId) => {
    const opname = stokOpnames.find((o) => o.id === opnameId);
    if (!opname) return;

    const hasUnfilled = opname.details?.some(
      (d) => d.stok_real === null || d.stok_real === undefined
    );

    let shouldProceed = true;
    if (hasUnfilled) {
      const confirm = await Swal.fire({
        title: "Item Belum Lengkap!",
        text: "Beberapa item belum diisi stok fisiknya. Lanjutkan?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, Selesaikan",
        cancelButtonText: "Batal",
      });
      shouldProceed = confirm.isConfirmed;
    } else {
      const confirm = await Swal.fire({
        title: "Selesaikan Opname?",
        text: "Setelah diselesaikan, data tidak bisa diubah lagi.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, Selesaikan",
        cancelButtonText: "Batal",
      });
      shouldProceed = confirm.isConfirmed;
    }

    if (!shouldProceed) return;

    try {
      await api.post(`/stok-opname/${opnameId}/selesai`);
      Swal.fire("Berhasil!", "Stok opname telah diselesaikan", "success");
      fetchData();
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Gagal menyelesaikan opname",
        "error"
      );
    }
  };

  const handleBatalkanOpname = async (opnameId) => {
    const confirm = await Swal.fire({
      title: "Batalkan Opname?",
      text: "Semua data pada opname ini akan dihapus.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Batalkan",
      cancelButtonText: "Batal",
    });

    if (confirm.isConfirmed) {
      try {
        await api.post(`/stok-opname/${opnameId}/batal`);
        Swal.fire("Dibatalkan", "Stok opname berhasil dibatalkan", "info");
        fetchData();
      } catch (err) {
        Swal.fire("Error", "Gagal membatalkan opname", "error");
      }
    }
  };

  const formatDateForPrint = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handlePrint = (opname) => {
    const opnameDate = new Date(opname.tgl_opname);
    const year = opnameDate.getFullYear();
    const month = String(opnameDate.getMonth() + 1).padStart(2, "0");
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      Swal.fire("Error", "Gagal membuka jendela cetak", "error");
      return;
    }

    let detailsHtml = "";
    if (opname.details && opname.details.length > 0) {
      // ✅ Urutkan detail untuk cetak: BENGKEL dulu, lalu TOKO
      const sortedDetails = [...opname.details].sort((a, b) => {
        const getPriority = (kode) => {
          if (kode === "BENGKEL") return 0;
          if (kode === "TOKO") return 1;
          return 2;
        };
        const prioA = getPriority(a.inventory?.place?.kode);
        const prioB = getPriority(b.inventory?.place?.kode);
        return prioA - prioB;
      });

      detailsHtml = sortedDetails
        .map((d) => {
          const productName = formatProductName(d.inventory?.product) || "-";
          const placeName = d.inventory?.place?.nama || "–";
          const stokSistem = d.stok_sistem || 0;
          const stokReal = d.stok_real !== null && d.stok_real !== undefined ? d.stok_real : " ";
          const selisih = d.selisih !== null && d.selisih !== undefined ? d.selisih : " ";
          const selisihClass = selisih > 0 ? "pos" : selisih < 0 ? "neg" : "";
          const keteranganHtml = d.keterangan
            ? `<div class="card-row"><span class="label">Keterangan:</span> <span>${d.keterangan}</span></div>`
            : "";

          return `
            <div class="card">
              <div class="card-title">${productName} | ${placeName}</div>
              <div class="card-row"><span class="label">Stok Sistem:</span> <span>${stokSistem}</span></div>
              <div class="card-row"><span class="label">Stok Fisik:</span> <span>${stokReal}</span></div>
              <div class="card-row"><span class="label">Selisih:</span> <span class="selisih ${selisihClass}">${selisih}</span></div>
              ${keteranganHtml}
            </div>
          `;
        })
        .join("");
    }

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stok Opname JRS/SO/${year}/${month}/${opname.id}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 20px;
              color: #333;
              width: 210mm;
              margin: 0 auto;
            }
            @media print {
              body { padding: 10mm; }
              .no-print { display: none !important; }
            }
            h1 {
              text-align: center;
              color: #4f46e5;
              margin-bottom: 20px;
              line-height: 1.4;
            }
            .header {
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 2px solid #eee;
            }
            .card {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 14px;
              margin-bottom: 10px;
              page-break-inside: avoid;
            }
            .card-title {
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 6px;
              font-size: 10px;
              line-height: 1.4;
              word-wrap: break-word;
              hyphens: auto;
            }
            .card-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
              font-size: 11px;
            }
            .label { color: #6b7280; }
            .value { font-weight: 500; }
            .selisih.pos { color: #10b981; }
            .selisih.neg { color: #ef4444; }
            .print-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 10px;
            }
          </style>
        </head>
        <body>
          <h1>Laporan Stok Opname (Draft)<br>JRS/SO/${year}/${month}/${opname.id}</h1>
          <div class="header">
            <div class="card-row"><span class="label">Tanggal:</span> <span class="value">${formatDateForPrint(opname.tgl_opname)}</span></div>
            <div class="card-row"><span class="label">Status:</span> <span class="value">Draft (Belum Selesai)</span></div>
            <div class="card-row"><span class="label">Oleh:</span> <span class="value">${
              opname.user?.name || "–"
            }</span></div>
          </div>
          <div class="print-grid">
            ${detailsHtml}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Memuat data stok opname...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {draftOpnames.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 mb-4">
            <Edit3 size={28} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            Belum Ada Opname Aktif
          </h3>
          <p className="text-gray-600 mt-2">
            Buat stok opname baru untuk memulai proses pencocokan stok.
          </p>
          {(role === "admin" || role === "operator") && (
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              Buat Opname Sekarang
            </button>
          )}
        </div>
      ) : (
        draftOpnames.map((op) => (
          <div
            key={op.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md"
          >
            <div className="p-5 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {op.keterangan || `JRS/SO/${new Date(op.tgl_opname).getFullYear()}/${String(new Date(op.tgl_opname).getMonth() + 1).padStart(2, "0")}/${op.id}`}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Tanggal:{" "}
                    <span className="font-medium">
                      {new Date(op.tgl_opname).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Dibuat oleh:{" "}
                    <span className="font-medium">{op.user?.name || "–"}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handlePrint(op)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-white text-xs rounded-lg hover:bg-gray-800 transition no-print"
                  >
                    <Printer size={14} /> Cetak
                  </button>
                  {role === "admin" && (
                    <button
                      onClick={() => handleSelesaiOpname(op.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition no-print"
                    >
                      <CheckCircle size={14} /> Selesai
                    </button>
                  )}
                  {role === "admin" && (
                    <button
                      onClick={() => handleBatalkanOpname(op.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition no-print"
                    >
                      <XCircle size={14} /> Batal
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5">
              {op.details?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Tidak ada item dalam opname ini.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {/* ✅ URUTKAN DI SINI: BENGKEL dulu, lalu TOKO */}
                  {(() => {
                    const sortedDetails = [...op.details].sort((a, b) => {
                      const getPriority = (kode) => {
                        if (kode === "BENGKEL") return 0;
                        if (kode === "TOKO") return 1;
                        return 2;
                      };
                      const prioA = getPriority(a.inventory?.place?.kode);
                      const prioB = getPriority(b.inventory?.place?.kode);
                      return prioA - prioB;
                    });

                    return sortedDetails.map((d) => (
                      <div
                        key={d.id}
                        className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors min-w-[160px]"
                      >
                        <div className="font-semibold text-gray-800 text-sm mb-2 text-center break-words">
                          {formatProductName(d.inventory?.product)}
                        </div>
                        <p className="text-xs text-gray-600 mb-1 text-center">
                          {d.inventory?.place?.nama || "–"}
                        </p>

                        <div className="space-y-1.5 mt-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Stok Sistem</span>
                            <span className="font-medium">{d.stok_sistem}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Stok Fisik</span>
                            <span
                              className="font-medium text-indigo-700 underline cursor-pointer"
                              onClick={() =>
                                handleUpdateStokReal(
                                  d.id,
                                  d.inventory_id,
                                  d.stok_real,
                                  d.keterangan
                                )
                              }
                            >
                              {d.stok_real !== null && d.stok_real !== undefined
                                ? d.stok_real
                                : "-"}
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
                                : "-"}
                            </span>
                          </div>
                        </div>

                        {d.keterangan ? (
                          <p className="text-xs text-gray-600 mt-2 text-center">
                            {d.keterangan}
                          </p>
                        ) : (
                          <div className="flex justify-center">
                            <button
                              onClick={() =>
                                handleUpdateStokReal(
                                  d.id,
                                  d.inventory_id,
                                  d.stok_real,
                                  d.keterangan
                                )
                              }
                              className="text-xs text-indigo-600 hover:text-indigo-800 underline mt-2"
                            >
                              + Tambah Keterangan
                            </button>
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        ))
      )}

        <button
          onClick={() => setIsCreating(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-full shadow-lg transition"
        >
          <Plus size={18} />
        </button>

      {isCreating && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Buat Stok Opname Baru
              </h2>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold mb-3 text-center">
                  Informasi Opname
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Opname
                    </label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={formHeader.tgl_opname}
                      onChange={(e) =>
                        setFormHeader({
                          ...formHeader,
                          tgl_opname: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keterangan
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={formHeader.keterangan}
                      onChange={(e) =>
                        setFormHeader({
                          ...formHeader,
                          keterangan: e.target.value,
                        })
                      }
                      placeholder="Opsional"
                    />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter Tempat Penyimpanan
                </label>
                <select
                  className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-center"
                  value={selectedPlaceId}
                  onChange={(e) => setSelectedPlaceId(e.target.value)}
                >
                  <option value="">Semua Tempat</option>
                  {places.map((place) => (
                    <option key={place.id} value={place.id}>
                      {place.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-center">
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mx-auto"
                >
                  {selectedInventoryIds.size === filteredInventories.length ? (
                    <>
                      <Square size={16} /> Batalkan Pilih Semua
                    </>
                  ) : (
                    <>
                      <CheckSquare size={16} /> Pilih Semua (
                      {filteredInventories.length})
                    </>
                  )}
                </button>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Pilih Item untuk Opname
                </h3>
                {filteredInventories.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Tidak ada inventory ditemukan.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredInventories.map((inv) => (
                      <div
                        key={inv.id}
                        className={`border-2 rounded-xl p-4 cursor-pointer relative min-w-[160px] ${
                          selectedInventoryIds.has(inv.id)
                            ? "border-indigo-500 bg-indigo-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => toggleInventorySelection(inv.id)}
                      >
                        <div className="text-center">
                          <p className="font-semibold text-gray-800 mt-1 text-sm break-words">
                            {formatProductName(inv.product)}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {inv.place?.nama || "–"}
                          </p>
                          <p className="text-xl font-bold text-indigo-700 mt-2">
                            {inv.qty}
                          </p>
                          <p className="text-xs text-gray-500">Stok Sistem</p>
                        </div>
                        {selectedInventoryIds.has(inv.id) && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="text-white w-3 h-3" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCreateOpname}
                  disabled={isSubmitting || selectedInventoryIds.size === 0}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Memproses...
                    </>
                  ) : (
                    `Buat Opname (${selectedInventoryIds.size} item)`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StokOpnamePage;