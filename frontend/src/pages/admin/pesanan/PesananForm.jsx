import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, Plus, Trash2, Search, ChevronDown, ChevronUp,
  Package, Loader2, User, Calendar, CheckCircle2,
  DollarSign, Tag, Sparkles, TrendingUp, Lock, Unlock,
  Pencil, Layers, Hash, AlertCircle, Crown, Info,
  Save, RefreshCw, // ✅ NEW: untuk tombol submit & refresh
} from "lucide-react";

import { usePesananModals } from "../../../lib/zustand/pesananStore";
import { useCreatePesanan, useUpdatePesanan } from "../../../hooks/usePesanan";
import {
  useCustomersFull,
  useProductsAll,
  useJenisDropdown,
  useTypesDropdown,
  useBahansDropdown,
  useHargaByProduct,
  useCreateHarga, // ✅ NEW: hook untuk create harga ke backend
} from "../../../hooks/useMasterData";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import {
  formatRupiah,
  unformatRupiah,
  formatProductName,
  PESANAN_STATUS_MAP,
} from "./utils/pesananUtils";
import { cn } from "../../../lib/utils";

/* ==========================================
   HELPER: KODE GENERATION
   ========================================== */

const jenisKode = (t) => {
  if (!t) return "";
  const c = t.trim().toUpperCase();
  return c.length < 2 ? c : c.charAt(0) + c.charAt(c.length - 1);
};

const typeKode = (t) => {
  if (!t) return "";
  const c = t.replace(/\(.+?\)/g, "").trim().toUpperCase();
  const w = c.split(/\s+/).filter((w) => /^[A-Z]/.test(w));
  const h = w.length === 1 ? w[0].slice(0, 2) : w.map((w) => w.charAt(0)).join("");
  const n = t.match(/\d+/g) || [];
  const a = n.length >= 2 ? n[0] + n[1] : n[0] || "";
  return (h + a).toUpperCase();
};

const bahanKode = (t) => {
  if (!t) return "";
  const c = t.replace(/\(.+?\)/g, "").trim().toUpperCase();
  const w = c.split(/\s+/).filter((w) => /^[A-Z]/.test(w));
  return w.length === 1 ? w[0].slice(0, 2) : w.map((w) => w.charAt(0)).join("");
};

const ukuranKode = (t) => {
  if (!t) return "";
  const m = t.match(/\d+[.,]?\d*/g);
  return m ? m.map((n) => n.replace(/[.,]/g, "")).join("") : "";
};

const customerPrefix = (name, phone) => {
  if (!name) return "";
  const init = name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase()).join("").slice(0, 4);
  const hp = (phone || "").replace(/\D/g, "");
  return init + hp.slice(-4);
};

const generateKodePreview = (jenisNama, typeNama, bahanNama, ukuran, custName, custPhone) => {
  const base = (jenisKode(jenisNama) + typeKode(typeNama) + bahanKode(bahanNama) + ukuranKode(ukuran)).toUpperCase();
  const prefix = customerPrefix(custName, custPhone);
  return prefix ? `${prefix}-${base}` : base || "—";
};

/* ==========================================
   HELPERS
   ========================================== */

const getSafeKey = (item, index, prefix = "item") => {
  if (!item) return `${prefix}-fallback-${index}`;
  const id = item.id ?? item.value ?? item._id;
  return id !== undefined && id !== null && id !== "" ? `${prefix}-${id}` : `${prefix}-index-${index}`;
};

const createEmptyDetail = () => ({
  product_id: "",
  qty: 1,
  discount: 0,
  catatan: "",
  status_transaksi_id: String(PESANAN_STATUS_MAP.PROSES),
  harga_product_id: "",
  harga_baru: {
    harga: "",
    keterangan: "",
    tanggal_berlaku: new Date().toISOString().split("T")[0],
  },
  selected_harga: 0,
  harga_label: "",
  use_new_product: false,
  product_baru: {
    jenis_id: "", jenis_nama: "",
    type_id: "", type_nama: "",
    bahan_id: "", bahan_nama: "",
    ukuran: "", keterangan: "",
  },
});

/* ==========================================
   PORTAL DROPDOWN
   ========================================== */

const useDropdownPosition = (open) => {
  const triggerRef = useRef(null);
  const [style, setStyle] = useState(null);

  useEffect(() => {
    if (!open) { setStyle(null); return; }
    const el = triggerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const maxHeight = 420;
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;

      if (spaceBelow >= 260 || spaceBelow >= spaceAbove) {
        setStyle({
          top: rect.bottom + 6, left: rect.left, width: rect.width,
          maxHeight: Math.max(200, Math.min(maxHeight, spaceBelow)),
        });
      } else {
        setStyle({
          bottom: window.innerHeight - rect.top + 6, left: rect.left, width: rect.width,
          maxHeight: Math.max(200, Math.min(maxHeight, spaceAbove)),
        });
      }
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return { triggerRef, style };
};

const DropdownPortal = ({ open, style, onClose, children }) => {
  if (!open || !style) return null;
  return createPortal(
    <>
      <div className="fixed inset-0 z-[80]" onClick={onClose} />
      <div
        style={style}
        className="fixed z-[85] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn"
      >
        {children}
      </div>
    </>,
    document.body
  );
};

/* ==========================================
   CUSTOMER DROPDOWN
   ========================================== */

const CustomerDropdown = ({ customers, selectedId, onSelect, onCreateNew, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);
  const { triggerRef, style } = useDropdownPosition(isOpen);

  const normalized = useMemo(
    () => (customers || []).map((c, i) => ({
      _key: getSafeKey(c, i, "customer"),
      id: c.id ?? c.value,
      name: c.name ?? c.label ?? "Unnamed",
      phone: c.phone ?? c.no_hp ?? "",
    })),
    [customers]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return normalized;
    const s = search.toLowerCase();
    return normalized.filter((c) => c.name?.toLowerCase().includes(s) || c.phone?.toLowerCase().includes(s));
  }, [normalized, search]);

  const selected = normalized.find((c) => String(c.id) === String(selectedId));

  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  return (
    <div ref={triggerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 border rounded-xl bg-white text-left transition-all",
          disabled && "opacity-60 cursor-not-allowed",
          isOpen ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300"
        )}
      >
        <span className="truncate flex items-center gap-2">
          {selected ? (
            <>
              <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm flex-shrink-0">
                <User size={13} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-slate-900 truncate">{selected.name}</p>
                {selected.phone && <p className="text-xs text-slate-500 truncate">{selected.phone}</p>}
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
        {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      <DropdownPortal open={isOpen} style={style} onClose={() => { setIsOpen(false); setSearch(""); }}>
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Cari nama / no HP..."
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
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
                  onClick={() => {
                    onSelect(c.id);
                    setSearch("");
                    setTimeout(() => setIsOpen(false), 100);
                  }}
                  className={cn(
                    "w-full px-3 py-2.5 text-left text-sm hover:bg-indigo-50 flex items-center gap-3 transition",
                    isSelected && "bg-indigo-50"
                  )}
                >
                  <div className={cn("p-1.5 rounded-lg flex-shrink-0", isSelected ? "bg-indigo-100" : "bg-slate-100")}>
                    <User size={13} className={isSelected ? "text-indigo-600" : "text-slate-500"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{c.name}</p>
                    {c.phone && <p className="text-xs text-slate-500 truncate">{c.phone}</p>}
                  </div>
                  {isSelected && <CheckCircle2 size={16} className="text-indigo-600" />}
                </button>
              );
            })
          )}
        </div>

        {onCreateNew && (
          <button
            type="button"
            onClick={() => { onCreateNew(); setIsOpen(false); setSearch(""); }}
            className="p-3 border-t border-slate-100 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-2 font-medium flex-shrink-0"
          >
            <Plus size={14} /> Buat Customer Baru
          </button>
        )}
      </DropdownPortal>
    </div>
  );
};

