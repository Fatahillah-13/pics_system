import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useRef, useCallback } from 'react';
import {
    Search, Printer, Plus, X, AlertCircle, CheckCircle,
    Download, Loader2, ListChecks, User, Building2, Briefcase,
    BadgeCheck, Trash2
} from 'lucide-react';

const EMPLOYEE_API = 'http://10.10.100.193:1002/api.employees.v1/employees';
const MAX_PRINT_LIST = 10;

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

export default function Reprint({ serviceStatus }) {
    const { flash } = usePage().props;

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    const [printList, setPrintList] = useState([]);
    const [isPrinting, setIsPrinting] = useState(false);

    const debounceRef = useRef(null);

    const searchEmployees = useCallback(async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setHasSearched(false);
            setSearchError(null);
            return;
        }

        setIsSearching(true);
        setSearchError(null);

        try {
            const url = `${EMPLOYEE_API}/?search=${encodeURIComponent(searchQuery.trim())}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setResults(json.data ?? []);
            setHasSearched(true);
        } catch (err) {
            setSearchError('Gagal memuat data karyawan. Periksa koneksi ke server.');
            setResults([]);
            setHasSearched(true);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleQueryChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchEmployees(val), 500);
    };

    const isInList = (employee) =>
        printList.some((e) => e.number_of_employees === employee.number_of_employees);

    const handleAddToList = (employee) => {
        if (printList.length >= MAX_PRINT_LIST) return;
        if (isInList(employee)) return;
        setPrintList((prev) => [...prev, { ...employee, ctpat: false }]);
    };

    const handleToggleCtpat = (employee) => {
        setPrintList((prev) =>
            prev.map((e) =>
                e.number_of_employees === employee.number_of_employees
                    ? { ...e, ctpat: !e.ctpat }
                    : e
            )
        );
    };

    const handleRemoveFromList = (employee) => {
        setPrintList((prev) =>
            prev.filter((e) => e.number_of_employees !== employee.number_of_employees)
        );
    };

    const buildCards = (employees) =>
        employees.map((emp) => ({
            name: emp.name,
            department: emp.department,
            job_level: emp.job_level,
            employee_id: emp.number_of_employees,
            ctpat: emp.ctpat ?? false,
        }));

    const submitPrint = (cards) => {
        if (isPrinting) return;
        setIsPrinting(true);
        router.post(
            route('candidates.reprintIdCard.store'),
            { cards },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const pdfUrl = page.props.flash?.pdf_url;
                    if (pdfUrl) window.open(pdfUrl, '_blank');
                    setPrintList([]);
                },
                onFinish: () => setIsPrinting(false),
            }
        );
    };

    const handlePrintNow = (employee, ctpat) => {
        submitPrint(buildCards([{ ...employee, ctpat: ctpat ?? false }]));
    };

    const handlePrintList = () => {
        if (printList.length === 0) return;
        submitPrint(buildCards(printList));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Reprint ID Card
                </h2>
            }
        >
            <Head title="Reprint ID Card" />

            <div className="py-6">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Service Warning */}
                    {serviceStatus === false && (
                        <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            Service cetak ID Card sedang tidak tersedia. Pastikan Python service sudah berjalan.
                        </div>
                    )}

                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 shrink-0" />
                                <div className="flex-1">
                                    {flash.success}
                                    {flash.errors && (
                                        <span className="ml-1 text-yellow-700">({flash.errors})</span>
                                    )}
                                </div>
                                {flash?.pdf_url && (
                                    <a
                                        href={flash.pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Buka PDF
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {flash.error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Search + Results */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-white shadow-sm rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                    Cari Karyawan
                                </h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={handleQueryChange}
                                        placeholder="Cari nama, NIK, atau departemen..."
                                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                    {isSearching && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 animate-spin" />
                                    )}
                                </div>
                            </div>

                            {/* Results */}
                            <div className="space-y-3">
                                {searchError && (
                                    <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {searchError}
                                    </div>
                                )}

                                {!isSearching && hasSearched && results.length === 0 && !searchError && (
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
                                    <EmployeeCard
                                        key={emp.number_of_employees}
                                        employee={emp}
                                        inList={isInList(emp)}
                                        onPrintNow={handlePrintNow}
                                        onAddToList={handleAddToList}
                                        onRemoveFromList={handleRemoveFromList}
                                        isPrinting={isPrinting}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Right: Print List */}
                        <div className="lg:col-span-1">
                            <div className="bg-white shadow-sm rounded-lg p-4 sticky top-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <ListChecks className="h-4 w-4 text-indigo-600" />
                                        List Cetak
                                    </h3>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${printList.length >= MAX_PRINT_LIST
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-indigo-100 text-indigo-600'
                                        }`}>
                                        {printList.length}/{MAX_PRINT_LIST}
                                    </span>
                                </div>

                                {printList.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-md">
                                        Belum ada karyawan di list cetak
                                    </p>
                                ) : (
                                    <ul className="space-y-2 mb-4">
                                        {printList.map((emp) => (
                                            <li
                                                key={emp.number_of_employees}
                                                className="flex items-start gap-2 p-2 bg-gray-50 rounded-md"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-gray-800 truncate">{emp.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{emp.department} · {emp.job_level}</p>
                                                    <p className="text-xs text-gray-400 font-mono">{emp.number_of_employees}</p>
                                                    {/* Checkbox C-TPAT di list */}
                                                    <label className="flex items-center gap-1.5 mt-1 text-xs text-indigo-700 cursor-pointer select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={emp.ctpat ?? false}
                                                            onChange={() => handleToggleCtpat(emp)}
                                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        C-TPAT
                                                    </label>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveFromList(emp)}
                                                    className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {printList.length >= MAX_PRINT_LIST && (
                                    <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        Maksimal {MAX_PRINT_LIST} karyawan per cetak
                                    </p>
                                )}

                                <button
                                    onClick={handlePrintList}
                                    disabled={printList.length === 0 || isPrinting || serviceStatus === false}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isPrinting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Mencetak...
                                        </>
                                    ) : (
                                        <>
                                            <Printer className="h-4 w-4" />
                                            Cetak {printList.length > 0 ? `(${printList.length})` : ''}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

