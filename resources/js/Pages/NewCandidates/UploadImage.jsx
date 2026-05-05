import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, StopCircle, RotateCcw, Save, User, Search, RefreshCw, RotateCw, Upload } from 'lucide-react';

export default function UploadImage({ candidates }) {
    const { flash } = usePage().props;
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const [facingMode, setFacingMode] = useState('user');
    const [sortBy, setSortBy] = useState('index');
    const [editingPhotoNumber, setEditingPhotoNumber] = useState(null);
    const [editingValue, setEditingValue] = useState('');
    const [savingPhotoNumber, setSavingPhotoNumber] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploadedImage, setIsUploadedImage] = useState(false);
    const ITEMS_PER_PAGE = 5;

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const editInputRef = useRef(null);
    const fileInputRef = useRef(null);

    const filteredCandidates = candidates
        .filter((c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.nik && c.nik.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.department?.name && c.department.name.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice()
        .sort((a, b) => {
            if (sortBy === 'photo_number') {
                const aNum = a.photo_number ?? Infinity;
                const bNum = b.photo_number ?? Infinity;
                return aNum - bNum;
            }
            return 0; // preserve original order (already sorted by name from server)
        });

    const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedCandidates = filteredCandidates.slice(
        (safePage - 1) * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE
    );

    const startCamera = useCallback(async (overrideFacingMode) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 480 },
                    height: { ideal: 640 },
                    facingMode: overrideFacingMode ?? facingMode,
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
    }, [facingMode]);

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
        const ctx = canvas.getContext('2d');

        // Always portrait output
        canvas.width = 480;
        canvas.height = 640;

        // Calculate crop to maintain aspect ratio from video
        const videoAspect = video.videoWidth / video.videoHeight;

        // targetAspect stays the same — for 90/270, the rotated drawing area is 640×480
        const targetAspect = rotation === 90 || rotation === 270 ? 640 / 480 : 480 / 640;

        let sx, sy, sw, sh;
        if (videoAspect > targetAspect) {
            sh = video.videoHeight;
            sw = sh * targetAspect;
            sx = (video.videoWidth - sw) / 2;
            sy = 0;
        } else {
            sw = video.videoWidth;
            sh = sw / targetAspect;
            sx = 0;
            sy = (video.videoHeight - sh) / 2;
        }

        // Apply rotation to canvas
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);

        if (rotation === 90 || rotation === 270) {
            ctx.drawImage(video, sx, sy, sw, sh, -320, -240, 640, 480);
        } else {
            ctx.drawImage(video, sx, sy, sw, sh, -240, -320, 480, 640);
        }

        ctx.restore();

        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
    }, [rotation, stopCamera]);

    const retakePhoto = useCallback(() => {
        setCapturedImage(null);
        setRotation(0);
        if (isUploadedImage) {
            setIsUploadedImage(false);
            // don't start camera — let user choose again
        } else {
            setIsUploadedImage(false);
            startCamera();
        }
    }, [isUploadedImage, startCamera]);

    const rotatePhoto = useCallback(() => {
        setRotation((prev) => (prev + 90) % 360);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only clear if leaving the drop zone entirely (not entering a child)
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setCapturedImage(ev.target.result);
            setIsUploadedImage(true);
            if (isCameraOn) stopCamera();
        };
        reader.readAsDataURL(file);
    }, [isCameraOn, stopCamera]);

    const handleFileSelect = useCallback((e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setCapturedImage(ev.target.result);
            setIsUploadedImage(true);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }, []);

    const switchCamera = useCallback(() => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        if (isCameraOn) {
            stopCamera();
            startCamera(newMode);
        }
    }, [facingMode, isCameraOn, stopCamera, startCamera]);

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
                    setRotation(0);
                    setIsUploadedImage(false);
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

    useEffect(() => {
        if (editingPhotoNumber !== null && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingPhotoNumber]);

    const savePhotoNumber = useCallback((candidateId) => {
        const trimmed = String(editingValue).trim();
        const value = trimmed === '' ? null : parseInt(trimmed, 10);
        if (trimmed !== '' && isNaN(value)) {
            setEditingPhotoNumber(null);
            return;
        }
        setSavingPhotoNumber(candidateId);
        router.patch(
            route('candidates.updatePhotoNumber', candidateId),
            { photo_number: value },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSavingPhotoNumber(null);
                    setEditingPhotoNumber(null);
                },
                onError: () => {
                    setSavingPhotoNumber(null);
                    setEditingPhotoNumber(null);
                },
            }
        );
    }, [editingValue]);

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
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
                            {flash.success}
                        </div>
                    )}

                    <div className="flex flex-col gap-6 lg:flex-row">
                        {/* LEFT: Candidate Table */}
                        <div className="w-full lg:w-1/2 overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">
                                    Kandidat Belum Ada Foto
                                </h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama atau departemen..."
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
                                                <button
                                                    onClick={() => setSortBy(s => s === 'index' ? 'photo_number' : 'index')}
                                                    className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                                                    title={sortBy === 'index' ? 'Klik untuk urut berdasarkan No. Foto' : 'Klik untuk urut biasa'}
                                                >
                                                    {sortBy === 'index' ? 'No' : 'No. Foto'}
                                                    <span className="text-indigo-400">⇅</span>
                                                </button>
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nama
                                            </th>
                                            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                            paginatedCandidates.map((candidate, index) => {
                                                const globalIndex = (safePage - 1) * ITEMS_PER_PAGE + index;
                                                return (
                                                    <tr
                                                        key={candidate.id}
                                                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedCandidate?.id === candidate.id
                                                            ? 'bg-indigo-50 border-l-4 border-l-indigo-500'
                                                            : ''
                                                            }`}
                                                        onClick={() => setSelectedCandidate(candidate)}
                                                    >
                                                        <td
                                                            className="px-4 py-3 text-sm text-gray-500"
                                                            onDoubleClick={(e) => {
                                                                if (sortBy !== 'photo_number') return;
                                                                e.stopPropagation();
                                                                setEditingPhotoNumber(candidate.id);
                                                                setEditingValue(candidate.photo_number ?? '');
                                                            }}
                                                            title={sortBy === 'photo_number' ? 'Klik dua kali untuk edit no. foto' : ''}
                                                        >
                                                            {sortBy === 'photo_number' && editingPhotoNumber === candidate.id ? (
                                                                <input
                                                                    ref={editInputRef}
                                                                    type="number"
                                                                    min="1"
                                                                    value={editingValue}
                                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                                    onBlur={() => savePhotoNumber(candidate.id)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') savePhotoNumber(candidate.id);
                                                                        if (e.key === 'Escape') setEditingPhotoNumber(null);
                                                                        e.stopPropagation();
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    disabled={savingPhotoNumber === candidate.id}
                                                                    className="w-16 px-1 py-0.5 border border-indigo-400 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                                                                />
                                                            ) : (
                                                                <span className={sortBy === 'photo_number' ? 'cursor-pointer hover:text-indigo-600' : ''}>
                                                                    {sortBy === 'photo_number'
                                                                        ? (candidate.photo_number ?? '-')
                                                                        : globalIndex + 1}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                            {candidate.name}
                                                        </td>
                                                        <td className="hidden sm:table-cell px-4 py-3 text-sm text-gray-500">
                                                            {candidate.department?.name || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedCandidate(candidate);
                                                                }}
                                                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${selectedCandidate?.id === candidate.id
                                                                    ? 'bg-indigo-600 text-white'
                                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                    }`}
                                                            >
                                                                Pilih
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 flex items-center justify-between gap-2">
                                <span>Total: {filteredCandidates.length} kandidat</span>
                                {totalPages > 1 && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={safePage === 1}
                                            className="px-2 py-1 rounded border border-gray-300 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
                                        >«</button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={safePage === 1}
                                            className="px-2 py-1 rounded border border-gray-300 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
                                        >‹</button>
                                        <span className="px-2 text-xs text-gray-600">
                                            {safePage} / {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={safePage === totalPages}
                                            className="px-2 py-1 rounded border border-gray-300 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
                                        >›</button>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={safePage === totalPages}
                                            className="px-2 py-1 rounded border border-gray-300 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
                                        >»</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Camera & Preview */}
                        <div className="w-full lg:w-1/2 bg-white shadow-sm sm:rounded-lg">
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
                                        <p className="text-sm text-center">Pilih kandidat terlebih dahulu dari daftar di atas</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        {/* Camera / Preview Area */}
                                        <div
                                            className={`relative bg-black rounded-lg overflow-hidden mb-4 w-full mx-auto transition-colors ${isDragging ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                                            style={{ maxWidth: '320px', aspectRatio: '3/4' }}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        >
                                            {/* Camera Video */}
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className={`w-full h-full object-cover ${isCameraOn && !capturedImage ? '' : 'hidden'
                                                    }`}
                                                style={{
                                                    transform: `${facingMode === 'user' ? 'scaleX(-1)' : ''} rotate(${rotation}deg)`,
                                                    transformOrigin: 'center center'
                                                }}
                                            />

                                            {/* Captured Image Preview */}
                                            {capturedImage && (
                                                <img
                                                    src={capturedImage}
                                                    alt="Captured"
                                                    className="w-full h-full object-cover"
                                                    style={{ transform: (!isUploadedImage && facingMode === 'user') ? 'scaleX(-1)' : undefined }}
                                                />
                                            )}

                                            {/* Placeholder when camera is off */}
                                            {!isCameraOn && !capturedImage && (
                                                <div
                                                    className={`w-full h-full flex flex-col items-center justify-center text-gray-500 cursor-pointer transition-colors ${isDragging ? 'bg-indigo-900/20' : ''}`}
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Upload className="h-12 w-12 mb-2 text-gray-400" />
                                                    <p className="text-sm text-center px-4">Drag & drop gambar di sini</p>
                                                    <p className="text-xs text-gray-400 mt-1">atau klik untuk pilih file</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Canvas for capture (hidden) */}
                                        <canvas ref={canvasRef} className="hidden" />

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 mt-2">
                                            {!isCameraOn && !capturedImage && (
                                                <>
                                                    <button
                                                        onClick={startCamera}
                                                        className="inline-flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                                                    >
                                                        <Camera className="h-4 w-4" />
                                                        Nyalakan Kamera
                                                    </button>
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-300"
                                                    >
                                                        <Upload className="h-4 w-4" />
                                                        Pilih File
                                                    </button>
                                                </>
                                            )}

                                            {isCameraOn && !capturedImage && (
                                                <>
                                                    <button
                                                        onClick={capturePhoto}
                                                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                                                    >
                                                        <Camera className="h-4 w-4" />
                                                        Ambil Foto
                                                    </button>
                                                    <button
                                                        onClick={rotatePhoto}
                                                        className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                                        title="Putar 90°"
                                                    >
                                                        <RotateCw className="h-4 w-4" />
                                                        <span className="hidden sm:inline">Putar</span>
                                                    </button>
                                                    <button
                                                        onClick={switchCamera}
                                                        className="inline-flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                                                        title="Balik Kamera"
                                                    >
                                                        <RefreshCw className="h-4 w-4" />
                                                        <span className="hidden sm:inline">Balik</span>
                                                    </button>
                                                    <button
                                                        onClick={stopCamera}
                                                        className="inline-flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                                                    >
                                                        <StopCircle className="h-4 w-4" />
                                                        <span className="hidden sm:inline">Stop</span>
                                                    </button>
                                                </>
                                            )}

                                            {capturedImage && (
                                                <>
                                                    <button
                                                        onClick={retakePhoto}
                                                        className="inline-flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                        Ulangi
                                                    </button>
                                                    <button
                                                        onClick={savePhoto}
                                                        disabled={saving}
                                                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
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
