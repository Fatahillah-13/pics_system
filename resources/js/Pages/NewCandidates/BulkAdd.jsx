import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
    Upload, FileSpreadsheet, Check, X, Pencil, Save,
    AlertCircle, CheckCircle2, FileImage, ChevronLeft, Image,
} from 'lucide-react';

// ─── tiny shared helpers ────────────────────────────────────────────────────

function InlineSelect({ value, onChange, options, placeholder }) {
    return (
        <select
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
        </select>
    );
}

function InlineInput({ value, onChange, type = 'text', placeholder = '' }) {
    return (
        <input
            type={type}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
    );
}

// ─── helpers ────────────────────────────────────────────────────────────────

function buildPhotoMap(files) {
    const map = {};
    for (const file of files) {
        const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
        // Extract all digit groups; use the last one, parsed as int to strip leading zeros
        // e.g. "DSC00001" → last group "00001" → parseInt → 1 → key "1"
        const groups = nameWithoutExt.match(/\d+/g);
        if (groups) {
            const numKey = String(parseInt(groups[groups.length - 1], 10));
            if (!map[numKey]) map[numKey] = file;
        }
        // Also store the full name (no ext, lowercase) as a fallback key
        const fullKey = nameWithoutExt.toLowerCase();
        if (!map[fullKey]) map[fullKey] = file;
    }
    return map;
}

function matchRows(rows, photoFiles, joblevels, departments) {
    const photoMap = buildPhotoMap(photoFiles);
    return rows.map((row) => {
        const rawNum  = String(row.photo_number ?? '').trim();
        // Normalize photo_number by parsing as int so "001" and "1" both become "1"
        const photoKey = rawNum !== '' && !isNaN(rawNum) ? String(parseInt(rawNum, 10)) : rawNum.toLowerCase();
        const nameKey  = String(row.name ?? '').trim().toLowerCase();
        const matched  = (photoKey && photoMap[photoKey]) || photoMap[nameKey] || null;
        return {
            ...row,
            joblevel_id:   joblevels.find((j) => j.name.toLowerCase() === String(row.job_level ?? '').toLowerCase())?.id ?? '',
            department_id: departments.find((d) => d.name.toLowerCase() === String(row.department ?? '').toLowerCase())?.id ?? '',
            matchedPhoto:  matched,
            previewUrl:    matched ? URL.createObjectURL(matched) : null,
        };
    });
}

