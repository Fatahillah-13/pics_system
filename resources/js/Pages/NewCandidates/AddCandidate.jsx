import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Check, X, Pencil, Upload, FileSpreadsheet, Download, ChevronDown, Search } from 'lucide-react';

function SearchableSelect({ value, onChange, options, placeholder }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [dropdownStyle, setDropdownStyle] = useState({});
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);
    const searchRef = useRef(null);

    const selected = options.find((o) => String(o.id) === String(value));
    const filtered = options.filter((o) =>
        o.name.toLowerCase().includes(search.toLowerCase())
    );

    const updatePosition = useCallback(() => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownHeight = Math.min(220, spaceBelow - 8);
        setDropdownStyle({
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            width: Math.max(rect.width, 220),
            maxHeight: dropdownHeight,
            zIndex: 9999,
        });
    }, []);

    useEffect(() => {
        if (open) {
            setSearch('');
            updatePosition();
            setTimeout(() => searchRef.current?.focus(), 0);
        }
    }, [open, updatePosition]);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (
                buttonRef.current && !buttonRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        const onScroll = () => setOpen(false);
        document.addEventListener('mousedown', handler);
        window.addEventListener('scroll', onScroll, true);
        return () => {
            document.removeEventListener('mousedown', handler);
            window.removeEventListener('scroll', onScroll, true);
        };
    }, [open]);

    const handleSelect = (id) => {
        onChange(id);
        setOpen(false);
    };

    return (
        <div className="relative w-full">
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
                <span className={`truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
                    {selected ? selected.name : placeholder}
                </span>
                <ChevronDown className={`ml-1 h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && createPortal(
                <div
                    ref={dropdownRef}
                    style={dropdownStyle}
                    className="flex flex-col rounded-md border border-gray-200 bg-white shadow-xl"
                >
                    <div className="flex shrink-0 items-center gap-1 border-b border-gray-200 px-2 py-2">
                        <Search className="h-4 w-4 shrink-0 text-gray-400" />
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari..."
                            className="w-full border-0 bg-transparent p-0 text-sm text-gray-700 focus:outline-none focus:ring-0"
                        />
                    </div>
                    <ul className="overflow-y-auto py-1">
                        <li>
                            <button
                                type="button"
                                onClick={() => handleSelect('')}
                                className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-indigo-50"
                            >
                                {placeholder}
                            </button>
                        </li>
                        {filtered.length > 0 ? (
                            filtered.map((opt) => (
                                <li key={opt.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(opt.id)}
                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 ${
                                            String(opt.id) === String(value)
                                                ? 'bg-indigo-100 font-medium text-indigo-700'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        {opt.name}
                                    </button>
                                </li>
                            ))
                        ) : (
                            <li className="px-3 py-2 text-sm text-gray-400">Tidak ditemukan</li>
                        )}
                    </ul>
                </div>,
                document.body
            )}
        </div>
    );
}

function InlineInput({ value, onChange, type = 'text', placeholder = '' }) {
    return (
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
    );
}

