import { useState, useEffect, useMemo, useRef } from "react";
import {
  X, Plus, Trash2, Search, ChevronDown, ChevronUp,
  Package, Loader2, User, Calendar, CheckCircle2, DollarSign,
  Tag, AlertCircle, Sparkles, TrendingUp,
} from "lucide-react";
import { useTransaksiModals } from "../../../lib/zustand/transaksiStore";
import {
  useCreateTransaksi,
  useUpdateTransaksi,
  useStatusTransaksiList,
} from "../../../hooks/useTransaksi";
import {
  useCustomersFull,
  useProductsFull,
  useJenisDropdown,
  useTypesDropdown,
  useHargaByProduct,
} from "../../../hooks/useMasterData";
import { useInventories } from "../../../hooks/useInventory";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import {
  formatRupiah,
  unformatRupiah,
  formatProductName,
  formatTanggal,
  STATUS_MAP,
} from "./utils/transaksiUtils";
import { cn } from "../../../lib/utils";

// ==========================================
// SAFE KEY GENERATOR
// ==========================================
const getSafeKey = (item, index, prefix = "item") => {
  if (!item) return `${prefix}-fallback-${index}`;
  const id = item.id ?? item.value ?? item._id;
  if (id !== undefined && id !== null && id !== "") {
    return `${prefix}-${id}`;
  }
  return `${prefix}-index-${index}`;
};

// ==========================================
// GET STOK TOKO DARI INVENTORY MAP
// ==========================================
const getStokFromMap = (productId, stokMap) => {
  if (!productId || !stokMap) return 0;
  return stokMap.get(Number(productId)) ?? 0;
};

// ==========================================
// INITIAL DETAIL SHAPE
// ==========================================
const createEmptyDetail = (statusProsesId) => ({
  product_id: "",
  qty: 1,
  discount: 0,
  catatan: "",
  status_transaksi_id: statusProsesId,
  harga_product_id: "",
  harga_baru: { harga: "", keterangan: "", tanggal_berlaku: "" },
  selected_harga: 0,      // ✅ Cached actual value for instant calculation
  harga_label: "",        // ✅ Display label
});

