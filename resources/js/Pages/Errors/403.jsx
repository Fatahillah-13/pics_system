import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ShieldOff } from 'lucide-react';

export default function Forbidden() {
    return (
        <AuthenticatedLayout>
            <Head title="Akses Ditolak" />
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <ShieldOff className="h-16 w-16 text-red-400 mb-4" />
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Akses Ditolak</h1>
                <p className="text-gray-500 mb-6">
                    Anda tidak memiliki izin untuk mengakses halaman ini.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                >
                    Kembali ke Dashboard
                </Link>
            </div>
        </AuthenticatedLayout>
    );
}
