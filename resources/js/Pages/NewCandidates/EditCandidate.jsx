import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditCandidate({ candidate, departments, joblevels, previousUrl }) {
    const { data, setData, put, processing, errors } = useForm({
        name: candidate.name || '',
        nik: candidate.nik || '',
        photo_number: candidate.photo_number || '',
        joblevel_id: candidate.joblevel_id || '',
        department_id: candidate.department_id || '',
        birthplace: candidate.birthplace || '',
        birthdate: candidate.birthdate ? candidate.birthdate.split('T')[0] : '',
        first_working_day: candidate.first_working_day ? candidate.first_working_day.split('T')[0] : '',
    });

    const handleBack = () => {
        if (previousUrl) {
            router.visit(previousUrl);
        } else {
            window.history.back();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('candidates.update', candidate.id), {
            preserveScroll: true,
            onSuccess: handleBack,
        });
    };

    const handleCancel = () => {
        handleBack();
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCancel}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Edit Kandidat
                    </h2>
                </div>
            }
        >
            <Head title="Edit Kandidat" />

            <div className="py-6">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Candidate Photo Preview */}
                                {candidate.image_path && (
                                    <div className="flex justify-center">
                                        <div className="text-center">
                                            <img
                                                src={`/storage/${candidate.image_path}`}
                                                alt={candidate.name}
                                                className="h-40 w-32 object-cover rounded-lg shadow-md mx-auto"
                                            />
                                            <p className="text-xs text-gray-500 mt-2">Foto Kandidat</p>
                                        </div>
                                    </div>
                                )}

                                {/* Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama Lengkap <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    />
                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* NIK */}
                                    <div>
                                        <label htmlFor="nik" className="block text-sm font-medium text-gray-700 mb-1">
                                            NIK
                                        </label>
                                        <input
                                            type="text"
                                            id="nik"
                                            value={data.nik}
                                            onChange={(e) => setData('nik', e.target.value)}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        {errors.nik && <p className="text-xs text-red-500 mt-1">{errors.nik}</p>}
                                    </div>

                                    {/* Photo Number */}
                                    <div>
                                        <label htmlFor="photo_number" className="block text-sm font-medium text-gray-700 mb-1">
                                            Nomor Foto
                                        </label>
                                        <input
                                            type="number"
                                            id="photo_number"
                                            value={data.photo_number}
                                            onChange={(e) => setData('photo_number', e.target.value)}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        {errors.photo_number && <p className="text-xs text-red-500 mt-1">{errors.photo_number}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Department */}
                                    <div>
                                        <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 mb-1">
                                            Departemen <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="department_id"
                                            value={data.department_id}
                                            onChange={(e) => setData('department_id', e.target.value)}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        >
                                            <option value="">Pilih Departemen</option>
                                            {departments.map((dept) => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.department_id && <p className="text-xs text-red-500 mt-1">{errors.department_id}</p>}
                                    </div>

                                    {/* Job Level */}
                                    <div>
                                        <label htmlFor="joblevel_id" className="block text-sm font-medium text-gray-700 mb-1">
                                            Job Level <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="joblevel_id"
                                            value={data.joblevel_id}
                                            onChange={(e) => setData('joblevel_id', e.target.value)}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        >
                                            <option value="">Pilih Job Level</option>
                                            {joblevels.map((jl) => (
                                                <option key={jl.id} value={jl.id}>
                                                    {jl.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.joblevel_id && <p className="text-xs text-red-500 mt-1">{errors.joblevel_id}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Birthplace */}
                                    <div>
                                        <label htmlFor="birthplace" className="block text-sm font-medium text-gray-700 mb-1">
                                            Tempat Lahir
                                        </label>
                                        <input
                                            type="text"
                                            id="birthplace"
                                            value={data.birthplace}
                                            onChange={(e) => setData('birthplace', e.target.value)}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        {errors.birthplace && <p className="text-xs text-red-500 mt-1">{errors.birthplace}</p>}
                                    </div>

                                    {/* Birthdate */}
                                    <div>
                                        <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
                                            Tanggal Lahir
                                        </label>
                                        <input
                                            type="date"
                                            id="birthdate"
                                            value={data.birthdate}
                                            onChange={(e) => setData('birthdate', e.target.value)}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        {errors.birthdate && <p className="text-xs text-red-500 mt-1">{errors.birthdate}</p>}
                                    </div>
                                </div>

                                {/* First Working Day */}
                                <div>
                                    <label htmlFor="first_working_day" className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal Masuk Kerja
                                    </label>
                                    <input
                                        type="date"
                                        id="first_working_day"
                                        value={data.first_working_day}
                                        onChange={(e) => setData('first_working_day', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.first_working_day && <p className="text-xs text-red-500 mt-1">{errors.first_working_day}</p>}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        disabled={processing}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                    >
                                        <Save className="h-4 w-4" />
                                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