// ==========================================
// HARGA SELECTOR COMPONENT (REDESIGNED)
// ==========================================
const HargaSelector = ({
  detailIndex,
  detail,
  productId,
  customerId,
  onUpdateHarga,
  disabled,
}) => {
  const { data: hargaList = [], isLoading } = useHargaByProduct(productId, customerId);
  const [showNewForm, setShowNewForm] = useState(false);

  // Sync showNewForm dengan state detail
  useEffect(() => {
    if (!detail.harga_product_id && detail.harga_baru?.harga) {
      setShowNewForm(true);
    }
  }, [detail.harga_product_id, detail.harga_baru?.harga]);

  // Categorize harga
  const hargaUmum = hargaList.filter((h) => !h.customer_id);
  const hargaKhusus = hargaList.filter((h) => h.customer_id);

  // Determine current selection state
  const selectedHargaObj = detail.harga_product_id
    ? hargaList.find((h) => String(h.id) === String(detail.harga_product_id))
    : null;

  const currentSelection = detail.harga_product_id
    ? String(detail.harga_product_id)
    : showNewForm
      ? "tambah_harga_khusus"
      : "";

  const handleSelect = (value) => {
    if (value === "tambah_harga_khusus") {
      setShowNewForm(true);
      onUpdateHarga(detailIndex, {
        harga_product_id: "",
        harga_baru: {
          harga: detail.harga_baru?.harga || "",
          keterangan: detail.harga_baru?.keterangan || "",
          tanggal_berlaku: detail.harga_baru?.tanggal_berlaku || new Date().toISOString().split("T")[0],
        },
        selected_harga: Number(detail.harga_baru?.harga) || 0,
        harga_label: "",
      });
    } else {
      setShowNewForm(false);
      const selected = hargaList.find((h) => String(h.id) === String(value));
      onUpdateHarga(detailIndex, {
        harga_product_id: value,
        harga_baru: { harga: "", keterangan: "", tanggal_berlaku: "" },
        selected_harga: Number(selected?.harga) || 0,
        harga_label: selected
          ? `Rp ${formatRupiah(selected.harga)} • ${selected.keterangan || (selected.customer_id ? "Harga Khusus" : "Harga Umum")}`
          : "",
      });
    }
  };

  const handleNewHargaChange = (field, value) => {
    const updated = {
      harga: detail.harga_baru?.harga || "",
      keterangan: detail.harga_baru?.keterangan || "",
      tanggal_berlaku: detail.harga_baru?.tanggal_berlaku || new Date().toISOString().split("T")[0],
      [field]: value,
    };

    onUpdateHarga(detailIndex, {
      harga_product_id: "",
      harga_baru: updated,
      selected_harga: field === "harga" ? Number(value) : Number(detail.harga_baru?.harga) || 0,
      harga_label: updated.harga ? `Rp ${formatRupiah(updated.harga)} • ${updated.keterangan || "Harga Baru"}` : "",
    });
  };

  if (!productId) return null;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 py-3 px-4 bg-slate-50 rounded-lg border border-slate-200">
        <Loader2 size={14} className="animate-spin text-indigo-600" />
        <span>Memuat daftar harga...</span>
      </div>
    );
  }

  // Empty state - belum ada harga
  const hasAnyHarga = hargaList.length > 0;

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Tag size={13} className="text-indigo-600" />
          Pilih Harga
        </label>
        {detail.selected_harga > 0 && (
          <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
            Rp {formatRupiah(detail.selected_harga)}
          </span>
        )}
      </div>

      {/* Main Select */}
      <select
        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:outline-none focus:border-indigo-400 disabled:bg-slate-100 disabled:cursor-not-allowed transition"
        value={currentSelection}
        onChange={(e) => handleSelect(e.target.value)}
        disabled={disabled}
      >
        <option value="">-- Pilih Harga --</option>

        {hargaUmum.length > 0 && (
          <optgroup label="💰 Harga Umum">
            {hargaUmum.map((h) => (
              <option key={`umum-${h.id}`} value={String(h.id)}>
                Rp {formatRupiah(h.harga)} {h.keterangan ? `• ${h.keterangan}` : ""} ({formatTanggal(h.tanggal_berlaku, "short")})
              </option>
            ))}
          </optgroup>
        )}

        {hargaKhusus.length > 0 && (
          <optgroup label="⭐ Harga Khusus Customer">
            {hargaKhusus.map((h) => (
              <option key={`khusus-${h.id}`} value={String(h.id)}>
                Rp {formatRupiah(h.harga)} {h.keterangan ? `• ${h.keterangan}` : "• Khusus"} ({formatTanggal(h.tanggal_berlaku, "short")})
              </option>
            ))}
          </optgroup>
        )}

        <option value="tambah_harga_khusus">✨ Buat Harga Khusus Baru</option>
      </select>

      {/* Empty warning */}
      {!hasAnyHarga && !showNewForm && (
        <div className="flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Belum ada harga untuk produk ini</p>
            <p className="text-amber-600 mt-0.5">Silakan buat harga baru untuk melanjutkan</p>
          </div>
        </div>
      )}

      {/* Selected harga info card */}
      {selectedHargaObj && !showNewForm && (
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg animate-fadeIn">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <DollarSign size={16} className="text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              Harga Terpilih
            </p>
            <p className="text-sm font-bold text-slate-900">
              Rp {formatRupiah(selectedHargaObj.harga)}
            </p>
            <p className="text-[10px] text-slate-600 truncate">
              {selectedHargaObj.keterangan || (selectedHargaObj.customer_id ? "Harga Khusus Customer" : "Harga Umum")}
              {" • "}Berlaku {formatTanggal(selectedHargaObj.tanggal_berlaku, "short")}
            </p>
          </div>
          <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
        </div>
      )}

      {/* Edit mode - harga tersimpan dari DB */}
      {detail.harga_product_id && !selectedHargaObj && !isLoading && detail.selected_harga > 0 && (
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <DollarSign size={16} className="text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              Harga Tersimpan
            </p>
            <p className="text-sm font-bold text-slate-900">
              Rp {formatRupiah(detail.selected_harga)}
            </p>
            <p className="text-[10px] text-slate-600">
              Harga dari transaksi sebelumnya
            </p>
          </div>
        </div>
      )}

      {/* New harga form */}
      {showNewForm && (
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2 pb-2 border-b border-blue-200">
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <Sparkles size={14} className="text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-blue-900">Harga Khusus Baru</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-[10px] font-medium text-slate-600 mb-1 uppercase tracking-wide">
                Harga (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-400 transition"
                value={detail.harga_baru?.harga ? formatRupiah(detail.harga_baru.harga) : ""}
                onChange={(e) => handleNewHargaChange("harga", unformatRupiah(e.target.value))}
                disabled={disabled}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-1 uppercase tracking-wide">
                Keterangan
              </label>
              <input
                type="text"
                placeholder="Harga khusus..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-400 transition"
                value={detail.harga_baru?.keterangan || ""}
                onChange={(e) => handleNewHargaChange("keterangan", e.target.value)}
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-1 uppercase tracking-wide">
                Berlaku Mulai
              </label>
              <input
                type="date"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-400 transition"
                value={detail.harga_baru?.tanggal_berlaku || new Date().toISOString().split("T")[0]}
                onChange={(e) => handleNewHargaChange("tanggal_berlaku", e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>

          {detail.harga_baru?.harga > 0 && (
            <div className="pt-2 border-t border-blue-200 flex items-center justify-between">
              <span className="text-xs text-slate-600">Harga akan dibuat:</span>
              <span className="text-sm font-bold text-blue-900">
                Rp {formatRupiah(detail.harga_baru.harga)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// SEARCHABLE CUSTOMER DROPDOWN
// ==========================================
const CustomerDropdown = ({ customers, selectedId, onSelect, onCreateNew, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const normalizedCustomers = useMemo(() => {
    return (customers || []).map((c, idx) => ({
      _key: getSafeKey(c, idx, 'customer'),
      id: c.id ?? c.value,
      name: c.name ?? c.label ?? c.nama ?? "Unnamed",
      no_hp: c.no_hp ?? c.phone ?? "",
      email: c.email ?? "",
    }));
  }, [customers]);

  const filtered = useMemo(() => {
    if (!search.trim()) return normalizedCustomers;
    const s = search.toLowerCase();
    return normalizedCustomers.filter((c) =>
      c.name?.toLowerCase().includes(s) ||
      c.no_hp?.toLowerCase().includes(s)
    );
  }, [normalizedCustomers, search]);

  const selected = normalizedCustomers.find((c) => String(c.id) === String(selectedId));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (disabled) {
    return (
      <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-sm">
        {selected ? (
          <div className="flex items-center gap-2">
            <User size={14} className="text-slate-500" />
            <span className="font-medium">{selected.name}</span>
            {selected.no_hp && <span className="text-slate-400 text-xs">• {selected.no_hp}</span>}
          </div>
        ) : "Pilih Customer..."}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 border rounded-xl bg-white text-left transition-all",
          isOpen
            ? "border-indigo-400 ring-2 ring-indigo-100"
            : "border-slate-200 hover:border-indigo-300"
        )}
      >
        <span className="truncate flex items-center gap-2">
          {selected ? (
            <>
              <div className="p-1.5 bg-indigo-100 rounded-lg flex-shrink-0">
                <User size={13} className="text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-slate-900 truncate">{selected.name}</p>
                {selected.no_hp && (
                  <p className="text-xs text-slate-500 truncate">{selected.no_hp}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="p-1.5 bg-slate-100 rounded-lg flex-shrink-0">
                <User size={13} className="text-slate-400" />
              </div>
              <span className="text-slate-500 text-sm">Pilih Customer...</span>
            </>
          )}
        </span>
        {isOpen ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setSearch(""); }} />
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-80 overflow-hidden flex flex-col animate-fadeIn">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Cari nama/no HP..."
                  className="w-full pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
                {search && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSearch(""); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 max-h-60">
              {filtered.length === 0 ? (
                <div className="p-6 text-center">
                  <User size={24} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">Customer tidak ditemukan</p>
                </div>
              ) : (
                filtered.map((c) => {
                  const isSelected = String(c.id) === String(selectedId);
                  return (
                    <button
                      key={c._key}
                      type="button"
                      onClick={() => { onSelect(c.id); setIsOpen(false); setSearch(""); }}
                      className={cn(
                        "w-full px-3 py-2.5 text-left text-sm hover:bg-indigo-50 flex items-center gap-3 transition",
                        isSelected ? "bg-indigo-50" : ""
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-lg flex-shrink-0",
                        isSelected ? "bg-indigo-100" : "bg-slate-100"
                      )}>
                        <User size={13} className={isSelected ? "text-indigo-600" : "text-slate-500"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{c.name}</p>
                        {c.no_hp && <p className="text-xs text-slate-500 truncate">{c.no_hp}</p>}
                      </div>
                      {isSelected && <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
            {onCreateNew && (
              <button
                type="button"
                onClick={() => { onCreateNew(); setIsOpen(false); setSearch(""); }}
                className="p-3 border-t border-slate-100 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-2 font-medium transition"
              >
                <Plus size={14} /> Buat Customer Baru
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// SEARCHABLE PRODUCT DROPDOWN
// ==========================================
const ProductDropdown = ({ products, selectedId, onSelect, jenisList, typeList, stokMap }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterType, setFilterType] = useState("");
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const normalizedProducts = useMemo(() => {
    return (products || []).map((p, idx) => ({
      _key: getSafeKey(p, idx, 'product'),
      id: p.id ?? p.value,
      kode: p.kode ?? "",
      jenis_id: p.jenis_id ?? p.jenis?.id,
      type_id: p.type_id ?? p.type?.id,
      bahan_id: p.bahan_id ?? p.bahan?.id,
      ukuran: p.ukuran ?? "",
      jenis: p.jenis,
      type: p.type,
      bahan: p.bahan,
      harga_umum: p.harga_umum ?? p.harga ?? 0,
      _raw: p,
    }));
  }, [products]);

  const filtered = useMemo(() => {
    let result = normalizedProducts;

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((p) => {
        const namaProduk = formatProductName(p._raw).toLowerCase();
        const kode = (p.kode || "").toLowerCase();
        return kode.includes(s) || namaProduk.includes(s);
      });
    }

    if (filterJenis) {
      result = result.filter((p) => String(p.jenis_id) === String(filterJenis));
    }

    if (filterType) {
      result = result.filter((p) => String(p.type_id) === String(filterType));
    }

    return result;
  }, [normalizedProducts, search, filterJenis, filterType]);

  const selected = normalizedProducts.find((p) => String(p.id) === String(selectedId));

  const filteredTypes = useMemo(() => {
    if (!filterJenis) return typeList;
    return typeList.filter((t) => {
      const jenisId = t.jenis_id ?? t.jenis?.id;
      return String(jenisId) === String(filterJenis);
    });
  }, [filterJenis, typeList]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const resetFilters = () => {
    setSearch("");
    setFilterJenis("");
    setFilterType("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 border rounded-xl bg-white text-left transition-all",
          isOpen
            ? "border-indigo-400 ring-2 ring-indigo-100"
            : "border-slate-200 hover:border-indigo-300"
        )}
      >
        <span className="truncate flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              <div className="p-1.5 bg-indigo-100 rounded-lg flex-shrink-0">
                <Package size={13} className="text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono font-bold text-xs text-indigo-700">{selected.kode}</span>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-semibold",
                    getStokFromMap(selected.id, stokMap) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    Stok: {getStokFromMap(selected.id, stokMap)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 truncate mt-0.5">
                  {formatProductName(selected._raw)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-1.5 bg-slate-100 rounded-lg flex-shrink-0">
                <Package size={13} className="text-slate-400" />
              </div>
              <span className="text-slate-500 text-sm">Pilih Produk...</span>
            </>
          )}
        </span>
        {isOpen ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-96 overflow-hidden flex flex-col animate-fadeIn">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Cari kode/nama produk..."
                  className="w-full pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
                {search && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSearch(""); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex gap-1.5">
                <select
                  className="flex-1 py-1.5 px-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-200 transition"
                  value={filterJenis}
                  onChange={(e) => { setFilterJenis(e.target.value); setFilterType(""); }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">Semua Jenis</option>
                  {jenisList.map((j) => (
                    <option key={j.value ?? j.id} value={j.value ?? j.id}>{j.label ?? j.nama}</option>
                  ))}
                </select>
                <select
                  className="flex-1 py-1.5 px-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-200 disabled:bg-slate-50 disabled:cursor-not-allowed transition"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  disabled={!filterJenis}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">Semua Tipe</option>
                  {filteredTypes.map((t) => (
                    <option key={t.value ?? t.id} value={t.value ?? t.id}>{t.label ?? t.nama}</option>
                  ))}
                </select>
                {(search || filterJenis || filterType) && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); resetFilters(); }}
                    className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    title="Reset filter"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {(search || filterJenis || filterType) && (
                <p className="text-[10px] text-slate-500 text-center">
                  {filtered.length} dari {normalizedProducts.length} produk
                </p>
              )}
            </div>

            <div className="overflow-y-auto flex-1 max-h-72">
              {filtered.length === 0 ? (
                <div className="p-6 text-center">
                  <Package size={24} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">Produk tidak ditemukan</p>
                </div>
              ) : (
                filtered.map((p) => {
                  const isSelected = String(p.id) === String(selectedId);
                  const stok = getStokFromMap(p.id, stokMap);
                  const isOutOfStock = stok <= 0;
                  return (
                    <button
                      key={p._key}
                      type="button"
                      onClick={() => { if (!isOutOfStock) { onSelect(p.id); setIsOpen(false); } }}
                      disabled={isOutOfStock}
                      className={cn(
                        "w-full px-3 py-2.5 text-left hover:bg-indigo-50 flex items-center gap-3 border-b border-slate-100 last:border-0 transition",
                        isSelected ? "bg-indigo-50" : "",
                        isOutOfStock ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-lg flex-shrink-0",
                        isSelected ? "bg-indigo-100" : "bg-slate-100"
                      )}>
                        <Package size={13} className={cn(
                          isSelected ? "text-indigo-600" : "text-slate-500",
                          isOutOfStock && "text-red-400"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs">{p.kode || "-"}</span>
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-full font-semibold",
                            stok > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {stok > 0 ? `${stok} unit` : "Habis"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 truncate">
                          {formatProductName(p._raw)}
                        </p>
                      </div>
                      {isSelected && <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// MAIN FORM COMPONENT
// ==========================================
const TransaksiForm = () => {
  const { modals, selectedTransaksi, closeAllModals } = useTransaksiModals();
  const createMut = useCreateTransaksi();
  const updateMut = useUpdateTransaksi();
  const { success, info } = useConfirmDialog();

  const { data: statusList = [], isLoading: loadingStatus } = useStatusTransaksiList();
  const { data: products = [], isLoading: loadingProducts } = useProductsFull();
  const { data: customers = [], isLoading: loadingCustomers } = useCustomersFull();
  const { data: jenisList = [] } = useJenisDropdown();
  const { data: typeList = [] } = useTypesDropdown();

  const { data: inventoryData } = useInventories({ perPage: 5000 });
  const allInventories = inventoryData?.inventories || [];

  const stokTokoMap = useMemo(() => {
    const map = new Map();
    allInventories.forEach((inv) => {
      const isToko = inv.place?.kode === "TOKO" ||
                     inv.place?.nama?.toLowerCase().includes("toko");
      if (isToko && inv.product_id) {
        map.set(Number(inv.product_id), Number(inv.qty) || 0);
      }
    });
    return map;
  }, [allInventories]);

  const isOpen = modals.form;
  const isEdit = !!selectedTransaksi;
  const isSubmitting = createMut.isPending || updateMut.isPending;

  const statusProses = statusList.find((s) => s.nama?.toLowerCase().includes("proses"));
  const statusProsesId = statusProses?.id?.toString() || String(STATUS_MAP.PROSES);

  const [form, setForm] = useState({
    customer_id: "",
    customer_baru: { name: "", phone: "", email: "" },
    tanggal: new Date().toISOString().split("T")[0],
    details: [],
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Reset form saat modal buka
  useEffect(() => {
    if (isOpen) {
      if (isEdit && selectedTransaksi) {
        const activeDetails = (selectedTransaksi.details || [])
          .filter((d) => String(d.status_transaksi_id) !== String(STATUS_MAP.DIBATALKAN))
          .map((d) => ({
            id: d.id,
            product_id: String(d.product_id || ""),
            qty: d.qty || 1,
            discount: d.discount || 0,
            catatan: d.catatan || "",
            status_transaksi_id: String(d.status_transaksi_id || statusProsesId),
            harga_product_id: d.harga_product_id ? String(d.harga_product_id) : "",
            harga_baru: { harga: "", keterangan: "", tanggal_berlaku: "" },
            // ✅ Restore from actual harga used in transaction
            selected_harga: Number(d.harga) || 0,
            harga_label: d.harga ? `Rp ${formatRupiah(d.harga)} (tersimpan)` : "",
          }));

        setForm({
          customer_id: String(selectedTransaksi.customer_id || ""),
          customer_baru: {
            name: selectedTransaksi.customer?.name || "",
            phone: selectedTransaksi.customer?.no_hp || selectedTransaksi.customer?.phone || "",
            email: "",
          },
          tanggal: selectedTransaksi.tanggal || new Date().toISOString().split("T")[0],
          details: activeDetails.length > 0
            ? activeDetails
            : [createEmptyDetail(statusProsesId)],
        });
        setIsCreatingCustomer(!selectedTransaksi.customer_id && !!selectedTransaksi.customer);
      } else {
        setForm({
          customer_id: "",
          customer_baru: { name: "", phone: "", email: "" },
          tanggal: new Date().toISOString().split("T")[0],
          details: [createEmptyDetail(statusProsesId)],
        });
        setIsCreatingCustomer(false);
      }
    }
  }, [isOpen, isEdit, selectedTransaksi, statusProsesId]);

  // Detail operations
  const addDetailRow = () => {
    setForm((f) => ({
      ...f,
      details: [...f.details, createEmptyDetail(statusProsesId)],
    }));
  };

  const removeDetailRow = (index) => {
    setForm((f) => ({
      ...f,
      details: f.details.filter((_, i) => i !== index),
    }));
  };

  const updateDetail = (index, field, value) => {
    setForm((f) => {
      const updated = [...f.details];
      updated[index] = { ...updated[index], [field]: value };

      // Reset harga saat product berubah
      if (field === "product_id") {
        updated[index].harga_product_id = "";
        updated[index].harga_baru = { harga: "", keterangan: "", tanggal_berlaku: "" };
        updated[index].selected_harga = 0;
        updated[index].harga_label = "";
      }

      return { ...f, details: updated };
    });
  };

  const updateHarga = (index, hargaData) => {
    setForm((f) => {
      const updated = [...f.details];
      updated[index] = { ...updated[index], ...hargaData };
      return { ...f, details: updated };
    });
  };

  // ✅ Real-time calculation using selected_harga
  const { totalTransaksi, totalDiscount, itemCount } = useMemo(() => {
    let total = 0;
    let discount = 0;
    let count = 0;

    form.details.forEach((d) => {
      if (!d.product_id || !d.selected_harga) return;
      const qty = Number(d.qty) || 0;
      const disc = Number(d.discount) || 0;
      const subtotal = (d.selected_harga * qty) - disc;
      total += subtotal;
      discount += disc;
      count += qty;
    });

    return { totalTransaksi: total, totalDiscount: discount, itemCount: count };
  }, [form.details]);

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.customer_id && !form.customer_baru.name.trim()) {
      await info("Peringatan", "Pilih customer atau isi nama customer baru");
      return;
    }

    if (!form.tanggal) {
      await info("Peringatan", "Tanggal transaksi wajib diisi");
      return;
    }

    if (form.details.length === 0 || !form.details.some((d) => d.product_id)) {
      await info("Peringatan", "Tambahkan minimal 1 produk");
      return;
    }

    const stokErrors = [];
    const hargaErrors = [];

    form.details.forEach((d, idx) => {
      if (!d.product_id) return;
      const stok = getStokFromMap(d.product_id, stokTokoMap);
      const qty = Number(d.qty) || 0;

      if (qty > stok) {
        const product = products.find((p) => String(p.id) === String(d.product_id));
        stokErrors.push(`Item #${idx + 1} (${product?.kode || "Produk"}): Qty ${qty} > Stok ${stok}`);
      }

      if (!d.harga_product_id && !d.selected_harga) {
        const product = products.find((p) => String(p.id) === String(d.product_id));
        hargaErrors.push(`Item #${idx + 1} (${product?.kode || "Produk"}): Harga belum dipilih`);
      }
    });

    if (stokErrors.length > 0) {
      await info("Stok Tidak Cukup", stokErrors.join("\n"));
      return;
    }

    if (hargaErrors.length > 0) {
      await info("Harga Belum Dipilih", hargaErrors.join("\n"));
      return;
    }

    const payload = {
      customer_id: form.customer_id || undefined,
      customer_baru: isCreatingCustomer ? {
        name: form.customer_baru.name.trim(),
        phone: form.customer_baru.phone.trim() || undefined,
        email: form.customer_baru.email.trim() || undefined,
      } : undefined,
      tanggal: form.tanggal,
      details: form.details
        .filter((d) => d.product_id)
        .map((d) => {
          const detailPayload = {
            id: d.id || undefined,
            product_id: Number(d.product_id),
            qty: Number(d.qty) || 1,
            discount: Number(d.discount) || 0,
            catatan: d.catatan.trim() || undefined,
            status_transaksi_id: Number(d.status_transaksi_id || statusProsesId),
          };

          if (d.harga_product_id) {
            detailPayload.harga_product_id = Number(d.harga_product_id);
          } else if (d.harga_baru && d.harga_baru.harga) {
            detailPayload.harga_baru = {
              harga: Number(d.harga_baru.harga),
              keterangan: d.harga_baru.keterangan?.trim() || undefined,
              tanggal_berlaku: d.harga_baru.tanggal_berlaku || new Date().toISOString().split("T")[0],
            };
          }

          return detailPayload;
        }),
    };

    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: selectedTransaksi.id, data: payload });
        await success("Berhasil!", "Transaksi berhasil diperbarui");
      } else {
        await createMut.mutateAsync(payload);
        await success("Berhasil!", "Transaksi berhasil dibuat");
      }
      closeAllModals();
    } catch (err) {
      if (err.response?.data?.errors) {
        const msgs = Object.values(err.response.data.errors).flat().join("\n");
        await info("Validasi Gagal", msgs);
      } else {
        await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full sm:max-w-5xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 h-[95vh] sm:h-auto sm:max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className={cn(
          "px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0",
          isEdit ? "bg-gradient-to-r from-amber-50 via-orange-50 to-white" : "bg-gradient-to-r from-indigo-50 via-purple-50 to-white"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl shadow-sm",
              isEdit ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-indigo-500 to-purple-600"
            )}>
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isEdit ? "Edit Transaksi" : "Transaksi Baru"}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                {isEdit ? "Perbarui detail transaksi penjualan" : "Buat transaksi penjualan baru"}
              </p>
            </div>
          </div>
          <button
            onClick={closeAllModals}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 sm:p-6 space-y-5">
            {(loadingProducts || loadingCustomers || loadingStatus) && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-sm text-blue-800">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat data master...
              </div>
            )}

            {/* Customer & Tanggal Section */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <User size={14} className="text-indigo-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Informasi Customer</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Customer
                </label>
                <CustomerDropdown
                  customers={customers}
                  selectedId={form.customer_id}
                  onSelect={(id) => {
                    setForm((f) => {
                      const updated = { ...f, customer_id: id, customer_baru: { name: "", phone: "", email: "" } };
                      updated.details = updated.details.map((d) => ({
                        ...d,
                        harga_product_id: "",
                        harga_baru: { harga: "", keterangan: "", tanggal_berlaku: "" },
                        selected_harga: 0,
                        harga_label: "",
                      }));
                      return updated;
                    });
                    setIsCreatingCustomer(false);
                  }}
                  onCreateNew={() => {
                    setIsCreatingCustomer(true);
                    setForm((f) => ({ ...f, customer_id: "" }));
                  }}
                  disabled={isSubmitting || loadingCustomers}
                />

                {isCreatingCustomer && (
                  <div className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2 pb-2 border-b border-blue-200">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm">
                        <User size={13} className="text-blue-600" />
                      </div>
                      <p className="text-sm font-semibold text-blue-900">Customer Baru</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Nama Customer *"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-400 transition"
                      value={form.customer_baru.name}
                      onChange={(e) => setForm((f) => ({ ...f, customer_baru: { ...f.customer_baru, name: e.target.value } }))}
                      disabled={isSubmitting}
                      autoFocus
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="tel"
                        placeholder="No HP"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-400 transition"
                        value={form.customer_baru.phone}
                        onChange={(e) => setForm((f) => ({ ...f, customer_baru: { ...f.customer_baru, phone: e.target.value } }))}
                        disabled={isSubmitting}
                      />
                      <input
                        type="email"
                        placeholder="Email (opsional)"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-400 transition"
                        value={form.customer_baru.email}
                        onChange={(e) => setForm((f) => ({ ...f, customer_baru: { ...f.customer_baru, email: e.target.value } }))}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm bg-white transition"
                  value={form.tanggal}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
                  max={new Date().toISOString().split("T")[0]}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Details Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <Package size={14} className="text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Detail Produk</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                    {form.details.length} item
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addDetailRow}
                  disabled={isSubmitting}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-medium rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  <Plus size={13} /> Tambah
                </button>
              </div>

              <div className="space-y-4">
                {form.details.map((detail, index) => {
                  const product = products.find((p) => String(p.id) === String(detail.product_id));
                  const stok = detail.product_id ? getStokFromMap(detail.product_id, stokTokoMap) : 0;
                  const detailKey = detail.id ? `detail-${detail.id}` : `detail-new-${index}`;
                  const qtyNum = Number(detail.qty) || 0;
                  const discNum = Number(detail.discount) || 0;
                  const hargaNum = Number(detail.selected_harga) || 0;
                  const subtotal = (hargaNum * qtyNum) - discNum;
                  const exceedsStok = qtyNum > stok && stok >= 0;

                  return (
                    <div
                      key={detailKey}
                      className={cn(
                        "border rounded-2xl overflow-hidden transition-all duration-200",
                        exceedsStok
                          ? "border-red-300 shadow-sm shadow-red-100"
                          : "border-slate-200 hover:shadow-md hover:border-slate-300"
                      )}
                    >
                      {/* Item Header */}
                      <div className={cn(
                        "flex items-center justify-between px-4 py-2.5",
                        exceedsStok ? "bg-red-50" : "bg-slate-50"
                      )}>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                            exceedsStok ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-700"
                          )}>
                            Item #{index + 1}
                          </span>
                          {exceedsStok && (
                            <span className="text-[10px] text-red-600 flex items-center gap-1">
                              <AlertCircle size={11} /> Melebihi stok
                            </span>
                          )}
                        </div>
                        {form.details.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDetailRow(index)}
                            className="text-red-500 hover:bg-red-100 p-1.5 rounded-lg transition"
                            disabled={isSubmitting}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Item Body */}
                      <div className="p-4 space-y-3">
                        <ProductDropdown
                          products={products}
                          selectedId={detail.product_id}
                          onSelect={(id) => updateDetail(index, "product_id", id)}
                          jenisList={jenisList}
                          typeList={typeList}
                          stokMap={stokTokoMap}
                        />

                        {detail.product_id && (
                          <HargaSelector
                            detailIndex={index}
                            detail={detail}
                            productId={detail.product_id}
                            customerId={form.customer_id}
                            onUpdateHarga={updateHarga}
                            disabled={isSubmitting}
                          />
                        )}

                        {/* Qty, Stok, Diskon */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className={cn(
                              "block text-[10px] font-semibold mb-1 uppercase tracking-wide",
                              exceedsStok ? "text-red-600" : "text-slate-600"
                            )}>
                              Qty <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={stok || 9999}
                              className={cn(
                                "w-full px-3 py-2 border rounded-lg text-sm font-semibold focus:ring-2 focus:outline-none transition",
                                exceedsStok
                                  ? "border-red-300 focus:ring-red-500 bg-red-50"
                                  : "border-slate-200 focus:ring-indigo-200 focus:border-indigo-400"
                              )}
                              value={detail.qty}
                              onChange={(e) => updateDetail(index, "qty", e.target.value)}
                              disabled={isSubmitting || !product}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                              Stok
                            </label>
                            <div className={cn(
                              "w-full px-3 py-2 border rounded-lg text-sm font-bold",
                              stok > 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                            )}>
                              {product ? `${stok} unit` : "-"}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                              Diskon
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:outline-none focus:border-indigo-400 transition"
                              value={detail.discount ? formatRupiah(detail.discount) : ""}
                              onChange={(e) => updateDetail(index, "discount", unformatRupiah(e.target.value))}
                              placeholder="0"
                              disabled={isSubmitting}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                              Subtotal
                            </label>
                            <div className={cn(
                              "w-full px-3 py-2 rounded-lg text-sm font-bold border",
                              subtotal > 0
                                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700"
                                : "bg-slate-50 border-slate-200 text-slate-800"
                            )}>
                              {product && hargaNum > 0 ? formatRupiah(subtotal) : "-"}
                            </div>
                          </div>
                        </div>

                        {/* Catatan */}
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                            Catatan (opsional)
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:outline-none focus:border-indigo-400 transition"
                            value={detail.catatan}
                            onChange={(e) => updateDetail(index, "catatan", e.target.value)}
                            placeholder="Catatan khusus..."
                            disabled={isSubmitting}
                            maxLength={500}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </form>

        {/* Sticky Footer with Summary */}
        <div className="border-t border-slate-200 bg-white flex-shrink-0">
          {/* Summary Bar */}
          <div className="px-5 sm:px-6 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Items</p>
                <p className="text-sm font-bold text-slate-900">{form.details.filter(d => d.product_id).length}</p>
              </div>
              <div className="text-center border-x border-slate-200">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Diskon</p>
                <p className="text-sm font-bold text-red-600">
                  {totalDiscount > 0 ? `- Rp ${formatRupiah(totalDiscount)}` : "Rp 0"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Total</p>
                <p className="text-sm font-bold text-indigo-700">Rp {formatRupiah(totalTransaksi)}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-5 sm:px-6 py-3 sm:py-4 flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={closeAllModals}
              className="flex-1 sm:flex-none sm:px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || totalTransaksi === 0}
              className={cn(
                "flex-[2] sm:flex-1 px-6 py-3 text-sm font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
                isEdit
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-500/30"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/30"
              )}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> <span className="hidden sm:inline">Menyimpan...</span></>
              ) : (
                <>
                  <TrendingUp size={16} />
                  <span>{isEdit ? "Perbarui" : "Simpan Transaksi"}</span>
                  <span className="hidden sm:inline font-mono text-xs opacity-90">
                    • Rp {formatRupiah(totalTransaksi)}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransaksiForm;