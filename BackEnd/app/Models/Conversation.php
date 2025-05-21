<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'file_id',
        'message_user',
        'message_bot',
        'timestamp',
    ];
    
    protected $casts = [
        'timestamp' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function file()
    {
        return $this->belongsTo(File::class);
    }
    
    public function tickets()
    {
        return $this->hasMany(Ticketschat::class);
    }

}
