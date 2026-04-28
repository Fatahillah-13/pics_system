import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function LogHistory() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Log History
                </h2>
            }
        >
            <Head title="Log History" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            Here you can view the log history of the system. This section will display all the activities and events that have occurred within the PICS System, allowing you to monitor and track any changes or actions taken by users. You can filter the logs by date, user, or type of activity to easily find specific entries. This is an essential tool for maintaining security and ensuring accountability within the system.
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
