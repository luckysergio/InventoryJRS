import React, { forwardRef } from "react";

const InvoicePrintSimple = forwardRef(({ transaksi }, ref) => {
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
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  const formattedDate = invoiceDate.toLocaleDateString("id-ID", options);

  // Format nomor invoice: JRS/INV/YYYY/MM/{id}
  const year = invoiceDate.getFullYear();
  const month = String(invoiceDate.getMonth() + 1).padStart(2, "0");
  const invoiceNumber = `JRS/INV/${year}/${month}/${transaksi.id}`;

  const activeDetails =
    transaksi.details?.filter((d) => ![5, 6].includes(d.status_transaksi_id)) ||
    [];

  const totalSubtotal = activeDetails.reduce(
    (sum, d) => sum + d.qty * safeParseFloat(d.harga),
    0,
  );

  const totalDiscount = activeDetails.reduce(
    (sum, d) => sum + safeParseFloat(d.discount),
    0,
  );

  const totalAfterDiscount = totalSubtotal - totalDiscount;

  return (
    <div
      ref={ref}
      className="invoice-a4"
      style={{
        width: "297mm", // ✅ Landscape: lebar = 297mm
        minHeight: "210mm", // ✅ Landscape: tinggi = 210mm
        padding: "15mm", // ✅ Lebih kecil karena ruang lebih luas
        margin: "0 auto",
        backgroundColor: "white",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        fontSize: "11px",
        lineHeight: 1.5,
        color: "#1f2937",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "800",
            margin: "0",
            color: "#0ea5e9",
            letterSpacing: "1px",
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
          gap: "30px",
          marginBottom: "20px",
        }}
      >
        {/* Kolom Kiri: Info Pelanggan — format "label : value" */}
        <div>
          <div style={{ marginBottom: "6px", fontSize: "11px" }}>
            <span
              style={{
                fontWeight: "600",
                color: "#1f2937",
                minWidth: "120px",
                display: "inline-block",
              }}
            >
              Nama Bisnis
            </span>
            <span>: PT Jaya Rubber Seal Indonesia</span>
          </div>
          <div style={{ marginBottom: "6px", fontSize: "11px" }}>
            <span
              style={{
                fontWeight: "600",
                color: "#1f2937",
                minWidth: "120px",
                display: "inline-block",
              }}
            >
              Nama Pelanggan
            </span>
            <span>: {transaksi.customer?.name || "Umum"}</span>
          </div>
          <div style={{ fontSize: "11px" }}>
            <span
              style={{
                fontWeight: "600",
                color: "#1f2937",
                minWidth: "120px",
                display: "inline-block",
              }}
            >
              No. Telepon
            </span>
            <span>: {transaksi.customer?.phone || "-"}</span>
          </div>
        </div>

        {/* Kolom Kanan: Info Invoice — rata kanan */}
        <div style={{ textAlign: "right", fontSize: "11px" }}>
          <div style={{ marginBottom: "6px" }}>
            <div style={{ fontWeight: "600", color: "#1f2937" }}>
              No. Invoice
            </div>
            <div style={{ fontWeight: "700", color: "#1f2937" }}>
              {invoiceNumber}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: "600", color: "#1f2937" }}>Tanggal Transaksi</div>
            <div>{formattedDate}</div>
          </div>
        </div>
      </div>

      {/* Tabel Produk — lebih lebar, kolom lebih seimbang */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "20px",
          fontSize: "11px",
          tableLayout: "auto",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                border: "1px solid #d1d5db",
                padding: "10px 8px",
                textAlign: "center",
                fontWeight: "600",
                backgroundColor: "#f9fafb",
                color: "#1f2937",
                width: "50px",
              }}
            >
              No.
            </th>
            <th
              style={{
                border: "1px solid #d1d5db",
                padding: "10px 8px",
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
                padding: "10px 8px",
                textAlign: "center",
                fontWeight: "600",
                backgroundColor: "#f9fafb",
                color: "#1f2937",
                width: "80px",
              }}
            >
              Qty
            </th>
            <th
              style={{
                border: "1px solid #d1d5db",
                padding: "10px 8px",
                textAlign: "center",
                fontWeight: "600",
                backgroundColor: "#f9fafb",
                color: "#1f2937",
                width: "100px",
              }}
            >
              Harga Satuan
            </th>
            <th
              style={{
                border: "1px solid #d1d5db",
                padding: "10px 8px",
                textAlign: "center",
                fontWeight: "600",
                backgroundColor: "#f9fafb",
                color: "#1f2937",
                width: "110px",
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
                    padding: "10px 8px",
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
                    padding: "10px 8px",
                    fontWeight: "500",
                  }}
                >
                  {productInfo || "Produk"}
                </td>
                <td
                  style={{
                    border: "1px solid #d1d5db",
                    padding: "10px 8px",
                    textAlign: "center",
                  }}
                >
                  {d.qty}
                </td>
                <td
                  style={{
                    border: "1px solid #d1d5db",
                    padding: "10px 8px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  {formatRupiah(d.harga)}
                </td>
                <td
                  style={{
                    border: "1px solid #d1d5db",
                    padding: "10px 8px",
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

      {/* Ringkasan Total — tetap di kanan */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: "280px", fontSize: "11px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
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
              padding: "8px 0",
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
              padding: "10px 0",
              marginTop: "8px",
              borderTop: "2px solid #0ea5e9",
            }}
          >
            <span
              style={{ fontWeight: "700", fontSize: "12px", color: "#1f2937" }}
            >
              TOTAL TAGIHAN
            </span>
            <span
              style={{ fontWeight: "800", fontSize: "13px", color: "#0ea5e9" }}
            >
              {formatRupiah(totalAfterDiscount)}
            </span>
          </div>
        </div>
      </div>

      {/* Tanda Tangan — tetap dua kolom */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "50px",
          marginTop: "40px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "600", marginBottom: "70px" }}>
            Penerima
          </div>
          <div
            style={{
              height: "1px",
              backgroundColor: "#000",
              marginBottom: "8px",
            }}
          />
          <div style={{ fontSize: "10px", color: "#64748b" }}>
            
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "600", marginBottom: "70px" }}>
            Dengan Hormat,
          </div>
          <div
            style={{
              height: "1px",
              backgroundColor: "#000",
              marginBottom: "8px",
            }}
          />
          <div style={{ fontSize: "10px", color: "#64748b" }}>
            PT Jaya Rubber Seal Indonesia
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "25px",
          paddingTop: "10px",
          borderTop: "1px solid #e5e7eb",
          textAlign: "center",
          fontSize: "9px",
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