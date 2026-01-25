import React, { forwardRef } from "react";

const InvoicePrintSimple = forwardRef(({ transaksi, includeCompleted = false }, ref) => {
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

  const invoiceDate = transaksi.tanggal
    ? new Date(transaksi.tanggal)
    : new Date();

  const formattedDate = invoiceDate
    .toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .replace(/\s+/g, " ");

  const year = invoiceDate.getFullYear();
  const month = String(invoiceDate.getMonth() + 1).padStart(2, "0");
  const invoiceNumber = `JRS/INV/${year}/${month}/${transaksi.id}`;

  // ✅ Filter berdasarkan prop includeCompleted
  const activeDetails = includeCompleted
    ? transaksi.details || []
    : transaksi.details?.filter((d) => ![5, 6].includes(d.status_transaksi_id)) || [];

  const totalSubtotal = activeDetails.reduce(
    (sum, d) => sum + d.qty * safeParseFloat(d.harga),
    0,
  );

  const totalDiscount = activeDetails.reduce(
    (sum, d) => sum + safeParseFloat(d.discount),
    0,
  );

  const totalAfterDiscount = totalSubtotal - totalDiscount;

  const totalPaid = activeDetails.reduce((sum, d) => {
    const paid = Array.isArray(d.pembayarans)
      ? d.pembayarans.reduce((s, p) => s + safeParseFloat(p.jumlah_bayar), 0)
      : 0;
    return sum + paid;
  }, 0);

  const sisaTagihan = totalAfterDiscount - totalPaid;

  return (
    <div
      ref={ref}
      className="invoice-a4"
      style={{
  width: "210mm",
  minHeight: "297mm",
  padding: "10mm 12mm",
  margin: "0 auto",
  backgroundColor: "white",
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  fontSize: "10px",
  lineHeight: 1.4,
  color: "#1f2937",
  boxSizing: "border-box",
}}

    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "12px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "800",
            margin: "0",
            color: "#0ea5e9",
            letterSpacing: "1px",
            marginBottom: "4px",
          }}
        >
          INVOICE
        </h1>
      </div>

      {/* Informasi Pelanggan & Invoice */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "15px",
        }}
      >
        {/* Kolom Kiri: Info Pelanggan */}
        <div>
          <div style={{ marginBottom: "4px", fontSize: "10px" }}>
            <span
              style={{
                fontWeight: "600",
                color: "#1f2937",
                minWidth: "100px",
                display: "inline-block",
              }}
            >
              Nama Bisnis
            </span>
            <span>: Jaya Rubber Seal Indonesia</span>
          </div>
          <div style={{ marginBottom: "4px", fontSize: "10px" }}>
            <span
              style={{
                fontWeight: "600",
                color: "#1f2937",
                minWidth: "100px",
                display: "inline-block",
              }}
            >
              Nama Pelanggan
            </span>
            <span>: {transaksi.customer?.name || "Umum"}</span>
          </div>
          <div style={{ fontSize: "10px" }}>
            <span
              style={{
                fontWeight: "600",
                color: "#1f2937",
                minWidth: "100px",
                display: "inline-block",
              }}
            >
              No. Telepon
            </span>
            <span>: {transaksi.customer?.phone || "-"}</span>
          </div>
        </div>

        {/* Kolom Kanan: Info Invoice */}
        <div style={{ textAlign: "right", fontSize: "10px" }}>
          <div style={{ marginBottom: "4px" }}>
            <div style={{ fontWeight: "600", color: "#1f2937" }}>
              No. Invoice
            </div>
            <div style={{ fontWeight: "700", color: "#1f2937" }}>
              {invoiceNumber}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: "600", color: "#1f2937" }}>
              Tanggal Transaksi
            </div>
            <div>{formattedDate}</div>
          </div>
        </div>
      </div>

      {/* Tabel Produk */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "15px",
          fontSize: "9.5px",
          tableLayout: "auto",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                border: "1px solid #d1d5db",
                padding: "6px 4px",
                textAlign: "center",
                fontWeight: "600",
                backgroundColor: "#f9fafb",
                color: "#1f2937",
                width: "35px",
              }}
            >
              No.
            </th>
            <th
              style={{
                border: "1px solid #d1d5db",
                padding: "6px 4px",
                textAlign: "center",
                fontWeight: "600",
                backgroundColor: "#f9fafb",
                color: "#1f2937",
              }}
            >
              Produk
            </th>
            <th
              style={{
                border: "1px solid #d1d5db",
                padding: "6px 4px",
                textAlign: "center",
                fontWeight: "600",
                backgroundColor: "#f9fafb",
                color: "#1f2937",
                width: "40px",
              }}
            >
              Qty
            </th>
            <th
              style={{
                border: "1px solid #d1d5db",
                padding: "6px 4px",
                textAlign: "center",
                fontWeight: "600",
                backgroundColor: "#f9fafb",
                color: "#1f2937",
                width: "80px",
              }}
            >
              Harga Satuan
            </th>
            <th
              style={{
                border: "1px solid #d1d5db",
                padding: "6px 4px",
                textAlign: "center",
                fontWeight: "600",
                backgroundColor: "#f9fafb",
                color: "#1f2937",
                width: "90px",
              }}
            >
              Jumlah
            </th>
          </tr>
        </thead>
        <tbody>
          {activeDetails.map((d, idx) => {
            const itemSubtotal = d.qty * safeParseFloat(d.harga);
            const productInfo = [
              d.product?.jenis?.nama,
              d.product?.type?.nama,
              d.product?.bahan?.nama,
              d.product?.ukuran,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <tr key={d.id || idx}>
                <td
                  style={{
                    border: "1px solid #d1d5db",
                    padding: "6px 4px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  {idx + 1}
                </td>
                <td
                  style={{
                    border: "1px solid #d1d5db",
                    textAlign: "center",
                    padding: "6px 4px",
                    fontWeight: "500",
                    fontSize: "9px",
                    lineHeight: "1.3",
                    wordWrap: "break-word",
                  }}
                >
                  {productInfo || "Produk"}
                </td>
                <td
                  style={{
                    border: "1px solid #d1d5db",
                    padding: "6px 4px",
                    textAlign: "center",
                  }}
                >
                  {d.qty}
                </td>
                <td
                  style={{
                    border: "1px solid #d1d5db",
                    padding: "6px 4px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  {formatRupiah(d.harga)}
                </td>
                <td
                  style={{
                    border: "1px solid #d1d5db",
                    padding: "6px 4px",
                    textAlign: "center",
                    fontWeight: "600",
                    color: "#1f2937",
                  }}
                >
                  {formatRupiah(itemSubtotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Ringkasan Total */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: "250px", fontSize: "10px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "5px 0",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <span style={{ color: "#64748b" }}>Subtotal</span>
            <span style={{ fontWeight: "500" }}>
              {formatRupiah(totalSubtotal)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "5px 0",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <span style={{ color: "#64748b" }}>Diskon</span>
            <span style={{ fontWeight: "500" }}>
              {totalDiscount > 0
                ? `- ${formatRupiah(totalDiscount)}`
                : formatRupiah(0)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 0",
              marginTop: "4px",
              borderTop: "2px solid #0ea5e9",
            }}
          >
            <span
              style={{ fontWeight: "700", fontSize: "11px", color: "#1f2937" }}
            >
              TOTAL TAGIHAN
            </span>
            <span
              style={{ fontWeight: "800", fontSize: "12px", color: "#0ea5e9" }}
            >
              {formatRupiah(totalAfterDiscount)}
            </span>
          </div>

          {/* Summary Pembayaran */}
          {totalPaid > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  backgroundColor: "#f0fdf4",
                  borderRadius: "3px",
                  marginTop: "8px",
                }}
              >
                <span style={{ fontWeight: "600", color: "#059669" }}>
                  Dibayar
                </span>
                <span style={{ fontWeight: "600", color: "#059669" }}>
                  {formatRupiah(totalPaid)}
                </span>
              </div>

              {/* Sisa Tagihan */}
              {sisaTagihan > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    backgroundColor: "#fef2f2",
                    borderRadius: "3px",
                    marginTop: "6px",
                    border: "1px solid #fecaca",
                  }}
                >
                  <span style={{ fontWeight: "700", color: "#dc2626" }}>
                    Sisa Tagihan
                  </span>
                  <span style={{ fontWeight: "800", color: "#dc2626" }}>
                    {formatRupiah(sisaTagihan)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tanda Tangan */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
          marginTop: activeDetails.length <= 2 ? "60px" : "30px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "600", marginBottom: "50px" }}>
            Penerima
          </div>
          <div
            style={{
              height: "1px",
              backgroundColor: "#000",
              marginBottom: "6px",
            }}
          />
          <div style={{ fontSize: "9px", color: "#64748b" }}></div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "600", marginBottom: "50px" }}>
            Dengan Hormat,
          </div>
          <div
            style={{
              height: "1px",
              backgroundColor: "#000",
              marginBottom: "6px",
            }}
          />
          <div style={{ fontSize: "9px", color: "#64748b" }}>
            PT Jaya Rubber Seal Indonesia
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "15px",
          paddingTop: "6px",
          borderTop: "1px solid #e5e7eb",
          textAlign: "center",
          fontSize: "8px",
          color: "#94a3b8",
        }}
      >
        Invoice ini sah tanpa tanda tangan dan dibuat secara elektronik.
      </div>
    </div>
  );
});

InvoicePrintSimple.displayName = "InvoicePrintSimple";

export default InvoicePrintSimple;