import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Reprint() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Reprint ID Card
                </h2>
            }
        >
            <Head title="Reprint ID Card" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            This is the Reprint ID Card page.
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
