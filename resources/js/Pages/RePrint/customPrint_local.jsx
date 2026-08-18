import { useState } from "react";
import {
    AlertCircle,
    Briefcase,
    Building2,
    ImageIcon,
    ImageOff,
    Loader2,
    Search,
    Settings2,
    User,
} from "lucide-react";

const EMPLOYEE_API = "http://10.10.100.193:1002/api.employees.v1/employees";

export function EmployeeSearchForm({ onEmployeeFound, isPrinting }) {
    const [nik, setNik] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        if (!nik.trim()) {
            setError("NIK tidak boleh kosong");
            return;
        }

        setIsSearching(true);
        setError(null);
        try {
            const employeeResponse = await fetch(`${EMPLOYEE_API}/?search=${encodeURIComponent(nik.trim())}`);
            const employeeJson = await employeeResponse.json();
            const employees = employeeJson.data ?? [];
            const employee = employees.find((item) => {
                const apiNik = String(item.number_of_employees ?? "").trim();
                return apiNik === nik.trim() || apiNik.replace(/^0+/, "") === nik.trim().replace(/^0+/, "");
            }) ?? (employees.length === 1 ? employees[0] : null);

            if (!employee) {
                setError("Karyawan tidak ditemukan");
                return;
            }

            const photoResponse = await fetch(`${route("candidates.reprintIdCard.customLookup")}?nik=${encodeURIComponent(nik.trim())}`);
            const photoJson = photoResponse.ok ? await photoResponse.json() : {};
            onEmployeeFound({
                name: employee.name || "",
                department: employee.department || "",
                job_level: employee.job_level || "",
                employee_id: employee.number_of_employees || nik.trim(),
                has_photo: photoJson.has_photo ?? false,
                photo_source: photoJson.photo_source ?? null,
            });
            setNik("");
            setError(null);
        } catch {
            setError("Gagal menghubungi server");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="bg-white shadow-sm rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Cari Karyawan (NIK)</h3>
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input type="text" value={nik} onChange={(event) => setNik(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleSearch()} placeholder="Masukkan NIK karyawan..." disabled={isPrinting || isSearching} className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" />
                </div>
                <button onClick={handleSearch} disabled={isPrinting || isSearching || !nik.trim()} className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                    {isSearching ? <><Loader2 className="h-4 w-4 animate-spin" />Mencari...</> : <><Search className="h-4 w-4" />Cari</>}
                </button>
            </div>
            {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
        </div>
    );
}

export function CustomOptionsPanel({ options, setOptions, templates, isLoadingTemplates }) {
    return (
        <div className="bg-white shadow-sm rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-gray-600" /><h3 className="text-sm font-semibold text-gray-700">Custom Options</h3></div>
            <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={options.bypass_format} onChange={(event) => setOptions({ ...options, bypass_format: event.target.checked })} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <div><span className="text-sm font-medium text-gray-700">Use Full Name</span><p className="text-xs text-gray-500">Tampilkan nama lengkap tanpa singkatan</p></div>
            </label>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Card Template</label>
                {isLoadingTemplates ? <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Loading templates...</div> : <select value={options.custom_template || ""} onChange={(event) => setOptions({ ...options, custom_template: event.target.value || null })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Auto (berdasarkan dept/joblevel)</option>{templates.map((template) => <option key={template.value} value={template.value}>{template.label} {template.ctpat ? "(C-TPAT)" : ""}</option>)}</select>}
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Name Position Offset Y: {options.name_offset_y}px</label>
                <input type="range" min="-20" max="20" value={options.name_offset_y} onChange={(event) => setOptions({ ...options, name_offset_y: parseInt(event.target.value) })} className="w-full accent-indigo-600" />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>-20px</span><span>0px</span><span>+20px</span></div>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Font Size: {options.custom_font_size || "Default"}</label>
                <input type="range" min="12" max="28" value={options.custom_font_size || 20} onChange={(event) => setOptions({ ...options, custom_font_size: parseInt(event.target.value) })} className="w-full accent-indigo-600" />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>12px</span><span>20px</span><span>28px</span></div>
            </div>
            <button onClick={() => setOptions({ bypass_format: false, custom_template: null, name_offset_y: 0, custom_font_size: null })} className="w-full px-3 py-2 text-xs text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Reset ke Default</button>
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
