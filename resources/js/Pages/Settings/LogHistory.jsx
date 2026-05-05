import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';

const ACTION_BADGE = {
    created:  'bg-green-100 text-green-700',
    printed:  'bg-blue-100 text-blue-700',
    approved: 'bg-indigo-100 text-indigo-700',
    updated:  'bg-yellow-100 text-yellow-700',
    deleted:  'bg-red-100 text-red-700',
};

function badgeClass(action) {
    return ACTION_BADGE[action?.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function LogHistory() {
    const { logs = [] } = usePage().props;

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
        return logs.filter(log => {
            if (q && !(
                log.candidate?.name?.toLowerCase().includes(q) ||
                log.user?.name?.toLowerCase().includes(q) ||
                log.action?.toLowerCase().includes(q) ||
                log.notes?.toLowerCase().includes(q)
            )) return false;
            if (log.created_at) {
                const d = new Date(log.created_at);
                if (from && d < from) return false;
                if (to && d > to) return false;
            }
            return true;
        });
    }, [logs, search, dateFrom, dateTo]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

    function handleSearch(e) {
        setSearch(e.target.value);
        setPage(1);
    }

    function handlePageSize(e) {
        setPageSize(Number(e.target.value));
        setPage(1);
    }

    function handleDateFrom(e) {
        setDateFrom(e.target.value);
        setPage(1);
    }

    function handleDateTo(e) {
        setDateTo(e.target.value);
        setPage(1);
    }

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Log History
                </h2>
            }
        >
            <Head title="Log History" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Toolbar */}
                            <div className="mb-4 flex flex-col gap-3">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={handleSearch}
                                        placeholder="Cari kandidat, NIK, user, aksi, atau catatan…"
                                        className="w-full sm:w-80 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                    />
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>Tampilkan</span>
                                    <select
                                        value={pageSize}
                                        onChange={handlePageSize}
                                        className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                    >
                                        {PAGE_SIZE_OPTIONS.map(n => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                    <span>baris</span>
                                </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                    <span>Tanggal:</span>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={handleDateFrom}
                                        className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                    />
                                    <span>s/d</span>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={handleDateTo}
                                        min={dateFrom || undefined}
                                        className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                    />
                                    {(dateFrom || dateTo) && (
                                        <button
                                            onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
                                            className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 border border-red-200"
                                        >Reset</button>
                                    )}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-600 w-10">#</th>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-600">User</th>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Aksi</th>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Catatan</th>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">Tanggal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {paginated.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-3 py-8 text-center text-gray-400 italic">
                                                    Tidak ada data log.
                                                </td>
                                            </tr>
                                        ) : paginated.map((log, idx) => (
                                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-3 py-2 text-gray-400 select-none">
                                                    {(safePage - 1) * pageSize + idx + 1}
                                                </td>
                                                <td className="px-3 py-2 text-gray-600">
                                                    {log.user?.name ?? <span className="text-gray-300 italic">—</span>}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${badgeClass(log.action)}`}>
                                                        {log.action ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-gray-500 max-w-xs truncate">
                                                    {log.notes || <span className="text-gray-300 italic">—</span>}
                                                </td>
                                                <td className="px-3 py-2 text-gray-500 whitespace-nowrap text-xs">
                                                    {formatDate(log.created_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between text-sm text-gray-500">
                                <span>
                                    Menampilkan {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} dari {filtered.length} entri
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPage(1)}
                                        disabled={safePage === 1}
                                        className="rounded px-2 py-1 disabled:opacity-40 hover:bg-gray-100"
                                    >«</button>
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={safePage === 1}
                                        className="rounded px-2 py-1 disabled:opacity-40 hover:bg-gray-100"
                                    >‹</button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                                        .reduce((acc, p, i, arr) => {
                                            if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
                                            acc.push(p);
                                            return acc;
                                        }, [])
                                        .map((p, i) =>
                                            p === '…' ? (
                                                <span key={`ellipsis-${i}`} className="px-1">…</span>
                                            ) : (
                                                <button
                                                    key={p}
                                                    onClick={() => setPage(p)}
                                                    className={`rounded px-2.5 py-1 ${p === safePage ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-gray-100'}`}
                                                >{p}</button>
                                            )
                                        )
                                    }
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={safePage === totalPages}
                                        className="rounded px-2 py-1 disabled:opacity-40 hover:bg-gray-100"
                                    >›</button>
                                    <button
                                        onClick={() => setPage(totalPages)}
                                        disabled={safePage === totalPages}
                                        className="rounded px-2 py-1 disabled:opacity-40 hover:bg-gray-100"
                                    >»</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
