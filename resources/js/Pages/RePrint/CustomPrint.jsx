import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useRef, useCallback, useEffect } from 'react';

export default function CustomPrint({}) {
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Custom Reprint ID Card</h2>}>
            <Head title="Custom Print" />
            <div className="py-6">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
