<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Throwable;

class AccountController extends Controller
{
    // ── Show account page ────────────────────────────────────────────────────
    public function show()
    {
        $user = Auth::user();
        if (!$user instanceof User) return redirect('/');

        $categories = \App\Models\Catetgory_prodect::all();
        $offerPages = \App\Models\OffersPage::all();

        return view('website.my-account', compact('user', 'categories', 'offerPages'));
    }

    // ── Update profile ───────────────────────────────────────────────────────
    public function update(Request $request)
    {
        $user = Auth::user();
        if (!$user instanceof User) return response()->json(['success' => false, 'message' => 'غير مصرح'], 401);

        $validated = $request->validate([
            'first_name'  => ['required', 'string', 'max:255'],
            'last_name'   => ['required', 'string', 'max:255'],
            'email'       => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone'       => ['required', 'string', 'max:20', 'unique:users,phone,' . $user->id],
            'gender'      => ['nullable', 'in:male,female'],
        ]);

        try {
            $user->update($validated);
        } catch (Throwable $e) {
            report($e);
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء تحديث بيانات الحساب'], 500);
        }

        return response()->json(['success' => true, 'message' => 'تم تحديث البيانات بنجاح']);
    }

    public function updateBrandInfo(Request $request)
    {
        $user = Auth::user();
        if (!$user instanceof User) return response()->json(['success' => false, 'message' => 'غير مصرح'], 401);

        if (!$user->isDashboardUser()) {
            return response()->json(['success' => false, 'message' => 'غير مصرح بتحديث بيانات البراند'], 403);
        }

        if (!Schema::hasColumns('users', ['brand_name', 'brand_phone'])) {
            return response()->json([
                'success' => false,
                'message' => 'أعمدة بيانات البراند غير موجودة بقاعدة البيانات. نفذ php artisan migrate ثم أعد المحاولة.'
            ], 422);
        }

        $validated = $request->validate([
            'brand_name'  => ['required', 'string', 'max:255'],
            'brand_phone' => ['required', 'string', 'max:30'],
        ]);

        try {
            $user->update($validated);
        } catch (Throwable $e) {
            report($e);
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء تحديث بيانات البراند'], 500);
        }

        return response()->json(['success' => true, 'message' => 'تم تحديث بيانات البراند بنجاح']);
    }

    // ── Change password ──────────────────────────────────────────────────────
    public function changePassword(Request $request)
    {
        $user = Auth::user();
        if (!$user instanceof User) return response()->json(['success' => false, 'message' => 'غير مصرح'], 401);

        $request->validate([
            'current_password' => ['required', 'string'],
            'new_password'     => ['required', 'string', 'min:6'],
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'كلمة المرور الحالية غير صحيحة'], 422);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        return response()->json(['success' => true, 'message' => 'تم تغيير كلمة المرور بنجاح']);
    }
}
