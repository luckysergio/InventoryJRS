import React, { forwardRef } from "react";

const InvoicePrint = forwardRef(({ transaksi }, ref) => {
  if (!transaksi) return null;

  /* =======================
   * UTILITIES
   * ======================= */
  const safeParseFloat = (value) => {
    if (value == null) return 0;
    const num = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  const formatRupiah = (v) =>
    new Intl.NumberFormat("id-ID").format(
      Math.round(safeParseFloat(v) || 0)
    );

  const getTotalPaid = () =>
    transaksi.details?.reduce((sum, d) => {
      const paid = Array.isArray(d.pembayarans)
        ? d.pembayarans.reduce(
            (s, p) => s + safeParseFloat(p.jumlah_bayar),
            0
          )
        : 0;
      return sum + paid;
    }, 0) || 0;

  /* =======================
   * INVOICE META
   * ======================= */
  const invoiceDate = transaksi.tanggal
    ? new Date(transaksi.tanggal)
    : new Date();

  const year = invoiceDate.getFullYear();
  const month = String(invoiceDate.getMonth() + 1).padStart(2, "0");

  const invoiceNumber = `JRS/INV/${year}/${month}/${transaksi.id}`;

  const totalPaid = getTotalPaid();
  const totalTagihan = safeParseFloat(transaksi.total);
  const sisaTagihan = totalTagihan - totalPaid;

  /* =======================
   * RENDER
   * ======================= */
  return (
    <div
      ref={ref}
      className="p-6 text-sm text-gray-800 bg-white w-[210mm] mx-auto"
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <img
            src="/Favicon/favJRS.webp"
            alt="Logo JRS"
            className="h-12 object-contain mb-2"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <div className="text-gray-700 space-y-1">
            <p className="font-bold text-lg">JRS</p>
            <p className="text-xs">Jl. Contoh Alamat No. 123</p>
            <p className="text-xs">
              Telp: 08xxxxxxxx | Email: info@jrs.com
            </p>
          </div>
        </div>

        <div className="text-right">
          <h1 className="text-2xl font-bold text-blue-800">INVOICE</h1>
          <div className="mt-2 text-sm space-y-1">
            <p>
              <span className="font-semibold">No:</span> {invoiceNumber}
            </p>
            <p>
              <span className="font-semibold">Tanggal:</span>{" "}
              {invoiceDate.toLocaleDateString("id-ID")}
            </p>
            <p>
              <span className="font-semibold">Jenis:</span>{" "}
              {transaksi.jenis_transaksi === "daily"
                ? "Harian"
                : "Pesanan"}
            </p>
          </div>
        </div>
      </div>

      <hr className="border-t border-gray-300 my-4" />

      {/* ================= CUSTOMER ================= */}
      <div className="mb-6">
        <h2 className="font-semibold text-gray-700 mb-2">
          Ditagihkan ke:
        </h2>
        <p className="font-medium">
          {transaksi.customer?.name || "Umum"}
        </p>
        {transaksi.customer?.phone && (
          <p className="text-gray-600">
            Telp: {transaksi.customer.phone}
          </p>
        )}
        {transaksi.customer?.email && (
          <p className="text-gray-600">
            Email: {transaksi.customer.email}
          </p>
        )}
      </div>

      {/* ================= TABLE ================= */}
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-300">
            <th className="text-left p-2">Produk</th>
            <th className="text-center p-2">Tgl</th>
            <th className="text-center p-2">Qty</th>
            <th className="text-right p-2">Harga</th>
            <th className="text-right p-2">Diskon</th>
            <th className="text-right p-2">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {transaksi.details?.map((d) => (
            <tr key={d.id} className="border-b border-gray-200">
              <td className="p-2">
                <div className="font-medium">
                  {d.product?.kode || "-"}
                </div>
                <div className="text-gray-600 text-xs mt-1">
                  {[d.product?.jenis?.nama, d.product?.type?.nama, d.product?.ukuran]
                    .filter(Boolean)
                    .join(" • ")}
                </div>
                {d.catatan && (
                  <div className="text-gray-500 italic text-xs mt-1">
                    Catatan: {d.catatan}
                  </div>
                )}
              </td>
              <td className="text-center p-2">{d.tanggal || "-"}</td>
              <td className="text-center p-2">{d.qty}</td>
              <td className="text-right p-2">
                Rp {formatRupiah(d.harga)}
              </td>
              <td className="text-right p-2">
                Rp {formatRupiah(d.discount)}
              </td>
              <td className="text-right p-2 font-medium">
                Rp {formatRupiah(d.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ================= TOTAL ================= */}
      <div className="mt-6 flex justify-end">
        <div className="w-1/3 bg-gray-50 p-4 rounded">
          <div className="flex justify-between py-1">
            <span>Total Tagihan:</span>
            <span className="font-bold">
              Rp {formatRupiah(totalTagihan)}
            </span>
          </div>

          {totalPaid > 0 && (
            <div className="flex justify-between py-1 text-gray-700">
              <span>Sudah Dibayar:</span>
              <span>Rp {formatRupiah(totalPaid)}</span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t font-bold text-lg">
            <span>Sisa Tagihan:</span>
            <span className="text-red-600">
              Rp {formatRupiah(sisaTagihan)}
            </span>
          </div>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="mt-10 text-center text-xs text-gray-600">
        <p className="mb-1">
          Pembayaran dianggap sah jika sudah masuk ke rekening perusahaan.
        </p>
        <p>Terima kasih atas kepercayaan Anda!</p>
      </div>
    </div>
  );
});

export default InvoicePrint;
