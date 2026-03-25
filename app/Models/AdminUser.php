<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminUser extends Model
{
    protected $fillable = ['email', 'password_hash', 'display_name', 'last_login_at'];

    protected function casts(): array
    {
        return [
            'last_login_at' => 'datetime',
            'password_hash' => 'hashed:false',
        ];
    }

    protected $hidden = ['password_hash'];
}
