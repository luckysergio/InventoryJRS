import { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  Briefcase,
  Plus,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useKaryawanModals } from "../../../lib/zustand/karyawanStore";
import {
  useCreateKaryawan,
  useUpdateKaryawan,
} from "../../../hooks/useKaryawans";
import { useJabatansDropdown } from "../../../hooks/useJabatans";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";

const MAX_NAME_LENGTH = 255;
const MAX_PHONE_LENGTH = 20;

const KaryawanForm = () => {
  const { modals, selectedKaryawan, closeAllModals } = useKaryawanModals();
  const createMutation = useCreateKaryawan();
  const updateMutation = useUpdateKaryawan();
  const { success, info } = useConfirmDialog();

  // Ambil data jabatan untuk dropdown
  const { data: jabatans = [] } = useJabatansDropdown();

  const [form, setForm] = useState({
    nama: "",
    no_hp: "",
    email: "",
    jabatan_id: "",
    jabatan_nama: "",
  });

  const [isCreatingNewJabatan, setIsCreatingNewJabatan] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const isEdit = modals.edit && selectedKaryawan;
  const isCreate = modals.create;
  const isOpen = isEdit || isCreate;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Reset form saat modal open/close
  useEffect(() => {
    if (isEdit && selectedKaryawan) {
      setForm({
        nama: selectedKaryawan.nama || "",
        no_hp: selectedKaryawan.no_hp || "",
        email: selectedKaryawan.email || "",
        jabatan_id: selectedKaryawan.jabatan_id
          ? String(selectedKaryawan.jabatan_id)
          : "",
        jabatan_nama: "",
      });
      setIsCreatingNewJabatan(false);
      setErrors({});
      setTouched({});
    } else if (isCreate) {
      setForm({
        nama: "",
        no_hp: "",
        email: "",
        jabatan_id: "",
        jabatan_nama: "",
      });
      setIsCreatingNewJabatan(false);
      setErrors({});
      setTouched({});
    }
  }, [isEdit, isCreate, selectedKaryawan, modals.edit, modals.create]);

  // Real-time validation
  const validate = (fieldName, value) => {
    const newErrors = { ...errors };

    if (fieldName === "nama" || !fieldName) {
      const trimmed = (form.nama || "").trim();
      if (!trimmed) {
        newErrors.nama = "Nama wajib diisi";
      } else if (trimmed.length < 2) {
        newErrors.nama = "Nama minimal 2 karakter";
      } else if (!/^[\p{L}\s\-.]+$/u.test(trimmed)) {
        newErrors.nama = "Nama hanya boleh huruf, spasi, strip, titik";
      } else {
        delete newErrors.nama;
      }
    }

    if (fieldName === "no_hp" || !fieldName) {
      const trimmed = (form.no_hp || "").trim();
      if (!trimmed) {
        newErrors.no_hp = "No HP wajib diisi";
      } else if (trimmed.length < 8) {
        newErrors.no_hp = "No HP minimal 8 karakter";
      } else if (!/^[0-9+\-\s()]+$/.test(trimmed)) {
        newErrors.no_hp = "No HP hanya boleh angka, +, -, spasi, ()";
      } else {
        delete newErrors.no_hp;
      }
    }

    if (fieldName === "email" || !fieldName) {
      const trimmed = (form.email || "").trim();
      if (!trimmed) {
        newErrors.email = "Email wajib diisi";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        newErrors.email = "Format email tidak valid";
      } else {
        delete newErrors.email;
      }
    }

    if (fieldName === "jabatan" || !fieldName) {
      if (!isCreatingNewJabatan && !form.jabatan_id) {
        if (!form.jabatan_nama?.trim() && isCreatingNewJabatan) {
          newErrors.jabatan = "Pilih jabatan atau isi nama jabatan baru";
        } else if (!form.jabatan_id && !isCreatingNewJabatan) {
          newErrors.jabatan = "Pilih jabatan";
        } else {
          delete newErrors.jabatan;
        }
      } else if (isCreatingNewJabatan) {
        const trimmed = (form.jabatan_nama || "").trim();
        if (!trimmed) {
          newErrors.jabatan = "Nama jabatan baru wajib diisi";
        } else if (trimmed.length < 2) {
          newErrors.jabatan = "Nama jabatan minimal 2 karakter";
        } else if (!/^[\p{L}\s]+$/u.test(trimmed)) {
          newErrors.jabatan = "Nama jabatan hanya boleh huruf dan spasi";
        } else {
          delete newErrors.jabatan;
        }
      } else {
        delete newErrors.jabatan;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      setTimeout(() => validate(name, value), 0);
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validate(name, e.target.value);
  };

  const handleJabatanChange = (e) => {
    const value = e.target.value;
    if (value === "new") {
      setIsCreatingNewJabatan(true);
      setForm((prev) => ({ ...prev, jabatan_id: "", jabatan_nama: "" }));
      setTouched((prev) => ({ ...prev, jabatan: true }));
    } else {
      setIsCreatingNewJabatan(false);
      setForm((prev) => ({ ...prev, jabatan_id: value, jabatan_nama: "" }));
      if (touched.jabatan) {
        setTimeout(() => validate("jabatan", value), 0);
      }
    }
    setErrors((prev) => ({ ...prev, jabatan: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      nama: true,
      no_hp: true,
      email: true,
      jabatan: true,
    });

    // Validate all
    if (!validate(null, null)) {
      return;
    }

    const payload = {
      nama: form.nama.trim(),
      no_hp: form.no_hp.trim(),
      email: form.email.trim().toLowerCase(),
    };

    if (isCreatingNewJabatan) {
      payload.jabatan_nama = form.jabatan_nama.trim().toUpperCase();
    } else if (form.jabatan_id) {
      payload.jabatan_id = parseInt(form.jabatan_id);
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: selectedKaryawan.id,
          data: payload,
        });
        closeAllModals();
        await success(
          "Berhasil!",
          `Karyawan "${payload.nama}" berhasil diperbarui`
        );
      } else {
        await createMutation.mutateAsync(payload);
        closeAllModals();
        await success(
          "Berhasil!",
          `Karyawan "${payload.nama}" berhasil ditambahkan`
        );
      }
    } catch (err) {
      // Handle validation errors dari backend
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const serverErrors = {};
        Object.keys(err.response.data.errors).forEach((key) => {
          serverErrors[key] = err.response.data.errors[key][0];
        });
        setErrors(serverErrors);
        return;
      }

      await info(
        "Gagal",
        err.response?.data?.message || "Terjadi kesalahan, silakan coba lagi"
      );
    }
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    closeAllModals();
  };

  if (!isOpen) return null;

  const nameCharCount = form.nama.length;
  const phoneCharCount = form.no_hp.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div
          className={cn(
            "px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0",
            isEdit
              ? "bg-gradient-to-r from-amber-50 to-white"
              : "bg-gradient-to-r from-blue-50 to-white"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                isEdit ? "bg-amber-100" : "bg-blue-100"
              )}
            >
              <User
                className={cn(
                  "w-5 h-5",
                  isEdit ? "text-amber-600" : "text-blue-600"
                )}
              />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? "Edit Karyawan" : "Tambah Karyawan Baru"}
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
          {/* Nama */}
          <FormField label="Nama Lengkap" required error={errors.nama} touched={touched.nama}>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="nama"
                value={form.nama}
                onChange={handleChange}
                onBlur={handleBlur}
                className={cn(
                  "w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm",
                  errors.nama && touched.nama
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-200 focus:ring-blue-500"
                )}
                placeholder="Nama karyawan"
                disabled={isSubmitting}
                autoFocus
                maxLength={MAX_NAME_LENGTH}
              />
              <ValidationIcon hasError={errors.nama} touched={touched.nama} hasValue={form.nama} />
            </div>
            <CharCounter count={nameCharCount} max={MAX_NAME_LENGTH} />
          </FormField>

          {/* No HP */}
          <FormField label="No HP" required error={errors.no_hp} touched={touched.no_hp}>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="no_hp"
                value={form.no_hp}
                onChange={handleChange}
                onBlur={handleBlur}
                className={cn(
                  "w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm",
                  errors.no_hp && touched.no_hp
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-200 focus:ring-blue-500"
                )}
                placeholder="08xxxxxxxxxx"
                disabled={isSubmitting}
                maxLength={MAX_PHONE_LENGTH}
              />
              <ValidationIcon hasError={errors.no_hp} touched={touched.no_hp} hasValue={form.no_hp} />
            </div>
            <CharCounter count={phoneCharCount} max={MAX_PHONE_LENGTH} />
          </FormField>

          {/* Email */}
          <FormField label="Email" required error={errors.email} touched={touched.email}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={cn(
                  "w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm",
                  errors.email && touched.email
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-200 focus:ring-blue-500"
                )}
                placeholder="email@contoh.com"
                disabled={isSubmitting}
              />
              <ValidationIcon hasError={errors.email} touched={touched.email} hasValue={form.email} />
            </div>
          </FormField>

          {/* Jabatan */}
          <FormField label="Jabatan" required error={errors.jabatan} touched={touched.jabatan}>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                name="jabatan_id"
                value={isCreatingNewJabatan ? "new" : form.jabatan_id}
                onChange={handleJabatanChange}
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm bg-white appearance-none cursor-pointer",
                  errors.jabatan && touched.jabatan
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-200 focus:ring-blue-500"
                )}
                disabled={isSubmitting}
              >
                <option value="">Pilih Jabatan</option>
                {jabatans.map((j) => (
                  <option key={j.value} value={j.value}>
                    {j.label}
                  </option>
                ))}
                <option value="new">➕ Tambah Jabatan Baru</option>
              </select>
            </div>

            {isCreatingNewJabatan && (
              <div className="mt-2 animate-fadeIn">
                <div className="relative">
                  <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="jabatan_nama"
                    value={form.jabatan_nama}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setForm((prev) => ({ ...prev, jabatan_nama: val }));
                      if (touched.jabatan) {
                        setTimeout(() => validate("jabatan", val), 0);
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, jabatan: true }));
                      validate("jabatan", form.jabatan_nama);
                    }}
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm font-medium tracking-wide",
                      errors.jabatan && touched.jabatan
                        ? "border-red-300 focus:ring-red-500"
                        : "border-blue-300 focus:ring-blue-500"
                    )}
                    placeholder="NAMA JABATAN BARU"
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Huruf kapital otomatis. Contoh: STAFF ADMINISTRASI
                </p>
              </div>
            )}
          </FormField>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white pb-1">
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
                "flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                isEdit
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
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

// ============================================
// FORM FIELD WRAPPER
// ============================================
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

// ============================================
// VALIDATION ICON
// ============================================
const ValidationIcon = ({ hasError, touched, hasValue }) => {
  if (!touched || !hasValue) return null;

  if (hasError) {
    return (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <AlertCircle className="w-4 h-4 text-red-500" />
      </div>
    );
  }

  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2">
      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    </div>
  );
};

// ============================================
// CHARACTER COUNTER
// ============================================
const CharCounter = ({ count, max }) => {
  const percentage = (count / max) * 100;
  return (
    <div className="mt-1 flex justify-end">
      <span
        className={cn(
          "text-[11px] font-medium",
          percentage > 90
            ? "text-red-600"
            : percentage > 75
            ? "text-amber-600"
            : "text-slate-400"
        )}
      >
        {count}/{max}
      </span>
    </div>
  );
};

export default KaryawanForm;