import { useEffect, useRef, useState } from "react";
import {
    AlertCircle,
    Briefcase,
    Building2,
    Camera,
    ImageIcon,
    ImageOff,
    Loader2,
    User,
    X,
} from "lucide-react";

function SearchableSelect({ label, placeholder, value, options, onChange, disabled }) {
    const [query, setQuery] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!containerRef.current?.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const filteredOptions = options.filter((option) => option.name.toLowerCase().includes(query.toLowerCase()));

    const handleChange = (event) => {
        setQuery(event.target.value);
        onChange(event.target.value);
        setIsOpen(true);
    };

    const handleSelect = (option) => {
        setQuery(option.name);
        onChange(option.name);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
            <input
                type="search"
                value={query}
                onChange={handleChange}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete="off"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            {isOpen && !disabled && (
                <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                    {filteredOptions.length > 0 ? filteredOptions.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelect(option)}
                            className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                            {option.name}
                        </button>
                    )) : <p className="px-3 py-2 text-sm text-gray-400">Data tidak ditemukan</p>}
                </div>
            )}
        </div>
    );
}

export function EmployeeSearchForm({ onEmployeeFound, isPrinting, templates, isLoadingTemplates, departments = [], joblevels = [] }) {
    const [formData, setFormData] = useState({ name: "", department: "", nik: "", jobLevel: "", template: "" });
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handlePhotoChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
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
    };

    const handleSubmit = () => {
        if (!formData.name.trim()) return setError("Nama tidak boleh kosong");
        if (!formData.nik.trim()) return setError("NIK tidak boleh kosong");
        if (!formData.department) return setError("Pilih departemen terlebih dahulu");
        if (!formData.jobLevel) return setError("Pilih job level terlebih dahulu");
        if (!formData.template) return setError("Pilih template terlebih dahulu");

        onEmployeeFound({
            name: formData.name.trim(),
            department: formData.department.trim(),
            job_level: formData.jobLevel,
            employee_id: formData.nik.trim(),
            has_photo: !!photo,
            photo_source: photo ? "manual_upload" : null,
            photo_file: photo,
            photo_preview: photoPreview,
            custom_template: formData.template,
        });
        setFormData({ name: "", department: "", nik: "", jobLevel: "", template: "" });
        setPhoto(null);
        setPhotoPreview(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="bg-white shadow-sm rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Input Manual Karyawan Indonesia</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Foto Karyawan</label>
                    {photoPreview ? <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-50"><img src={photoPreview} alt="Preview" className="w-full h-full object-cover" /><button onClick={() => { setPhoto(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full"><X className="h-4 w-4" /></button></div> : <label className="block aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"><input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} disabled={isPrinting} className="hidden" /><div className="h-full flex flex-col items-center justify-center gap-2 p-4"><Camera className="h-12 w-12 text-gray-400" /><p className="text-xs text-gray-500 text-center">Klik untuk upload foto</p><p className="text-[10px] text-gray-400 text-center">JPG, PNG (Max 5MB)</p></div></label>}
                </div>
                <div className="md:col-span-2 space-y-3">
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">NIK *</label><input type="text" value={formData.nik} onChange={(event) => setFormData({ ...formData, nik: event.target.value })} placeholder="Masukkan NIK karyawan" disabled={isPrinting} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" /></div>
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Nama Lengkap *</label><input type="text" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} placeholder="Contoh: Budi Santoso" disabled={isPrinting} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" /></div>
                    <SearchableSelect label="Departemen *" placeholder="Cari departemen..." value={formData.department} options={departments} onChange={(department) => setFormData({ ...formData, department })} disabled={isPrinting} />
                    <SearchableSelect label="Job Level *" placeholder="Cari job level..." value={formData.jobLevel} options={joblevels} onChange={(jobLevel) => setFormData({ ...formData, jobLevel })} disabled={isPrinting} />
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Card Template *</label>{isLoadingTemplates ? <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Loading templates...</div> : <select value={formData.template} onChange={(event) => setFormData({ ...formData, template: event.target.value })} disabled={isPrinting} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"><option value="">Pilih template...</option>{templates.map((template) => <option key={template.value} value={template.value}>{template.label} {template.ctpat ? "(C-TPAT)" : ""}</option>)}</select>}</div>
                    <button onClick={handleSubmit} disabled={isPrinting} className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"><User className="h-4 w-4" />Tambah ke Daftar</button>
                </div>
            </div>
            {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
        </div>
    );
}

export function EmployeeCard({ employee, onRemove }) {
    return (
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center">{employee.photo_preview ? <img src={employee.photo_preview} alt={employee.name} className="w-full h-full object-cover" /> : <User className="h-5 w-5 text-indigo-600" />}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{employee.name}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-1"><span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{employee.department || "N/A"}</span>{employee.job_level && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{employee.job_level}</span>}<span className="font-mono">{employee.employee_id}</span></div>
                <div className="flex items-center gap-2 mt-1">{employee.has_photo ? <span className="flex items-center gap-1 text-xs text-green-600"><ImageIcon className="h-3 w-3" />Foto tersedia</span> : <span className="flex items-center gap-1 text-xs text-yellow-600"><ImageOff className="h-3 w-3" />Tanpa foto</span>}{employee.custom_template && <span className="text-xs text-indigo-600 font-medium">• Custom template</span>}</div>
            </div>
            <button onClick={onRemove} className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"><AlertCircle className="h-4 w-4" /></button>
        </div>
    );
}
