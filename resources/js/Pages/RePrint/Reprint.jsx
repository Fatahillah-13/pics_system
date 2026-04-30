import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
    Search, Printer, Plus, X, AlertCircle, CheckCircle,
    Download, Loader2, ListChecks, User, Building2, Briefcase,
    BadgeCheck, Trash2, ImageOff, ImageIcon, TriangleAlert, Table2
} from 'lucide-react';

const EMPLOYEE_API = 'http://10.10.100.193:1002/api.employees.v1/employees';
const MAX_PRINT_LIST = 50;

function StatusBadge({ status }) {
    const isActive = status === 'active';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
            <BadgeCheck className="h-3 w-3" />
            {isActive ? 'Aktif' : status}
        </span>
    );
}

/* ─── Bulk Reprint inline table ─── */
function BulkReprintTable({ rows, onNikChange, onNikBlur, onToggleCtpat, onRemoveRow, onAddRow, onPrint, isPrinting, serviceStatus }) {
    const validRows = rows.filter((r) => r.nik.trim() !== '' && r.name !== '' && r.name !== null);
    const includedCount = validRows.length;
    const nikRefs = useRef([]);
    const prevRowCount = useRef(rows.length);

    useEffect(() => {
        if (rows.length > prevRowCount.current) {
            nikRefs.current[rows.length - 1]?.focus();
        }
        prevRowCount.current = rows.length;
    }, [rows.length]);

    return (
        <div className="space-y-4">
            {/* Header actions */}
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium text-gray-500">
                    {rows.length}/{MAX_PRINT_LIST} baris &nbsp;·&nbsp; {includedCount} siap cetak
                </span>
                <div className="flex-1" />
                <button
                    onClick={onAddRow}
                    disabled={rows.length >= MAX_PRINT_LIST}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-md hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Baris
                </button>
                <button
                    onClick={onPrint}
                    disabled={includedCount === 0 || isPrinting || serviceStatus === false}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isPrinting ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Mencetak...</>
                    ) : (
                        <><Printer className="h-4 w-4" />Cetak ({includedCount})</>
                    )}
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-xs">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 w-8">#</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 w-36">NIK</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Nama</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Departemen</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Job Level</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600 w-14">Foto</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600 w-16">C-TPAT</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {rows.map((row, idx) => (
                            <tr key={row.id} className={row.loading ? 'opacity-60' : ''}>
                                <td className="px-3 py-1.5 text-gray-400 select-none">{idx + 1}</td>
                                <td className="px-3 py-1.5">
                                    <div className="relative">
                                        <input
                                            ref={(el) => (nikRefs.current[idx] = el)}
                                            type="text"
                                            value={row.nik}
                                            onChange={(e) => onNikChange(row.id, e.target.value)}
                                            onBlur={() => onNikBlur(row.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    onNikBlur(row.id);
                                                    const next = nikRefs.current[idx + 1];
                                                    if (next) {
                                                        next.focus();
                                                    } else if (rows.length < MAX_PRINT_LIST) {
                                                        onAddRow();
                                                    }
                                                }
                                            }}
                                            placeholder="Ketik NIK…"
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                        />
                                        {row.loading && (
                                            <Loader2 className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-indigo-400 animate-spin" />
                                        )}
                                    </div>
                                    {row.error && (
                                        <p className="mt-0.5 text-red-500 text-[10px] flex items-center gap-0.5">
                                            <AlertCircle className="h-2.5 w-2.5" />{row.error}
                                        </p>
                                    )}
                                </td>
                                <td className="px-3 py-1.5 text-gray-800">
                                    {row.name
                                        ? <span>{row.name}</span>
                                        : <span className="text-gray-300 italic">—</span>
                                    }
                                </td>
                                <td className="px-3 py-1.5 text-gray-600">
                                    {row.department || <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-3 py-1.5 text-gray-600">
                                    {row.job_level || <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-3 py-1.5 text-center">
                                    {row.nik.trim() === '' ? (
                                        <span className="text-gray-200">—</span>
                                    ) : row.has_photo ? (
                                        <ImageIcon className="h-3.5 w-3.5 text-green-500 mx-auto" />
                                    ) : (
                                        <ImageOff className="h-3.5 w-3.5 text-yellow-400 mx-auto" />
                                    )}
                                </td>
                                <td className="px-3 py-1.5 text-center">
                                    <input
                                        type="checkbox"
                                        checked={row.ctpat}
                                        onChange={() => onToggleCtpat(row.id)}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </td>
                                <td className="px-3 py-1.5 text-center">
                                    <button
                                        onClick={() => onRemoveRow(row.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {rows.length < MAX_PRINT_LIST && (
                <button
                    onClick={onAddRow}
                    className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
                >
                    <Plus className="h-3 w-3" /> Tambah baris lagi
                </button>
            )}
        </div>
    );
}

function EmployeeCard({ employee, inList, onPrintNow, onAddToList, onRemoveFromList, isPrinting }) {
    const [ctpat, setCtpat] = useState(false);
    return (
        <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{employee.name}</p>
                    <StatusBadge status={employee.status_employee} />
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />{employee.department}
                    </span>
                    <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />{employee.job_level}
                    </span>
                    <span className="font-mono">{employee.number_of_employees}</span>
                </div>
            </div>
            <div className="flex-shrink-0 flex flex-col gap-2 sm:flex-row items-start">
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none pt-1">
                    <input
                        type="checkbox"
                        checked={ctpat}
                        onChange={(e) => setCtpat(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    C-TPAT
                </label>
                <button
                    onClick={() => onPrintNow(employee, ctpat)}
                    disabled={isPrinting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    <Printer className="h-3.5 w-3.5" />
                    Cetak Sekarang
                </button>
                {inList ? (
                    <button
                        onClick={() => onRemoveFromList(employee)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-medium rounded-md hover:bg-red-100 transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                        Hapus dari List
                    </button>
                ) : (
                    <button
                        onClick={() => onAddToList(employee)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium rounded-md hover:bg-emerald-100 transition-colors"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Masuk ke List
                    </button>
                )}
            </div>
        </div>
    );
}

let _rowCounter = 0;
const newRow = () => ({
    id: ++_rowCounter,
    nik: '',
    name: '',
    department: '',
    job_level: '',
    has_photo: false,
    photo_source: null,
    ctpat: false,
    loading: false,
    error: null,
});

export default function Reprint({ serviceStatus }) {
    const { flash } = usePage().props;

    /* ── Search state ── */
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    /* ── Print list state ── */
    const [printList, setPrintList] = useState([]);
    const [isPrinting, setIsPrinting] = useState(false);

    /* ── Bulk reprint state ── */
    const [activeTab, setActiveTab] = useState('search'); // 'search' | 'bulk'
    const [bulkRows, setBulkRows] = useState(() => [newRow(), newRow(), newRow()]);

    const debounceRef = useRef(null);

    const searchEmployees = useCallback(async (searchQuery) => {
        if (!searchQuery.trim()) { setResults([]); setHasSearched(false); setSearchError(null); return; }
        setIsSearching(true); setSearchError(null);
        try {
            const res = await fetch(`${EMPLOYEE_API}/?search=${encodeURIComponent(searchQuery.trim())}`);
            if (!res.ok) throw new Error();
            const json = await res.json();
            setResults(json.data ?? []); setHasSearched(true);
        } catch {
            setSearchError('Gagal memuat data karyawan. Periksa koneksi ke server.');
            setResults([]); setHasSearched(true);
        } finally { setIsSearching(false); }
    }, []);

    const handleQueryChange = (e) => {
        const val = e.target.value; setQuery(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchEmployees(val), 500);
    };

    const isInList = (emp) => printList.some((e) => e.number_of_employees === emp.number_of_employees);

    const handleAddToList = (emp) => {
        if (printList.length >= MAX_PRINT_LIST || isInList(emp)) return;
        setPrintList((prev) => [...prev, { ...emp, ctpat: false }]);
    };

    const handleToggleCtpat = (emp) => setPrintList((prev) =>
        prev.map((e) => e.number_of_employees === emp.number_of_employees ? { ...e, ctpat: !e.ctpat } : e));

    const handleRemoveFromList = (emp) => setPrintList((prev) =>
        prev.filter((e) => e.number_of_employees !== emp.number_of_employees));

    const buildCards = (employees) => employees.map((emp) => ({
        name: emp.name, department: emp.department ?? '', job_level: emp.job_level ?? '',
        employee_id: emp.number_of_employees, ctpat: emp.ctpat ?? false,
    }));

    const submitPrint = (cards) => {
        if (isPrinting) return;
        setIsPrinting(true);
        router.post(route('candidates.reprintIdCard.store'), { cards }, {
            preserveScroll: true,
            onSuccess: (page) => { const u = page.props.flash?.pdf_url; if (u) window.open(u, '_blank'); setPrintList([]); },
            onFinish: () => setIsPrinting(false),
        });
    };

    const handlePrintNow = (emp, ctpat) => submitPrint(buildCards([{ ...emp, ctpat: ctpat ?? false }]));
    const handlePrintList = () => { if (printList.length) submitPrint(buildCards(printList)); };

    const handleBulkNikChange = (id, value) =>
        setBulkRows((prev) => prev.map((r) => r.id === id ? { ...r, nik: value, error: null } : r));

    const handleBulkNikBlur = async (id) => {
        const row = bulkRows.find((r) => r.id === id);
        if (!row) return;
        const nik = row.nik.trim();
        if (nik === '') {
            setBulkRows((prev) => prev.map((r) => r.id === id
                ? { ...r, name: '', department: '', job_level: '', has_photo: false, photo_source: null, error: null } : r));
            return;
        }
        if (row.name && row.nik.trim() === nik) return;
        setBulkRows((prev) => prev.map((r) => r.id === id ? { ...r, loading: true, error: null } : r));
        try {
            // Call Employee API directly from browser (same as Search tab)
            // and backend only for photo check (network share / DB)
            const [empRes, photoRes] = await Promise.all([
                fetch(`${EMPLOYEE_API}/?search=${encodeURIComponent(nik)}`),
                fetch(route('candidates.reprintIdCard.lookup') + '?nik=' + encodeURIComponent(nik)),
            ]);
            const empJson = await empRes.json();
            const photoJson = photoRes.ok ? await photoRes.json() : {};

            const employees = empJson.data ?? [];
            const emp = employees.find((e) => {
                const apiNik = String(e.number_of_employees ?? '').trim();
                return apiNik === nik || apiNik.replace(/^0+/, '') === nik.replace(/^0+/, '');
            }) ?? (employees.length === 1 ? employees[0] : null);

            if (!emp) {
                setBulkRows((prev) => prev.map((r) => r.id === id ? { ...r, loading: false, error: 'Karyawan tidak ditemukan' } : r));
                return;
            }
            setBulkRows((prev) => prev.map((r) => r.id === id ? {
                ...r, loading: false,
                name: emp.name || '', department: emp.department || '', job_level: emp.job_level || '',
                has_photo: photoJson.has_photo ?? false, photo_source: photoJson.photo_source ?? null,
                error: null,
            } : r));
        } catch {
            setBulkRows((prev) => prev.map((r) => r.id === id ? { ...r, loading: false, error: 'Gagal menghubungi server.' } : r));
        }
    };

    const handleBulkToggleCtpat = (id) =>
        setBulkRows((prev) => prev.map((r) => r.id === id ? { ...r, ctpat: !r.ctpat } : r));

    const handleBulkRemoveRow = (id) =>
        setBulkRows((prev) => { const next = prev.filter((r) => r.id !== id); return next.length ? next : [newRow()]; });

    const handleBulkAddRow = () => {
        if (bulkRows.length < MAX_PRINT_LIST) setBulkRows((prev) => [...prev, newRow()]);
    };

    const handleBulkPrint = () => {
        const cards = bulkRows.filter((r) => r.nik.trim() && r.name).map((r) => ({
            name: r.name, department: r.department ?? '', job_level: r.job_level ?? '',
            employee_id: r.nik.trim(), ctpat: r.ctpat,
        }));
        if (!cards.length || isPrinting) return;
        setIsPrinting(true);
        router.post(route('candidates.reprintIdCard.store'), { cards }, {
            preserveScroll: true,
            onSuccess: (page) => { const u = page.props.flash?.pdf_url; if (u) window.open(u, '_blank'); },
            onFinish: () => setIsPrinting(false),
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Reprint ID Card</h2>}>
            <Head title="Reprint ID Card" />
            <div className="py-6">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
                    {serviceStatus === false && (
                        <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            Service cetak ID Card sedang tidak tersedia. Pastikan Python service sudah berjalan.
                        </div>
                    )}
                    {flash?.success && (
                        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 shrink-0" />
                                <div className="flex-1">
                                    {flash.success}
                                    {flash.errors && <span className="ml-1 text-yellow-700">({flash.errors})</span>}
                                </div>
                                {flash?.pdf_url && (
                                    <a href={flash.pdf_url} target="_blank" rel="noopener noreferrer"
                                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors">
                                        <Download className="h-3.5 w-3.5" />Buka PDF
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                            <AlertCircle className="h-4 w-4 shrink-0" />{flash.error}
                        </div>
                    )}

                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                        <button onClick={() => setActiveTab('search')}
                            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'search' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <Search className="h-3.5 w-3.5" />Cari Karyawan
                        </button>
                        <button onClick={() => setActiveTab('bulk')}
                            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'bulk' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <Table2 className="h-3.5 w-3.5" />Bulk Reprint
                        </button>
                    </div>

                    {activeTab === 'search' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-4">
                                <div className="bg-white shadow-sm rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Cari Karyawan</h3>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                        <input type="text" value={query} onChange={handleQueryChange}
                                            placeholder="Cari nama, NIK, atau departemen..."
                                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                                        {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 animate-spin" />}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {searchError && (
                                        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                                            <AlertCircle className="h-4 w-4 shrink-0" />{searchError}
                                        </div>
                                    )}
                                    {!isSearching && hasSearched && !results.length && !searchError && (
                                        <div className="text-center py-10 text-sm text-gray-500 bg-white rounded-lg border border-dashed border-gray-200">
                                            Tidak ada karyawan ditemukan untuk "<span className="font-medium">{query}</span>"
                                        </div>
                                    )}
                                    {!hasSearched && !isSearching && (
                                        <div className="text-center py-10 text-sm text-gray-400 bg-white rounded-lg border border-dashed border-gray-200">
                                            Ketik nama atau NIK karyawan untuk mulai mencari
                                        </div>
                                    )}
                                    {results.map((emp) => (
                                        <EmployeeCard key={emp.number_of_employees} employee={emp} inList={isInList(emp)}
                                            onPrintNow={handlePrintNow} onAddToList={handleAddToList}
                                            onRemoveFromList={handleRemoveFromList} isPrinting={isPrinting} />
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-1">
                                <div className="bg-white shadow-sm rounded-lg p-4 sticky top-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <ListChecks className="h-4 w-4 text-indigo-600" />List Cetak
                                        </h3>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${printList.length >= MAX_PRINT_LIST ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                            {printList.length}/{MAX_PRINT_LIST}
                                        </span>
                                    </div>
                                    {!printList.length ? (
                                        <p className="text-xs text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-md">
                                            Belum ada karyawan di list cetak
                                        </p>
                                    ) : (
                                        <ul className="space-y-2 mb-4 max-h-96 overflow-y-auto pr-1">
                                            {printList.map((emp) => (
                                                <li key={emp.number_of_employees} className="flex items-start gap-2 p-2 bg-gray-50 rounded-md">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-gray-800 truncate">{emp.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{emp.department} · {emp.job_level}</p>
                                                        <p className="text-xs text-gray-400 font-mono">{emp.number_of_employees}</p>
                                                        <label className="flex items-center gap-1.5 mt-1 text-xs text-indigo-700 cursor-pointer select-none">
                                                            <input type="checkbox" checked={emp.ctpat ?? false}
                                                                onChange={() => handleToggleCtpat(emp)}
                                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                            C-TPAT
                                                        </label>
                                                    </div>
                                                    <button onClick={() => handleRemoveFromList(emp)}
                                                        className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {printList.length >= MAX_PRINT_LIST && (
                                        <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
                                            <AlertCircle className="h-3.5 w-3.5" />Maksimal {MAX_PRINT_LIST} karyawan per cetak
                                        </p>
                                    )}
                                    <button onClick={handlePrintList}
                                        disabled={!printList.length || isPrinting || serviceStatus === false}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                        {isPrinting ? (<><Loader2 className="h-4 w-4 animate-spin" />Mencetak...</>)
                                            : (<><Printer className="h-4 w-4" />Cetak {printList.length ? `(${printList.length})` : ''}</>)}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bulk' && (
                        <div className="bg-white shadow-sm rounded-lg p-6 space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-1">Bulk Reprint</h3>
                                <p className="text-xs text-gray-500">
                                    Masukkan NIK karyawan, lalu tekan Enter atau pindah kolom.
                                    Sistem akan otomatis mengambil data dan foto. Maksimal {MAX_PRINT_LIST} karyawan.
                                </p>
                            </div>
                            <BulkReprintTable rows={bulkRows} onNikChange={handleBulkNikChange} onNikBlur={handleBulkNikBlur}
                                onToggleCtpat={handleBulkToggleCtpat} onRemoveRow={handleBulkRemoveRow}
                                onAddRow={handleBulkAddRow} onPrint={handleBulkPrint}
                                isPrinting={isPrinting} serviceStatus={serviceStatus} />
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
