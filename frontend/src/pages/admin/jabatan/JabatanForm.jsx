import { useState, useEffect } from "react";
import { X, Briefcase, AlertCircle, CheckCircle2 } from "lucide-react";
import { useJabatanModals } from "../../../lib/zustand/jabatanStore";
import { useCreateJabatan, useUpdateJabatan } from "../../../hooks/useJabatans";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";

const MAX_LENGTH = 100;

const JabatanForm = () => {
  const { modals, selectedJabatan, closeAllModals } = useJabatanModals();
  const createMutation = useCreateJabatan();
  const updateMutation = useUpdateJabatan();
  
  // ✅ Gunakan confirmDialog Anda
  const { success, info } = useConfirmDialog();

  const [nama, setNama] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const isEdit = modals.edit && selectedJabatan;
  const isCreate = modals.create;
  const isOpen = isEdit || isCreate;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Reset form saat modal open/close
  useEffect(() => {
    if (isEdit && selectedJabatan) {
      setNama(selectedJabatan.nama || "");
      setErrors({});
      setTouched({});
    } else if (isCreate) {
      setNama("");
      setErrors({});
      setTouched({});
    }
  }, [isEdit, isCreate, selectedJabatan, modals.edit, modals.create]);

  // Real-time validation
  const validate = (fieldName, value) => {
    const newErrors = { ...errors };

    if (fieldName === "nama" || !fieldName) {
      const trimmed = value.trim();
      if (!trimmed) {
        newErrors.nama = "Nama jabatan wajib diisi";
      } else if (trimmed.length < 2) {
        newErrors.nama = "Nama jabatan minimal 2 karakter";
      } else if (trimmed.length > MAX_LENGTH) {
        newErrors.nama = `Nama jabatan maksimal ${MAX_LENGTH} karakter`;
      } else if (!/^[\p{L}\s]+$/u.test(trimmed)) {
        newErrors.nama = "Nama jabatan hanya boleh huruf dan spasi";
      } else {
        delete newErrors.nama;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const value = e.target.value.toUpperCase();
    setNama(value);

    if (touched.nama) {
      validate("nama", value);
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validate(name, e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ nama: true });

    // Validate all fields
    if (!validate(null, nama)) {
      return;
    }

    const trimmedNama = nama.trim();

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: selectedJabatan.id,
          data: { nama: trimmedNama },
        });
        closeAllModals();
        await success(
          "Berhasil!",
          `Jabatan "${trimmedNama}" berhasil diperbarui.`
        );
      } else {
        await createMutation.mutateAsync({ nama: trimmedNama });
        closeAllModals();
        await success(
          "Berhasil!",
          `Jabatan "${trimmedNama}" berhasil ditambahkan.`
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

  const charCount = nama.length;
  const charPercentage = (charCount / MAX_LENGTH) * 100;

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
              <Briefcase
                className={cn(
                  "w-5 h-5",
                  isEdit ? "text-amber-600" : "text-blue-600"
                )}
              />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? "Edit Jabatan" : "Tambah Jabatan Baru"}
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
          className="p-6 space-y-5 overflow-y-auto flex-1"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nama Jabatan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="nama"
                value={nama}
                onChange={handleChange}
                onBlur={handleBlur}
                className={cn(
                  "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm font-medium tracking-wide",
                  errors.nama && touched.nama
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-200 focus:ring-blue-500"
                )}
                placeholder="CONTOH: STAFF ADMINISTRASI"
                disabled={isSubmitting}
                autoFocus
                maxLength={MAX_LENGTH}
              />

              {/* Validation Icon */}
              {touched.nama && !errors.nama && nama.trim() && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
              )}
              {touched.nama && errors.nama && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
              )}
            </div>

            {/* Character Counter */}
            <div className="mt-2 flex items-center justify-between text-xs">
              {errors.nama && touched.nama ? (
                <p className="text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.nama}
                </p>
              ) : (
                <p className="text-slate-500">
                  Huruf kapital otomatis. Contoh: MANAGER, STAFF IT
                </p>
              )}
              <span
                className={cn(
                  "font-medium",
                  charPercentage > 90
                    ? "text-red-600"
                    : charPercentage > 75
                    ? "text-amber-600"
                    : "text-slate-500"
                )}
              >
                {charCount}/{MAX_LENGTH}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300 rounded-full",
                  charPercentage > 90
                    ? "bg-red-500"
                    : charPercentage > 75
                    ? "bg-amber-500"
                    : "bg-blue-500"
                )}
                style={{ width: `${charPercentage}%` }}
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
              disabled={
                isSubmitting ||
                (touched.nama && Object.keys(errors).length > 0) ||
                !nama.trim()
              }
              className={cn(
                "flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                isEdit
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

export default JabatanForm;