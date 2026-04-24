import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Search, Printer, AlertCircle, CheckCircle, Download } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function PrintIdCard({ candidates, serviceStatus }) {
    const { flash } = usePage().props;
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selected, setSelected] = useState([]);
    const [printing, setPrinting] = useState(false);
    const [ctpatSelected, setCtpatSelected] = useState(new Set());

    const filteredCandidates = candidates.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.nik && c.nik.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.department?.name && c.department.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.joblevel?.name && c.joblevel.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedCandidates = filteredCandidates.slice(
        (safePage - 1) * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE
    );

    const allPageSelected =
        paginatedCandidates.length > 0 &&
        paginatedCandidates.every((c) => selected.includes(c.id));

    const toggleSelectAll = () => {
        if (allPageSelected) {
            setSelected((prev) => prev.filter((id) => !paginatedCandidates.find((c) => c.id === id)));
        } else {
            setSelected((prev) => [
                ...prev,
                ...paginatedCandidates.filter((c) => !prev.includes(c.id)).map((c) => c.id),
            ]);
        }
    };

    const toggleSelect = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleCtpat = (id) => {
        setCtpatSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handlePrint = (ids) => {
        if (printing) return;
        setPrinting(true);
        router.post(
            route('candidates.printIdCard.store'),
            {
                candidate_ids: ids,
                ctpat_ids: ids.filter((id) => ctpatSelected.has(id)),
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const pdfUrl = page.props.flash?.pdf_url;
                    if (pdfUrl) {
                        window.open(pdfUrl, '_blank');
                    }
                    setSelected([]);
                },
                onFinish: () => setPrinting(false),
            }
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Print ID Card
                </h2>
            }
        >
            <Head title="Print ID Card" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Service Status Warning */}
                    {serviceStatus === false && (
                        <div className="mb-4 flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            Service cetak ID Card sedang tidak tersedia. Pastikan Python service sudah berjalan.
                        </div>
                    )}

                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 shrink-0" />
                                <div className="flex-1">
                                    {flash.success}
                                    {flash.errors && <span className="ml-1 text-yellow-700">({flash.errors})</span>}
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
                        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {flash.error}
                        </div>
                    )}
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        {/* Header & Search */}
                        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    Kandidat Siap Cetak ID Card
                                </h3>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Kandidat di bawah sudah memiliki NIK dan foto.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {selected.length > 0 && (
                                    <button
                                        onClick={() => handlePrint(selected)}
                                        disabled={printing || serviceStatus === false}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Printer className="h-4 w-4" />
                                        {printing ? 'Mencetak...' : `Cetak (${selected.length})`}
                                    </button>
                                )}
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama, NIK, departemen..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 w-10">
                                            <input
                                                type="checkbox"
                                                checked={allPageSelected}
                                                onChange={toggleSelectAll}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                                            No
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                            Foto
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nama
                                        </th>
                                        <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Departemen
                                        </th>
                                        <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Jenjang
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            NIK
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-blue-600 uppercase tracking-wider w-20">
                                            CTPAT
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedCandidates.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-10 text-center text-sm text-gray-500">
                                                {searchQuery
                                                    ? 'Tidak ada kandidat yang cocok dengan pencarian.'
                                                    : 'Belum ada kandidat yang memiliki NIK dan foto.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedCandidates.map((candidate, index) => {
                                            const globalIndex = (safePage - 1) * ITEMS_PER_PAGE + index + 1;
                                            const isSelected = selected.includes(candidate.id);
                                            return (
                                                <tr
                                                    key={candidate.id}
                                                    className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}
                                                >
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleSelect(candidate.id)}
                                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        {globalIndex}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <img
                                                            src={`/storage/${candidate.image_path}`}
                                                            alt={candidate.name}
                                                            className="h-12 w-9 object-cover rounded shadow-sm"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                        {candidate.name}
                                                        <div className="sm:hidden text-xs text-gray-500 mt-0.5">
                                                            {candidate.department?.name || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="hidden sm:table-cell px-4 py-3 text-sm text-gray-500">
                                                        {candidate.department?.name || '-'}
                                                    </td>
                                                    <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-500">
                                                        {candidate.joblevel?.name || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                                                        {candidate.nik}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={ctpatSelected.has(candidate.id)}
                                                            onChange={() => toggleCtpat(candidate.id)}
                                                            className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => handlePrint([candidate.id])}
                                                            disabled={printing || serviceStatus === false}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <Printer className="h-3.5 w-3.5" />
                                                            {printing ? '...' : 'Cetak'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
                                <span>
                                    Halaman {safePage} dari {totalPages} &mdash; {filteredCandidates.length} kandidat
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={safePage === 1}
                                        className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        &laquo;
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-1 rounded border ${
                                                page === safePage
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={safePage === totalPages}
                                        className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        &raquo;
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
