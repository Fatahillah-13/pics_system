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
        return static::query()
            ->when($ctpat !== null, fn ($q) => $q->where('ctpat', $ctpat))
            ->where(function ($query) use ($joblevelId, $departmentId) {
                $query->whereHas('joblevels', fn ($q) => $q->where('joblevel_id', $joblevelId))
                    ->orWhereHas('departments', fn ($q) => $q->where('department_id', $departmentId));
            })
            ->first();
    }
}
