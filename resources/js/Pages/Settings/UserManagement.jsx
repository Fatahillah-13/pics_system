import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const emptyForm = {
    name: '',
    email: '',
    password: '',
    role: '',
    is_active: true,
};

const ROLE_COLORS = {
    Admin:     'bg-purple-100 text-purple-700 border-purple-200',
    Recruiter: 'bg-blue-100 text-blue-700 border-blue-200',
    Payroll:   'bg-green-100 text-green-700 border-green-200',
    Viewer:    'bg-gray-100 text-gray-600 border-gray-200',
};

function getRoleColor(role) {
    return ROLE_COLORS[role] ?? 'bg-yellow-100 text-yellow-700 border-yellow-200';
}

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h3 className="text-base font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

export default function UserManagement({ users, roles }) {
    const { flash } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
        setShowPassword(false);
        setShowModal(true);
    };

    const openEdit = (user) => {
        setEditing(user);
        setForm({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role ?? '',
            is_active: user.is_active,
        });
        setErrors({});
        setShowPassword(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
    };

    const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = { ...form };

        const routeName = editing
            ? route('settings.userManagement.update', editing.id)
            : route('settings.userManagement.store');
        const method = editing ? 'put' : 'post';

        router[method](routeName, payload, {
            onSuccess: () => { closeModal(); },
            onError: (errs) => { setErrors(errs); },
            onFinish: () => setSubmitting(false),
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(route('settings.userManagement.destroy', deleteTarget.id), {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-gray-800">User Management</h2>
                </div>
            }
        >
            <Head title="User Management" />

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
                        <div>
                            <p className="text-sm text-gray-500">{users.length} user terdaftar</p>
                        </div>
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah User
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">
                                        Belum ada user terdaftar.
                                    </td>
                                </tr>
                            ) : users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3 font-medium text-gray-800">{user.name}</td>
                                    <td className="px-5 py-3 text-gray-500">{user.email}</td>
                                    <td className="px-5 py-3">
                                        {user.role ? (
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.is_active ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                                            {user.is_active ? 'Aktif' : 'Non-aktif'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(user)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(user)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                title="Hapus"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <Modal title={editing ? 'Edit User' : 'Tambah User'} onClose={closeModal}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field label="Nama" error={errors.name}>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => set('name', e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                placeholder="Nama lengkap"
                            />
                        </Field>

                        <Field label="Email" error={errors.email}>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => set('email', e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                placeholder="email@example.com"
                            />
                        </Field>

                        <Field label={editing ? 'Password (kosongkan jika tidak diubah)' : 'Password'} error={errors.password}>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={(e) => set('password', e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    placeholder={editing ? 'Biarkan kosong jika tidak diubah' : 'Password'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </Field>

                        <Field label="Role" error={errors.role}>
                            <select
                                value={form.role}
                                onChange={(e) => set('role', e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            >
                                <option value="">-- Pilih Role --</option>
                                {roles.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Status" error={errors.is_active}>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => set('is_active', !form.is_active)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <span className="text-sm text-gray-600">{form.is_active ? 'Aktif' : 'Non-aktif'}</span>
                            </div>
                        </Field>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl">
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50"
                            >
                                {submitting ? 'Menyimpan...' : (editing ? 'Simpan Perubahan' : 'Tambah User')}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <Modal title="Hapus User" onClose={() => setDeleteTarget(null)}>
                    <p className="text-sm text-gray-600 mb-5">
                        Yakin ingin menghapus user <span className="font-semibold">{deleteTarget.name}</span>? Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:text-gray-800">
                            Batal
                        </button>
                        <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl">
                            Hapus
                        </button>
                    </div>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}

