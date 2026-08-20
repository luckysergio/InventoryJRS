import {
  normalizeDetails,
  sortDetailsByPlace,
  formatProductName,
  getOpnameLabel,
} from "./stokOpnameUtils";

const formatDateForPrint = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

const escapeHtml = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

export const printStokOpname = (opname, mode = "draft") => {
  const opnameDate = new Date(opname.tgl_opname);
  const year = opnameDate.getFullYear();
  const month = String(opnameDate.getMonth() + 1).padStart(2, "0");

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Gagal membuka jendela cetak. Izinkan popup untuk situs ini.");
    return;
  }

  const statusMap = {
    draft: "Draft (Belum Selesai)",
    selesai: "Selesai",
    dibatalkan: "Dibatalkan",
  };
  const statusLabel = statusMap[opname.status] || opname.status;
  const titlePrefix = mode === "draft" ? "Laporan Stok Opname (Draft)" : "Laporan Stok Opname (Riwayat)";

  const sortedDetails = sortDetailsByPlace(opname.details || []);

  const detailsHtml = sortedDetails
    .map((d) => {
      // ✅ d.product & d.place sudah dinormalisasi
      const productName = formatProductName(d.product);
      const productCode = d.product?.kode || "–";
      const placeName = d.place?.nama || "–";
      const stokSistem = d.stok_sistem ?? 0;
      const stokReal = d.stok_real !== null && d.stok_real !== undefined ? d.stok_real : "–";
      const selisih = d.selisih !== null && d.selisih !== undefined ? d.selisih : "–";
      const selisihNum = Number(d.selisih) || 0;
      const selisihClass = selisihNum > 0 ? "pos" : selisihNum < 0 ? "neg" : "";
      const keteranganHtml = d.keterangan
        ? `<div class="card-row"><span class="label">Keterangan:</span> <span>${escapeHtml(d.keterangan)}</span></div>`
        : "";

      return `
        <div class="card">
          <div class="card-code">${escapeHtml(productCode)}</div>
          <div class="card-title">${escapeHtml(productName)}</div>
          <div class="card-place">📍 ${escapeHtml(placeName)}</div>
          <div class="card-row"><span class="label">Stok Sistem:</span> <span>${stokSistem}</span></div>
          <div class="card-row"><span class="label">Stok Fisik:</span> <span>${stokReal}</span></div>
          <div class="card-row"><span class="label">Selisih:</span> <span class="selisih ${selisihClass}">${selisih}</span></div>
          ${keteranganHtml}
        </div>
      `;
    })
    .join("");

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Stok Opname ${escapeHtml(getOpnameLabel(opname))}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            color: #333;
            width: 210mm;
            margin: 0 auto;
          }
          @media print { body { padding: 10mm; } }
          h1 { text-align: center; color: #4f46e5; margin-bottom: 20px; line-height: 1.4; font-size: 18px; }
          .header { margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb; }
          .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; page-break-inside: avoid; }
          .card-code { font-family: monospace; font-size: 10px; color: #4f46e5; font-weight: 600; margin-bottom: 2px; }
          .card-title { font-weight: 600; color: #1f2937; margin-bottom: 4px; font-size: 11px; line-height: 1.3; word-wrap: break-word; }
          .card-place { font-size: 10px; color: #6b7280; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dashed #e5e7eb; }
          .card-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 10px; }
          .label { color: #6b7280; }
          .value { font-weight: 500; }
          .selisih.pos { color: #10b981; font-weight: 600; }
          .selisih.neg { color: #ef4444; font-weight: 600; }
          .print-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
        </style>
      </head>
      <body>
        <h1>${titlePrefix}<br>${escapeHtml(getOpnameLabel(opname))}</h1>
        <div class="header">
          <div class="card-row"><span class="label">Tanggal:</span> <span class="value">${formatDateForPrint(opname.tgl_opname)}</span></div>
          <div class="card-row"><span class="label">Status:</span> <span class="value">${statusLabel}</span></div>
          <div class="card-row"><span class="label">Oleh:</span> <span class="value">${escapeHtml(opname.user?.name) || "–"}</span></div>
          <div class="card-row"><span class="label">Total Item:</span> <span class="value">${sortedDetails.length}</span></div>
        </div>
        <div class="print-grid">
          ${detailsHtml || '<p style="text-align:center;color:#6b7280;grid-column:1/-1;">Tidak ada item</p>'}
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 250);
};