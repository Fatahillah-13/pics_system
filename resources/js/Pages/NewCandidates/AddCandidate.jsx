import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState, useRef, useCallback } from 'react';
import { Plus, Trash2, Check, X, Pencil, Upload, FileSpreadsheet, Download } from 'lucide-react';

function InlineSelect({ value, onChange, options, placeholder }) {
    return (
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                    {opt.name}
                </option>
            ))}
        </select>
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
        nik: candidate.nik || '',
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
                <InlineInput value={form.nik} onChange={set('nik')} placeholder="NIK" />
                {errors?.nik && <p className="text-xs text-red-500 mt-1">{errors.nik}</p>}
            </td>
            <td className="px-3 py-2">
                <InlineSelect value={form.joblevel_id} onChange={set('joblevel_id')} options={joblevels} placeholder="Pilih Job Level" />
                {errors?.joblevel_id && <p className="text-xs text-red-500 mt-1">{errors.joblevel_id}</p>}
            </td>
            <td className="px-3 py-2">
                <InlineSelect value={form.department_id} onChange={set('department_id')} options={departments} placeholder="Pilih Department" />
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
            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{candidate.nik || '-'}</td>
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
    const fileInputRef = useRef(null);
    const { errors: pageErrors } = usePage().props;

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
        'NIK',
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
                                    <button
                                        onClick={() => setShowImportModal(true)}
                                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                                    >
                                        <Upload className="h-4 w-4" />
                                        Import Excel
                                    </button>
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
                                        {candidates.map((candidate, index) =>
                                            editingId === candidate.id ? (
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
                                                    index={index}
                                                    onEdit={(c) => {
                                                        setEditingId(c.id);
                                                        setIsAdding(false);
                                                        setErrors({});
                                                    }}
                                                    onDelete={handleDelete}
                                                />
                                            )
                                        )}
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
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
