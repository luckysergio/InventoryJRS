export const safeParseFloat = (value) => {
  if (value == null) return 0;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

export const formatRupiah = (value) => {
  const num = safeParseFloat(value);
  return new Intl.NumberFormat("id-ID").format(Math.round(num));
};

export const unformatRupiah = (str) => {
  if (!str) return 0;
  const clean = String(str).replace(/\D/g, "");
  return clean === "" ? 0 : parseInt(clean, 10);
};

export const formatTanggal = (date, style = 'long') => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  if (style === 'short') {
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export const formatProductName = (p) => {
  if (!p) return "-";
  const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean);
  return parts.length > 0 ? parts.join(" • ") : "-";
};

export const getInvoiceNumber = (transaksi) => {
  if (!transaksi?.kode) {
    const date = new Date(transaksi?.tanggal || new Date());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `JRS/INV/${year}/${month}/${transaksi?.id || 0}`;
  }
  return transaksi.kode;
};

export const getStokToko = (product) => {
  if (!product || !product.inventories) return 0;
  const tokoInventory = product.inventories.find(
    (inv) => inv.place && inv.place.kode === "TOKO"
  );
  return tokoInventory ? tokoInventory.qty : 0;
};

// Status helpers
export const STATUS_MAP = {
  PROSES: 1,
  SELESAI: 5,
  DIBATALKAN: 6,
};

export const getStatusConfig = (statusId) => {
  const configs = {
    1: { label: "Proses", bg: "bg-blue-100", text: "text-blue-700", icon: "⏳" },
    2: { label: "Selesai", bg: "bg-green-100", text: "text-green-700", icon: "✅" },
    5: { label: "Selesai", bg: "bg-green-100", text: "text-green-700", icon: "✅" },
    6: { label: "Dibatalkan", bg: "bg-red-100", text: "text-red-700", icon: "❌" },
  };
  return configs[statusId] || { label: "Unknown", bg: "bg-gray-100", text: "text-gray-700", icon: "?" };
};

export const getJenisConfig = (jenis) => {
  const configs = {
    daily: { label: "Harian", bg: "bg-blue-100", text: "text-blue-700" },
    pesanan: { label: "Pesanan", bg: "bg-purple-100", text: "text-purple-700" },
  };
  return configs[jenis] || { label: jenis || "Lainnya", bg: "bg-gray-100", text: "text-gray-700" };
};

export const normalizeDetail = (d) => ({
  ...d,
  product: d.product || d.inventory?.product || null,
  place: d.place || d.inventory?.place || null,
});

export const normalizeDetails = (details = []) => details.map(normalizeDetail);