import { useRef, useState } from "react";
import {
    Camera,
    Loader2,
    User,
    X,
} from "lucide-react";

export default function CustomPrintKorea({
    onEmployeeAdded,
    isPrinting,
    templates,
    isLoadingTemplates,
}) {
    const [formData, setFormData] = useState({
        name: "",
        department: "",
        template: "",
    });
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handlePhotoChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                setError("File harus berupa gambar (JPG, PNG, dll)");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError("Ukuran file maksimal 5MB");
                return;
            }

            setPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result);
            reader.readAsDataURL(file);
            setError(null);
        }
    };

    const handleRemovePhoto = () => {
        setPhoto(null);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = () => {
        if (!formData.name.trim()) {
            setError("Nama tidak boleh kosong");
            return;
        }
        if (!formData.template) {
            setError("Pilih template terlebih dahulu");
            return;
        }

        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0");

        onEmployeeAdded({
            name: formData.name,
            department: formData.department || "",
            job_level: "",
            employee_id: `KR-${timestamp}-${randomNum}`,
            has_photo: !!photo,
            photo_source: photo ? "manual_upload" : null,
            photo_file: photo,
            photo_preview: photoPreview,
            custom_template: formData.template,
        });

        setFormData({ name: "", department: "", template: "" });
        setPhoto(null);
        setPhotoPreview(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="bg-white shadow-sm rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">
                Input Manual Karyawan Korea
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                        Foto Karyawan
                    </label>
                    {photoPreview ? (
                        <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-50">
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                            <button onClick={handleRemovePhoto} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <label className="block aspect-[3/4] w-full border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} disabled={isPrinting} className="hidden" />
                            <div className="h-full flex flex-col items-center justify-center gap-2 p-4">
                                <Camera className="h-12 w-12 text-gray-400" />
                                <p className="text-xs text-gray-500 text-center">Klik untuk upload foto</p>
                                <p className="text-[10px] text-gray-400 text-center">JPG, PNG (Max 5MB)</p>
                            </div>
                        </label>
                    )}
                </div>

                <div className="md:col-span-2 space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                        <input type="text" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} placeholder="Contoh: Kim Soo Hyun" disabled={isPrinting} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Departemen</label>
                        <input type="text" value={formData.department} onChange={(event) => setFormData({ ...formData, department: event.target.value })} placeholder="Contoh: PRODUCTION" disabled={isPrinting} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Card Template *</label>
                        {isLoadingTemplates ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Loading templates...</div>
                        ) : (
                            <select value={formData.template} onChange={(event) => setFormData({ ...formData, template: event.target.value })} disabled={isPrinting} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                                <option value="">Pilih template...</option>
                                {templates.map((template) => <option key={template.value} value={template.value}>{template.label} {template.ctpat ? "(C-TPAT)" : ""}</option>)}
                            </select>
                        )}
                    </div>
                    <button onClick={handleSubmit} disabled={isPrinting} className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                        <User className="h-4 w-4" />Tambah ke Daftar
                    </button>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>
            </div>
        </div>
    );
}
