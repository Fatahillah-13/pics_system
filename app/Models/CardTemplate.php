<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CardTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'ctpat',
        'description',
        'template_path',
    ];

    protected $casts = [
        'ctpat' => 'boolean',
    ];

    public function joblevels(): BelongsToMany
    {
        return $this->belongsToMany(Joblevel::class, 'card_template_joblevel');
    }

    public function departments(): BelongsToMany
    {
        return $this->belongsToMany(Department::class, 'card_template_department');
    }

    public static function findForCandidate($joblevelId, $departmentId, $ctpat = null)
    {
        $base = static::query()
            ->when($ctpat !== null, fn ($q) => $q->where('ctpat', $ctpat));

        // Tier 1: department AND joblevel both match (paling spesifik)
        if ($joblevelId && $departmentId) {
            $template = (clone $base)
                ->whereHas('joblevels', fn ($q) => $q->where('joblevel_id', $joblevelId))
                ->whereHas('departments', fn ($q) => $q->where('department_id', $departmentId))
                ->first();
            if ($template) return $template;
        }

        // Tier 2: department match saja (department lebih spesifik dari joblevel)
        if ($departmentId) {
            $template = (clone $base)
                ->whereHas('departments', fn ($q) => $q->where('department_id', $departmentId))
                ->first();
            if ($template) return $template;
        }

        // Tier 3: joblevel match saja
        if ($joblevelId) {
            $template = (clone $base)
                ->whereHas('joblevels', fn ($q) => $q->where('joblevel_id', $joblevelId))
                ->first();
            if ($template) return $template;
        }

        return null;
    }
}
