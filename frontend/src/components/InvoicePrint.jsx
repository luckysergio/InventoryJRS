import React, { forwardRef } from "react";

const InvoicePrint = forwardRef(({ transaksi }, ref) => {
  if (!transaksi) {
    return <div ref={ref} style={{ display: "none" }} />;
  }

  const safeParseFloat = (value) => {
    if (value == null) return 0;
    const num = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  const formatRupiah = (v) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Math.round(safeParseFloat(v) || 0));

  // Gunakan tanggal transaksi
  const invoiceDate = transaksi.tanggal
    ? new Date(transaksi.tanggal)
    : new Date();

  const options = { day: "2-digit", month: "long", year: "numeric" };
  const formattedDate = invoiceDate.toLocaleDateString("id-ID", options);

  // Nomor invoice: JRS/INV/2026/01/123
  const year = invoiceDate.getFullYear();
  const month = String(invoiceDate.getMonth() + 1).padStart(2, "0");
  const invoiceNumber = `JRS/INV/${year}/${month}/${transaksi.id}`;

  // Filter detail aktif (bukan selesai/dibatalkan)
  const activeDetails =
    transaksi.details?.filter((d) => ![5, 6].includes(d.status_transaksi_id)) ||
    [];

  const totalSubtotal = activeDetails.reduce(
    (sum, d) => sum + d.qty * safeParseFloat(d.harga),
    0
  );

  const totalDiscount = activeDetails.reduce(
    (sum, d) => sum + safeParseFloat(d.discount),
    0
  );

  const totalAfterDiscount = totalSubtotal - totalDiscount;

  const totalPaid = activeDetails.reduce((sum, d) => {
    const paid = Array.isArray(d.pembayarans)
      ? d.pembayarans.reduce((s, p) => s + safeParseFloat(p.jumlah_bayar), 0)
      : 0;
    return sum + paid;
  }, 0);

  const sisaTagihan = totalAfterDiscount - totalPaid;

  // Helper render baris
  const renderRow = (label, value, isBold = false, isNegative = false) => (
    <div className="flex justify-between py-1 border-b border-gray-100">
      <span className={`${isBold ? 'font-semibold' : ''}`}>{label}</span>
      <span className={`${isBold ? 'font-semibold' : ''} ${isNegative ? 'text-red-600' : ''}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div
      ref={ref}
      className="font-sans"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
        margin: "0 auto",
        backgroundColor: "white",
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: "12px",
        lineHeight: 1.5,
        color: "#333",
        boxSizing: "border-box",
      }}
    >
      {/* Kop Surat */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-300">
        <div>
          <img
            src="/Logo/logo.png"
            alt="Logo Jaya Rubber Seal"
            style={{
              height: "40px",
              imageRendering: "pixelated",
              objectFit: "contain",
            }}
            onError={(e) => (e.target.style.display = "none")}
          />
          <h1 className="text-xl font-bold mt-2 text-gray-800">JAYA RUBBER SEAL</h1>
          <p className="text-sm text-gray-600 mt-1">
            Jl. Contoh Alamat No. 123, Tangerang Selatan<br />
            Telp: 08xxxxxxxx | Email: info@jayarubberseal.com<br />
            <a href="https://maps.app.goo.gl/BCTk4gNK9stGwamG9" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              Lihat di Google Maps
            </a>
          </p>
        </div>

        <div className="text-right">
          <h2 className="text-lg font-bold text-gray-800">INVOICE</h2>
          <p className="mt-2">
            <strong>No:</strong> {invoiceNumber}<br />
            <strong>Tanggal:</strong> {formattedDate}
          </p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Kepada Yth.</h3>
          <p className="font-medium">{transaksi.customer?.name || "Umum"}</p>
          {transaksi.customer?.phone && <p>{transaksi.customer.phone}</p>}
          {transaksi.customer?.email && <p>{transaksi.customer.email}</p>}
          {transaksi.customer?.alamat && <p>{transaksi.customer.alamat}</p>}
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Detail Transaksi</h3>
          <p>
            Jenis:{" "}
            <span className="font-medium">
              {transaksi.jenis_transaksi === "daily" ? "Harian" : "Pesanan"}
            </span>
          </p>
          <p>ID Transaksi: <span className="font-mono">#{transaksi.id}</span></p>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left py-2 px-3 border">Produk</th>
              <th className="text-center py-2 px-3 border">Qty</th>
              <th className="text-right py-2 px-3 border">Harga Satuan</th>
              <th className="text-right py-2 px-3 border">Diskon</th>
              <th className="text-right py-2 px-3 border">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {activeDetails.map((d, idx) => {
              const itemSubtotal = d.qty * safeParseFloat(d.harga);
              const productInfo = [
                d.product?.kode,
                d.product?.jenis?.nama,
                d.product?.type?.nama,
                d.product?.bahan?.nama,
                d.product?.ukuran,
              ]
                .filter(Boolean)
                .join(" • ");

              return (
                <tr key={d.id || idx} className="hover:bg-gray-50">
                  <td className="py-2 px-3 border align-top">
                    <div className="font-medium">{productInfo}</div>
                    {d.catatan && (
                      <div className="text-xs italic text-gray-600 mt-1">
                        Catatan: {d.catatan}
                      </div>
                    )}
                  </td>
                  <td className="text-center py-2 px-3 border align-top">{d.qty}</td>
                  <td className="text-right py-2 px-3 border align-top">
                    {formatRupiah(d.harga)}
                  </td>
                  <td className="text-right py-2 px-3 border align-top">
                    {d.discount ? formatRupiah(d.discount) : "-"}
                  </td>
                  <td className="text-right py-2 px-3 border align-top font-medium">
                    {formatRupiah(itemSubtotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="max-w-md ml-auto w-full">
        {renderRow("Subtotal", formatRupiah(totalSubtotal))}
        {totalDiscount > 0 && renderRow("Diskon", `- ${formatRupiah(totalDiscount)}`, false, true)}
        {renderRow("Total Tagihan", formatRupiah(totalAfterDiscount), true)}
        {totalPaid > 0 && renderRow("Total Dibayar", formatRupiah(totalPaid), true)}
        {renderRow("Sisa Tagihan", formatRupiah(sisaTagihan), true, sisaTagihan > 0)}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-gray-300 text-sm text-gray-600">
        <p className="mb-1">
          <strong>Pembayaran dapat dilakukan ke:</strong>
        </p>
        <p>Bank BCA a.n. JAYA RUBBER SEAL – No. Rek: 1234567890</p>
        <p className="mt-2">
          Pembayaran sah jika telah dikonfirmasi oleh tim kami. 
          Terima kasih atas kepercayaan Anda!
        </p>
        <p className="mt-3 text-center text-xs text-gray-500">
          Dokumen ini dicetak secara otomatis. Tanda tangan tidak diperlukan.
        </p>
      </div>
    </div>
  );
});

export default InvoicePrint;