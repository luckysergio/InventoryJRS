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

  const invoiceDate = transaksi.tanggal
    ? new Date(transaksi.tanggal)
    : new Date();
  const options = { day: "2-digit", month: "long", year: "numeric" };
  const formattedDate = invoiceDate.toLocaleDateString("id-ID", options);

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
        padding: "20mm",
        margin: "0 auto",
        backgroundColor: "white",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        fontSize: "11px",
        lineHeight: 1.5,
        color: "#1f2937",
        boxSizing: "border-box",
      }}
    >
      {/* Header Rapi & Seimbang */}
      {/* Header dengan layout yang lebih rapi */}
      <div
        style={{
          borderBottom: "3px solid #0ea5e9",
          paddingBottom: "20px",
          marginBottom: "25px",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: "20px",
        }}
      >
        {/* Logo - Kiri */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <img
            src="/Logo/logo.png"
            alt="Logo Jaya Rubber Seal"
            style={{
              height: "80px",
              width: "auto",
              maxWidth: "180px",
              objectFit: "contain",
            }}
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>

        {/* Info Perusahaan - Tengah */}
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            lineHeight: 1.4,
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#1f2937",
              marginBottom: "4px",
              letterSpacing: "1px",
            }}
          >
            JAYA RUBBER SEAL
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#64748b",
              lineHeight: 1.6,
              maxWidth: "400px",
            }}
          >
            <div>Jl. Contoh Alamat No. 123, Tangerang Selatan, Indonesia</div>
            <div>08xxxxxxxx | info@jayarubberseal.com</div>
          </div>
        </div>

        {/* Invoice Badge - Kanan */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: "800",
              color: "#0ea5e9",
              letterSpacing: "1.5px",
              marginBottom: "4px",
            }}
          >
            INVOICE
          </div>
          <div
            style={{
              fontSize: "9px",
              color: "#64748b",
              fontWeight: "500",
            }}
          ></div>
        </div>
      </div>

      {/* Informasi Pelanggan & Invoice */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "25px",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "#1f2937",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Kepada Yth.
          </div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#1f2937",
              marginBottom: "4px",
            }}
          >
            {transaksi.customer?.name || "Umum"}
          </div>
          {transaksi.customer?.phone && (
            <div
              style={{
                fontSize: "10px",
                color: "#64748b",
                marginBottom: "2px",
              }}
            >
              Telp: {transaksi.customer.phone}
            </div>
          )}
          {transaksi.customer?.email && (
            <div
              style={{
                fontSize: "10px",
                color: "#64748b",
                marginBottom: "2px",
              }}
            >
              Email: {transaksi.customer.email}
            </div>
          )}
          {transaksi.customer?.alamat && (
            <div
              style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}
            >
              Alamat: {transaksi.customer.alamat}
            </div>
          )}
        </div>

        <div style={{ textAlign: "right", minWidth: "200px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  marginBottom: "2px",
                }}
              >
                No. Invoice
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#1f2937",
                }}
              >
                {invoiceNumber}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  marginBottom: "2px",
                }}
              >
                Tanggal Transaksi
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#1f2937",
                }}
              >
                {formattedDate}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Produk */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "20px",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                backgroundColor: "#0ea5e9",
                color: "white",
                padding: "12px 10px",
                textAlign: "center",
                fontSize: "10px",
                fontWeight: "600",
                textTransform: "uppercase",
                borderBottom: "2px solid #0284c7",
              }}
            >
              No.
            </th>
            <th
              style={{
                backgroundColor: "#0ea5e9",
                color: "white",
                padding: "12px 10px",
                textAlign: "center",
                fontSize: "10px",
                fontWeight: "600",
                textTransform: "uppercase",
                borderBottom: "2px solid #0284c7",
              }}
            >
              Deskripsi Produk
            </th>
            <th
              style={{
                backgroundColor: "#0ea5e9",
                color: "white",
                padding: "12px 10px",
                textAlign: "center",
                fontSize: "10px",
                fontWeight: "600",
                textTransform: "uppercase",
                borderBottom: "2px solid #0284c7",
                width: "60px",
              }}
            >
              Qty
            </th>
            <th
              style={{
                backgroundColor: "#0ea5e9",
                color: "white",
                padding: "12px 10px",
                textAlign: "center",
                fontSize: "10px",
                fontWeight: "600",
                textTransform: "uppercase",
                borderBottom: "2px solid #0284c7",
                width: "100px",
              }}
            >
              Harga
            </th>
            <th
              style={{
                backgroundColor: "#0ea5e9",
                color: "white",
                padding: "12px 10px",
                textAlign: "center",
                fontSize: "10px",
                fontWeight: "600",
                textTransform: "uppercase",
                borderBottom: "2px solid #0284c7",
                width: "110px",
              }}
            >
              Total
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
                    padding: "10px",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: "10px",
                    textAlign: "center",
                    color: "#64748b",
                    verticalAlign: "top",
                  }}
                >
                  {idx + 1}
                </td>
                <td
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: "10px",
                    verticalAlign: "top",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "500",
                      textAlign: "center",
                      color: "#1f2937",
                      marginBottom: "2px",
                    }}
                  >
                    {productInfo}
                  </div>
                  {d.catatan && (
                    <div
                      style={{
                        fontSize: "9px",
                        fontStyle: "italic",
                        color: "#64748b",
                        marginTop: "4px",
                      }}
                    >
                      Catatan: {d.catatan}
                    </div>
                  )}
                </td>
                <td
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid #e5e7eb",
                    textAlign: "center",
                    fontSize: "10px",
                    fontWeight: "500",
                    verticalAlign: "top",
                  }}
                >
                  {d.qty}
                </td>
                <td
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid #e5e7eb",
                    textAlign: "center",
                    fontSize: "10px",
                    color: "#64748b",
                    verticalAlign: "top",
                  }}
                >
                  {formatRupiah(d.harga)}
                </td>
                <td
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid #e5e7eb",
                    textAlign: "center",
                    fontSize: "10px",
                    fontWeight: "600",
                    color: "#1f2937",
                    verticalAlign: "top",
                  }}
                >
                  {formatRupiah(itemSubtotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Bagian Bawah: Informasi Pembayaran + Total */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "30px",
          marginTop: "20px",
          flexWrap: "wrap",
        }}
      >
        {/* Informasi Pembayaran */}
        <div style={{ flex: 1, minWidth: "280px" }}>
          <div
            style={{
              padding: "15px",
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "700",
                textAlign: "center",
                color: "#1f2937",
                marginBottom: "12px",
                textTransform: "uppercase",
                borderBottom: "2px solid #0ea5e9",
                paddingBottom: "6px",
              }}
            >
              Informasi Pembayaran
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
                fontSize: "10px",
                color: "#64748b",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: "600",
                    color: "#1f2937",
                    marginBottom: "4px",
                  }}
                >
                  Transfer Bank
                </div>
                <div>
                  <div>BCA: 1234567890</div>
                  <div>BNI: 0987654321</div>
                  <div>BRI: 1122334455</div>
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontWeight: "600",
                    color: "#1f2937",
                    marginBottom: "4px",
                  }}
                >
                  E-Wallet
                </div>
                <div>
                  <div>OVO: 0812-3456-7890</div>
                  <div>Dana: 0812-3456-7890</div>
                  <div>Gopay: 0812-3456-7890</div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "15px",
                fontSize: "9px",
                textAlign: "center",
                color: "#dc2626",
              }}
            >
              <strong>Perhatian:</strong> Harap konfirmasi setelah melakukan
              pembayaran
            </div>
          </div>
        </div>

        {/* Total Pembayaran */}
        <div style={{ width: "300px", minWidth: "280px" }}>
          <div style={{ marginBottom: "15px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#f8fafc",
              }}
            >
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                Subtotal:
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "500",
                  color: "#1f2937",
                }}
              >
                {formatRupiah(totalSubtotal)}
              </span>
            </div>

            {/* Selalu tampilkan diskon, bahkan jika 0 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#f8fafc",
              }}
            >
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                Total Diskon:
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "500",
                  color: totalDiscount > 0 ? "#dc2626" : "#64748b",
                }}
              >
                {totalDiscount > 0
                  ? `- ${formatRupiah(totalDiscount)}`
                  : formatRupiah(0)}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 12px",
                backgroundColor: "#0ea5e9",
                color: "white",
                marginTop: "4px",
                borderRadius: "4px 4px 0 0",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: "700" }}>
                TOTAL TAGIHAN:
              </span>
              <span style={{ fontSize: "14px", fontWeight: "700" }}>
                {formatRupiah(totalAfterDiscount)}
              </span>
            </div>

            {totalPaid > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  backgroundColor: "#d1fae5",
                  borderBottom: "1px solid #86efac",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#059669",
                  }}
                >
                  Dibayar:
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#059669",
                  }}
                >
                  {formatRupiah(totalPaid)}
                </span>
              </div>
            )}

            {sisaTagihan > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 12px",
                  backgroundColor: "#fee2e2",
                  borderRadius: "0 0 4px 4px",
                  borderTop: "2px solid #fca5a5",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#dc2626",
                  }}
                >
                  Sisa Tagihan:
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    color: "#dc2626",
                  }}
                >
                  {formatRupiah(sisaTagihan)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Syarat & Ketentuan — Full Width */}
      <div
        style={{
          marginTop: "25px",
          textAlign: "center",
          padding: "15px",
          backgroundColor: "#f0f9ff",
          borderRadius: "8px",
          border: "1px solid #bae6fd",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: "700",
            color: "#0369a1",
            marginBottom: "12px",
            textTransform: "uppercase",
          }}
        >
          Syarat & Ketentuan
        </div>
        <div
          style={{
            fontSize: "9px",
            color: "#64748b",
            lineHeight: 1.7,
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <div>• Pembayaran dianggap sah setelah dikonfirmasi oleh admin</div>
          <div>• Invoice ini berlaku sebagai bukti transaksi yang sah</div>
          <div>• Pengiriman barang dilakukan setelah pembayaran lunas</div>
          <div>
            • Klaim kerusakan harus diajukan maksimal 3 hari setelah barang
            diterima
          </div>
          <div>• Harga sudah termasuk PPN 11% (jika berlaku)</div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "40px",
          paddingTop: "20px",
          borderTop: "2px solid #e5e7eb",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "9px",
            color: "#94a3b8",
            fontStyle: "italic",
            marginBottom: "15px",
          }}
        >
          Terima kasih atas kepercayaan Anda. Invoice ini dibuat secara otomatis
          dan sah tanpa tanda tangan.
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "30px",
            fontSize: "9px",
            color: "#64748b",
            flexWrap: "wrap",
            padding: "12px",
            backgroundColor: "#f8fafc",
            borderRadius: "6px",
          }}
        >
          <div>🌐 www.jayarubberseal.com</div>
          <div>📱 TikTok: @jayarubberseal</div>
          <div>🛒 Tokopedia: Jaya Rubber Seal</div>
          <div>📷 Instagram: @jaya_rubber_seal</div>
        </div>
      </div>
    </div>
  );
});

InvoicePrint.displayName = "InvoicePrint";

export default InvoicePrint;
