import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, StopCircle, RotateCcw, Save, User, Search } from 'lucide-react';

export default function UploadImage({ candidates }) {
    const { flash } = usePage().props;
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const filteredCandidates = candidates.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.nik && c.nik.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.department?.name && c.department.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 480 },
                    height: { ideal: 640 },
                    facingMode: 'user',
                },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraOn(true);
            setCapturedImage(null);
        } catch (err) {
            alert('Tidak dapat mengakses kamera. Pastikan kamera terhubung dan izin diberikan.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
    }, []);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Portrait: 480x640
        canvas.width = 480;
        canvas.height = 640;

        const ctx = canvas.getContext('2d');

        // Calculate crop to maintain portrait aspect ratio from video
        const videoAspect = video.videoWidth / video.videoHeight;
        const targetAspect = 480 / 640;

        let sx, sy, sw, sh;
        if (videoAspect > targetAspect) {
            // Video is wider, crop sides
            sh = video.videoHeight;
            sw = sh * targetAspect;
            sx = (video.videoWidth - sw) / 2;
            sy = 0;
        } else {
            // Video is taller, crop top/bottom
            sw = video.videoWidth;
            sh = sw / targetAspect;
            sx = 0;
            sy = (video.videoHeight - sh) / 2;
        }

        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, 480, 640);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
    }, [stopCamera]);

    const retakePhoto = useCallback(() => {
        setCapturedImage(null);
        startCamera();
    }, [startCamera]);

    const savePhoto = useCallback(() => {
        if (!selectedCandidate || !capturedImage) return;

        setSaving(true);
        router.post(
            route('candidates.uploadImage.store'),
            {
                candidate_id: selectedCandidate.id,
                image: capturedImage,
            },
            {
                onSuccess: () => {
                    setCapturedImage(null);
                    setSelectedCandidate(null);
                    setSaving(false);
                },
                onError: () => {
                    setSaving(false);
                },
            }
        );
    }, [selectedCandidate, capturedImage]);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Upload Foto Kandidat
                </h2>
            }
        >
            <Head title="Upload Image" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
                            {flash.success}
                        </div>
                    )}

                    <div className="flex gap-6">
                        {/* LEFT: Candidate Table */}
                        <div className="w-1/2 overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">
                                    Kandidat Belum Ada Foto
                                </h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama, NIK, atau departemen..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="overflow-y-auto" style={{ maxHeight: '65vh' }}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                No
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nama
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                NIK
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Departemen
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredCandidates.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">
                                                    {searchQuery
                                                        ? 'Tidak ada kandidat yang cocok.'
                                                        : 'Semua kandidat sudah memiliki foto.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredCandidates.map((candidate, index) => (
                                                <tr
                                                    key={candidate.id}
                                                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                                                        selectedCandidate?.id === candidate.id
                                                            ? 'bg-indigo-50 border-l-4 border-l-indigo-500'
                                                            : ''
                                                    }`}
                                                    onClick={() => setSelectedCandidate(candidate)}
                                                >
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                        {candidate.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        {candidate.nik || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        {candidate.department?.name || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedCandidate(candidate);
                                                            }}
                                                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                                                selectedCandidate?.id === candidate.id
                                                                    ? 'bg-indigo-600 text-white'
                                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            Pilih
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
                                Total: {filteredCandidates.length} kandidat
                            </div>
                        </div>

                        {/* RIGHT: Camera & Preview */}
                        <div className="w-1/2 bg-white shadow-sm sm:rounded-lg">
                            <div className="p-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Ambil Foto
                                </h3>
                                {selectedCandidate && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Kandidat terpilih:{' '}
                                        <span className="font-semibold text-indigo-600">
                                            {selectedCandidate.name}
                                        </span>
                                    </p>
                                )}
                            </div>

                            <div className="p-4">
                                {!selectedCandidate ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                        <User className="h-16 w-16 mb-4" />
                                        <p className="text-sm">Pilih kandidat terlebih dahulu dari tabel di sebelah kiri</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        {/* Camera / Preview Area */}
                                        <div
                                            className="relative bg-black rounded-lg overflow-hidden mb-4"
                                            style={{ width: '320px', height: '427px' }}
                                        >
                                            {/* Camera Video */}
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className={`w-full h-full object-cover ${
                                                    isCameraOn && !capturedImage ? '' : 'hidden'
                                                }`}
                                                style={{ transform: 'scaleX(-1)' }}
                                            />

                                            {/* Captured Image Preview */}
                                            {capturedImage && (
                                                <img
                                                    src={capturedImage}
                                                    alt="Captured"
                                                    className="w-full h-full object-cover"
                                                    style={{ transform: 'scaleX(-1)' }}
                                                />
                                            )}

                                            {/* Placeholder when camera is off */}
                                            {!isCameraOn && !capturedImage && (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                                    <Camera className="h-12 w-12 mb-2 text-gray-400" />
                                                    <p className="text-sm">Klik tombol di bawah untuk menyalakan kamera</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Canvas for capture (hidden) */}
                                        <canvas ref={canvasRef} className="hidden" />

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 mt-2">
                                            {!isCameraOn && !capturedImage && (
                                                <button
                                                    onClick={startCamera}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                                                >
                                                    <Camera className="h-4 w-4" />
                                                    Nyalakan Kamera
                                                </button>
                                            )}

                                            {isCameraOn && !capturedImage && (
                                                <>
                                                    <button
                                                        onClick={capturePhoto}
                                                        className="inline-flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                                                    >
                                                        <Camera className="h-4 w-4" />
                                                        Ambil Foto
                                                    </button>
                                                    <button
                                                        onClick={stopCamera}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                                                    >
                                                        <StopCircle className="h-4 w-4" />
                                                        Stop
                                                    </button>
                                                </>
                                            )}

                                            {capturedImage && (
                                                <>
                                                    <button
                                                        onClick={retakePhoto}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                        Ulangi
                                                    </button>
                                                    <button
                                                        onClick={savePhoto}
                                                        disabled={saving}
                                                        className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                                    >
                                                        <Save className="h-4 w-4" />
                                                        {saving ? 'Menyimpan...' : 'Simpan'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
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