/* ==========================================
   PESANAN PRODUCT SELECTOR
   ========================================== */

const PesananProductSelector = ({
  products, selectedId, onSelect, jenisList, bahanList,
  onToggleNewProduct, useNewProduct, productBaru, onUpdateProductBaru,
  disabled = false, customerName = "", customerPhone = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterType, setFilterType] = useState("");
  const inputRef = useRef(null);
  const { triggerRef, style } = useDropdownPosition(isOpen && !useNewProduct);

  const isNewJenis = productBaru.jenis_id === "new";
  const isNewType = productBaru.type_id === "new";
  const isNewBahan = productBaru.bahan_id === "new";

  const activeJenisId = isNewJenis || !productBaru.jenis_id ? null : productBaru.jenis_id;
  const { data: reactiveTypes = [], isLoading: loadingTypes } = useTypesDropdown(activeJenisId);

  useEffect(() => {
    if (isNewJenis || isNewType || !productBaru.jenis_id || loadingTypes) return;
    if (productBaru.type_id) {
      const isValid = reactiveTypes.some((t) => String(t.value ?? t.id) === String(productBaru.type_id));
      if (!isValid) {
        onUpdateProductBaru("type_id", "");
        onUpdateProductBaru("type_nama", "");
      }
    }
  }, [productBaru.jenis_id, productBaru.type_id, reactiveTypes, loadingTypes, isNewJenis, isNewType, onUpdateProductBaru]);

  const kodePreview = useMemo(() => {
    const jNama = isNewJenis
      ? productBaru.jenis_nama
      : jenisList.find((j) => String(j.value ?? j.id) === String(productBaru.jenis_id))?.label ?? "";
    const tNama = isNewType
      ? productBaru.type_nama
      : reactiveTypes.find((t) => String(t.value ?? t.id) === String(productBaru.type_id))?.label ?? "";
    const bNama = isNewBahan
      ? productBaru.bahan_nama
      : bahanList.find((b) => String(b.value ?? b.id) === String(productBaru.bahan_id))?.label ?? "";
    return generateKodePreview(jNama, tNama, bNama, productBaru.ukuran, customerName, customerPhone);
  }, [productBaru, isNewJenis, isNewType, isNewBahan, jenisList, reactiveTypes, bahanList, customerName, customerPhone]);

  const normalized = useMemo(
    () => (products || []).map((p, i) => ({
      _key: getSafeKey(p, i, "product"),
      id: p.id ?? p.value,
      kode: p.kode ?? "",
      jenis_id: p.jenis_id ?? p.jenis?.id,
      type_id: p.type_id ?? p.type?.id,
      bahan_id: p.bahan_id ?? p.bahan?.id,
      jenis: p.jenis, type: p.type, bahan: p.bahan,
      ukuran: p.ukuran ?? "",
      _raw: p,
    })),
    [products]
  );

  const filtered = useMemo(() => {
    let result = normalized;
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((p) =>
        (p.kode || "").toLowerCase().includes(s) || formatProductName(p._raw).toLowerCase().includes(s)
      );
    }
    if (filterJenis) result = result.filter((p) => String(p.jenis_id) === String(filterJenis));
    if (filterType) result = result.filter((p) => String(p.type_id) === String(filterType));
    return result;
  }, [normalized, search, filterJenis, filterType]);

  const selected = normalized.find((p) => String(p.id) === String(selectedId));

  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  if (useNewProduct) {
    return (
      <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 via-pink-50 to-white rounded-xl border-2 border-purple-200 animate-fadeIn">
        <div className="flex items-center justify-between pb-3 border-b border-purple-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <Sparkles size={14} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-purple-900">Produk Pesanan Baru</p>
              <p className="text-[10px] text-purple-700">Format mengikuti Product Customer</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onToggleNewProduct(false)}
            className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-white hover:bg-purple-100 border border-purple-200 rounded-lg transition"
            disabled={disabled}
          >
            Pilih Produk Existing
          </button>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-purple-800 mb-1 uppercase items-center gap-1">
            <Hash size={10} /> Kode Produk (Auto-generated)
          </label>
          <div
            className={cn(
              "w-full px-3 py-2.5 border rounded-lg font-mono font-semibold text-sm text-center transition-colors",
              kodePreview !== "—" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-400"
            )}
          >
            {kodePreview}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-purple-800 mb-1 uppercase">Jenis <span className="text-red-500">*</span></label>
            <select
              className="w-full px-3 py-2.5 border border-purple-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-200"
              value={productBaru.jenis_id}
              onChange={(e) => {
                onUpdateProductBaru("jenis_id", e.target.value);
                onUpdateProductBaru("jenis_nama", "");
                onUpdateProductBaru("type_id", "");
                onUpdateProductBaru("type_nama", "");
              }}
              disabled={disabled}
            >
              <option value="">Pilih Jenis</option>
              {(jenisList || []).map((j, idx) => (
                <option key={getSafeKey(j, idx, "jenis")} value={j.value ?? j.id}>{j.label ?? j.nama}</option>
              ))}
              <option value="new">➕ Buat Jenis Baru</option>
            </select>
            {isNewJenis && (
              <input
                type="text"
                placeholder="Nama JENIS baru (HURUF KAPITAL)"
                className="w-full mt-2 px-3 py-2.5 border border-purple-300 rounded-lg text-sm font-medium uppercase tracking-wide focus:ring-2 focus:ring-purple-200"
                value={productBaru.jenis_nama}
                onChange={(e) => onUpdateProductBaru("jenis_nama", e.target.value.toUpperCase())}
                disabled={disabled}
              />
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-purple-800 mb-1 uppercase">Type {isNewJenis ? "*" : ""}</label>
            {isNewJenis ? (
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Nama TIPE baru (HURUF KAPITAL)"
                  className="w-full px-3 py-2.5 border border-purple-300 rounded-lg text-sm font-medium uppercase tracking-wide focus:ring-2 focus:ring-purple-200"
                  value={productBaru.type_nama}
                  onChange={(e) => onUpdateProductBaru("type_nama", e.target.value.toUpperCase())}
                  disabled={disabled}
                />
                <p className="text-[10px] text-purple-600 flex items-center gap-1">
                  <Sparkles size={9} /> Tipe akan dibuat bersama jenis baru
                </p>
              </div>
            ) : (
              <>
                <select
                  className="w-full px-3 py-2.5 border border-purple-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-200 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  value={productBaru.type_id}
                  onChange={(e) => { onUpdateProductBaru("type_id", e.target.value); onUpdateProductBaru("type_nama", ""); }}
                  disabled={disabled || !productBaru.jenis_id || loadingTypes}
                >
                  <option value="">{loadingTypes ? "Memuat..." : productBaru.jenis_id ? `Pilih Tipe (${reactiveTypes.length})` : "Pilih Jenis dulu"}</option>
                  {reactiveTypes.map((t, idx) => (
                    <option key={getSafeKey(t, idx, "type")} value={t.value ?? t.id}>{t.label ?? t.nama}</option>
                  ))}
                  <option value="new">➕ Buat Tipe Baru</option>
                </select>
                {isNewType && (
                  <input
                    type="text"
                    placeholder="Nama TIPE baru (HURUF KAPITAL)"
                    className="w-full mt-2 px-3 py-2.5 border border-purple-300 rounded-lg text-sm font-medium uppercase tracking-wide focus:ring-2 focus:ring-purple-200"
                    value={productBaru.type_nama}
                    onChange={(e) => onUpdateProductBaru("type_nama", e.target.value.toUpperCase())}
                    disabled={disabled}
                  />
                )}
                {productBaru.jenis_id && !isNewJenis && reactiveTypes.length === 0 && !loadingTypes && (
                  <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={9} /> Belum ada tipe untuk jenis ini, silakan buat baru
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-purple-800 mb-1 uppercase">Bahan</label>
            <select
              className="w-full px-3 py-2.5 border border-purple-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-200"
              value={productBaru.bahan_id}
              onChange={(e) => { onUpdateProductBaru("bahan_id", e.target.value); onUpdateProductBaru("bahan_nama", ""); }}
              disabled={disabled}
            >
              <option value="">Pilih Bahan (opsional)</option>
              {(bahanList || []).map((b, idx) => (
                <option key={getSafeKey(b, idx, "bahan")} value={b.value ?? b.id}>{b.label ?? b.nama}</option>
              ))}
              <option value="new">➕ Buat Bahan Baru</option>
            </select>
            {isNewBahan && (
              <input
                type="text"
                placeholder="Nama BAHAN baru (HURUF KAPITAL)"
                className="w-full mt-2 px-3 py-2.5 border border-purple-300 rounded-lg text-sm font-medium uppercase tracking-wide focus:ring-2 focus:ring-purple-200"
                value={productBaru.bahan_nama}
                onChange={(e) => onUpdateProductBaru("bahan_nama", e.target.value.toUpperCase())}
                disabled={disabled}
              />
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-purple-800 mb-1 uppercase">Ukuran <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="Contoh: 200x100"
              className="w-full px-3 py-2.5 border border-purple-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-purple-200"
              value={productBaru.ukuran}
              onChange={(e) => onUpdateProductBaru("ukuran", e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-purple-800 mb-1 uppercase">Keterangan</label>
          <textarea
            placeholder="Detail spesifikasi pesanan..."
            className="w-full px-3 py-2.5 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-200"
            rows="2"
            value={productBaru.keterangan}
            onChange={(e) => onUpdateProductBaru("keterangan", e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={triggerRef}>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "flex-1 flex items-center justify-between px-4 py-3 border rounded-xl bg-white text-left transition-all",
            disabled && "opacity-60 cursor-not-allowed",
            isOpen ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300"
          )}
          disabled={disabled}
        >
          <span className="truncate flex items-center gap-2 min-w-0">
            {selected ? (
              <>
                <div className="p-1.5 bg-indigo-100 rounded-lg flex-shrink-0">
                  <Package size={13} className="text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-mono font-bold text-xs text-indigo-700">{selected.kode || "-"}</span>
                  <p className="text-xs text-slate-600 truncate">{formatProductName(selected._raw)}</p>
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
          {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        <button
          type="button"
          onClick={() => onToggleNewProduct(true)}
          disabled={disabled}
          className="flex items-center gap-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          title="Buat produk baru"
        >
          <Sparkles size={14} />
          <span className="hidden sm:inline">Produk Baru</span>
        </button>
      </div>

      <DropdownPortal open={isOpen} style={style} onClose={() => setIsOpen(false)}>
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Cari kode / nama produk..."
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-1.5">
            <select
              className="flex-1 py-1.5 px-2 text-xs border border-slate-200 rounded-lg bg-white"
              value={filterJenis}
              onChange={(e) => { setFilterJenis(e.target.value); setFilterType(""); }}
            >
              <option value="">Semua Jenis</option>
              {(jenisList || []).map((j, idx) => (
                <option key={getSafeKey(j, idx, "filter-jenis")} value={j.value ?? j.id}>{j.label ?? j.nama}</option>
              ))}
            </select>

            <select
              className="flex-1 py-1.5 px-2 text-xs border border-slate-200 rounded-lg bg-white disabled:bg-slate-50"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              disabled={!filterJenis}
            >
              <option value="">Semua Type</option>
              {!filterJenis ? [] : normalized
                .filter((p) => String(p.jenis_id) === String(filterJenis) && p.type)
                .reduce((acc, p) => {
                  if (!acc.find((t) => t.id === p.type_id)) acc.push({ id: p.type_id, nama: p.type?.nama || "-" });
                  return acc;
                }, [])
                .map((t, idx) => (
                  <option key={getSafeKey(t, idx, "filter-type")} value={t.id}>{t.nama}</option>
                ))
              }
            </select>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center">
              <Package size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">Produk tidak ditemukan</p>
            </div>
          ) : (
            filtered.map((p) => {
              const isSelected = String(p.id) === String(selectedId);
              return (
                <button
                  key={p._key}
                  type="button"
                  onClick={() => { onSelect(p.id); setTimeout(() => setIsOpen(false), 150); }}
                  className={cn(
                    "w-full px-3 py-2.5 text-left hover:bg-indigo-50 flex items-center gap-3 border-b border-slate-100 last:border-0 transition",
                    isSelected && "bg-indigo-50"
                  )}
                >
                  <div className={cn("p-1.5 rounded-lg flex-shrink-0", isSelected ? "bg-indigo-100" : "bg-slate-100")}>
                    <Package size={13} className={isSelected ? "text-indigo-600" : "text-slate-500"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-mono font-bold text-xs">{p.kode || "-"}</span>
                    <p className="text-xs text-slate-600 truncate">{formatProductName(p._raw)}</p>
                  </div>
                  {isSelected && <CheckCircle2 size={16} className="text-indigo-600" />}
                </button>
              );
            })
          )}
        </div>
      </DropdownPortal>
    </div>
  );
};

/* ==========================================
   ✅ HARGA SELECTOR — FRESH CACHE GUARANTEE
   Dengan submit ke backend + auto-refetch
   ========================================== */

const HargaSelector = ({
  detailIndex, detail, productId, customerId,
  customerName, onUpdateHarga, disabled
}) => {
  const { 
    data: hargaList = [], 
    isLoading, 
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useHargaByProduct(productId, customerId);
  
  const createHargaMut = useCreateHarga(); // ✅ Hook untuk create harga
  const [showNewForm, setShowNewForm] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter harga berdasarkan customer
  const hargaUmum = useMemo(
    () => hargaList.filter((h) => !h.customer_id),
    [hargaList]
  );
  const hargaKhusus = useMemo(
    () => hargaList.filter((h) => h.customer_id && String(h.customer_id) === String(customerId)),
    [hargaList, customerId]
  );

  // ✅ Force refetch setiap kali productId ATAU customerId berubah
  useEffect(() => {
    if (productId) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, customerId]);

  // Auto-reset saat customer berubah
  const prevCustomerIdRef = useRef(customerId);
  useEffect(() => {
    const prevId = String(prevCustomerIdRef.current || "");
    const currId = String(customerId || "");

    if (prevId !== currId && detail.harga_product_id) {
      const selectedHarga = hargaList.find((h) => String(h.id) === String(detail.harga_product_id));

      if (selectedHarga?.customer_id && String(selectedHarga.customer_id) !== currId) {
        onUpdateHarga(detailIndex, {
          harga_product_id: "",
          harga_baru: { harga: "", keterangan: "", tanggal_berlaku: new Date().toISOString().split("T")[0] },
          selected_harga: 0,
          harga_label: "",
        });
        setShowNewForm(false);
      }
    }
    prevCustomerIdRef.current = customerId;
  }, [customerId, hargaList, detail.harga_product_id, detailIndex, onUpdateHarga]);

  // Auto-show new form jika sudah ada draft
  useEffect(() => {
    if (!detail.harga_product_id && detail.harga_baru?.harga) {
      setShowNewForm(true);
    }
  }, [detail.harga_product_id, detail.harga_baru?.harga]);

  // ✅ Auto-refetch saat dropdown dibuka
  useEffect(() => {
    if (isDropdownOpen && productId && !isLoading) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDropdownOpen, productId]);

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
      return;
    }

    setShowNewForm(false);
    const selected = hargaList.find((h) => String(h.id) === String(value));
    onUpdateHarga(detailIndex, {
      harga_product_id: value,
      harga_baru: { harga: "", keterangan: "", tanggal_berlaku: "" },
      selected_harga: Number(selected?.harga) || 0,
      harga_label: selected
        ? `Rp ${formatRupiah(selected.harga)} • ${selected.keterangan || (selected.customer_id ? `Harga Khusus ${customerName || "Customer"}` : "Harga Umum")}`
        : "",
    });
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

  // ✅ Submit harga baru ke backend
  const handleSubmitNewHarga = async () => {
    if (!detail.harga_baru?.harga) return;

    try {
      const payload = {
        product_id: Number(productId),
        customer_id: customerId ? Number(customerId) : null,
        harga: Number(detail.harga_baru.harga),
        keterangan: detail.harga_baru.keterangan?.trim() || (customerId ? `Harga khusus ${customerName}` : 'Harga baru'),
        tanggal_berlaku: detail.harga_baru.tanggal_berlaku || new Date().toISOString().split("T")[0],
      };

      // Create ke backend (auto force-fresh cache via hook)
      const newHarga = await createHargaMut.mutateAsync(payload);
      
      // ✅ Manual refetch setelah success (double-safety)
      await refetch();
      
      // ✅ Small delay untuk pastikan cache sudah ter-update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refetch sekali lagi untuk memastikan
      await refetch();

      // Auto-select harga yang baru dibuat
      onUpdateHarga(detailIndex, {
        harga_product_id: String(newHarga.id),
        harga_baru: { harga: "", keterangan: "", tanggal_berlaku: "" },
        selected_harga: Number(newHarga.harga),
        harga_label: `Rp ${formatRupiah(newHarga.harga)} • ${newHarga.keterangan || 'Harga baru dibuat'}`,
      });
      
      setShowNewForm(false);
    } catch (err) {
      console.error('[HargaSelector] Gagal buat harga:', err);
    }
  };

  const handleCancelNewHarga = () => {
    setShowNewForm(false);
    onUpdateHarga(detailIndex, {
      harga_product_id: "",
      harga_baru: { harga: "", keterangan: "", tanggal_berlaku: "" },
      selected_harga: 0,
      harga_label: "",
    });
  };

  if (!productId) return null;

  if (isLoading && !dataUpdatedAt) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 py-3 px-4 bg-slate-50 rounded-lg border border-slate-200">
        <Loader2 size={14} className="animate-spin text-indigo-600" />
        <span>Memuat daftar harga...</span>
      </div>
    );
  }

  const hasCustomerPrice = hargaKhusus.length > 0 && customerId;
  const hasAnyHarga = hargaList.length > 0;
  const isSubmittingNew = createHargaMut.isPending;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Tag size={13} className="text-indigo-600" />
          Pilih Harga
        </label>

        <div className="flex items-center gap-2 flex-wrap">
          {hasCustomerPrice && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Crown size={10} />
              Harga Khusus {customerName || "Customer"}
            </span>
          )}
          
          {/* ✅ Tombol Refresh Manual */}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching || disabled}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
            title="Refresh daftar harga"
          >
            <RefreshCw size={12} className={isFetching ? "animate-spin text-indigo-600" : "text-slate-500"} />
          </button>

          {detail.selected_harga > 0 && (
            <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              Rp {formatRupiah(detail.selected_harga)}
            </span>
          )}
        </div>
      </div>

      {/* Info box: Customer belum dipilih */}
      {!customerId && hargaUmum.length > 0 && (
        <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800">
          <Info size={12} className="flex-shrink-0 mt-0.5" />
          <p>Pilih customer untuk menampilkan harga khusus (jika ada). Saat ini hanya menampilkan <strong>Harga Umum</strong>.</p>
        </div>
      )}

      <select
        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
        value={currentSelection}
        onChange={(e) => handleSelect(e.target.value)}
        onFocus={() => setIsDropdownOpen(true)}
        onBlur={() => setIsDropdownOpen(false)}
        disabled={disabled || isSubmittingNew}
      >
        <option value="">-- Pilih Harga --</option>

        {/* Harga khusus customer (hanya tampil jika customer punya) */}
        {hargaKhusus.length > 0 && (
          <optgroup label={`💎 Harga Khusus ${customerName || "Customer"}`}>
            {hargaKhusus.map((h) => (
              <option key={`khusus-${h.id}`} value={String(h.id)}>
                Rp {formatRupiah(h.harga)}
                {h.keterangan ? ` • ${h.keterangan}` : ""}
                {" "}✨ Khusus
              </option>
            ))}
          </optgroup>
        )}

        {/* Harga umum (selalu tampil jika ada) */}
        {hargaUmum.length > 0 && (
          <optgroup label="💲 Harga Umum">
            {hargaUmum.map((h) => (
              <option key={`umum-${h.id}`} value={String(h.id)}>
                Rp {formatRupiah(h.harga)}
                {h.keterangan ? ` • ${h.keterangan}` : ""}
              </option>
            ))}
          </optgroup>
        )}

        {/* Empty state jika tidak ada harga sama sekali */}
        {hargaUmum.length === 0 && hargaKhusus.length === 0 && (
          <option value="" disabled>
            Belum ada harga untuk produk ini
          </option>
        )}

        <option value="tambah_harga_khusus">
          {customerId ? `+ Buat Harga Khusus untuk ${customerName || "Customer"}` : "+ Buat Harga Baru"}
        </option>
      </select>

      {/* Info saat customer dipilih tapi tidak punya harga khusus */}
      {customerId && hargaKhusus.length === 0 && hargaUmum.length > 0 && !detail.harga_product_id && !showNewForm && (
        <div className="flex items-start gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
          <Info size={12} className="flex-shrink-0 mt-0.5 text-slate-400" />
          <p>
            <strong>{customerName}</strong> belum memiliki harga khusus untuk produk ini.
            Anda bisa menggunakan harga umum atau <strong>membuat harga khusus baru</strong>.
          </p>
        </div>
      )}

      {/* Warning jika tidak ada harga sama sekali */}
      {!hasAnyHarga && !showNewForm && !disabled && (
        <div className="flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Belum ada harga untuk produk ini</p>
            <p className="text-amber-600 mt-0.5">Silakan buat harga baru untuk melanjutkan</p>
          </div>
        </div>
      )}

      {/* ✅ Form Harga Baru dengan Tombol Submit */}
      {showNewForm && (
        <div className={cn(
          "p-4 rounded-xl border space-y-3 animate-fadeIn",
          customerId
            ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
            : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
        )}>
          <div className={cn(
            "flex items-center gap-2 pb-2 border-b",
            customerId ? "border-amber-200" : "border-blue-200"
          )}>
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              {customerId ? <Crown size={14} className="text-amber-600" /> : <Sparkles size={14} className="text-blue-600" />}
            </div>
            <div className="flex-1">
              <p className={cn(
                "text-sm font-semibold",
                customerId ? "text-amber-900" : "text-blue-900"
              )}>
                {customerId ? `Harga Khusus: ${customerName || "Customer"}` : "Harga Baru"}
              </p>
              {customerId && (
                <p className="text-[10px] text-amber-700">
                  Harga ini akan tersimpan untuk customer ini
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-1 uppercase">
                Harga (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-400 transition"
                value={detail.harga_baru?.harga ? formatRupiah(detail.harga_baru.harga) : ""}
                onChange={(e) => handleNewHargaChange("harga", unformatRupiah(e.target.value))}
                disabled={disabled || isSubmittingNew}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-1 uppercase">Keterangan</label>
              <input
                type="text"
                placeholder={customerId ? "Harga khusus..." : "Keterangan..."}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-400 transition"
                value={detail.harga_baru?.keterangan || ""}
                onChange={(e) => handleNewHargaChange("keterangan", e.target.value)}
                disabled={disabled || isSubmittingNew}
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-1 uppercase">Berlaku Mulai</label>
              <input
                type="date"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-400 transition"
                value={detail.harga_baru?.tanggal_berlaku || new Date().toISOString().split("T")[0]}
                onChange={(e) => handleNewHargaChange("tanggal_berlaku", e.target.value)}
                disabled={disabled || isSubmittingNew}
              />
            </div>
          </div>

          {/* Preview */}
          {detail.harga_baru?.harga > 0 && !isSubmittingNew && (
            <div className={cn(
              "pt-2 border-t flex items-center justify-between text-xs",
              customerId ? "border-amber-200" : "border-blue-200"
            )}>
              <span className="text-slate-600">Preview:</span>
              <span className={cn("font-bold", customerId ? "text-amber-900" : "text-blue-900")}>
                Rp {formatRupiah(detail.harga_baru.harga)}
              </span>
            </div>
          )}

          {/* ✅ Tombol Aksi: Batal + Simpan */}
          <div className={cn(
            "pt-3 border-t flex gap-2",
            customerId ? "border-amber-200" : "border-blue-200"
          )}>
            <button
              type="button"
              onClick={handleCancelNewHarga}
              disabled={isSubmittingNew}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmitNewHarga}
              disabled={disabled || isSubmittingNew || !detail.harga_baru?.harga}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-bold text-white rounded-lg transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2",
                customerId
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              )}
            >
              {isSubmittingNew ? (
                <><Loader2 size={14} className="animate-spin" /> Menyimpan...</>
              ) : (
                <><Save size={14} /> Simpan Harga</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ==========================================
   HARGA MANUAL PRODUCT BARU
   (Tetap sama - ini untuk produk baru yang dibuat di form pesanan)
   ========================================== */

const HargaManualProdukBaru = ({ detail, detailIndex, onUpdateHarga, disabled }) => {
  return (
    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 space-y-3">
      <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
        <DollarSign size={14} /> Harga Produk Pesanan
      </p>
      <p className="text-[10px] text-blue-700 italic">
        Harga ini akan digunakan untuk pesanan ini dan TIDAK disimpan ke database harga.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-medium text-slate-600 mb-1 uppercase">Harga <span className="text-red-500">*</span></label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold"
            value={detail.harga_baru?.harga ? formatRupiah(detail.harga_baru.harga) : ""}
            onChange={(e) =>
              onUpdateHarga(detailIndex, {
                harga_product_id: "",
                harga_baru: {
                  ...detail.harga_baru,
                  harga: unformatRupiah(e.target.value),
                  tanggal_berlaku: detail.harga_baru?.tanggal_berlaku || new Date().toISOString().split("T")[0],
                },
                selected_harga: unformatRupiah(e.target.value),
              })
            }
            disabled={disabled}
          />
        </div>

        <div>
          <label className="block text-[10px] font-medium text-slate-600 mb-1 uppercase">Keterangan</label>
          <input
            type="text"
            placeholder="Harga pesanan..."
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm"
            value={detail.harga_baru?.keterangan || ""}
            onChange={(e) =>
              onUpdateHarga(detailIndex, {
                harga_product_id: "",
                harga_baru: { ...detail.harga_baru, keterangan: e.target.value },
              })
            }
            disabled={disabled}
          />
        </div>

        <div>
          <label className="block text-[10px] font-medium text-slate-600 mb-1 uppercase">Berlaku Mulai</label>
          <input
            type="date"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm"
            value={detail.harga_baru?.tanggal_berlaku || new Date().toISOString().split("T")[0]}
            onChange={(e) =>
              onUpdateHarga(detailIndex, {
                harga_product_id: "",
                harga_baru: { ...detail.harga_baru, tanggal_berlaku: e.target.value },
              })
            }
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

/* ==========================================
   MAIN FORM
   ========================================== */

const PesananForm = () => {
  const { modals, selectedPesanan, closeAllModals } = usePesananModals();
  const createMut = useCreatePesanan();
  const updateMut = useUpdatePesanan();
  const { success, info } = useConfirmDialog();

  const { data: products = [], isLoading: loadingProducts } = useProductsAll();
  const { data: customers = [], isLoading: loadingCustomers } = useCustomersFull();
  const { data: jenisList = [] } = useJenisDropdown();
  const { data: bahanList = [] } = useBahansDropdown();

  const isOpen = modals.form;
  const isEdit = !!selectedPesanan;
  const isSubmitting = createMut.isPending || updateMut.isPending;

  const [form, setForm] = useState({
    customer_id: "",
    customer_baru: { name: "", phone: "", email: "" },
    tanggal: new Date().toISOString().split("T")[0],
    details: [],
  });

  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [editableIndices, setEditableIndices] = useState(new Set());

  // Info customer terpilih
  const selectedCustomerInfo = useMemo(() => {
    if (isCreatingCustomer && form.customer_baru.name) {
      return { id: null, name: form.customer_baru.name, phone: form.customer_baru.phone || "" };
    }
    if (form.customer_id) {
      const c = customers.find((c) => String(c.id ?? c.value) === String(form.customer_id));
      return {
        id: c?.id ?? c?.value,
        name: c?.name || c?.label || "",
        phone: c?.phone || c?.no_hp || "",
      };
    }
    return { id: null, name: "", phone: "" };
  }, [form.customer_id, form.customer_baru, isCreatingCustomer, customers]);

  useEffect(() => {
    if (!isOpen) return;

    if (isEdit && selectedPesanan) {
      const activeDetails = (selectedPesanan.details || [])
        .filter((d) => d.status_transaksi_id !== PESANAN_STATUS_MAP.DIBATALKAN)
        .map((d) => ({
          id: d.id,
          product_id: String(d.product_id || ""),
          qty: d.qty || 1,
          discount: d.discount || 0,
          catatan: d.catatan || "",
          status_transaksi_id: String(d.status_transaksi_id || PESANAN_STATUS_MAP.PROSES),
          harga_product_id: "",
          harga_baru: { harga: "", keterangan: "", tanggal_berlaku: "" },
          selected_harga: Number(d.harga) || 0,
          harga_label: d.harga ? `Rp ${formatRupiah(d.harga)} (tersimpan)` : "",
          use_new_product: false,
          product_baru: {
            jenis_id: "", jenis_nama: "",
            type_id: "", type_nama: "",
            bahan_id: "", bahan_nama: "",
            ukuran: "", keterangan: "",
          },
        }));

      setForm({
        customer_id: String(selectedPesanan.customer_id || ""),
        customer_baru: {
          name: selectedPesanan.customer?.name || "",
          phone: selectedPesanan.customer?.phone || "",
          email: "",
        },
        tanggal: selectedPesanan.tanggal || new Date().toISOString().split("T")[0],
        details: activeDetails.length > 0 ? activeDetails : [createEmptyDetail()],
      });

      setIsCreatingCustomer(false);
      setEditableIndices(new Set());
      return;
    }

    setForm({
      customer_id: "",
      customer_baru: { name: "", phone: "", email: "" },
      tanggal: new Date().toISOString().split("T")[0],
      details: [createEmptyDetail()],
    });

    setIsCreatingCustomer(false);
    setEditableIndices(new Set([0]));
  }, [isOpen, isEdit, selectedPesanan]);

  const toggleEditDetail = (index) => {
    setEditableIndices((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const addDetailRow = () => {
    const newIndex = form.details.length;
    setForm((f) => ({ ...f, details: [...f.details, createEmptyDetail()] }));
    setEditableIndices((prev) => new Set([...prev, newIndex]));
  };

  const removeDetailRow = (index) => {
    setForm((f) => ({ ...f, details: f.details.filter((_, i) => i !== index) }));
    setEditableIndices((prev) => {
      const next = new Set();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  const updateDetail = (index, field, value) => {
    setForm((f) => {
      const updated = [...f.details];
      updated[index] = { ...updated[index], [field]: value };

      if (field === "product_id") {
        updated[index].use_new_product = false;
        updated[index].harga_product_id = "";
        updated[index].harga_baru = {
          harga: "", keterangan: "",
          tanggal_berlaku: new Date().toISOString().split("T")[0],
        };
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

  const updateProductBaru = (index, field, value) => {
    setForm((f) => {
      const updated = [...f.details];
      updated[index] = {
        ...updated[index],
        product_baru: { ...updated[index].product_baru, [field]: value },
      };
      return { ...f, details: updated };
    });
  };

  const toggleNewProduct = (index, value) => {
    setForm((f) => {
      const updated = [...f.details];
      updated[index] = { ...updated[index], use_new_product: value };

      if (value) {
        updated[index].product_id = "";
        updated[index].harga_product_id = "";
        updated[index].harga_baru = {
          harga: "", keterangan: "",
          tanggal_berlaku: new Date().toISOString().split("T")[0],
        };
        updated[index].selected_harga = 0;
        updated[index].harga_label = "";
      }

      return { ...f, details: updated };
    });
  };

  const { totalTransaksi, totalDiscount } = useMemo(() => {
    let total = 0;
    let discount = 0;

    form.details.forEach((d) => {
      if (!(d.product_id || d.use_new_product) || !d.selected_harga) return;
      const qty = Number(d.qty) || 0;
      const disc = Number(d.discount) || 0;
      const subtotal = Math.max(Number(d.selected_harga) * qty - disc, 0);
      total += subtotal;
      discount += disc;
    });

    return { totalTransaksi: total, totalDiscount: discount };
  }, [form.details]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.customer_id && !form.customer_baru.name.trim()) {
      await info("Peringatan", "Pilih customer atau isi customer baru.");
      return;
    }

    if (!form.tanggal) {
      await info("Peringatan", "Tanggal pesanan wajib diisi.");
      return;
    }

    const validDetails = form.details.filter((d) => d.product_id || d.use_new_product);

    if (validDetails.length === 0) {
      await info("Peringatan", "Tambahkan minimal 1 item pesanan.");
      return;
    }

    const errors = [];

    validDetails.forEach((d, idx) => {
      const label = `Item #${idx + 1}`;

      if (d.use_new_product) {
        if (!d.product_baru.jenis_id && !d.product_baru.jenis_nama) {
          errors.push(`${label}: Jenis wajib diisi.`);
        } else if (d.product_baru.jenis_id === "new" && !d.product_baru.jenis_nama.trim()) {
          errors.push(`${label}: Nama jenis baru wajib diisi.`);
        }

        if (!d.product_baru.type_id && !d.product_baru.type_nama) {
          errors.push(`${label}: Type wajib diisi.`);
        } else if (d.product_baru.type_id === "new" && !d.product_baru.type_nama.trim()) {
          errors.push(`${label}: Nama type baru wajib diisi.`);
        }

        if (d.product_baru.bahan_id === "new" && !d.product_baru.bahan_nama.trim()) {
          errors.push(`${label}: Nama bahan baru wajib diisi.`);
        }

        if (!d.product_baru.ukuran?.trim()) {
          errors.push(`${label}: Ukuran wajib diisi.`);
        }
      }

      if (!d.selected_harga || Number(d.selected_harga) <= 0) {
        errors.push(`${label}: Harga wajib diisi.`);
      }

      if (!d.qty || Number(d.qty) <= 0) {
        errors.push(`${label}: Qty minimal 1.`);
      }
    });

    if (errors.length > 0) {
      await info("Validasi Gagal", errors.join("\n"));
      return;
    }

    const payload = {
      customer_id: form.customer_id || undefined,
      customer_baru: !form.customer_id
        ? {
            name: form.customer_baru.name.trim(),
            phone: form.customer_baru.phone.trim() || undefined,
            email: form.customer_baru.email.trim() || undefined,
          }
        : undefined,
      tanggal: form.tanggal,
      details: validDetails.map((d) => {
        const base = {
          id: d.id || undefined,
          product_id: d.product_id ? Number(d.product_id) : null,
          qty: Number(d.qty) || 1,
          discount: Number(d.discount) || 0,
          catatan: d.catatan?.trim() || undefined,
          status_transaksi_id: Number(d.status_transaksi_id || PESANAN_STATUS_MAP.PROSES),
        };

        if (d.use_new_product) {
          base.product_baru = {
            jenis_id: d.product_baru.jenis_id === "new" ? null : d.product_baru.jenis_id ? Number(d.product_baru.jenis_id) : null,
            jenis_nama: d.product_baru.jenis_id === "new" ? d.product_baru.jenis_nama.trim() : undefined,
            type_id: d.product_baru.type_id === "new" ? null : d.product_baru.type_id ? Number(d.product_baru.type_id) : null,
            type_nama: d.product_baru.type_id === "new" ? d.product_baru.type_nama.trim() : undefined,
            bahan_id: d.product_baru.bahan_id === "new" ? null : d.product_baru.bahan_id ? Number(d.product_baru.bahan_id) : null,
            bahan_nama: d.product_baru.bahan_id === "new" ? d.product_baru.bahan_nama.trim() : undefined,
            ukuran: d.product_baru.ukuran.trim(),
            keterangan: d.product_baru.keterangan?.trim() || undefined,
          };
        }

        if (d.harga_product_id) {
          base.harga_product_id = Number(d.harga_product_id);
        } else {
          base.harga_baru = {
            harga: Number(d.harga_baru?.harga || d.selected_harga),
            keterangan: d.harga_baru?.keterangan?.trim() || undefined,
            tanggal_berlaku: d.harga_baru?.tanggal_berlaku || new Date().toISOString().split("T")[0],
          };
        }

        return base;
      }),
    };

    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: selectedPesanan.id, data: payload });
        await success("Berhasil", "Pesanan berhasil diperbarui.");
      } else {
        await createMut.mutateAsync(payload);
        await success("Berhasil", "Pesanan berhasil dibuat.");
      }
      closeAllModals();
    } catch (err) {
      if (err.response?.data?.errors) {
        const msgs = Object.values(err.response.data.errors).flat().join("\n");
        await info("Validasi Gagal", msgs);
      } else {
        await info("Gagal", err.response?.data?.message || "Terjadi kesalahan.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full sm:max-w-5xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 h-[95vh] sm:h-auto sm:max-h-[92vh] flex flex-col">
        {/* Header */}
        <div
          className={cn(
            "px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0",
            isEdit ? "bg-gradient-to-r from-amber-50 via-orange-50 to-white" : "bg-gradient-to-r from-purple-50 via-pink-50 to-white"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2.5 rounded-xl shadow-sm",
                isEdit ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-purple-500 to-pink-600"
              )}
            >
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isEdit ? "Edit Pesanan" : "Pesanan Baru"}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                {isEdit ? "Klik ikon pensil untuk mengedit detail pesanan" : "Buat pesanan dari produk existing atau produk custom"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAllModals}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 sm:p-6 space-y-5">
            {(loadingProducts || loadingCustomers) && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-sm text-blue-800">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat data master...
              </div>
            )}

            {/* Customer */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <User size={14} className="text-indigo-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Informasi Customer</h3>
              </div>

              <CustomerDropdown
                customers={customers}
                selectedId={form.customer_id}
                onSelect={(id) => {
                  setForm((f) => ({
                    ...f,
                    customer_id: id,
                    customer_baru: { name: "", phone: "", email: "" },
                  }));
                  setIsCreatingCustomer(false);
                }}
                onCreateNew={() => {
                  setIsCreatingCustomer(true);
                  setForm((f) => ({ ...f, customer_id: "" }));
                }}
                disabled={isSubmitting || loadingCustomers}
              />

              {isCreatingCustomer && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 space-y-3 animate-fadeIn">
                  <p className="text-sm font-semibold text-blue-900">Customer Baru</p>
                  <input
                    type="text"
                    placeholder="Nama Customer *"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm"
                    value={form.customer_baru.name}
                    onChange={(e) => setForm((f) => ({ ...f, customer_baru: { ...f.customer_baru, name: e.target.value } }))}
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="tel"
                      placeholder="No HP"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm"
                      value={form.customer_baru.phone}
                      onChange={(e) => setForm((f) => ({ ...f, customer_baru: { ...f.customer_baru, phone: e.target.value } }))}
                      disabled={isSubmitting}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm"
                      value={form.customer_baru.email}
                      onChange={(e) => setForm((f) => ({ ...f, customer_baru: { ...f.customer_baru, email: e.target.value } }))}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 uppercase flex items-center gap-1.5">
                  <Calendar size={13} className="text-indigo-600" />
                  Tanggal Pesanan
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 text-sm"
                  value={form.tanggal}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
                  max={new Date().toISOString().split("T")[0]}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Details */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <Package size={14} className="text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Detail Pesanan</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                    {form.details.length} item
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {form.details.map((detail, index) => {
                  const detailKey = detail.id ? `detail-${detail.id}` : `detail-new-${index}`;
                  const isEditable = editableIndices.has(index);
                  const isLocked = !isEditable;
                  const hargaNum = Number(detail.selected_harga) || 0;
                  const qtyNum = Number(detail.qty) || 0;
                  const subtotal = Math.max(hargaNum * qtyNum - (Number(detail.discount) || 0), 0);

                  return (
                    <div
                      key={detailKey}
                      className={cn(
                        "border rounded-2xl transition-all",
                        isLocked ? "border-slate-200 bg-slate-50/30" : "border-slate-200 hover:shadow-md"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-between px-4 py-2.5 rounded-t-2xl",
                          isLocked ? "bg-slate-100" : "bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-200 text-slate-700">
                            Item #{index + 1}
                          </span>
                          {isLocked ? (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Lock size={10} /> Terkunci
                            </span>
                          ) : (
                            <span className="text-[10px] text-indigo-600 flex items-center gap-1">
                              <Unlock size={10} /> Diedit
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {(detail.product_id || detail.use_new_product) && (
                            <button
                              type="button"
                              onClick={() => toggleEditDetail(index)}
                              disabled={isSubmitting}
                              className={cn(
                                "p-1.5 rounded-lg transition",
                                isLocked ? "text-amber-600 hover:bg-amber-100" : "text-indigo-600 hover:bg-indigo-100"
                              )}
                            >
                              {isLocked ? <Pencil size={14} /> : <Lock size={14} />}
                            </button>
                          )}

                          {isEditable && form.details.length > 1 && (
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
                      </div>

                      <div className={cn("p-4 space-y-3 transition-opacity", isLocked && "opacity-80")}>
                        <PesananProductSelector
                          products={products}
                          selectedId={detail.product_id}
                          onSelect={(id) => updateDetail(index, "product_id", id)}
                          jenisList={jenisList}
                          bahanList={bahanList}
                          useNewProduct={detail.use_new_product}
                          onToggleNewProduct={(v) => toggleNewProduct(index, v)}
                          productBaru={detail.product_baru}
                          onUpdateProductBaru={(field, value) => updateProductBaru(index, field, value)}
                          disabled={isLocked || isSubmitting}
                          customerName={selectedCustomerInfo.name}
                          customerPhone={selectedCustomerInfo.phone}
                        />

                        {detail.product_id && !detail.use_new_product && (
                          <HargaSelector
                            detailIndex={index}
                            detail={detail}
                            productId={detail.product_id}
                            customerId={selectedCustomerInfo.id}
                            customerName={selectedCustomerInfo.name}
                            onUpdateHarga={updateHarga}
                            disabled={isLocked || isSubmitting}
                          />
                        )}

                        {detail.use_new_product && (
                          <HargaManualProdukBaru
                            detail={detail}
                            detailIndex={index}
                            onUpdateHarga={updateHarga}
                            disabled={isLocked || isSubmitting}
                          />
                        )}

                        {!detail.product_id && !detail.use_new_product && (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                            <p className="text-xs text-slate-500">Silakan pilih produk atau buat produk baru.</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold mb-1 uppercase">Qty <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              min="1"
                              className={cn(
                                "w-full px-3 py-2 border rounded-lg text-sm font-semibold",
                                isLocked ? "border-slate-200 bg-slate-100" : "border-slate-200 focus:ring-2 focus:ring-indigo-200"
                              )}
                              value={detail.qty}
                              onChange={(e) => updateDetail(index, "qty", e.target.value)}
                              disabled={isLocked || isSubmitting}
                              readOnly={isLocked}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Harga</label>
                            <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold bg-slate-50">
                              Rp {formatRupiah(hargaNum)}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Diskon</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              className={cn(
                                "w-full px-3 py-2 border rounded-lg text-sm",
                                isLocked ? "border-slate-200 bg-slate-100" : "border-slate-200 focus:ring-2 focus:ring-indigo-200"
                              )}
                              value={detail.discount ? formatRupiah(detail.discount) : ""}
                              onChange={(e) => updateDetail(index, "discount", unformatRupiah(e.target.value))}
                              placeholder="0"
                              disabled={isLocked || isSubmitting}
                              readOnly={isLocked}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Subtotal</label>
                            <div
                              className={cn(
                                "w-full px-3 py-2 rounded-lg text-sm font-bold border",
                                subtotal > 0
                                  ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700"
                                  : "bg-slate-50 border-slate-200 text-slate-800"
                              )}
                            >
                              {subtotal > 0 ? formatRupiah(subtotal) : "-"}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Catatan</label>
                          <input
                            type="text"
                            className={cn(
                              "w-full px-3 py-2 border rounded-lg text-sm",
                              isLocked ? "border-slate-200 bg-slate-100" : "border-slate-200 focus:ring-2 focus:ring-indigo-200"
                            )}
                            value={detail.catatan}
                            onChange={(e) => updateDetail(index, "catatan", e.target.value)}
                            placeholder="Catatan khusus..."
                            disabled={isLocked || isSubmitting}
                            readOnly={isLocked}
                            maxLength={500}
                          />
                        </div>

                        {isLocked && (detail.product_id || detail.use_new_product) && (
                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                            <p className="text-[11px] text-slate-500 italic flex items-center gap-1">
                              <Lock size={11} /> Item terkunci
                            </p>
                            <button
                              type="button"
                              onClick={() => toggleEditDetail(index)}
                              disabled={isSubmitting}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg"
                            >
                              <Pencil size={12} /> Edit Item
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addDetailRow}
                disabled={isSubmitting}
                className={cn(
                  "mt-4 w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed transition-all group",
                  isSubmitting
                    ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-50"
                    : "border-purple-300 hover:border-purple-500 bg-gradient-to-br from-purple-50/50 to-pink-50/50 hover:from-purple-50 hover:to-pink-50 hover:shadow-md"
                )}
              >
                <div className={cn("p-2 rounded-full", isSubmitting ? "bg-slate-200" : "bg-purple-100 group-hover:bg-purple-200")}>
                  <Plus
                    size={18}
                    className={cn("transition-transform", isSubmitting ? "text-slate-400" : "text-purple-600 group-hover:scale-110")}
                  />
                </div>
                <div className="text-left">
                  <p className={cn("text-sm font-bold", isSubmitting ? "text-slate-400" : "text-purple-700")}>
                    Tambah Item Pesanan
                  </p>
                  <p className={cn("text-[11px]", isSubmitting ? "text-slate-400" : "text-purple-500")}>
                    Pilih produk existing atau buat produk custom baru
                  </p>
                </div>
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white flex-shrink-0">
          <div className="px-5 sm:px-6 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Items</p>
                <p className="text-sm font-bold text-slate-900">
                  {form.details.filter((d) => d.product_id || d.use_new_product).length}
                </p>
              </div>
              <div className="text-center border-x border-slate-200">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Diskon</p>
                <p className="text-sm font-bold text-red-600">
                  {totalDiscount > 0 ? `- Rp ${formatRupiah(totalDiscount)}` : "Rp 0"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Total</p>
                <p className="text-sm font-bold text-purple-700">Rp {formatRupiah(totalTransaksi)}</p>
              </div>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-3 sm:py-4 flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={closeAllModals}
              className="flex-1 sm:flex-none sm:px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || totalTransaksi === 0}
              className={cn(
                "flex-[2] sm:flex-1 px-6 py-3 text-sm font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50",
                isEdit
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Menyimpan...</span>
                </>
              ) : (
                <>
                  <TrendingUp size={16} />
                  <span>{isEdit ? "Perbarui" : "Simpan Pesanan"}</span>
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

export default PesananForm;