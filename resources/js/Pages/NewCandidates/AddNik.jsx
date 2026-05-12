import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

/**
 * Derive the 4-digit NIK prefix from first_working_day.
 * Format: YY (last 2 digits of year) + MM (zero-padded month)
 * Example: 2024-12-07 â†’ "2412"
 */
const getPrefix = (candidate) => {
    if (!candidate.first_working_day) return '';
    const [yearStr, monthStr] = candidate.first_working_day.split('-');
    return yearStr.slice(2) + monthStr;
};

export default function AddNik({ candidates }) {
    const { flash, auth } = usePage().props;
    const userPermissions = auth?.user?.permissions ?? [];
    const can = (perm) => userPermissions.includes(perm);
    const [searchQuery, setSearchQuery] = useState('');
    const [nikSuffixes, setNikSuffixes] = useState({});
    const [saving, setSaving] = useState(null);
    const [savingAll, setSavingAll] = useState(false);
    const [errors, setErrors] = useState({});
    const [bulkError, setBulkError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [bulkInput, setBulkInput] = useState('');
    const [showBulk, setShowBulk] = useState(false);
    const [bulkPrefix, setBulkPrefix] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const filteredCandidates = candidates.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.department?.name && c.department.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.joblevel?.name && c.joblevel.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedCandidates = filteredCandidates.slice(
        (safePage - 1) * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE
    );

    // Unique prefixes from all filtered candidates, sorted
    const availablePrefixes = [...new Set(
        filteredCandidates
            .map((c) => getPrefix(c))
            .filter((p) => p !== '')
    )].sort();

    const handleSuffixChange = (id, value) => {
        const numeric = value.replace(/\D/g, '');
        setNikSuffixes((prev) => ({ ...prev, [id]: numeric }));
        if (errors[id]) setErrors((prev) => ({ ...prev, [id]: null }));
    };

    const applyBulkInput = () => {
        const suffixes = bulkInput
            .split(',')
            .map((s) => s.trim().replace(/\D/g, ''))
            .filter((s) => s !== '');
        if (suffixes.length === 0) return;

        // Only apply to candidates whose prefix matches the selected bulkPrefix
        const targetCandidates = filteredCandidates.filter(
            (c) => getPrefix(c) === bulkPrefix
        );

        const newSuffixes = { ...nikSuffixes };
        const newErrors = { ...errors };
        targetCandidates.forEach((candidate, index) => {
            if (suffixes[index] !== undefined) {
                newSuffixes[candidate.id] = suffixes[index];
                delete newErrors[candidate.id];
            }
        });
        setNikSuffixes(newSuffixes);
        setErrors(newErrors);
        setBulkInput('');
    };

    const handleSave = (candidate) => {
        const prefix = getPrefix(candidate);
        const suffix = (nikSuffixes[candidate.id] ?? '').trim();
        if (!suffix) {
            setErrors((prev) => ({ ...prev, [candidate.id]: 'Nomor akhir NIK tidak boleh kosong.' }));
            return;
        }

        setSaving(candidate.id);
        router.post(
            route('candidates.uploadNik.store'),
            { candidate_id: candidate.id, nik: prefix + suffix },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNikSuffixes((prev) => ({ ...prev, [candidate.id]: '' }));
                    setSaving(null);
                },
                onError: (errs) => {
                    setSaving(null);
                    const msg = errs?.nik ?? errs?.candidate_id ?? 'Terjadi kesalahan.';
                    setErrors((prev) => ({ ...prev, [candidate.id]: msg }));
                },
            }
        );
    };

    const pendingCandidates = paginatedCandidates.filter(
        (c) => (nikSuffixes[c.id] ?? '').trim() !== ''
    );

    const handleSaveAll = () => {
        if (pendingCandidates.length === 0) return;
        setBulkError('');

        const payload = pendingCandidates.map((c) => ({
            candidate_id: c.id,
            nik: getPrefix(c) + nikSuffixes[c.id].trim(),
        }));

        setSavingAll(true);
        router.post(
            route('candidates.uploadNik.storeMany'),
            { data: payload },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSavingAll(false);
                    const cleared = {};
                    pendingCandidates.forEach((c) => { cleared[c.id] = ''; });
                    setNikSuffixes((prev) => ({ ...prev, ...cleared }));
                },
                onError: (errs) => {
                    setSavingAll(false);
                    setBulkError(errs?.data ?? 'Terjadi kesalahan saat menyimpan massal.');
                },
            }
        );
    };

    const handleEdit = (candidateId) => {
        router.get(route('candidates.edit', candidateId), {
            from: window.location.pathname + window.location.search,
        });
    };

    const handleDelete = (candidate) => {
        setDeleteConfirm(candidate);
    };

    const confirmDelete = () => {
        if (!deleteConfirm) return;
        setDeleting(true);
        router.delete(route('candidates.destroy', deleteConfirm.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteConfirm(null);
                setDeleting(false);
            },
            onError: () => {
                setDeleting(false);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Add NIK
                </h2>
            }
        >
            <Head title="Add NIK" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
                            {flash.success}
                        </div>
                    )}

                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        {/* Header & Search */}
                        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    Kandidat Belum Memiliki NIK
                                </h3>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Kandidat di bawah sudah memiliki foto namun belum memiliki NIK.
                                </p>
                            </div>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama, departemen, jenjang..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Bulk Input Panel */}
                        <div className="border-b border-gray-200">
                            <button
                                onClick={() => setShowBulk((v) => !v)}
                                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                                <span>Input NIK Massal</span>
                                {showBulk ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            {showBulk && (
                                <div className="px-4 pb-4 bg-indigo-50">
                                    {/* Prefix selector */}
                                    <div className="mb-3 pt-3">
                                        <p className="text-xs font-medium text-gray-600 mb-1.5">
                                            Pilih prefix (tahun+bulan masuk kerja):
                                        </p>
                                        {availablePrefixes.length === 0 ? (
                                            <p className="text-xs text-yellow-600">
                                                Tidak ada kandidat dengan tanggal masuk kerja yang terisi.
                                            </p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {availablePrefixes.map((prefix) => {
                                                    const count = filteredCandidates.filter(
                                                        (c) => getPrefix(c) === prefix
                                                    ).length;
                                                    return (
                                                        <button
                                                            key={prefix}
                                                            onClick={() => setBulkPrefix(prefix)}
                                                            className={`px-3 py-1 rounded-full text-xs font-mono font-medium border transition-colors ${
                                                                bulkPrefix === prefix
                                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                                                            }`}
                                                        >
                                                            {prefix}
                                                            <span className={`ml-1.5 ${
                                                                bulkPrefix === prefix ? 'text-indigo-200' : 'text-gray-400'
                                                            }`}>
                                                                ({count})
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-xs text-gray-500 mb-2">
                                        Masukkan <span className="font-semibold">nomor akhir NIK</span> dipisahkan koma sesuai urutan kandidat ber-prefix
                                        {bulkPrefix ? (
                                            <> <span className="font-mono text-indigo-600">{bulkPrefix}</span> ({filteredCandidates.filter((c) => getPrefix(c) === bulkPrefix).length} kandidat)</>
                                        ) : ' yang dipilih'}.
                                        {bulkPrefix && (
                                            <><br />Contoh: <span className="font-mono text-gray-700">074308, 074310</span> &rarr; NIK: <span className="font-mono text-gray-700">{bulkPrefix}074308, {bulkPrefix}074310</span></>
                                        )}
                                    </p>

                                    {bulkError && (
                                        <div className="mb-2 rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                                            {bulkError}
                                        </div>
                                    )}
                                    <textarea
                                        rows={3}
                                        value={bulkInput}
                                        onChange={(e) => setBulkInput(e.target.value)}
                                        placeholder={bulkPrefix ? '074308, 074310, 074312, ...' : 'Pilih prefix terlebih dahulu...'}
                                        disabled={!bulkPrefix}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:border-indigo-500 focus:ring-indigo-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <div className="flex items-center justify-between mt-2 gap-2">
                                        <span className="text-xs text-gray-400">
                                            {bulkPrefix
                                                ? `Diterapkan ke kandidat ber-prefix ${bulkPrefix} (berurutan dari atas)`
                                                : 'Pilih prefix di atas untuk mulai mengisi'}
                                        </span>
                                        <button
                                            onClick={applyBulkInput}
                                            disabled={!bulkInput.trim() || !bulkPrefix}
                                            className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Terapkan
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">No</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Foto</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                        <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departemen</th>
                                        <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenjang</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            NIK
                                            <span className="ml-1 font-normal normal-case text-gray-400">(prefix + nomor akhir)</span>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedCandidates.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-10 text-center text-sm text-gray-500">
                                                {searchQuery
                                                    ? 'Tidak ada kandidat yang cocok dengan pencarian.'
                                                    : 'Semua kandidat sudah memiliki NIK.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedCandidates.map((candidate, index) => {
                                            const globalIndex = (safePage - 1) * ITEMS_PER_PAGE + index + 1;
                                            const isSaving = saving === candidate.id;
                                            const error = errors[candidate.id];
                                            const prefix = getPrefix(candidate);
                                            const suffix = nikSuffixes[candidate.id] ?? '';
                                            return (
                                                <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 text-sm text-gray-500">{globalIndex}</td>
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
                                                    <td className="px-4 py-3">
                                                        {can('upload nik') ? (
                                                        <div>
                                                            <div className="flex items-stretch">
                                                                {/* Auto-generated prefix */}
                                                                {prefix ? (
                                                                    <span
                                                                        title="Tahun+bulan masuk kerja (otomatis)"
                                                                        className="flex items-center px-2 py-1.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm font-mono text-gray-600 select-none whitespace-nowrap"
                                                                    >
                                                                        {prefix}
                                                                    </span>
                                                                ) : (
                                                                    <span
                                                                        title="Tanggal masuk kerja belum diisi"
                                                                        className="flex items-center px-2 py-1.5 bg-yellow-50 border border-r-0 border-yellow-300 rounded-l-md text-xs text-yellow-600 select-none whitespace-nowrap"
                                                                    >
                                                                        ?
                                                                    </span>
                                                                )}
                                                                {/* User-input suffix */}
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    placeholder="nomor akhir..."
                                                                    value={suffix}
                                                                    onChange={(e) => handleSuffixChange(candidate.id, e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleSave(candidate);
                                                                    }}
                                                                    disabled={isSaving}
                                                                    className={`w-32 px-2 py-1.5 border rounded-r-md text-sm font-mono focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 disabled:opacity-50 ${
                                                                        error ? 'border-red-400' : 'border-gray-300'
                                                                    }`}
                                                                />
                                                            </div>
                                                            {/* Live preview of full NIK */}
                                                            {suffix && (
                                                                <p className="text-xs text-gray-400 mt-0.5 font-mono">
                                                                    NIK: {prefix}{suffix}
                                                                </p>
                                                            )}
                                                            {error && (
                                                                <p className="text-xs text-red-500 mt-1">{error}</p>
                                                            )}
                                                        </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1.5">
                                                            {can('upload nik') && (
                                                            <button
                                                                onClick={() => handleSave(candidate)}
                                                                disabled={isSaving || !suffix}
                                                                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {isSaving ? 'Menyimpan...' : 'Simpan'}
                                                            </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleEdit(candidate.id)}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                                title="Edit kandidat"
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(candidate)}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                                title="Hapus kandidat"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer: count + save all + pagination */}
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2 text-xs text-gray-500">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span>Total: {filteredCandidates.length} kandidat</span>
                                {can('upload nik') && pendingCandidates.length > 0 && (
                                    <button
                                        onClick={handleSaveAll}
                                        disabled={savingAll}
                                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {savingAll
                                            ? 'Menyimpan...'
                                            : `Simpan Semua (${pendingCandidates.length})`}
                                    </button>
                                )}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setCurrentPage(1)} disabled={safePage === 1} className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition-colors">Â«</button>
                                    <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition-colors">â€¹</button>
                                    <span className="px-2 text-gray-600">{safePage} / {totalPages}</span>
                                    <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition-colors">â€º</button>
                                    <button onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages} className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition-colors">Â»</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    Hapus Kandidat?
                                </h3>
                                <p className="text-sm text-gray-600 mb-1">
                                    Apakah Anda yakin ingin menghapus kandidat:
                                </p>
                                <p className="text-sm font-semibold text-gray-900 mb-2">
                                    {deleteConfirm.name}
                                </p>
                                <p className="text-sm text-red-600">
                                    Tindakan ini tidak dapat dibatalkan.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {deleting ? 'Menghapus...' : 'Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
