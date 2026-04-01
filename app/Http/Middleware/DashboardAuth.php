<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class DashboardAuth
{
    /**
     * Pages restricted to CEO only (trader & manager get redirected to dashboard home).
     */
    const CEO_ONLY_ROUTES = [
        'dashboard.Analysis',
        'dashboard.trader-manager',
        'dashboard.users.search',
        'dashboard.users.update-role',
    ];

    /**
     * Pages that trader is allowed to access.
     * Trader can ONLY access these routes inside dashboard-admin.
     */
    const TRADER_ALLOWED_ROUTES = [
        'dashboard.products',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // Not logged in or is a customer → redirect to website home
        if (!$user || $user->user_type === 'customer') {
            return redirect('/');
        }

        $routeName = $request->route()?->getName() ?? '';

        // CEO: full access
        if ($user->user_type === 'ceo') {
            return $next($request);
        }

        // Manager: blocked from analysis + trader_manager pages
        if ($user->user_type === 'manager') {
            if (in_array($routeName, self::CEO_ONLY_ROUTES)) {
                return redirect()->route('dashboard.index');
            }
            return $next($request);
        }

        // Trader: only allowed on specific routes
        if ($user->user_type === 'trader') {
            if (in_array($routeName, self::TRADER_ALLOWED_ROUTES)) {
                return $next($request);
            }
            return redirect()->route('dashboard.index');
        }

        // Fallback – any other unknown type
        return redirect('/');
    }
}
