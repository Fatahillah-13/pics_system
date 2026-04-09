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

    public function joblevels(): BelongsToMany
    {
        return $this->belongsToMany(Joblevel::class, 'card_template_joblevel');
    }

    public function departments(): BelongsToMany
    {
        return $this->belongsToMany(Department::class, 'card_template_department');
    }
}
