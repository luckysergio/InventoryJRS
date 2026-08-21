export const PESANAN_STATUS_MAP = {
  PROSES: 1,
  PRODUKSI: 2,
  QC: 3,
  SIAP_KIRIM: 4,
  SELESAI: 5,
  DIBATALKAN: 6,
};

export const PESANAN_STATUS_INFO = {
  [PESANAN_STATUS_MAP.PROSES]: {
    label: 'Menunggu Proses',
    color: 'blue',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: '⏳',
    nextStatus: PESANAN_STATUS_MAP.PRODUKSI,
    nextLabel: 'Mulai Produksi',
  },
  [PESANAN_STATUS_MAP.PRODUKSI]: {
    label: 'Dalam Produksi',
    color: 'amber',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: '🔨',
    nextStatus: PESANAN_STATUS_MAP.QC,
    nextLabel: 'Lanjut ke QC',
  },
  [PESANAN_STATUS_MAP.QC]: {
    label: 'Quality Control',
    color: 'purple',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: '🔍',
    nextStatus: PESANAN_STATUS_MAP.SIAP_KIRIM,
    nextLabel: 'Lolos QC',
  },
  [PESANAN_STATUS_MAP.SIAP_KIRIM]: {
    label: 'Siap Kirim',
    color: 'cyan',
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    icon: '📦',
    nextStatus: PESANAN_STATUS_MAP.SELESAI,
    nextLabel: 'Selesai',
  },
  [PESANAN_STATUS_MAP.SELESAI]: {
    label: 'Selesai',
    color: 'green',
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: '✅',
    nextStatus: null,
    nextLabel: null,
  },
  [PESANAN_STATUS_MAP.DIBATALKAN]: {
    label: 'Dibatalkan',
    color: 'red',
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: '❌',
    nextStatus: null,
    nextLabel: null,
  },
};

export const ACTIVE_STATUSES = [
  PESANAN_STATUS_MAP.PROSES,
  PESANAN_STATUS_MAP.PRODUKSI,
  PESANAN_STATUS_MAP.QC,
  PESANAN_STATUS_MAP.SIAP_KIRIM,
];

export const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID').format(value || 0);

export const unformatRupiah = (value) => {
  if (!value) return 0;
  return Number(String(value).replace(/\D/g, '')) || 0;
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

export const formatProductName = (product) => {
  if (!product) return '-';
  const parts = [
    product.jenis?.nama,
    product.type?.nama,
    product.bahan?.nama,
    product.ukuran && `Ukuran: ${product.ukuran}`,
  ].filter(Boolean);
  return parts.join(' • ') || product.kode || '-';
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

export const normalizeDetails = (details = []) => {
  return details.map((d) => ({
    ...d,
    total_bayar: Number(d.total_bayar) || 0,
    sisa_tagihan: Number(d.sisa_tagihan) || 0,
  }));
};

export const getOverallPesananStatus = (details = []) => {
  if (!details.length) return PESANAN_STATUS_MAP.PROSES;

  const normalized = normalizeDetails(details);
  const active = normalized.filter((d) =>
    ![PESANAN_STATUS_MAP.SELESAI, PESANAN_STATUS_MAP.DIBATALKAN].includes(d.status_transaksi_id)
  );

  if (active.length === 0) {
    const adaSelesai = normalized.some((d) => d.status_transaksi_id === PESANAN_STATUS_MAP.SELESAI);
    return adaSelesai ? PESANAN_STATUS_MAP.SELESAI : PESANAN_STATUS_MAP.DIBATALKAN;
  }

  // Return status tertinggi yang masih aktif (prioritas workflow)
  const priorities = [
    PESANAN_STATUS_MAP.SIAP_KIRIM,
    PESANAN_STATUS_MAP.QC,
    PESANAN_STATUS_MAP.PRODUKSI,
    PESANAN_STATUS_MAP.PROSES,
  ];
  for (const p of priorities) {
    if (active.some((d) => d.status_transaksi_id === p)) return p;
  }
  return PESANAN_STATUS_MAP.PROSES;
};