// Compress a File/Blob using canvas — max 1200px, JPEG quality 0.82
// Returns a Promise<Blob>
function compressPhoto(file, maxPx = 1200, quality = 0.82) {
    return new Promise((resolve) => {
        const img = new window.Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let { width, height } = img;
            if (width > maxPx || height > maxPx) {
                if (width >= height) { height = Math.round((height / width) * maxPx); width = maxPx; }
                else                 { width  = Math.round((width / height) * maxPx); height = maxPx; }
            }
            const canvas = document.createElement('canvas');
            canvas.width  = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', quality);
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
    });
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function BulkAdd({ departments, joblevels }) {
    const { flash } = usePage().props;

    const [step, setStep]           = useState('upload'); // 'upload' | 'review'
    const [excelFile, setExcelFile] = useState(null);
    const [photoFiles, setPhotoFiles] = useState([]);
    const [excelDragOver, setExcelDragOver] = useState(false);
    const [photoDragOver, setPhotoDragOver] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [parseError, setParseError] = useState(null);

    const [candidates, setCandidates] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveProgress, setSaveProgress] = useState(null); // null=idle, 0-99=uploading, 100=server processing
    const [successMessage, setSuccessMessage] = useState(null);

    const excelInputRef = useRef(null);
    const photoInputRef = useRef(null);

    // cleanup object URLs on unmount
    useEffect(() => () => {
        candidates.forEach((c) => { if (c.previewUrl) URL.revokeObjectURL(c.previewUrl); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleExcelFile = (file) => {
        if (file && /\.(xlsx|xls|csv)$/i.test(file.name)) setExcelFile(file);
    };

    const handlePhotoFiles = (files) => {
        setPhotoFiles(Array.from(files).filter((f) => f.type.startsWith('image/')));
    };

    const handleProcess = async () => {
        if (!excelFile) return;
        setProcessing(true);
        setParseError(null);

        const fd = new FormData();
        fd.append('file', excelFile);

        try {
            const res = await window.axios.post(route('candidates.bulkAdd.preview'), fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const rows = res.data.rows ?? [];
            if (rows.length === 0) { setParseError('File Excel tidak memiliki data.'); return; }
            setCandidates(matchRows(rows, photoFiles, joblevels, departments));
            setStep('review');
        } catch (err) {
            const msg = err.response?.data?.error
                || err.response?.data?.message
                || Object.values(err.response?.data?.errors ?? {})[0]?.[0]
                || 'Gagal memproses file.';
            setParseError(msg);
        } finally {
            setProcessing(false);
        }
    };

    const handleSaveEdit = (index, updated) => {
        setCandidates((prev) => {
            const next = [...prev];
            const old  = next[index];
            if (old.previewUrl && old.previewUrl !== updated.previewUrl) URL.revokeObjectURL(old.previewUrl);
            next[index] = { ...old, ...updated };
            return next;
        });
        setEditingIndex(null);
    };

    const handleManualPhoto = (index, file) => {
        setCandidates((prev) => {
            const next = [...prev];
            const old  = next[index];
            if (old.previewUrl) URL.revokeObjectURL(old.previewUrl);
            next[index] = { ...old, matchedPhoto: file, previewUrl: URL.createObjectURL(file) };
            return next;
        });
    };

    const handleRemovePhoto = (index) => {
        setCandidates((prev) => {
            const next = [...prev];
            if (next[index].previewUrl) URL.revokeObjectURL(next[index].previewUrl);
            next[index] = { ...next[index], matchedPhoto: null, previewUrl: null };
            return next;
        });
    };

    const handleSaveAll = async () => {
        setSaving(true);
        setSaveProgress(0);

        try {
            // ── Step 1: compress all photos in parallel ──
            const compressedPhotos = await Promise.all(
                candidates.map((c) =>
                    c.matchedPhoto ? compressPhoto(c.matchedPhoto) : Promise.resolve(null)
                )
            );

            // ── Step 2: send candidate data only (no photos) ──
            const fd = new FormData();
            const payload = candidates.map((c) => ({
                name:              c.name,
                nik:               c.nik ?? null,
                photo_number:      c.photo_number ?? null,
                job_level:         c.job_level ?? null,
                department:        c.department ?? null,
                joblevel_id:       c.joblevel_id || null,
                department_id:     c.department_id || null,
                birthplace:        c.birthplace ?? null,
                birthdate:         c.birthdate ?? null,
                first_working_day: c.first_working_day ?? null,
            }));
            fd.append('candidates', JSON.stringify(payload));

            const res = await window.axios.post(route('candidates.bulkAdd.store'), fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    if (e.total) setSaveProgress(Math.min(40, Math.round((e.loaded / e.total) * 40)));
                },
            });

            setSaveProgress(40);

            // ── Step 3: batch-upload photos (10 per request) ──
            const savedIds = res.data.ids ?? []; // array of candidate IDs in order
            const photoItems = compressedPhotos
                .map((blob, i) => ({ candidateId: savedIds[i], blob }))
                .filter(({ candidateId, blob }) => candidateId && blob);

            const BATCH_SIZE = 10;
            const totalBatches = Math.ceil(photoItems.length / BATCH_SIZE);

            for (let b = 0; b < totalBatches; b++) {
                const batch = photoItems.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
                const bfd = new FormData();
                batch.forEach(({ candidateId, blob }, i) => {
                    bfd.append(`ids[${i}]`, candidateId);
                    bfd.append(`photos[${i}]`, blob, `photo_${i}.jpg`);
                });
                await window.axios.post(route('candidates.bulkAdd.storePhotos'), bfd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setSaveProgress(40 + Math.round(((b + 1) / Math.max(totalBatches, 1)) * 59));
            }

            setSaveProgress(100);
            candidates.forEach((c) => { if (c.previewUrl) URL.revokeObjectURL(c.previewUrl); });
            setSuccessMessage(res.data?.message ?? `${candidates.length} kandidat berhasil disimpan.`);
            setStep('upload');
            setCandidates([]);
            setExcelFile(null);
            setPhotoFiles([]);
        } catch (err) {
            const msg = err.response?.data?.message
                || Object.values(err.response?.data?.errors ?? {})[0]?.[0]
                || 'Gagal menyimpan data.';
            alert(msg);
        } finally {
            setSaving(false);
            setSaveProgress(null);
        }
    };

    const matchedCount   = candidates.filter((c) => c.matchedPhoto).length;
    const unmatchedCount = candidates.length - matchedCount;
    const invalidCount   = candidates.filter((c) => !c.joblevel_id || !c.department_id).length;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Bulk Add Kandidat
                </h2>
            }
        >
            <Head title="Bulk Add" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">

                    {(flash?.success || successMessage) && (
                        <div className="rounded-md bg-green-50 p-4 border border-green-200 flex items-center gap-2 text-green-800">
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm font-medium">{successMessage || flash.success}</p>
                        </div>
                    )}

                    {step === 'upload' && (
                        <UploadStep
                            excelFile={excelFile}
                            photoFiles={photoFiles}
                            excelDragOver={excelDragOver}
                            photoDragOver={photoDragOver}
                            processing={processing}
                            parseError={parseError}
                            excelInputRef={excelInputRef}
                            photoInputRef={photoInputRef}
                            onExcelFile={handleExcelFile}
                            onPhotoFiles={handlePhotoFiles}
                            onProcess={handleProcess}
                            setExcelDragOver={setExcelDragOver}
                            setPhotoDragOver={setPhotoDragOver}
                        />
                    )}

                    {step === 'review' && (
                        <ReviewStep
                            candidates={candidates}
                            departments={departments}
                            joblevels={joblevels}
                            editingIndex={editingIndex}
                            saving={saving}
                            saveProgress={saveProgress}
                            matchedCount={matchedCount}
                            unmatchedCount={unmatchedCount}
                            invalidCount={invalidCount}
                            onEdit={setEditingIndex}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={() => setEditingIndex(null)}
                            onManualPhoto={handleManualPhoto}
                            onRemovePhoto={handleRemovePhoto}
                            onSaveAll={handleSaveAll}
                            onBack={() => setStep('upload')}
                        />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// ─── UploadStep ──────────────────────────────────────────────────────────────

function UploadStep({
    excelFile, photoFiles, excelDragOver, photoDragOver,
    processing, parseError, excelInputRef, photoInputRef,
    onExcelFile, onPhotoFiles, onProcess, setExcelDragOver, setPhotoDragOver,
}) {
    const handleExcelDrop = useCallback((e) => {
        e.preventDefault(); setExcelDragOver(false);
        if (e.dataTransfer.files[0]) onExcelFile(e.dataTransfer.files[0]);
    }, [onExcelFile, setExcelDragOver]);

    const handlePhotoDrop = useCallback((e) => {
        e.preventDefault(); setPhotoDragOver(false);
        onPhotoFiles(e.dataTransfer.files);
    }, [onPhotoFiles, setPhotoDragOver]);

    return (
        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
            <div className="p-6 space-y-6">
                <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Langkah 1: Upload File</h3>
                    <p className="text-sm text-gray-500">
                        Upload file Excel berisi data kandidat, lalu upload foto-foto kandidat.
                        Foto dicocokkan berdasarkan kolom <code className="bg-gray-100 px-1 rounded">photo_number</code> dengan nama file foto (tanpa ekstensi).
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Excel drop zone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FileSpreadsheet className="inline h-4 w-4 mr-1 text-green-600" />
                            File Excel Kandidat <span className="text-red-500">*</span>
                        </label>
                        <div
                            onDrop={handleExcelDrop}
                            onDragOver={(e) => { e.preventDefault(); setExcelDragOver(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setExcelDragOver(false); }}
                            onClick={() => excelInputRef.current?.click()}
                            className={`cursor-pointer border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                excelDragOver
                                    ? 'border-indigo-400 bg-indigo-50'
                                    : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                            }`}
                        >
                            {excelFile ? (
                                <div className="flex flex-col items-center gap-2">
                                    <FileSpreadsheet className="h-10 w-10 text-green-600" />
                                    <p className="text-sm font-medium text-gray-900">{excelFile.name}</p>
                                    <p className="text-xs text-gray-400">{(excelFile.size / 1024).toFixed(1)} KB — klik untuk ganti</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                    <Upload className="h-10 w-10" />
                                    <p className="text-sm">Drag & drop atau klik untuk upload</p>
                                    <p className="text-xs">.xlsx, .xls, .csv</p>
                                </div>
                            )}
                        </div>
                        <input ref={excelInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                            onChange={(e) => e.target.files[0] && onExcelFile(e.target.files[0])} />
                    </div>

                    {/* Photo drop zone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Image className="inline h-4 w-4 mr-1 text-blue-600" />
                            Foto-foto Kandidat (opsional, banyak file)
                        </label>
                        <div
                            onDrop={handlePhotoDrop}
                            onDragOver={(e) => { e.preventDefault(); setPhotoDragOver(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setPhotoDragOver(false); }}
                            onClick={() => photoInputRef.current?.click()}
                            className={`cursor-pointer border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                photoDragOver
                                    ? 'border-blue-400 bg-blue-50'
                                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                            }`}
                        >
                            {photoFiles.length > 0 ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Image className="h-10 w-10 text-blue-600" />
                                    <p className="text-sm font-medium text-gray-900">{photoFiles.length} foto dipilih</p>
                                    <p className="text-xs text-gray-400 break-all">
                                        {photoFiles.slice(0, 3).map((f) => f.name).join(', ')}
                                        {photoFiles.length > 3 ? ` +${photoFiles.length - 3} lainnya` : ''}
                                    </p>
                                    <p className="text-xs text-indigo-500">Klik untuk ganti</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                    <Upload className="h-10 w-10" />
                                    <p className="text-sm">Drag & drop atau klik untuk upload</p>
                                    <p className="text-xs">JPG, PNG, dll — nama file = nomor foto</p>
                                </div>
                            )}
                        </div>
                        <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden"
                            onChange={(e) => onPhotoFiles(e.target.files)} />
                    </div>
                </div>

                {/* Info box */}
                <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
                    <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800 space-y-2">
                            <p className="font-medium">Cara pencocokan foto otomatis:</p>
                            <ul className="list-disc list-inside text-blue-700 space-y-1">
                                <li>
                                    Foto harus diambil menggunakan kamera <span className="font-semibold">Sony ZV-E10</span>.
                                    Kamera ini menghasilkan nama file dengan format{' '}
                                    <code className="bg-blue-100 px-1 rounded">DSC00001.JPG</code>,{' '}
                                    <code className="bg-blue-100 px-1 rounded">DSC00002.JPG</code>, dst.
                                </li>
                                <li>
                                    Sistem akan mengekstrak angka di akhir nama file — contoh:{' '}
                                    <code className="bg-blue-100 px-1 rounded">DSC00042.JPG</code> → angka{' '}
                                    <code className="bg-blue-100 px-1 rounded">42</code> — lalu dicocokkan dengan kolom{' '}
                                    <code className="bg-blue-100 px-1 rounded">photo_number</code> di Excel.
                                </li>
                                <li>
                                    Pastikan nilai <code className="bg-blue-100 px-1 rounded">photo_number</code> di Excel sesuai dengan urutan nomor foto dari kamera.
                                </li>
                                <li>Jika tidak cocok otomatis, Anda bisa mencocokkan secara manual di langkah berikutnya.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {parseError && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-4 flex gap-2 text-red-800">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm">{parseError}</p>
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        onClick={onProcess}
                        disabled={!excelFile || processing}
                        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? (
                            <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />Memproses...</>
                        ) : (
                            <><Check className="h-4 w-4" />Proses & Preview</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── ReviewStep ──────────────────────────────────────────────────────────────

function ReviewStep({
    candidates, departments, joblevels, editingIndex, saving, saveProgress,
    matchedCount, unmatchedCount, invalidCount,
    onEdit, onSaveEdit, onCancelEdit, onManualPhoto, onRemovePhoto, onSaveAll, onBack,
}) {
    const hasInvalid = invalidCount > 0;
    return (
        <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-medium">Total Kandidat</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{candidates.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg shadow-sm p-4 border border-green-200">
                    <p className="text-xs text-green-600 uppercase font-medium">Foto Cocok</p>
                    <p className="text-3xl font-bold text-green-800 mt-1">{matchedCount}</p>
                </div>
                <div className={`rounded-lg shadow-sm p-4 border ${unmatchedCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs uppercase font-medium ${unmatchedCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>Belum Ada Foto</p>
                    <p className={`text-3xl font-bold mt-1 ${unmatchedCount > 0 ? 'text-amber-800' : 'text-gray-300'}`}>{unmatchedCount}</p>
                </div>
                <div className={`rounded-lg shadow-sm p-4 border ${hasInvalid ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs uppercase font-medium ${hasInvalid ? 'text-red-600' : 'text-gray-400'}`}>Data Tidak Sesuai</p>
                    <p className={`text-3xl font-bold mt-1 ${hasInvalid ? 'text-red-700' : 'text-gray-300'}`}>{invalidCount}</p>
                </div>
            </div>

            {/* Invalid warning banner */}
            {hasInvalid && (
                <div className="rounded-md bg-red-50 border border-red-300 p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800">
                        <p className="font-semibold">Terdapat {invalidCount} data yang tidak sesuai</p>
                        <p className="mt-0.5">Job Level atau Departemen pada baris yang ditandai merah tidak ditemukan di database. Silakan edit baris tersebut dan pilih nilai yang sesuai sebelum menyimpan.</p>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">Review Data Kandidat</h3>
                    <p className="text-xs text-gray-400">Kandidat tanpa foto tetap bisa disimpan</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {['#','Nama','No. Foto','Job Level','Departemen','T. Lahir','Tgl. Lahir','Hari Pertama','Foto','Status','Aksi'].map((h) => (
                                    <th key={h} className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {candidates.map((c, i) =>
                                editingIndex === i ? (
                                    <EditableRow
                                        key={i}
                                        index={i}
                                        candidate={c}
                                        departments={departments}
                                        joblevels={joblevels}
                                        onSave={(data) => onSaveEdit(i, data)}
                                        onCancel={onCancelEdit}
                                    />
                                ) : (
                                    <ReadOnlyRow
                                        key={i}
                                        index={i}
                                        candidate={c}
                                        departments={departments}
                                        joblevels={joblevels}
                                        onEdit={() => onEdit(i)}
                                        onManualPhoto={(file) => onManualPhoto(i, file)}
                                        onRemovePhoto={() => onRemovePhoto(i)}
                                    />
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="h-4 w-4" /> Kembali ke Upload
                </button>

                <div className="flex flex-col items-end gap-2">
                    {saveProgress !== null && (
                        <div className="w-72">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>
                                    {saveProgress < 100 ? 'Mengupload data & foto...' : 'Memproses di server...'}
                                </span>
                                <span className="font-semibold tabular-nums">{saveProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${saveProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                    <button
                        onClick={onSaveAll}
                        disabled={saving || candidates.length === 0 || hasInvalid}
                        title={hasInvalid ? 'Perbaiki data yang tidak sesuai terlebih dahulu' : undefined}
                        className="inline-flex items-center gap-2 rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />Menyimpan...</>
                        ) : (
                            <><Save className="h-4 w-4" />Simpan {candidates.length} Kandidat</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── ReadOnlyRow ─────────────────────────────────────────────────────────────

function ReadOnlyRow({ index, candidate, departments, joblevels, onEdit, onManualPhoto, onRemovePhoto }) {
    const fileRef      = useRef(null);
    const isMatched    = !!candidate.matchedPhoto;
    const joblevelOk   = !!candidate.joblevel_id;
    const departmentOk = !!candidate.department_id;
    const isInvalid    = !joblevelOk || !departmentOk;

    let rowBg = 'hover:bg-gray-50';
    if (isInvalid)      rowBg = 'bg-red-50 hover:bg-red-100';
    else if (isMatched) rowBg = 'bg-green-50 hover:bg-green-100';
    else                rowBg = 'bg-amber-50 hover:bg-amber-100';

    return (
        <tr className={rowBg}>
            <td className="whitespace-nowrap px-3 py-2 text-gray-500">{index + 1}</td>
            <td className="px-3 py-2 font-medium text-gray-900 max-w-[160px] truncate">{candidate.name || '-'}</td>
            <td className="whitespace-nowrap px-3 py-2 text-gray-500">{candidate.photo_number || '-'}</td>
            <td className="whitespace-nowrap px-3 py-2">
                {joblevelOk ? (
                    <span className="text-gray-500">{joblevels.find((j) => String(j.id) === String(candidate.joblevel_id))?.name}</span>
                ) : (
                    <div className="space-y-0.5">
                        <span className="text-gray-400 line-through text-xs">{candidate.job_level || '-'}</span>
                        <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                            <X className="h-3 w-3" /> Tidak Sesuai
                        </span>
                    </div>
                )}
            </td>
            <td className="whitespace-nowrap px-3 py-2">
                {departmentOk ? (
                    <span className="text-gray-500">{departments.find((d) => String(d.id) === String(candidate.department_id))?.name}</span>
                ) : (
                    <div className="space-y-0.5">
                        <span className="text-gray-400 line-through text-xs">{candidate.department || '-'}</span>
                        <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                            <X className="h-3 w-3" /> Tidak Sesuai
                        </span>
                    </div>
                )}
            </td>
            <td className="whitespace-nowrap px-3 py-2 text-gray-500">{candidate.birthplace || '-'}</td>
            <td className="whitespace-nowrap px-3 py-2 text-gray-500">{candidate.birthdate || '-'}</td>
            <td className="whitespace-nowrap px-3 py-2 text-gray-500">{candidate.first_working_day || '-'}</td>

            {/* Photo cell */}
            <td className="px-3 py-2">
                {isMatched ? (
                    <div className="relative group w-10 h-10">
                        <img src={candidate.previewUrl} alt="foto" className="h-10 w-10 rounded object-cover border border-green-300" />
                        <button
                            onClick={onRemovePhoto}
                            className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow"
                            title="Hapus foto"
                        >
                            <X className="h-2.5 w-2.5" />
                        </button>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={() => fileRef.current?.click()}
                            className="inline-flex items-center gap-1 rounded border border-dashed border-gray-400 px-2 py-1 text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
                        >
                            <FileImage className="h-3 w-3" /> Pilih Foto
                        </button>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden"
                            onChange={(e) => e.target.files[0] && onManualPhoto(e.target.files[0])} />
                    </>
                )}
            </td>

            {/* Status cell */}
            <td className="whitespace-nowrap px-3 py-2">
                {isMatched ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <CheckCircle2 className="h-3 w-3" /> Cocok
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        <AlertCircle className="h-3 w-3" /> Belum Ada Foto
                    </span>
                )}
            </td>

            {/* Action cell */}
            <td className="whitespace-nowrap px-3 py-2">
                <button
                    onClick={onEdit}
                    className="inline-flex items-center rounded-md bg-amber-500 p-1.5 text-white hover:bg-amber-600"
                    title="Edit"
                >
                    <Pencil className="h-4 w-4" />
                </button>
            </td>
        </tr>
    );
}

// ─── EditableRow ─────────────────────────────────────────────────────────────

function EditableRow({ index, candidate, departments, joblevels, onSave, onCancel }) {
    const [form, setForm] = useState({
        name:             candidate.name ?? '',
        photo_number:     candidate.photo_number ?? '',
        joblevel_id:      candidate.joblevel_id ?? '',
        job_level:        candidate.job_level ?? '',
        department_id:    candidate.department_id ?? '',
        department:       candidate.department ?? '',
        birthplace:       candidate.birthplace ?? '',
        birthdate:        candidate.birthdate ?? '',
        first_working_day: candidate.first_working_day ?? '',
    });
    const [localPreview, setLocalPreview] = useState(candidate.previewUrl ?? null);
    const [localPhoto, setLocalPhoto]     = useState(candidate.matchedPhoto ?? null);
    const fileRef = useRef(null);

    const set = (field) => (val) => setForm((p) => ({ ...p, [field]: val }));

    const handlePhotoChange = (file) => {
        if (!file) return;
        if (localPreview && localPreview !== candidate.previewUrl) URL.revokeObjectURL(localPreview);
        setLocalPreview(URL.createObjectURL(file));
        setLocalPhoto(file);
    };

    const handleSave = () => {
        onSave({
            ...form,
            matchedPhoto: localPhoto,
            previewUrl:   localPreview,
        });
    };

    return (
        <tr className="bg-indigo-50">
            <td className="whitespace-nowrap px-3 py-2 text-gray-500">{index + 1}</td>
            <td className="px-3 py-2 min-w-[140px]">
                <InlineInput value={form.name} onChange={set('name')} placeholder="Nama" />
            </td>
            <td className="px-3 py-2 min-w-[90px]">
                <InlineInput value={form.photo_number} onChange={set('photo_number')} placeholder="No. Foto" />
            </td>
            <td className="px-3 py-2 min-w-[140px]">
                <InlineSelect
                    value={form.joblevel_id}
                    onChange={(v) => setForm((p) => ({ ...p, joblevel_id: v, job_level: joblevels.find((j) => String(j.id) === String(v))?.name ?? p.job_level }))}
                    options={joblevels}
                    placeholder="Job Level"
                />
            </td>
            <td className="px-3 py-2 min-w-[140px]">
                <InlineSelect
                    value={form.department_id}
                    onChange={(v) => setForm((p) => ({ ...p, department_id: v, department: departments.find((d) => String(d.id) === String(v))?.name ?? p.department }))}
                    options={departments}
                    placeholder="Departemen"
                />
            </td>
            <td className="px-3 py-2 min-w-[130px]">
                <InlineInput value={form.birthplace} onChange={set('birthplace')} placeholder="Tempat Lahir" />
            </td>
            <td className="px-3 py-2 min-w-[140px]">
                <InlineInput type="date" value={form.birthdate} onChange={set('birthdate')} />
            </td>
            <td className="px-3 py-2 min-w-[140px]">
                <InlineInput type="date" value={form.first_working_day} onChange={set('first_working_day')} />
            </td>

            {/* Photo cell */}
            <td className="px-3 py-2">
                {localPreview ? (
                    <div
                        className="relative group w-10 h-10 cursor-pointer"
                        onClick={() => fileRef.current?.click()}
                        title="Klik untuk ganti foto"
                    >
                        <img src={localPreview} alt="foto" className="h-10 w-10 rounded object-cover border" />
                        <div className="absolute inset-0 hidden group-hover:flex items-center justify-center rounded bg-black/40 text-white text-xs font-medium">Ganti</div>
                    </div>
                ) : (
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="inline-flex items-center gap-1 rounded border border-dashed border-gray-400 px-2 py-1 text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
                    >
                        <FileImage className="h-3 w-3" /> Pilih Foto
                    </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files[0] && handlePhotoChange(e.target.files[0])} />
            </td>

            {/* Status cell */}
            <td className="whitespace-nowrap px-3 py-2">
                {localPhoto ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <CheckCircle2 className="h-3 w-3" /> Cocok
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        <AlertCircle className="h-3 w-3" /> Belum Ada Foto
                    </span>
                )}
            </td>

            {/* Action cell */}
            <td className="whitespace-nowrap px-3 py-2">
                <div className="flex gap-1">
                    <button onClick={handleSave} className="inline-flex items-center rounded-md bg-green-600 p-1.5 text-white hover:bg-green-700" title="Simpan">
                        <Check className="h-4 w-4" />
                    </button>
                    <button onClick={onCancel} className="inline-flex items-center rounded-md bg-gray-400 p-1.5 text-white hover:bg-gray-500" title="Batal">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

