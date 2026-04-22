<?php

namespace App\Http\Controllers\SettingsController;

use App\Http\Controllers\Controller;
use App\Models\CardTemplate;
use App\Models\Department;
use App\Models\Joblevel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class IdCardTemplateController extends Controller
{
    public function view()
    {
        return Inertia::render('Settings/IdCardTemplate', [
            'templates'   => CardTemplate::with(['joblevels', 'departments'])->latest()->get(),
            'departments' => Department::all(),
            'joblevels'   => Joblevel::all(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'           => 'required|string|max:255',
            'ctpat'          => 'required|integer',
            'description'    => 'nullable|string',
            'template_image' => 'required|image|mimes:jpg,jpeg,png|max:5120',
            'joblevel_ids'   => 'nullable|array',
            'joblevel_ids.*' => 'exists:joblevels,id',
            'department_ids'   => 'nullable|array',
            'department_ids.*' => 'exists:departments,id',
        ]);

        $path = $request->file('template_image')->store('card_templates', 'public');

        $template = CardTemplate::create([
            'name'          => $request->name,
            'ctpat'         => $request->ctpat,
            'description'   => $request->description,
            'template_path' => $path,
        ]);

        $template->joblevels()->sync($request->joblevel_ids ?? []);
        $template->departments()->sync($request->department_ids ?? []);

        return back()->with('success', 'Template berhasil ditambahkan.');
    }

    public function update(Request $request, CardTemplate $cardTemplate)
    {
        $request->validate([
            'name'           => 'required|string|max:255',
            'ctpat'          => 'required|integer',
            'description'    => 'nullable|string',
            'template_image' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'joblevel_ids'   => 'nullable|array',
            'joblevel_ids.*' => 'exists:joblevels,id',
            'department_ids'   => 'nullable|array',
            'department_ids.*' => 'exists:departments,id',
        ]);

        $data = [
            'name'        => $request->name,
            'ctpat'       => $request->ctpat,
            'description' => $request->description,
        ];

        if ($request->hasFile('template_image')) {
            Storage::disk('public')->delete($cardTemplate->template_path);
            $data['template_path'] = $request->file('template_image')->store('card_templates', 'public');
        }

        $cardTemplate->update($data);
        $cardTemplate->joblevels()->sync($request->joblevel_ids ?? []);
        $cardTemplate->departments()->sync($request->department_ids ?? []);

        return back()->with('success', 'Template berhasil diperbarui.');
    }

    public function destroy(CardTemplate $cardTemplate)
    {
        Storage::disk('public')->delete($cardTemplate->template_path);
        $cardTemplate->delete();

        return back()->with('success', 'Template berhasil dihapus.');
    }
}
