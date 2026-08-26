import { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Tag,
  User,
  Globe,
  Calendar,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  ChevronUp,
  ChevronDown,
  Package,
} from "lucide-react";
import { useHargaProductModals } from "../../../lib/zustand/hargaProductStore";
import {
  useCreateHargaProduct,
  useUpdateHargaProduct,
} from "../../../hooks/useHargaProducts";
import {
  useProductsDropdown,
  useCustomersDropdown,
} from "../../../hooks/useMasterData";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";

const formatRupiahDisplay = (value) => {
  if (!value && value !== 0) return "";
  return new Intl.NumberFormat("id-ID").format(value);
};

const unformatRupiah = (value) => {
  if (!value) return "";
  return value.replace(/\D/g, "");
};

// ==========================================
// SEARCHABLE SELECT (Reusable, Cyan Theme)
// ==========================================
const SearchableSelect = ({
  options,
  value,
  onChange,
  icon: Icon,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  disabled = false,
  error = false,
  emptyIcon: EmptyIcon = Package,
  emptyText = "Tidak ada data",
  renderItem,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter & sort options
  const filtered = useMemo(() => {
    const sorted = [...options].sort((a, b) =>
      (a.label || "")
        .toLowerCase()
        .localeCompare((b.label || "").toLowerCase()),
    );
    if (!search.trim()) return sorted;
    const s = search.toLowerCase();
    return sorted.filter((opt) => opt.label?.toLowerCase().includes(s));
  }, [options, search]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when open
  useEffect(() => {
    if (isOpen && inputRef.current && !disabled) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, disabled]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearch("");
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen]);

  const selected = options.find((opt) => String(opt.value) === String(value));

  // Disabled state
  if (disabled) {
    return (
      <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm flex items-center gap-2">
        {Icon && <Icon size={14} className="text-slate-400 flex-shrink-0" />}
        <span className="truncate">
          {selected ? selected.label : placeholder}
        </span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 border rounded-lg bg-white text-left text-sm",
          "outline-none focus:outline-none focus:ring-2 transition-all duration-200",
          error
            ? "border-red-300 focus:ring-red-500"
            : isOpen
              ? "border-cyan-400 ring-2 ring-cyan-200"
              : "border-slate-200 focus:ring-cyan-200 focus:border-cyan-400 hover:border-slate-300",
        )}
      >
        <span className="flex items-center gap-2 truncate min-w-0">
          {Icon && (
            <Icon
              size={14}
              className={cn(
                "flex-shrink-0",
                selected ? "text-cyan-600" : "text-slate-400",
              )}
            />
          )}
          <span
            className={cn(
              "truncate",
              selected ? "text-slate-900 font-semibold" : "text-slate-500",
            )}
          >
            {selected ? selected.label : placeholder}
          </span>
        </span>
        {isOpen ? (
          <ChevronUp size={16} className="text-slate-400 ml-2 flex-shrink-0" />
        ) : (
          <ChevronDown
            size={16}
            className="text-slate-400 ml-2 flex-shrink-0"
          />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col animate-fadeIn">
          {/* Search Bar */}
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {search && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearch("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1 max-h-60">
            {filtered.length === 0 ? (
              <div className="p-6 text-center">
                <EmptyIcon size={24} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">
                  {search ? "Tidak ditemukan" : emptyText}
                </p>
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-2 text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    Reset Pencarian
                  </button>
                )}
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full px-3 py-2.5 text-left text-sm flex items-center justify-between transition-colors",
                      isSelected
                        ? "bg-cyan-50 text-cyan-700 font-semibold"
                        : "hover:bg-slate-50 text-slate-700",
                    )}
                  >
                    {renderItem ? (
                      renderItem(opt, isSelected)
                    ) : (
                      <span className="flex items-center gap-2 truncate">
                        {Icon && (
                          <div
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                              isSelected ? "bg-cyan-100" : "bg-slate-100",
                            )}
                          >
                            <Icon
                              size={13}
                              className={
                                isSelected ? "text-cyan-600" : "text-slate-500"
                              }
                            />
                          </div>
                        )}
                        <span className="truncate">{opt.label}</span>
                      </span>
                    )}
                    {isSelected && (
                      <CheckCircle2
                        size={16}
                        className="text-cyan-600 flex-shrink-0 ml-2"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// MAIN FORM COMPONENT
// ==========================================
const HargaProductForm = () => {
  const { modals, selectedHarga, closeAllModals } = useHargaProductModals();
  const createMutation = useCreateHargaProduct();
  const updateMutation = useUpdateHargaProduct();
  const { success, info } = useConfirmDialog();

  const { data: products = [], isLoading: loadingProducts } =
    useProductsDropdown();
  const { data: customers = [], isLoading: loadingCustomers } =
    useCustomersDropdown();

  const [form, setForm] = useState({
    product_id: "",
    customer_id: "",
    harga: "",
    tanggal_berlaku: "",
    keterangan: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const isEdit = modals.edit && selectedHarga;
  const isCreate = modals.create;
  const isOpen = isEdit || isCreate;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isEdit && selectedHarga) {
      setForm({
        product_id: String(selectedHarga.product_id),
        customer_id: selectedHarga.customer_id
          ? String(selectedHarga.customer_id)
          : "",
        harga: String(selectedHarga.harga),
        tanggal_berlaku: selectedHarga.tanggal_berlaku
          ? selectedHarga.tanggal_berlaku.split("T")[0]
          : "",
        keterangan: selectedHarga.keterangan || "",
      });
      setErrors({});
      setTouched({});
    } else if (isCreate) {
      setForm({
        product_id: "",
        customer_id: "",
        harga: "",
        tanggal_berlaku: "",
        keterangan: "",
      });
      setErrors({});
      setTouched({});
    }
  }, [isEdit, isCreate, selectedHarga, modals.edit, modals.create]);

  const validate = (fieldName) => {
    const newErrors = { ...errors };

    if ((fieldName === "product_id" || !fieldName) && !form.product_id) {
      newErrors.product_id = "Product wajib dipilih";
    } else if (fieldName === "product_id" || !fieldName) {
      delete newErrors.product_id;
    }

    if (fieldName === "harga" || !fieldName) {
      const raw = unformatRupiah(form.harga);
      if (!raw || Number(raw) < 1) {
        newErrors.harga = "Harga wajib diisi dan harus lebih dari 0";
      } else {
        delete newErrors.harga;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "harga") {
      newValue = unformatRupiah(value);
    }

    setForm((prev) => ({ ...prev, [name]: newValue }));
    if (touched[name]) setTimeout(() => validate(name), 0);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validate(name);
  };

  const handleSelectChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ product_id: true, harga: true });
    if (!validate()) return;

    const payload = {
      product_id: parseInt(form.product_id, 10),
      customer_id: form.customer_id ? parseInt(form.customer_id, 10) : null,
      harga: Number(unformatRupiah(form.harga)),
      tanggal_berlaku: form.tanggal_berlaku || null,
      keterangan: form.keterangan.trim() || null,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: selectedHarga.id,
          data: payload,
        });
        await success("Berhasil!", "Harga berhasil diperbarui");
        closeAllModals();
      } else {
        await createMutation.mutateAsync(payload);
        await success("Berhasil!", "Harga berhasil ditambahkan");
        closeAllModals();
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const serverErrors = {};
        Object.keys(err.response.data.errors).forEach((key) => {
          serverErrors[key] = err.response.data.errors[key][0];
        });
        setErrors(serverErrors);
        return;
      }
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) closeAllModals();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div
          className={cn(
            "px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0",
            isEdit
              ? "bg-gradient-to-r from-amber-50 to-white"
              : "bg-gradient-to-r from-cyan-50 to-white",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                isEdit ? "bg-amber-100" : "bg-cyan-100",
              )}
            >
              <Tag
                className={cn(
                  "w-5 h-5",
                  isEdit ? "text-amber-600" : "text-cyan-600",
                )}
              />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? "Edit Harga" : "Tambah Harga Baru"}
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto flex-1"
        >
          {/* Product Select - SEARCHABLE */}
          <FormField
            label="Product"
            required
            error={errors.product_id}
            touched={touched.product_id}
          >
            {loadingProducts ? (
              <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-cyan-600" />
                Memuat data product...
              </div>
            ) : (
              <SearchableSelect
                options={products}
                value={form.product_id}
                onChange={(val) => handleSelectChange("product_id", val)}
                icon={Package}
                placeholder="Pilih Product..."
                searchPlaceholder="Cari kode atau nama product..."
                disabled={isSubmitting}
                error={!!(errors.product_id && touched.product_id)}
                emptyIcon={Package}
                emptyText="Belum ada data product"
                renderItem={(opt, isSelected) => (
                  <span className="flex items-center gap-2 truncate min-w-0">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-mono font-bold text-[10px]",
                        isSelected
                          ? "bg-cyan-100 text-cyan-700"
                          : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {(opt.label || "").slice(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate">{opt.label}</span>
                  </span>
                )}
              />
            )}
          </FormField>

          {/* Customer Select - SEARCHABLE */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Customer{" "}
              <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>

            {loadingCustomers ? (
              <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-cyan-600" />
                Memuat data customer...
              </div>
            ) : (
              <SearchableSelect
                options={customers}
                value={form.customer_id}
                onChange={(val) => handleSelectChange("customer_id", val || "")}
                icon={User}
                placeholder="Harga Umum (Semua Customer)"
                searchPlaceholder="Cari nama customer..."
                disabled={isSubmitting}
                emptyIcon={User}
                emptyText="Belum ada data customer"
                renderItem={(opt, isSelected) => (
                  <span className="flex items-center gap-2 truncate min-w-0">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[10px]",
                        isSelected
                          ? "bg-purple-100 text-purple-700"
                          : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {(opt.label || "?")
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span className="truncate">{opt.label}</span>
                  </span> // ✅ FIXED!
                )}
              />
            )}

            <p className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Kosongkan untuk harga yang berlaku umum
            </p>

            {/* Clear customer button */}
            {form.customer_id && (
              <button
                type="button"
                onClick={() => handleSelectChange("customer_id", "")}
                className="mt-1.5 text-[11px] text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1"
              >
                <X size={12} />
                Kembali ke Harga Umum
              </button>
            )}
          </div>

          {/* Harga Input */}
          <FormField
            label="Harga (Rp)"
            required
            error={errors.harga}
            touched={touched.harga}
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                name="harga"
                value={formatRupiahDisplay(form.harga)}
                onChange={handleChange}
                onBlur={handleBlur}
                className={cn(
                  "w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm font-semibold tracking-wide",
                  errors.harga && touched.harga
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-200 focus:ring-cyan-500 focus:border-cyan-500",
                )}
                placeholder="0"
                disabled={isSubmitting}
                autoFocus={!form.product_id}
              />
              {touched.harga && !errors.harga && form.harga && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              )}
            </div>
          </FormField>

          {/* Tanggal Berlaku */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tanggal Berlaku
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                name="tanggal_berlaku"
                value={form.tanggal_berlaku}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Keterangan
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea
                name="keterangan"
                value={form.keterangan}
                onChange={handleChange}
                rows={2}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm resize-none"
                placeholder="Opsional"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50",
                isEdit
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-cyan-600 hover:bg-cyan-700",
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                </>
              ) : isEdit ? (
                "Perbarui"
              ) : (
                "Simpan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reusable FormField wrapper
const FormField = ({ label, required, error, touched, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && touched && (
      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

export default HargaProductForm;
