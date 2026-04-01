<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class UpdateLastSeen
{
    public function __invoke(Request $request, Closure $next)
    {
        if (Auth::check()) {
            User::where('id', Auth::id())->update(['last_seen' => now()]);
        }
        return $next($request);
    }
}
