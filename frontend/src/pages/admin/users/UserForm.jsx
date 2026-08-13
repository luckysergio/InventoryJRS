import { useState, useEffect } from "react";
import { X, User, Mail, Lock, Shield, Eye, EyeOff } from "lucide-react";
import { useCreateUser, useUpdateUser } from "../../../hooks/useUsers";
import { useUserModals } from "../../../lib/zustand/userStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";

const UserForm = () => {
  const { modals, selectedUser, closeAllModals } = useUserModals();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  
  // ✅ Gunakan useConfirmDialog
  const { toast } = useConfirmDialog();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "admin_toko",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const isEdit = modals.edit && selectedUser;
  const isCreate = modals.create;
  const isOpen = isEdit || isCreate;

  const isSubmitting = createUser.isPending || updateUser.isPending;

  useEffect(() => {
    if (isEdit && selectedUser) {
      setForm({
        name: selectedUser.name || "",
        email: selectedUser.email || "",
        password: "",
        password_confirmation: "",
        role: selectedUser.role || "admin_toko",
      });
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    } else if (isCreate) {
      setForm({ name: "", email: "", password: "", password_confirmation: "", role: "admin_toko" });
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isEdit, isCreate, selectedUser]);

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Nama wajib diisi";

    if (!form.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (isCreate) {
      if (!form.password) newErrors.password = "Password wajib diisi";
      else if (form.password.length < 6) newErrors.password = "Password minimal 6 karakter";
      else if (!/[!_]/.test(form.password)) newErrors.password = "Password wajib mengandung ! atau _";
    } else if (form.password) {
      if (form.password.length < 6) newErrors.password = "Password minimal 6 karakter";
      else if (!/[!_]/.test(form.password)) newErrors.password = "Password wajib mengandung ! atau _";
    }

    if (form.password || isCreate) {
      if (form.password !== form.password_confirmation) newErrors.password_confirmation = "Password tidak cocok";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        role: form.role,
      };

      if (form.password) {
        payload.password = form.password;
        payload.password_confirmation = form.password_confirmation;
      }

      if (isEdit) {
        await updateUser.mutateAsync({ id: selectedUser.id, data: payload });
        toast({ icon: "success", title: "Berhasil!", text: "User berhasil diperbarui" });
      } else {
        await createUser.mutateAsync(payload);
        toast({ icon: "success", title: "Berhasil!", text: "User berhasil ditambahkan" });
      }

      closeAllModals();
    } catch (error) {
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const serverErrors = {};
        Object.keys(error.response.data.errors).forEach((key) => {
          serverErrors[key] = error.response.data.errors[key][0];
        });
        setErrors(serverErrors);
        return;
      }

      if (error.response?.status === 403) {
        toast({ icon: "warning", title: "Ditolak", text: error.response?.data?.message || "Anda tidak memiliki akses" });
        return;
      }

      toast({ icon: "error", title: "Error", text: error.response?.data?.message || "Terjadi kesalahan, silakan coba lagi" });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    closeAllModals();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-modalIn">
        <div className={`px-6 py-4 border-b border-gray-200 flex items-center justify-between ${isEdit ? "bg-gradient-to-r from-amber-50 to-white" : "bg-gradient-to-r from-blue-50 to-white"}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isEdit ? "bg-amber-100" : "bg-blue-100"}`}>
              <User className={`w-5 h-5 ${isEdit ? "text-amber-600" : "text-blue-600"}`} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{isEdit ? "Edit User" : "Tambah User Baru"}</h2>
          </div>
          <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" disabled={isSubmitting}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm ${errors.name ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`} disabled={isSubmitting} />
            </div>
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@example.com" className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm ${errors.email ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`} disabled={isSubmitting} />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password {isEdit ? <span className="text-xs text-gray-500 font-normal">(kosongkan jika tidak diubah)</span> : <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder={isEdit ? "••••••" : "Min. 6 karakter dengan ! atau _"} className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm ${errors.password ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`} disabled={isSubmitting} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Konfirmasi Password {(form.password || isCreate) && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={showConfirmPassword ? "text" : "password"} name="password_confirmation" value={form.password_confirmation} onChange={handleChange} placeholder="Ulangi password" className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm ${errors.password_confirmation ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`} disabled={isSubmitting} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password_confirmation && <p className="mt-1 text-xs text-red-600">{errors.password_confirmation}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role <span className="text-red-500">*</span></label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select name="role" value={form.role} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm appearance-none cursor-pointer" disabled={isSubmitting}>
                <option value="admin">Admin</option>
                <option value="admin_toko">Admin Toko</option>
                <option value="operator">Operator</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={handleCancel} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting} className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isEdit ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}`}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : isEdit ? (
                "Simpan Perubahan"
              ) : (
                "Tambah User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;