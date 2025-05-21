<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Ticketschat extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'question',
        'response',
        'status',
        'evaluation',
        'conversation_id',
        'commentaire_admin'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

}

