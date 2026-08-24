export const normalizeDetail = (d) => ({
  ...d,
  product: d.product || d.inventory?.product || null,
  place: d.place || d.inventory?.place || null,
  inventory_id: d.inventory_id || d.inventory?.id || null,
});

export const normalizeDetails = (details = []) => details.map(normalizeDetail);

export const formatProductName = (p) => {
  if (!p) return "-";
  const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "-";
};

export const sortDetailsByPlace = (details = []) => {
  const getPriority = (kode) => {
    if (kode === "BENGKEL") return 0;
    if (kode === "TOKO") return 1;
    return 2;
  };
  return [...normalizeDetails(details)].sort(
    (a, b) => getPriority(a.place?.kode) - getPriority(b.place?.kode)
  );
};

export const getOpnameLabel = (opname) => {
  if (opname.keterangan) return opname.keterangan;
  const date = new Date(opname.tgl_opname);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `JRS/SO/${year}/${month}/${opname.id}`;
};

export const getTotalSelisih = (details = []) =>
  details.reduce((sum, d) => sum + (Number(d.selisih) || 0), 0);

export const getFilledCount = (details = []) =>
  details.filter((d) => d.stok_real !== null && d.stok_real !== undefined).length;

export const getProgress = (details = []) => {
  if (details.length === 0) return 0;
  const filled = getFilledCount(details);
  return Math.round((filled / details.length) * 100);
};

export const groupByPlace = (details = []) => {
  return normalizeDetails(details).reduce((acc, d) => {
    const kode = d.place?.kode || "LAINNYA";
    if (!acc[kode]) acc[kode] = [];
    acc[kode].push(d);
    return acc;
  }, {});
};

export const getPlaceCounts = (details = []) => {
  const counts = {};
  normalizeDetails(details).forEach((d) => {
    const kode = d.place?.kode || "LAINNYA";
    counts[kode] = (counts[kode] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([kode, count]) => ({ kode, count }))
    .sort((a, b) => {
      const priority = { BENGKEL: 0, TOKO: 1 };
      return (priority[a.kode] ?? 2) - (priority[b.kode] ?? 2);
    });
};

export const isOpnameComplete = (details = []) => {
  if (details.length === 0) return false;
  return details.every((d) => d.stok_real !== null && d.stok_real !== undefined);
};

export const getPlaceEmoji = (kode) => {
  const map = {
    TOKO: "🏪",
    BENGKEL: "🔧",
    GUDANG: "📦",
  };
  return map[kode] || "📦";
};

export const formatDateShort = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatDateLong = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};