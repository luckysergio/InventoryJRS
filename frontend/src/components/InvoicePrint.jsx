import React, { forwardRef } from "react";

const InvoicePrint = forwardRef(({ transaksi }, ref) => {
  if (!transaksi) return null;

  const safeParseFloat = (value) => {
    if (value == null) return 0;
    const num = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  const formatRupiah = (v) =>
    new Intl.NumberFormat("id-ID").format(Math.round(safeParseFloat(v) || 0));

  const getTotalPaid = () =>
    transaksi.details?.reduce((sum, d) => {
      const paid = Array.isArray(d.pembayarans)
        ? d.pembayarans.reduce((s, p) => s + safeParseFloat(p.jumlah_bayar), 0)
        : 0;
      return sum + paid;
    }, 0) || 0;

  const invoiceDate = transaksi.tanggal
    ? new Date(transaksi.tanggal)
    : new Date();
  const year = invoiceDate.getFullYear();
  const month = String(invoiceDate.getMonth() + 1).padStart(2, "0");
  const invoiceNumber = `JRS/INV/${year}/${month}/${transaksi.id}`;
  const totalPaid = getTotalPaid();
  const totalTagihan = safeParseFloat(transaksi.total);
  const sisaTagihan = totalTagihan - totalPaid;

  const options = { day: "2-digit", month: "long", year: "numeric" };
  const formattedDate = invoiceDate.toLocaleDateString("id-ID", options);

  const renderLine = (left, right, isBold = false, isDiscount = false) => {
    const className = `text-[10px] ${isBold ? "font-bold" : ""} ${
      isDiscount ? "text-red-600" : ""
    }`;
    return (
      <div className={className}>
        <span>{left}</span>
        <span className="float-right">{right}</span>
        <div className="clear-both"></div>
      </div>
    );
  };

  return (
    <div
      ref={ref}
      className="bg-white"
      style={{
        width: "80mm",
        fontFamily: "'Courier New', monospace",
        lineHeight: 1.4,
        fontSize: "10px",
        boxSizing: "border-box",
        padding: "3mm",
        margin: "0",
      }}
    >
      {/* Header */}
      <div className="text-center mb-2">
        <div className="flex justify-center mb-1">
          <img
            src="/Logo/logo.png"
            alt="Logo JRS"
            style={{
              width: "60px",
              height: "auto",
              imageRendering: "pixelated",
            }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>

        <div>Jl. Contoh Alamat No. 123</div>
        <div>Telp: 08xxxxxxxx</div>
        <div className="mt-1 font-bold">INVOICE</div>
        <div className="text-[9px] mt-1">{invoiceNumber}</div>
        <div className="text-[9px]">{formattedDate}</div>
        <div className="text-[9px]">
          Transaksi{" "}
          {transaksi.jenis_transaksi === "daily" ? "Harian" : "Pesanan"}
        </div>
      </div>

      <hr className="border-t border-black my-1" />

      {/* Customer */}
      <div className="mb-2">
        <div className="font-bold text-center">
          Customer: {transaksi.customer?.name || "Umum"}
        </div>
      </div>

      <hr className="border-t border-black my-1" />

      {/* Items */}
      <div className="mb-1">
        {transaksi.details?.map((d, idx) => (
          <div key={d.id || idx} className="mb-1.5">
            <div className="font-bold text-center">
              {d.product?.kode || "-"}
            </div>
            <div className="text-[9px] text-center text-gray-600">
              {[
                d.product?.jenis?.nama,
                d.product?.type?.nama,
                d.product?.bahan?.nama,
                d.product?.ukuran,
              ]
                .filter(Boolean)
                .join(" ")}
            </div>
            {d.catatan && (
              <div className="text-[9px] italic">Cat: {d.catatan}</div>
            )}
            {renderLine(
              `${d.qty} x Rp${formatRupiah(d.harga)}`,
              `Rp${formatRupiah(d.subtotal)}`
            )}
            {d.discount > 0 &&
              renderLine(
                "Diskon",
                `-Rp${formatRupiah(d.discount)}`,
                false,
                true
              )}
          </div>
        ))}
      </div>

      <hr className="border-t border-black my-1" />

      {/* Totals */}
      <div className="font-bold mb-1">
        {renderLine("Total:", `Rp${formatRupiah(totalTagihan)}`)}
        {totalPaid > 0 && renderLine("Bayar:", `Rp${formatRupiah(totalPaid)}`)}
        {renderLine(
          "Sisa:",
          `Rp${formatRupiah(sisaTagihan)}`,
          true,
          sisaTagihan > 0
        )}
      </div>

      <hr className="border-t border-black my-2" />

      {/* Footer note */}
      <div className="text-center text-[9px]">
        Pembayaran sah jika masuk rekening perusahaan.
      </div>
      <div className="text-center text-[9px] mt-1">Terima kasih!</div>
    </div>
  );
});

export default InvoicePrint;
