import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    Users, Printer, CheckCircle2, ImageOff, CreditCard,
    UserPlus2, ImagePlus, BadgeCheck, RotateCcw,
    Calendar, ChevronRight, DatabaseZap, ChevronLeft,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, bg, iconColor, valueColor }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className={`rounded-lg p-3 ${bg}`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className={`text-2xl font-bold ${valueColor ?? 'text-gray-800'}`}>{value}</p>
            </div>
        </div>
    );
}

function ActionButton({ href, icon: Icon, label, description, border, iconBg, iconColor }) {
    return (
        <Link
            href={href}
            className={`group flex items-center gap-4 bg-white rounded-xl border-2 ${border} p-4 shadow-sm hover:shadow-md transition-shadow`}
        >
            <div className={`rounded-lg p-3 ${iconBg}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{label}</p>
                <p className="text-xs text-gray-500 truncate">{description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
        </Link>
    );
}

function PipelineBar({ stages, total }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-5">Pipeline Status Kandidat</h3>
            <div className="flex items-stretch gap-0">
                {stages.map((stage, i) => {
                    const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0;
                    const isLast = i === stages.length - 1;
                    return (
                        <div key={stage.label} className="flex-1 flex flex-col items-center gap-2 relative">
                            {/* connector line */}
                            {!isLast && (
                                <div className="absolute top-5 left-1/2 w-full h-0.5 bg-gray-200 z-0" />
                            )}
                            {/* circle */}
                            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${stage.circle}`}>
                                {stage.count}
                            </div>
                            {/* progress bar segment */}
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden px-1">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${stage.bar}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-600 text-center font-medium leading-tight">{stage.label}</p>
                            <p className="text-xs text-gray-400">{pct}%</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function Dashboard({ stats, upcoming }) {
    const statCards = [
        { label: 'Total Kandidat',  value: stats.total,      icon: Users,         bg: 'bg-indigo-50',  iconColor: 'text-indigo-600' },
        { label: 'Belum Cetak',     value: stats.belumCetak, icon: Printer,       bg: 'bg-amber-50',   iconColor: 'text-amber-500',  valueColor: 'text-amber-600' },
        { label: 'Sudah Cetak',     value: stats.sudahCetak, icon: CheckCircle2,  bg: 'bg-green-50',   iconColor: 'text-green-600',  valueColor: 'text-green-700' },
        { label: 'Belum Ada Foto',  value: stats.belumFoto,  icon: ImageOff,      bg: 'bg-rose-50',    iconColor: 'text-rose-500',   valueColor: 'text-rose-600' },
        { label: 'Belum Ada NIK',   value: stats.belumNik,   icon: CreditCard,    bg: 'bg-orange-50',  iconColor: 'text-orange-500', valueColor: 'text-orange-600' },
    ];

    const actions = [
        { href: '/candidates',              icon: UserPlus2,    label: 'Tambah Kandidat',   description: 'Input data karyawan baru',          border: 'border-indigo-200', iconBg: 'bg-indigo-50',  iconColor: 'text-indigo-600' },
        { href: '/candidates/upload-image', icon: ImagePlus,    label: 'Upload Foto',        description: 'Upload foto kandidat',              border: 'border-purple-200', iconBg: 'bg-purple-50',  iconColor: 'text-purple-600' },
        { href: '/candidates/upload-nik',   icon: BadgeCheck,   label: 'Input NIK',          description: 'Tambahkan NIK ke kandidat',         border: 'border-amber-200',  iconBg: 'bg-amber-50',   iconColor: 'text-amber-600' },
        { href: '/candidates/print-id-card',icon: Printer,      label: 'Cetak ID Card',      description: 'Cetak kartu tanda karyawan',        border: 'border-green-200',  iconBg: 'bg-green-50',   iconColor: 'text-green-600' },
        { href: '/re-print',                icon: RotateCcw,    label: 'Cetak Ulang',        description: 'Cetak ulang ID card yang rusak',    border: 'border-rose-200',   iconBg: 'bg-rose-50',    iconColor: 'text-rose-500' },
        { href: '/candidates/bulk-add',     icon: DatabaseZap,  label: 'Bulk Add Kandidat',  description: 'Import banyak kandidat sekaligus',  border: 'border-teal-200',   iconBg: 'bg-teal-50',    iconColor: 'text-teal-600' },
    ];

    const pipeline = [
        { label: 'Data Masuk',    count: stats.total,      circle: 'bg-indigo-500', bar: 'bg-indigo-400' },
        { label: 'Foto Diupload', count: stats.sudahFoto,  circle: 'bg-purple-500', bar: 'bg-purple-400' },
        { label: 'NIK Diisi',     count: stats.sudahNik,   circle: 'bg-amber-500',  bar: 'bg-amber-400'  },
        { label: 'ID Dicetak',    count: stats.sudahCetak, circle: 'bg-green-600',  bar: 'bg-green-500'  },
    ];

    const [upcomingPage, setUpcomingPage] = useState(1);
    const UPCOMING_PER_PAGE = 5;
    const upcomingTotalPages = Math.ceil(upcoming.length / UPCOMING_PER_PAGE);
    const upcomingSlice = upcoming.slice(
        (upcomingPage - 1) * UPCOMING_PER_PAGE,
        upcomingPage * UPCOMING_PER_PAGE,
    );

    const today = new Date();
    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
        const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        if (diffDays < 0) return { label, diffDays, badge: 'Sudah lewat', color: 'bg-rose-100 text-rose-600' };
        if (diffDays === 0) return { label, diffDays, badge: 'Hari ini', color: 'bg-rose-100 text-rose-600' };
        if (diffDays === 1) return { label, diffDays, badge: 'Besok', color: 'bg-amber-100 text-amber-600' };
        if (diffDays <= 3) return { label, diffDays, badge: `${diffDays} hari lagi`, color: 'bg-amber-100 text-amber-600' };
        return { label, diffDays, badge: `${diffDays} hari lagi`, color: 'bg-blue-100 text-blue-600' };
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="p-6 space-y-6">

                {/* Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {statCards.map((card) => (
                        <StatCard key={card.label} {...card} />
                    ))}
                </div>

                {/* Pipeline */}
                <PipelineBar stages={pipeline} total={stats.total} />

                {/* Quick Actions */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Aksi Cepat</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {actions.map((action) => (
                            <ActionButton key={action.href} {...action} />
                        ))}
                    </div>
                </div>

                {/* Reminder: Upcoming first_working_day */}
                {upcoming.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-5 h-5 text-amber-500" />
                            <h3 className="text-sm font-semibold text-gray-700">
                                Kandidat Belum Cetak &amp; Mulai Kerja ≤7 Hari
                            </h3>
                            <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                {upcoming.length} kandidat
                            </span>
                        </div>

                        {/* List */}
                        <div className="divide-y divide-gray-100">
                            {upcomingSlice.map((c) => {
                                const { label, badge, color } = formatDate(c.first_working_day);
                                return (
                                    <div key={c.id} className="flex items-center gap-3 py-2.5">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                                            <p className="text-xs text-gray-400">{label}</p>
                                        </div>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
                                            {badge}
                                        </span>
                                        <Printer className="w-4 h-4 text-amber-400 shrink-0" title="Belum cetak" />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {upcomingTotalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-400">
                                    Halaman {upcomingPage} dari {upcomingTotalPages}
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setUpcomingPage((p) => Math.max(1, p - 1))}
                                        disabled={upcomingPage === 1}
                                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    {Array.from({ length: upcomingTotalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setUpcomingPage(page)}
                                            className={`w-7 h-7 text-xs rounded-md font-medium transition-colors ${
                                                page === upcomingPage
                                                    ? 'bg-amber-500 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setUpcomingPage((p) => Math.min(upcomingTotalPages, p + 1))}
                                        disabled={upcomingPage === upcomingTotalPages}
                                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}
