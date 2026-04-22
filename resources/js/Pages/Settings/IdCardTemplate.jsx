import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useRef, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Upload, ImageIcon, Search, CheckSquare, Square } from 'lucide-react';

const CTPAT_OPTIONS = [
    { value: 1, label: 'CTPAT' },
    { value: 0, label: 'Non-CTPAT' },
];

const emptyForm = {
    name: '',
    ctpat: '',
    description: '',
    template_image: null,
    joblevel_ids: [],
    department_ids: [],
};

function MultiSelect({ label, items, selected, onChange, colorClass, selectedColorClass }) {
    const [search, setSearch] = useState('');
    const filtered = items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );
    const allFilteredIds = filtered.map((i) => i.id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selected.includes(id));

    const toggleAll = () => {
        if (allSelected) {
            onChange(selected.filter((id) => !allFilteredIds.includes(id)));
        } else {
            const merged = [...new Set([...selected, ...allFilteredIds])];
            onChange(merged);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <span className="text-xs text-gray-400">{selected.length} dipilih</span>
            </div>
            <div className="border border-gray-300 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-2.5 py-2 border-b border-gray-200 bg-gray-50">
                    <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Cari ${label.toLowerCase()}...`}
                        className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
                    />
                    {filtered.length > 0 && (
                        <button
                            type="button"
                            onClick={toggleAll}
                            className="shrink-0 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            {allSelected
                                ? <><CheckSquare className="h-3.5 w-3.5" /> Hapus semua</>
                                : <><Square className="h-3.5 w-3.5" /> Pilih semua</>
                            }
                        </button>
                    )}
                </div>
                <div className="max-h-36 overflow-y-auto p-2 flex flex-wrap gap-1.5">
                    {filtered.length === 0 ? (
                        <p className="text-xs text-gray-400 py-1 px-1">Tidak ditemukan.</p>
                    ) : filtered.map((item) => {
                        const isSelected = selected.includes(item.id);
                        return (
                            <button
                                type="button"
                                key={item.id}
                                onClick={() => onChange(
                                    isSelected ? selected.filter((v) => v !== item.id) : [...selected, item.id]
                                )}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                                    isSelected ? selectedColorClass : colorClass
                                }`}
                            >
                                {item.name}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function DropZone({ preview, editing, onFile, onClear, onClickBrowse, fileRef, error }) {
    const [dragging, setDragging] = useState(false);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
            onFile(file);
        }
    }, [onFile]);

    const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
    const handleDragLeave = () => setDragging(false);

    return (
        <div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) onFile(f); }} />
            {preview ? (
                <div className="relative group">
                    <img src={preview} alt="preview" className="w-full max-h-56 object-contain rounded-md border border-gray-200 bg-gray-50" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-md transition-colors" />
                    <button
                        type="button"
                        onClick={onClear}
                        className="absolute top-2 right-2 bg-white/90 rounded-full p-1 hover:bg-white border border-gray-300 shadow-sm"
                    >
                        <X className="h-3.5 w-3.5 text-gray-600" />
                    </button>
                    <button
                        type="button"
                        onClick={onClickBrowse}
                        className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 bg-white/90 hover:bg-white border border-gray-300 rounded-md px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm transition-colors"
                    >
                        <Upload className="h-3 w-3" /> Ganti
                    </button>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={onClickBrowse}
                    className={`w-full flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed rounded-xl cursor-pointer transition-colors select-none ${
                        dragging
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                            : error
                            ? 'border-red-400 bg-red-50 text-red-500'
                            : 'border-gray-300 text-gray-500 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                >
                    <Upload className="h-7 w-7" />
                    <div className="text-center">
                        <p className="text-sm font-medium">{dragging ? 'Lepaskan file di sini' : 'Drag & drop atau klik untuk upload'}</p>
                        <p className="text-xs mt-0.5 opacity-70">JPG / PNG, maks 5MB</p>
                    </div>
                </div>
            )}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

export default function IdCardTemplate({ templates, departments, joblevels }) {
    const { flash } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [preview, setPreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const fileRef = useRef();

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setPreview(null);
        setErrors({});
        setShowModal(true);
    };

    const openEdit = (template) => {
        setEditing(template);
        setForm({
            name: template.name,
            ctpat: String(template.ctpat),
            description: template.description ?? '',
            template_image: null,
            joblevel_ids: template.joblevels.map((j) => j.id),
            department_ids: template.departments.map((d) => d.id),
        });
        setPreview(`/storage/${template.template_path}`);
        setErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditing(null);
        setForm(emptyForm);
        setPreview(null);
        setErrors({});
    };

    const handleFile = (file) => {
        setForm((prev) => ({ ...prev, template_image: file }));
        setPreview(URL.createObjectURL(file));
    };

    const handleClearPreview = () => {
        setPreview(editing ? `/storage/${editing.template_path}` : null);
        setForm((p) => ({ ...p, template_image: null }));
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});
        setSubmitting(true);

        const data = new FormData();
        data.append('name', form.name);
        data.append('ctpat', form.ctpat);
        data.append('description', form.description);
        if (form.template_image) data.append('template_image', form.template_image);
        form.joblevel_ids.forEach((id) => data.append('joblevel_ids[]', id));
        form.department_ids.forEach((id) => data.append('department_ids[]', id));

        const routeName = editing
            ? route('settings.idCardTemplate.update', editing.id)
            : route('settings.idCardTemplate.store');

        router.post(routeName, data, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { setSubmitting(false); closeModal(); },
            onError: (errs) => { setSubmitting(false); setErrors(errs); },
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(route('settings.idCardTemplate.destroy', deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => setDeleteTarget(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    ID Card Template
                </h2>
            }
        >
            <Head title="ID Card Template" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
                            {flash.success}
                        </div>
                    )}

                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Template ID Card</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{templates.length} template tersedia</p>
                            </div>
                            <button
                                onClick={openCreate}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Template
                            </button>
                        </div>

                        {templates.length === 0 ? (
                            <div className="py-20 text-center text-gray-400">
                                <ImageIcon className="mx-auto h-12 w-12 mb-3 opacity-40" />
                                <p className="text-sm">Belum ada template. Klik &quot;Tambah Template&quot; untuk memulai.</p>
                            </div>
                        ) : (
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {templates.map((template) => (
                                    <div key={template.id} className="border border-gray-200 rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                        <div className="bg-gray-100 aspect-[3/2] overflow-hidden">
                                            <img
                                                src={`/storage/${template.template_path}`}
                                                alt={template.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="p-3 flex flex-col gap-1 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="text-sm font-semibold text-gray-900 leading-tight">{template.name}</h4>
                                                <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${template.ctpat ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {template.ctpat ? 'CTPAT' : 'Non-CTPAT'}
                                                </span>
                                            </div>
                                            {template.description && (
                                                <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
                                            )}
                                            <div className="flex gap-2 mt-auto pt-2">
                                                <button
                                                    onClick={() => openEdit(template)}
                                                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium border border-indigo-300 text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                                                >
                                                    <Pencil className="h-3 w-3" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(template)}
                                                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 className="h-3 w-3" /> Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
                            <h3 className="text-base font-semibold text-gray-900">
                                {editing ? 'Edit Template' : 'Tambah Template Baru'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Template <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:border-indigo-500 focus:ring-indigo-500 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                                    placeholder="Nama template..."
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>

                            {/* CTPAT */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CTPAT <span className="text-red-500">*</span></label>
                                <div className="flex gap-3">
                                    {CTPAT_OPTIONS.map((opt) => (
                                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="ctpat"
                                                value={String(opt.value)}
                                                checked={form.ctpat === String(opt.value)}
                                                onChange={(e) => setForm((p) => ({ ...p, ctpat: e.target.value }))}
                                                className="text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.ctpat && <p className="text-xs text-red-500 mt-1">{errors.ctpat}</p>}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                                <textarea
                                    rows={2}
                                    value={form.description}
                                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                                    placeholder="Keterangan template..."
                                />
                            </div>

                            {/* Departments */}
                            <MultiSelect
                                label="Departemen"
                                items={departments}
                                selected={form.department_ids}
                                onChange={(ids) => setForm((p) => ({ ...p, department_ids: ids }))}
                                colorClass="bg-white text-gray-600 border-gray-300 hover:border-amber-400 hover:text-amber-600"
                                selectedColorClass="bg-amber-500 text-white border-amber-500"
                            />

                            {/* Joblevels */}
                            <MultiSelect
                                label="Jenjang"
                                items={joblevels}
                                selected={form.joblevel_ids}
                                onChange={(ids) => setForm((p) => ({ ...p, joblevel_ids: ids }))}
                                colorClass="bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
                                selectedColorClass="bg-indigo-600 text-white border-indigo-600"
                            />

                            {/* Template Image */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Gambar Template {!editing && <span className="text-red-500">*</span>}
                                    {editing && <span className="text-gray-400 font-normal text-xs ml-1">(kosongkan jika tidak ingin mengganti)</span>}
                                </label>
                                <DropZone
                                    preview={preview}
                                    editing={editing}
                                    onFile={handleFile}
                                    onClear={handleClearPreview}
                                    onClickBrowse={() => fileRef.current?.click()}
                                    fileRef={fileRef}
                                    error={errors.template_image}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-2">Hapus Template</h3>
                        <p className="text-sm text-gray-600">
                            Yakin ingin menghapus template <span className="font-medium text-gray-900">&quot;{deleteTarget.name}&quot;</span>? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex justify-end gap-3 mt-5">
                            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                                Batal
                            </button>
                            <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors">
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
