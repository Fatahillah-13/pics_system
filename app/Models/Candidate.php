<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Candidate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'joblevel_id',
        'department_id',
        'birthplace',
        'birthdate',
        'first_working_day',
        'nik',
        'image_path',
        'photo_number',
        'is_printed',
    ];

    protected function casts(): array
    {
        return [
            'birthdate' => 'date',
            'first_working_day' => 'date',
            'is_printed' => 'boolean',
        ];
    }

    public function joblevel(): BelongsTo
    {
        return $this->belongsTo(Joblevel::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }
}
