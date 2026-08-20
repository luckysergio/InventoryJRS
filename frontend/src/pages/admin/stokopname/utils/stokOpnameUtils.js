// ==========================================
// NORMALIZE: support struktur FLAT (Resource baru) & NESTED (legacy)
// Backend Resource baru return: d.product, d.place (flat)
// Struktur lama return: d.inventory.product, d.inventory.place (nested)
// ==========================================
export const normalizeDetail = (d) => ({
  ...d,
  product: d.product || d.inventory?.product || null,
  place: d.place || d.inventory?.place || null,
});

export const normalizeDetails = (details = []) => details.map(normalizeDetail);

export const formatProductName = (p) => {
  if (!p) return "-";
  const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "-";
};

// Sort BENGKEL dulu, lalu TOKO, lalu lainnya
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

// Label opname: keterangan custom atau format JRS/SO/YYYY/MM/ID
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