function EditableRow({ candidate, departments, joblevels, onCancel, onSave, errors }) {
    const [form, setForm] = useState({
        name: candidate.name || '',
        photo_number: candidate.photo_number || '',
        joblevel_id: candidate.joblevel_id || '',
        department_id: candidate.department_id || '',
        birthplace: candidate.birthplace || '',
        birthdate: candidate.birthdate ? candidate.birthdate.split('T')[0] : '',
        first_working_day: candidate.first_working_day ? candidate.first_working_day.split('T')[0] : '',
    });

    const set = (field) => (val) => setForm((prev) => ({ ...prev, [field]: val }));

    return (
        <tr className="bg-indigo-50">
            <td className="px-3 py-2 text-sm text-gray-500">{candidate.id ?? '-'}</td>
            <td className="px-3 py-2">
                <InlineInput value={form.name} onChange={set('name')} placeholder="Nama" />
                {errors?.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </td>
            <td className="px-3 py-2">
                <InlineInput value={form.photo_number} onChange={set('photo_number')} placeholder="Nomor Foto" />
                {errors?.photo_number && <p className="text-xs text-red-500 mt-1">{errors.photo_number}</p>}
            </td>
            <td className="px-3 py-2">
                <SearchableSelect value={form.joblevel_id} onChange={set('joblevel_id')} options={joblevels} placeholder="Pilih Job Level" />
                {errors?.joblevel_id && <p className="text-xs text-red-500 mt-1">{errors.joblevel_id}</p>}
            </td>
            <td className="px-3 py-2">
                <SearchableSelect value={form.department_id} onChange={set('department_id')} options={departments} placeholder="Pilih Department" />
                {errors?.department_id && <p className="text-xs text-red-500 mt-1">{errors.department_id}</p>}
            </td>
            <td className="px-3 py-2">
                <InlineInput value={form.birthplace} onChange={set('birthplace')} placeholder="Tempat Lahir" />
            </td>
            <td className="px-3 py-2">
                <InlineInput type="date" value={form.birthdate} onChange={set('birthdate')} />
            </td>
            <td className="px-3 py-2">
                <InlineInput type="date" value={form.first_working_day} onChange={set('first_working_day')} />
            </td>
            <td className="px-3 py-2">
                <div className="flex gap-1">
                    <button
                        onClick={() => onSave(form)}
                        className="inline-flex items-center rounded-md bg-green-600 p-1.5 text-white hover:bg-green-700"
                        title="Simpan"
                    >
                        <Check className="h-4 w-4" />
                    </button>
                    <button
                        onClick={onCancel}
                        className="inline-flex items-center rounded-md bg-gray-400 p-1.5 text-white hover:bg-gray-500"
                        title="Batal"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function ReadOnlyRow({ candidate, index, onEdit, onDelete }) {
    return (
        <tr className="hover:bg-gray-50">
            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{index + 1}</td>
            <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-gray-900">{candidate.name}</td>
            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{candidate.photo_number || '-'}</td>
            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{candidate.joblevel?.name || '-'}</td>
            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{candidate.department?.name || '-'}</td>
            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{candidate.birthplace || '-'}</td>
            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
                {candidate.birthdate ? new Date(candidate.birthdate).toLocaleDateString('id-ID') : '-'}
            </td>
            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
                {candidate.first_working_day ? new Date(candidate.first_working_day).toLocaleDateString('id-ID') : '-'}
            </td>
            <td className="whitespace-nowrap px-3 py-3 text-sm">
                <div className="flex gap-1">
                    <button
                        onClick={() => onEdit(candidate)}
                        className="inline-flex items-center rounded-md bg-amber-500 p-1.5 text-white hover:bg-amber-600"
                        title="Edit"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onDelete(candidate.id)}
                        className="inline-flex items-center rounded-md bg-red-600 p-1.5 text-white hover:bg-red-700"
                        title="Hapus"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default function AddCandidate({ candidates, departments, joblevels }) {
    const [editingId, setEditingId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [errors, setErrors] = useState({});
    const [importing, setImporting] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const fileInputRef = useRef(null);
    const { errors: pageErrors, auth } = usePage().props;
    const userPermissions = auth?.user?.permissions ?? [];
    const can = (perm) => userPermissions.includes(perm);

    const totalPages = Math.max(1, Math.ceil(candidates.length / perPage));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedCandidates = candidates.slice(
        (safePage - 1) * perPage,
        safePage * perPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [perPage]);

    const handleFileSelect = (file) => {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ];
        if (file && (validTypes.includes(file.type) || /\.(xlsx|xls|csv)$/i.test(file.name))) {
            setSelectedFile(file);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const handleImportSubmit = () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        router.post(route('candidates.import'), formData, {
            preserveScroll: true,
            onStart: () => setImporting(true),
            onFinish: () => setImporting(false),
            onSuccess: () => {
                setShowImportModal(false);
                setSelectedFile(null);
            },
        });
    };

    const closeImportModal = () => {
        setShowImportModal(false);
        setSelectedFile(null);
        setDragOver(false);
    };

    const handleSaveNew = (formData) => {
        router.post(route('candidates.store'), formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsAdding(false);
                setErrors({});
            },
            onError: (errs) => setErrors(errs),
        });
    };

    const handleUpdate = (id, formData) => {
        router.put(route('candidates.update', id), formData, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingId(null);
                setErrors({});
            },
            onError: (errs) => setErrors(errs),
        });
    };

    const handleDelete = (id) => {
        if (!confirm('Yakin ingin menghapus kandidat ini?')) return;
        router.delete(route('candidates.destroy', id), {
            preserveScroll: true,
        });
    };

    const columns = [
        'No',
        'Nama',
        'Nomor Foto',
        'Job Level',
        'Department',
        'Tempat Lahir',
        'Tanggal Lahir',
        'Hari Pertama Kerja',
        'Aksi',
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Add Candidate
                </h2>
            }
        >
            <Head title="Add Candidate" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Daftar Kandidat</h3>
                                <div className="flex items-center gap-2">
                                    {can('import candidates') && (
                                        <button
                                            onClick={() => setShowImportModal(true)}
                                            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                                        >
                                            <Upload className="h-4 w-4" />
                                            Import Excel
                                        </button>
                                    )}
                                    {can('bulk add candidates') && (
                                        <a
                                            href={route('candidates.bulkAdd.view')}
                                            className="inline-flex items-center gap-1 rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
                                        >
                                            <FileSpreadsheet className="h-4 w-4" />
                                            Bulk Add
                                        </a>
                                    )}
                                    {can('create candidates') && (
                                        <button
                                            onClick={() => {
                                                setIsAdding(true);
                                                setEditingId(null);
                                                setErrors({});
                                            }}
                                            disabled={isAdding}
                                            className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Tambah Kandidat
                                        </button>
                                    )}
                                </div>
                            </div>

                            {pageErrors?.file && (
                                <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
                                    <p className="text-sm text-red-600">{pageErrors.file}</p>
                                </div>
                            )}

                            {/* Import Excel Modal */}
                            {showImportModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeImportModal}>
                                    <div
                                        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-gray-900">Import Excel</h3>
                                            <button onClick={closeImportModal} className="text-gray-400 hover:text-gray-600">
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>

                                        {/* Drag & Drop Zone */}
                                        <div
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                                                dragOver
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : selectedFile
                                                      ? 'border-emerald-400 bg-emerald-50'
                                                      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                                            }`}
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={(e) => handleFileSelect(e.target.files[0])}
                                                accept=".xlsx,.xls,.csv"
                                                className="hidden"
                                            />
                                            {selectedFile ? (
                                                <>
                                                    <FileSpreadsheet className="mb-2 h-10 w-10 text-emerald-500" />
                                                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {(selectedFile.size / 1024).toFixed(1)} KB — Klik atau drop untuk ganti file
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mb-2 h-10 w-10 text-gray-400" />
                                                    <p className="text-sm font-medium text-gray-700">
                                                        Drag & drop file di sini, atau <span className="text-indigo-600">klik untuk pilih</span>
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">Format: .xlsx, .xls, .csv (maks 2MB)</p>
                                                </>
                                            )}
                                        </div>

                                        {pageErrors?.file && (
                                            <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
                                                <p className="text-sm text-red-600">{pageErrors.file}</p>
                                            </div>
                                        )}

                                        {/* Download Template */}
                                        <div className="mb-5 rounded-md bg-blue-50 border border-blue-200 p-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-blue-800">Template Import</p>
                                                    <p className="text-xs text-blue-600">Download template untuk format yang benar</p>
                                                </div>
                                                <a
                                                    href={route('candidates.template')}
                                                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    Download
                                                </a>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={closeImportModal}
                                                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                onClick={handleImportSubmit}
                                                disabled={!selectedFile || importing}
                                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                            >
                                                <Upload className="h-4 w-4" />
                                                {importing ? 'Mengimpor...' : 'Import'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {columns.map((col) => (
                                                <th
                                                    key={col}
                                                    className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {isAdding && (
                                            <EditableRow
                                                candidate={{}}
                                                departments={departments}
                                                joblevels={joblevels}
                                                onCancel={() => {
                                                    setIsAdding(false);
                                                    setErrors({});
                                                }}
                                                onSave={handleSaveNew}
                                                errors={errors}
                                            />
                                        )}
                                        {paginatedCandidates.map((candidate, index) => {
                                            const globalIndex = (safePage - 1) * perPage + index;
                                            return editingId === candidate.id ? (
                                                <EditableRow
                                                    key={candidate.id}
                                                    candidate={candidate}
                                                    departments={departments}
                                                    joblevels={joblevels}
                                                    onCancel={() => {
                                                        setEditingId(null);
                                                        setErrors({});
                                                    }}
                                                    onSave={(formData) => handleUpdate(candidate.id, formData)}
                                                    errors={errors}
                                                />
                                            ) : (
                                                <ReadOnlyRow
                                                    key={candidate.id}
                                                    candidate={candidate}
                                                    index={globalIndex}
                                                    onEdit={(c) => {
                                                        setEditingId(c.id);
                                                        setIsAdding(false);
                                                        setErrors({});
                                                    }}
                                                    onDelete={handleDelete}
                                                />
                                            );
                                        })}
                                        {candidates.length === 0 && !isAdding && (
                                            <tr>
                                                <td colSpan={columns.length} className="px-3 py-6 text-center text-sm text-gray-500">
                                                    Belum ada kandidat. Klik "Tambah Kandidat" untuk menambahkan.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Footer */}
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>Tampilkan</span>
                                    <select
                                        value={perPage}
                                        onChange={(e) => setPerPage(Number(e.target.value))}
                                        className="w-20 rounded border border-gray-300 pl-2 pr-7 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        {[10, 20, 30, 50].map((n) => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                    <span>per halaman &mdash; Total {candidates.length} kandidat</span>
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={safePage === 1}
                                            className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
                                        >«</button>
                                        <button
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={safePage === 1}
                                            className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
                                        >‹</button>
                                        <span className="px-3 text-sm text-gray-600">{safePage} / {totalPages}</span>
                                        <button
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={safePage === totalPages}
                                            className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
                                        >›</button>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={safePage === totalPages}
                                            className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
                                        >»</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
