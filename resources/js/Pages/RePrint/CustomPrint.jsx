import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Download, FileText, Globe2, Loader2, Printer, Wand2 } from "lucide-react";
import CustomPrintKorea from "./customPrint_korea";
import { EmployeeCard, EmployeeSearchForm } from "./customPrint_local";

const PRESETS = {
    korean: { label: "🇰🇷 Korean Employee", description: "Input manual untuk karyawan Korea", icon: Globe2, color: "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700" },
    "long-name": { label: "📝 Nama Panjang Indonesia", description: "Untuk nama 2 kata yang terlalu panjang", icon: FileText, color: "bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700" },
};

function PresetButton({ preset, selectedPreset, onClick }) {
    const config = PRESETS[preset];
    const Icon = config.icon;
    const isSelected = selectedPreset === preset;
    return (
        <button onClick={() => onClick(preset)} className={`flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-all ${isSelected ? "border-indigo-500 bg-indigo-50 shadow-md" : config.color}`}>
            <div className="flex items-center gap-2 w-full"><Icon className={`h-5 w-5 ${isSelected ? "text-indigo-600" : ""}`} /><span className={`font-semibold text-sm ${isSelected ? "text-indigo-700" : ""}`}>{config.label}</span></div>
            <p className={`text-xs ${isSelected ? "text-indigo-600" : "text-gray-500"}`}>{config.description}</p>
        </button>
    );
}

export default function CustomPrint({ serviceStatus, departments = [], joblevels = [] }) {
    const { flash } = usePage().props;
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        fetch(route("candidates.reprintIdCard.getTemplates"))
            .then((response) => response.json())
            .then((data) => { setTemplates(data); setIsLoadingTemplates(false); })
            .catch(() => setIsLoadingTemplates(false));
    }, []);

    const handlePresetClick = (preset) => {
        setSelectedPreset(preset);
    };

    const addEmployee = (employee) => {
        if (employees.length >= 10) {
            alert("Maksimal 10 karyawan per cetak");
            return;
        }
        setEmployees((currentEmployees) => [...currentEmployees, employee]);
    };

    const handlePrint = () => {
        if (employees.length === 0 || isPrinting) return;
        setIsPrinting(true);
        const pdfWindow = window.open("", "_blank");
        const cards = employees.map((employee) => {
            const card = { ...employee };
            if (card.photo_preview?.startsWith("data:")) card.photo_base64 = card.photo_preview.split(",")[1];
            delete card.photo_file;
            delete card.photo_preview;
            delete card.photo_source;
            return card;
        });

        router.post(route("candidates.reprintIdCard.storeCustom"), { cards, options: { preset: selectedPreset } }, {
            preserveScroll: true,
            onSuccess: (page) => {
                const url = page.props.flash?.pdf_url;
                if (url && pdfWindow) pdfWindow.location.href = url;
                else pdfWindow?.close();
            },
            onError: () => pdfWindow?.close(),
            onFinish: () => setIsPrinting(false),
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Custom Reprint ID Card</h2>}>
            <Head title="Custom Print" />
            <div className="py-6"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
                {serviceStatus === false && <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800"><AlertCircle className="h-4 w-4 shrink-0" />Service cetak ID Card sedang tidak tersedia. Pastikan Python service sudah berjalan.</div>}
                {flash?.success && <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 shrink-0" /><div className="flex-1">{flash.success}</div>{flash.pdf_url && <a href={flash.pdf_url} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700"><Download className="h-3.5 w-3.5" />Buka PDF</a>}</div></div>}
                {flash?.error && <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{flash.error}</div>}
                <div className="bg-white shadow-sm rounded-lg p-6 space-y-4"><div className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-indigo-600" /><h3 className="text-base font-semibold text-gray-800">Pilih Preset Template</h3></div><p className="text-sm text-gray-600">Pilih preset yang sesuai dengan kebutuhan cetak ID Card Anda.</p><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.keys(PRESETS).map((preset) => <PresetButton key={preset} preset={preset} selectedPreset={selectedPreset} onClick={handlePresetClick} />)}</div></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-6">{selectedPreset === "korean" ? <CustomPrintKorea onEmployeeAdded={addEmployee} isPrinting={isPrinting} templates={templates} isLoadingTemplates={isLoadingTemplates} /> : <EmployeeSearchForm onEmployeeFound={addEmployee} isPrinting={isPrinting} templates={templates} isLoadingTemplates={isLoadingTemplates} departments={departments} joblevels={joblevels} />}</div><div className="lg:col-span-1"><div className="bg-white shadow-sm rounded-lg p-4 sticky top-6 space-y-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-gray-700">Daftar Karyawan</h3><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600">{employees.length}/10</span></div>{employees.length === 0 ? <p className="text-xs text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-md">Belum ada karyawan</p> : <div className="space-y-2 max-h-96 overflow-y-auto">{employees.map((employee, index) => <EmployeeCard key={`${employee.employee_id}-${index}`} employee={employee} onRemove={() => setEmployees((currentEmployees) => currentEmployees.filter((_, employeeIndex) => employeeIndex !== index))} />)}</div>}<button onClick={handlePrint} disabled={employees.length === 0 || isPrinting || serviceStatus === false} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{isPrinting ? <><Loader2 className="h-4 w-4 animate-spin" />Mencetak...</> : <><Printer className="h-4 w-4" />Cetak ({employees.length})</>}</button></div></div></div>
            </div></div>
        </AuthenticatedLayout>
    );
}
