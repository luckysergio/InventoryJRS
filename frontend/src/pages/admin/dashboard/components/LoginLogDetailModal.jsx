import { useEffect, useCallback } from "react";
import {
    X,
    Shield,
    ShieldCheck,
    ShieldAlert,
    Clock,
    MapPin,
    Globe,
    Mail,
    User,
    Monitor,
    Smartphone,
    Hash,
    Fingerprint,
    AlertTriangle,
} from "lucide-react";
import { cn } from "../../../../lib/utils";
import { useLoginLogDetail } from "../../../../hooks/useDashboard";

const LoginLogDetailModal = ({ logId, onClose }) => {
    const { data, isLoading, error } = useLoginLogDetail(logId);

    const log = data?.data;
    const isOpen = !!logId;

    // ============================================
    // KEYBOARD & SCROLL LOCK HANDLERS
    // ============================================
    const handleEscKey = useCallback(
        (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        },
        [isOpen, onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleEscKey);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscKey);
            document.body.style.overflow = "";
        };
    }, [isOpen, handleEscKey]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // ============================================
    // HELPERS
    // ============================================
    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getInitials = (email) => {
        if (!email) return "?";
        const name = email.split("@")[0];
        return name
            .split(/[._-]/)
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-log-detail-title"
        >
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-modalIn flex flex-col max-h-[85vh]">
                {/* ============================================ */}
                {/* HEADER - STICKY */}
                {/* ============================================ */}
                <div
                    className={cn(
                        "sticky top-0 z-10 px-5 py-3.5 border-b border-slate-200/60 flex items-center justify-between flex-shrink-0",
                        log?.success === false
                            ? "bg-gradient-to-r from-rose-50 via-white to-white"
                            : log?.success === true
                            ? "bg-gradient-to-r from-emerald-50 via-white to-white"
                            : "bg-gradient-to-r from-blue-50 via-white to-white"
                    )}
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div
                            className={cn(
                                "p-1.5 rounded-lg shadow-sm flex-shrink-0 bg-gradient-to-br",
                                log?.success === false
                                    ? "from-rose-500 to-red-600"
                                    : log?.success === true
                                    ? "from-emerald-500 to-teal-600"
                                    : "from-blue-500 to-indigo-600"
                            )}
                        >
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <h2
                            id="login-log-detail-title"
                            className="text-base font-semibold text-slate-900 truncate"
                        >
                            Detail Login Activity
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 group"
                        aria-label="Close modal"
                    >
                        <X className="w-4 h-4 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" />
                    </button>
                </div>

                {/* ============================================ */}
                {/* SCROLLABLE CONTENT */}
                {/* ============================================ */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
                            <p className="mt-3 text-xs text-slate-500 font-medium">
                                Memuat detail...
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {!isLoading && error && (
                        <div className="flex flex-col items-center justify-center py-16 text-rose-600">
                            <div className="p-4 bg-rose-50 rounded-full mb-3">
                                <ShieldAlert className="w-10 h-10 opacity-70" />
                            </div>
                            <p className="text-sm font-semibold">Gagal memuat detail</p>
                            <p className="text-xs text-slate-500 mt-1">
                                Silakan coba lagi
                            </p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && !error && !log && (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                            <div className="p-4 bg-slate-100 rounded-full mb-3">
                                <Shield className="w-10 h-10 opacity-50" />
                            </div>
                            <p className="text-sm font-semibold">Data tidak ditemukan</p>
                            <p className="text-xs text-slate-400 mt-1">
                                Log aktivitas tidak tersedia
                            </p>
                        </div>
                    )}

                    {/* Success Content */}
                    {!isLoading && !error && log && (
                        <>
                            {/* Profile Header */}
                            <div className="px-5 pt-5 pb-4 text-center bg-gradient-to-b from-slate-50 to-white">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={cn(
                                            "w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white",
                                            log.success
                                                ? "from-emerald-500 to-teal-600"
                                                : "from-rose-500 to-red-600"
                                        )}
                                    >
                                        {getInitials(log.email_attempted)}
                                    </div>
                                    <h3 className="mt-3 text-base font-semibold text-slate-900">
                                        {log.user?.name || log.email_attempted || "Unknown"}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[240px]">
                                        {log.email_attempted}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span
                                            className={cn(
                                                "px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1",
                                                log.success
                                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                    : "bg-rose-100 text-rose-700 border-rose-200"
                                            )}
                                        >
                                            {log.success ? (
                                                <>
                                                    <ShieldCheck className="w-3 h-3" />
                                                    Login Berhasil
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldAlert className="w-3 h-3" />
                                                    Login Gagal
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1.5">
                                        {log.time_ago}
                                    </p>
                                </div>
                            </div>

                            {/* Failure Reason Alert */}
                            {!log.success && log.failure_reason && (
                                <div className="mx-5 mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5">
                                    <div className="p-1 bg-rose-100 rounded-md flex-shrink-0 mt-0.5">
                                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wide mb-0.5">
                                            Alasan Gagal
                                        </p>
                                        <p className="text-xs text-rose-600 leading-relaxed">
                                            {log.failure_reason}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Info Grid */}
                            <div className="px-5 py-4 space-y-2">
                                {/* User Info */}
                                <InfoItem
                                    icon={Hash}
                                    iconBg="bg-slate-100"
                                    iconColor="text-slate-600"
                                    label="ID Log"
                                    value={`#${log.id}`}
                                />
                                <InfoItem
                                    icon={Mail}
                                    iconBg="bg-blue-100"
                                    iconColor="text-blue-600"
                                    label="Email"
                                    value={log.email_attempted || "-"}
                                    breakAll
                                />
                                {log.user && (
                                    <>
                                        <InfoItem
                                            icon={User}
                                            iconBg="bg-indigo-100"
                                            iconColor="text-indigo-600"
                                            label="Nama User"
                                            value={log.user.name}
                                        />
                                        <InfoItem
                                            icon={Fingerprint}
                                            iconBg="bg-purple-100"
                                            iconColor="text-purple-600"
                                            label="Role"
                                            value={log.user.role || "User"}
                                        />
                                    </>
                                )}

                                {/* Location & Time */}
                                <InfoItem
                                    icon={MapPin}
                                    iconBg="bg-amber-100"
                                    iconColor="text-amber-600"
                                    label="IP Address"
                                    value={log.ip_address || "-"}
                                />
                                <InfoItem
                                    icon={Clock}
                                    iconBg="bg-emerald-100"
                                    iconColor="text-emerald-600"
                                    label="Waktu Login"
                                    value={formatDate(log.created_at)}
                                />

                                {/* Device Info */}
                                <InfoItem
                                    icon={Globe}
                                    iconBg="bg-sky-100"
                                    iconColor="text-sky-600"
                                    label="Browser"
                                    value={log.browser || "Unknown"}
                                />
                                <InfoItem
                                    icon={Monitor}
                                    iconBg="bg-cyan-100"
                                    iconColor="text-cyan-600"
                                    label="Operating System"
                                    value={log.os || "Unknown"}
                                />
                                <InfoItem
                                    icon={Smartphone}
                                    iconBg="bg-teal-100"
                                    iconColor="text-teal-600"
                                    label="Device"
                                    value={log.device || "Unknown"}
                                />

                                {/* User Agent */}
                                {log.user_agent && (
                                    <InfoItem
                                        icon={Fingerprint}
                                        iconBg="bg-slate-200"
                                        iconColor="text-slate-700"
                                        label="User Agent"
                                        value={log.user_agent}
                                        breakAll
                                        mono
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ============================================ */}
                {/* STICKY FOOTER ACTIONS */}
                {/* ============================================ */}
                <div className="sticky bottom-0 px-5 py-3.5 border-t border-slate-200/60 bg-white flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full px-3 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// INFO ITEM COMPONENT (Seragam dengan UserDetail)
// ============================================
const InfoItem = ({ icon: Icon, iconBg, iconColor, label, value, breakAll, mono }) => (
    <div className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100/70 rounded-lg transition-colors group">
        <div
            className={cn(
                "p-1.5 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform",
                iconBg
            )}
        >
            <Icon className={cn("w-3.5 h-3.5", iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">
                {label}
            </p>
            <p
                className={cn(
                    "text-sm font-medium text-slate-900",
                    breakAll ? "break-all" : "truncate",
                    mono && "font-mono text-xs"
                )}
            >
                {value}
            </p>
        </div>
    </div>
);

export default LoginLogDetailModal;