import { useState, useEffect, useMemo } from "react";
import {
    X,
    User,
    Mail,
    Lock,
    Shield,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Loader2,  // ✅ TAMBAHKAN INI
} from "lucide-react";
import { useCreateUser, useUpdateUser } from "../../../hooks/useUsers";
import { useUserModals } from "../../../lib/zustand/userStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";

const UserForm = () => {
    const { modals, selectedUser, closeAllModals } = useUserModals();
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const { success, warning, info } = useConfirmDialog();

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

    // Reset form saat modal open/close
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
            setForm({
                name: "",
                email: "",
                password: "",
                password_confirmation: "",
                role: "admin_toko",
            });
            setErrors({});
            setShowPassword(false);
            setShowConfirmPassword(false);
        }
    }, [isEdit, isCreate, selectedUser, modals.edit, modals.create]);

    // Password strength calculator
    const passwordStrength = useMemo(() => {
        const pwd = form.password;
        if (!pwd) return { score: 0, label: "", color: "", checks: {} };

        const checks = {
            length: pwd.length >= 8,
            letter: /[a-zA-Z]/.test(pwd),
            number: /[0-9]/.test(pwd),
            special: /[!_@#$%^&*]/.test(pwd),
        };

        const score = Object.values(checks).filter(Boolean).length;

        const labels = {
            0: { label: "", color: "" },
            1: { label: "Sangat Lemah", color: "bg-red-500" },
            2: { label: "Lemah", color: "bg-orange-500" },
            3: { label: "Sedang", color: "bg-yellow-500" },
            4: { label: "Kuat", color: "bg-emerald-500" },
        };

        return { score, checks, ...labels[score] };
    }, [form.password]);

    const validate = () => {
        const newErrors = {};

        // Name validation
        if (!form.name.trim()) {
            newErrors.name = "Nama wajib diisi";
        } else if (!/^[\p{L}\s\-.]+$/u.test(form.name.trim())) {
            newErrors.name = "Nama hanya boleh huruf, spasi, strip, titik";
        }

        // Email validation
        if (!form.email.trim()) {
            newErrors.email = "Email wajib diisi";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = "Format email tidak valid";
        }

        // Password validation - MATCH dengan backend
        if (isCreate || form.password) {
            if (!form.password) {
                newErrors.password = "Password wajib diisi";
            } else if (form.password.length < 8) {
                newErrors.password = "Password minimal 8 karakter";
            } else if (!/[a-zA-Z]/.test(form.password)) {
                newErrors.password = "Password wajib mengandung huruf";
            } else if (!/[0-9]/.test(form.password)) {
                newErrors.password = "Password wajib mengandung angka";
            } else if (!/[!_@#$%^&*]/.test(form.password)) {
                newErrors.password = "Password wajib mengandung karakter spesial";
            }

            // Password confirmation
            if (form.password !== form.password_confirmation) {
                newErrors.password_confirmation = "Password tidak cocok";
            }
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
            }

            if (isEdit) {
                await updateUser.mutateAsync({
                    id: selectedUser.id,
                    data: payload,
                });
                closeAllModals();
                await success("Berhasil!", "User berhasil diperbarui");
            } else {
                await createUser.mutateAsync(payload);
                closeAllModals();
                await success("Berhasil!", "User berhasil ditambahkan");
            }
        } catch (error) {
            // Handle validation errors dari backend
            if (error.response?.status === 422 && error.response?.data?.errors) {
                const serverErrors = {};
                Object.keys(error.response.data.errors).forEach((key) => {
                    serverErrors[key] = error.response.data.errors[key][0];
                });
                setErrors(serverErrors);
                return;
            }

            if (error.response?.status === 403) {
                await warning(
                    "Ditolak",
                    error.response?.data?.message || "Anda tidak memiliki akses"
                );
                return;
            }

            await info(
                "Error",
                error.response?.data?.message || "Terjadi kesalahan, silakan coba lagi"
            );
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-modalIn max-h-[90vh] flex flex-col">
                {/* Header */}
                <div
                    className={cn(
                        "px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0",
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
                        <h2 className="text-lg font-semibold text-gray-900">
                            {isEdit ? "Edit User" : "Tambah User Baru"}
                        </h2>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isSubmitting}
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form - Scrollable */}
                <form
                    onSubmit={handleSubmit}
                    className="p-6 space-y-4 overflow-y-auto flex-1"
                >
                    {/* Name */}
                    <FormField label="Nama Lengkap" required error={errors.name}>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                className={cn(
                                    "w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm",
                                    errors.name
                                        ? "border-red-300 focus:ring-red-500"
                                        : "border-gray-200 focus:ring-blue-500"
                                )}
                                disabled={isSubmitting}
                                autoFocus
                            />
                        </div>
                    </FormField>

                    {/* Email */}
                    <FormField label="Email" required error={errors.email}>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="email@example.com"
                                className={cn(
                                    "w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm",
                                    errors.email
                                        ? "border-red-300 focus:ring-red-500"
                                        : "border-gray-200 focus:ring-blue-500"
                                )}
                                disabled={isSubmitting}
                            />
                        </div>
                    </FormField>

                    {/* Password */}
                    <FormField
                        label="Password"
                        required={isCreate}
                        error={errors.password}
                        hint={isEdit ? "(kosongkan jika tidak diubah)" : ""}
                    >
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Min. 8 karakter dengan huruf, angka, & spesial"
                                className={cn(
                                    "w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm",
                                    errors.password
                                        ? "border-red-300 focus:ring-red-500"
                                        : "border-gray-200 focus:ring-blue-500"
                                )}
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>

                        {/* Password Strength Indicator */}
                        {form.password && (
                            <div className="mt-2 space-y-2">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            className={cn(
                                                "h-1 flex-1 rounded-full transition-all",
                                                passwordStrength.score >= level
                                                    ? passwordStrength.color
                                                    : "bg-gray-200"
                                            )}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-gray-600">
                                    Kekuatan:{" "}
                                    <span className="font-medium">
                                        {passwordStrength.label}
                                    </span>
                                </p>

                                {/* Password Requirements Checklist */}
                                <div className="grid grid-cols-2 gap-1.5 text-xs">
                                    <RequirementCheck
                                        met={passwordStrength.checks?.length}
                                        label="Min. 8 karakter"
                                    />
                                    <RequirementCheck
                                        met={passwordStrength.checks?.letter}
                                        label="Huruf"
                                    />
                                    <RequirementCheck
                                        met={passwordStrength.checks?.number}
                                        label="Angka"
                                    />
                                    <RequirementCheck
                                        met={passwordStrength.checks?.special}
                                        label="Karakter spesial"
                                    />
                                </div>
                            </div>
                        )}
                    </FormField>

                    {/* Password Confirmation */}
                    {(form.password || isCreate) && (
                        <FormField
                            label="Konfirmasi Password"
                            required
                            error={errors.password_confirmation}
                        >
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type={
                                        showConfirmPassword ? "text" : "password"
                                    }
                                    name="password_confirmation"
                                    value={form.password_confirmation}
                                    onChange={handleChange}
                                    placeholder="Ulangi password"
                                    className={cn(
                                        "w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm",
                                        errors.password_confirmation
                                            ? "border-red-300 focus:ring-red-500"
                                            : "border-gray-200 focus:ring-blue-500"
                                    )}
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(!showConfirmPassword)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </FormField>
                    )}

                    {/* Role */}
                    <FormField label="Role" required>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm appearance-none cursor-pointer"
                                disabled={isSubmitting}
                            >
                                <option value="admin">Administrator</option>
                                <option value="admin_toko">Admin Toko</option>
                                <option value="operator">Operator</option>
                            </select>
                        </div>
                    </FormField>
                </form>

                {/* Footer Actions - Sticky */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                        disabled={isSubmitting}
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={cn(
                            "flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
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
                            "Simpan Perubahan"
                        ) : (
                            "Tambah User"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// FORM FIELD WRAPPER
// ============================================
const FormField = ({ label, required, error, hint, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
            {hint && (
                <span className="text-xs text-gray-500 font-normal ml-1">
                    {hint}
                </span>
            )}
        </label>
        {children}
        {error && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
            </p>
        )}
    </div>
);

const RequirementCheck = ({ met, label }) => (
    <div className="flex items-center gap-1.5">
        <CheckCircle2
            className={cn(
                "w-3 h-3 transition-colors",
                met ? "text-emerald-500" : "text-gray-300"
            )}
        />
        <span className={cn(met ? "text-emerald-700" : "text-gray-500")}>
            {label}
        </span>
    </div>
);

export default UserForm;