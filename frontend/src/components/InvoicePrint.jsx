import React, { forwardRef } from "react";

const InvoicePrint = forwardRef(({ transaksi }, ref) => {
  if (!transaksi) {
    return <div ref={ref} className="thermal" style={{ display: "none" }} />;
  }

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

  const activeDetails =
    transaksi.details?.filter((d) => ![5, 6].includes(d.status_transaksi_id)) ||
    [];

  const totalSubtotal = activeDetails.reduce((sum, d) => {
    return sum + d.qty * safeParseFloat(d.harga);
  }, 0);

  const totalDiscount = activeDetails.reduce((sum, d) => {
    return sum + safeParseFloat(d.discount);
  }, 0);

  const totalAfterDiscount = totalSubtotal - totalDiscount;

  const totalPaid = activeDetails.reduce((sum, d) => {
    const paid = Array.isArray(d.pembayarans)
      ? d.pembayarans.reduce((s, p) => s + safeParseFloat(p.jumlah_bayar), 0)
      : 0;
    return sum + paid;
  }, 0);

  const totalTagihan = totalAfterDiscount;
  const sisaTagihan = totalTagihan - totalPaid;

  const options = { day: "2-digit", month: "long", year: "numeric" };
  const formattedDate = invoiceDate.toLocaleDateString("id-ID", options);

  const renderLine = (left, right, isBold = false, isDiscount = false) => {
    const className = `flex justify-between text-10px mb-1 ${
      isBold ? "font-bold" : ""
    } ${isDiscount ? "text-red" : ""}`;
    return (
      <div className={className}>
        <span>{left}</span>
        <span>{right}</span>
      </div>
    );
  };

  return (
    <div ref={ref} className="thermal">
      {/* Wrapper untuk perfect centering */}
      <div className="thermal-content">
        {/* Header */}
        <div className="text-center mb-2">
          <div className="flex justify-center mb-1">
            <img
              src="/Logo/logo.png"
              alt="Logo JRS"
              className="w-[60px] h-auto"
              style={{ imageRendering: "pixelated" }}
              onError={(e) => (e.target.style.display = "none")}
            />
          </div>

          <div className="text-9px">Jl. Contoh Alamat No. 123</div>
          <div className="text-9px">Telp: 08xxxxxxxx</div>
          <div className="mt-1 font-bold text-[11px]">INVOICE</div>
          <div className="flex justify-between text-9px mt-1">
            <span>{invoiceNumber}</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        <hr />

        {/* Customer */}
        <div className="mb-2">
          <div className="font-bold text-center">
            Customer: {transaksi.customer?.name || "Umum"}
          </div>
          <div className="text-9px text-center">
            Transaksi{" "}
            {transaksi.jenis_transaksi === "daily" ? "Harian" : "Pesanan"}
          </div>
        </div>

        <hr />

        {/* ITEMS */}
        <div className="mb-2">
          {transaksi.details?.map((d, idx) => {
            const itemSubtotal = d.qty * safeParseFloat(d.harga);
            return (
              <div key={d.id || idx} className="mb-2">
                <div className="font-bold text-center">
                  {d.product?.kode || "-"}
                </div>
                <div className="text-9px text-center text-gray">
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
                  <div className="text-9px italic">Cat: {d.catatan}</div>
                )}
                {renderLine(
                  `${d.qty} x Rp${formatRupiah(d.harga)}`,
                  `Rp${formatRupiah(itemSubtotal)}`
                )}
              </div>
            );
          })}
        </div>

        <hr />

        {/* TOTALS */}
        <div className="font-bold mb-1">
          {renderLine("Subtotal:", `Rp${formatRupiah(totalSubtotal)}`, true)}
          {totalDiscount > 0 &&
            renderLine(
              "Diskon:",
              `-Rp${formatRupiah(totalDiscount)}`,
              true,
              true
            )}
        </div>

        <hr />

        {/* Payment Summary */}
        <div className="mb-1">
          {renderLine(
            "Total Tagihan:",
            `Rp${formatRupiah(totalTagihan)}`,
            true
          )}

          {totalPaid > 0 && (
            <>
              {renderLine(
                "Total Dibayar:",
                `Rp${formatRupiah(totalPaid)}`,
                true
              )}
              {renderLine(
                "Sisa Tagihan:",
                `Rp${formatRupiah(sisaTagihan)}`,
                true,
                sisaTagihan > 0
              )}
            </>
          )}

          {totalPaid === 0 &&
            renderLine(
              "Sisa Tagihan:",
              `Rp${formatRupiah(sisaTagihan)}`,
              true,
              true
            )}
        </div>

        <hr />

        {/* Footer */}
        <div className="text-center text-9px mt-2">
          Pembayaran sah jika masuk rekening perusahaan.
        </div>
        <div className="text-center text-9px mt-1">Terima kasih!</div>
      </div>
    </div>
  );
});

export default InvoicePrint;
