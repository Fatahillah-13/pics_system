import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Shield, ChevronDown, ChevronUp } from 'lucide-react';

const emptyForm = {
    name: '',
    permissions: [],
};

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                    <h3 className="text-base font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="px-6 py-5 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

function PermissionGroup({ groupName, permissions, selected, onChange }) {
    const [open, setOpen] = useState(true);
    const allChecked = permissions.every((p) => selected.includes(p));
    const someChecked = permissions.some((p) => selected.includes(p));

    const toggleAll = () => {
        if (allChecked) {
            onChange(selected.filter((p) => !permissions.includes(p)));
        } else {
            const merged = [...new Set([...selected, ...permissions])];
            onChange(merged);
        }
    };

    const toggle = (perm) => {
        onChange(
            selected.includes(perm)
                ? selected.filter((p) => p !== perm)
                : [...selected, perm]
        );
    };

    const PERM_LABELS = {
        'view candidates':      'Lihat Kandidat',
        'create candidates':    'Tambah Kandidat',
        'edit candidates':      'Edit Kandidat',
        'delete candidates':    'Hapus Kandidat',
        'import candidates':    'Import Kandidat',
        'bulk add candidates':  'Bulk Add Kandidat',
        'upload image':         'Upload Foto',
        'upload nik':           'Upload NIK',
        'print id cards':       'Cetak ID Card',
        'reprint id cards':     'Cetak Ulang ID Card',
        'manage users':         'Kelola Users',
        'manage roles':         'Kelola Roles',
        'view logs':            'Lihat Log Histori',
        'manage id card templates': 'Kelola Template ID Card',
    };

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700"
            >
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={allChecked}
                        ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                        onChange={toggleAll}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{groupName}</span>
                    <span className="text-xs text-gray-400 font-normal">({permissions.filter((p) => selected.includes(p)).length}/{permissions.length})</span>
                </div>
                {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>
            {open && (
                <div className="p-3 grid grid-cols-2 gap-2">
                    {permissions.map((perm) => (
                        <label key={perm} className="flex items-center gap-2 cursor-pointer select-none group">
                            <input
                                type="checkbox"
                                checked={selected.includes(perm)}
                                onChange={() => toggle(perm)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                {PERM_LABELS[perm] ?? perm}
                            </span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function RoleManagement({ roles, groupedPermissions }) {
    const { flash } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
        setShowModal(true);
    };

    const openEdit = (role) => {
        setEditing(role);
        setForm({ name: role.name, permissions: role.permissions });
        setErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);

        const routeName = editing
            ? route('settings.roleManagement.update', editing.id)
            : route('settings.roleManagement.store');
        const method = editing ? 'put' : 'post';

        router[method](routeName, form, {
            onSuccess: () => closeModal(),
            onError: (errs) => setErrors(errs),
            onFinish: () => setSubmitting(false),
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(route('settings.roleManagement.destroy', deleteTarget.id), {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-gray-800">Role Management</h2>
                </div>
            }
        >
            <Head title="Role Management" />

            <div className="p-6 max-w-5xl mx-auto space-y-4">
                {/* Flash messages */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                        {flash.error}
                    </div>
                )}

                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">{roles.length} role terdaftar</p>
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Role
                        </button>
                    </div>
                </div>

                {/* Roles Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                    {roles.map((role) => (
                        <div key={role.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h4 className="font-semibold text-gray-800">{role.name}</h4>
                                    <p className="text-xs text-gray-400 mt-0.5">{role.users_count} user · {role.permissions.length} permission</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openEdit(role)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(role)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        title="Hapus"
                                        disabled={role.users_count > 0}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Permission badges */}
                            <div className="flex flex-wrap gap-1.5">
                                {role.permissions.length === 0 ? (
                                    <span className="text-xs text-gray-400">Tidak ada permission</span>
                                ) : role.permissions.slice(0, 6).map((perm) => (
                                    <span key={perm} className="inline-flex px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-600 border border-indigo-100">
                                        {perm}
                                    </span>
                                ))}
                                {role.permissions.length > 6 && (
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
                                        +{role.permissions.length - 6} lainnya
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <Modal title={editing ? `Edit Role: ${editing.name}` : 'Tambah Role'} onClose={closeModal}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Role</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                placeholder="Contoh: Manager"
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Permissions
                                <span className="ml-2 text-xs font-normal text-gray-400">({form.permissions.length} dipilih)</span>
                            </label>
                            {Object.entries(groupedPermissions).map(([group, perms]) => (
                                <PermissionGroup
                                    key={group}
                                    groupName={group}
                                    permissions={perms}
                                    selected={form.permissions}
                                    onChange={(newPerms) => setForm((p) => ({ ...p, permissions: newPerms }))}
                                />
                            ))}
                            {errors.permissions && <p className="text-xs text-red-500">{errors.permissions}</p>}
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl">
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50"
                            >
                                {submitting ? 'Menyimpan...' : (editing ? 'Simpan Perubahan' : 'Tambah Role')}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <Modal title="Hapus Role" onClose={() => setDeleteTarget(null)}>
                    <p className="text-sm text-gray-600 mb-5">
                        Yakin ingin menghapus role <span className="font-semibold">{deleteTarget.name}</span>?
                        {deleteTarget.users_count > 0 && (
                            <span className="block text-red-500 mt-1">
                                Role ini masih digunakan oleh {deleteTarget.users_count} user.
                            </span>
                        )}
                    </p>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:text-gray-800">
                            Batal
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleteTarget.users_count > 0}
                            className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-40"
                        >
                            Hapus
                        </button>
                    </div>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}
