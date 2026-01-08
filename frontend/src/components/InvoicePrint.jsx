import React, { forwardRef } from "react";

const InvoicePrint = forwardRef(({ transaksi }, ref) => {
  if (!transaksi) return null;

  const formatRupiah = (v) =>
    new Intl.NumberFormat("id-ID").format(Math.round(v || 0));

  return (
    <div ref={ref} className="p-8 text-sm text-black w-[210mm]">
      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">INVOICE</h1>
          <p>No: INV-{transaksi.id}</p>
          <p>Tanggal: {new Date().toLocaleDateString("id-ID")}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">JRS</p>
          <p>Jl. Contoh Alamat</p>
          <p>Telp: 08xxxxxxxx</p>
        </div>
      </div>

      {/* CUSTOMER */}
      <div className="mb-4">
        <p className="font-semibold">Ditagihkan ke:</p>
        <p>{transaksi.customer?.name || "Umum"}</p>
        <p>{transaksi.customer?.phone}</p>
      </div>

      {/* TABLE */}
      <table className="w-full border-collapse border border-black text-xs">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Produk</th>
            <th className="border p-2">Tanggal</th>
            <th className="border p-2">Qty</th>
            <th className="border p-2">Harga</th>
            <th className="border p-2">Diskon</th>
            <th className="border p-2">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {transaksi.details.map((d) => (
            <tr key={d.id}>
              <td className="border p-2">
                {[
                  d.product?.jenis?.nama,
                  d.product?.type?.nama,
                  d.product?.ukuran,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </td>
              <td className="border p-2">{d.tanggal}</td>
              <td className="border p-2 text-center">{d.qty}</td>
              <td className="border p-2 text-right">
                Rp {formatRupiah(d.harga)}
              </td>
              <td className="border p-2 text-right">
                Rp {formatRupiah(d.discount)}
              </td>
              <td className="border p-2 text-right">
                Rp {formatRupiah(d.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTAL */}
      <div className="mt-4 flex justify-end">
        <div className="w-1/3">
          <div className="flex justify-between font-bold border-t pt-2">
            <span>Total</span>
            <span>Rp {formatRupiah(transaksi.total)}</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-8 text-center text-xs">
        <p>Terima kasih atas kepercayaan Anda</p>
      </div>
    </div>
  );
});

export default InvoicePrint;
