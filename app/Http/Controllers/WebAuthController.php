<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Favorites;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class WebAuthController extends Controller
{
    // ===== تسجيل الدخول =====
    public function login(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
            'password'   => 'required|string',
        ]);

        $identifier = $this->normalizeIdentifier($request->identifier);
        $user = $this->findUserByIdentifier($identifier);

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'البيانات التي ادخلتها غير صحيحة'], 401);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        // Set last_seen to "متصل الان"
        $user->update(['last_seen' => 'متصل الان']);

        // Transfer localStorage cart items to DB
        $this->transferLocalCart($request, $user);

        return response()->json([
            'success' => true,
            'cart_count' => Cart::where('user_id', $user->id)->sum('quantity'),
        ]);
    }

    // ===== تسجيل جديد =====
    public function register(Request $request)
    {
        $request->merge([
            'phone' => $this->normalizePhone($request->phone),
            'email' => $this->normalizeEmail($request->email),
        ]);

        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name'  => ['required', 'string', 'max:255'],
            'phone'      => ['required', 'string', 'max:20', 'unique:users'],
            'email'      => ['required', 'email', 'max:255', 'unique:users'],
            'password'   => ['required', 'string', 'min:6'],
            'gender'     => ['nullable', 'in:male,female'],
            'address'    => ['nullable', 'string'],
        ]);

        $user = User::create([
            'first_name'     => $request->first_name,
            'last_name'      => $request->last_name,
            'phone'          => $request->phone,
            'email'          => $request->email,
            'password'       => Hash::make($request->password),
            'gender'         => $request->gender,
            'address'        => $request->address,
            'wallet_balance' => 0,
            'user_type'      => 'customer',
            'last_seen'      => 'متصل الان',
        ]);

        Auth::login($user, true);
        $request->session()->regenerate();

        // Transfer localStorage cart items to DB
        $this->transferLocalCart($request, $user);

        return response()->json([
            'success' => true,
            'cart_count' => Cart::where('user_id', $user->id)->sum('quantity'),
        ]);
    }

    // ===== تسجيل الخروج =====
    public function logout(Request $request)
    {
        // Update last_seen before logout
        $user = Auth::user();
        if ($user instanceof User) {
            $user->update(['last_seen' => now()->format('Y-m-d H:i')]);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['success' => true]);
    }

    // ===== تحديث آخر ظهور =====
    public function updateLastSeen(Request $request)
    {
        $user = Auth::user();
        if ($user instanceof User) {
            $user->update([
                'last_seen' => now()->format('d/m/Y - H:i'),
            ]);
        }

        return response()->json(['success' => true]);
    }

    private function findUserByIdentifier(string $identifier): ?User
    {
        if ($identifier === '') {
            return null;
        }

        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            return User::whereRaw('LOWER(email) = ?', [$identifier])->first();
        }

        $phoneCandidates = $this->phoneCandidates($identifier);

        return User::where(function ($query) use ($phoneCandidates) {
            foreach ($phoneCandidates as $index => $phone) {
                if ($index === 0) {
                    $query->where('phone', $phone);
                } else {
                    $query->orWhere('phone', $phone);
                }
            }
        })->first();
    }

    private function normalizeIdentifier(?string $value): string
    {
        $value = trim($this->convertArabicDigits((string) $value));

        return filter_var($value, FILTER_VALIDATE_EMAIL)
            ? $this->normalizeEmail($value)
            : $this->normalizePhone($value);
    }

    private function normalizeEmail(?string $email): string
    {
        return strtolower(trim((string) $email));
    }

    private function normalizePhone(?string $phone): string
    {
        $phone = trim($this->convertArabicDigits((string) $phone));
        $phone = preg_replace('/[^0-9+]/', '', $phone) ?? '';

        if (str_starts_with($phone, '+20')) {
            $phone = '0' . substr($phone, 3);
        } elseif (str_starts_with($phone, '20') && strlen($phone) > 11) {
            $phone = '0' . substr($phone, 2);
        }

        return $phone;
    }

    private function phoneCandidates(string $phone): array
    {
        $normalized = $this->normalizePhone($phone);
        $candidates = array_filter([
            $phone,
            $normalized,
            ltrim($normalized, '+'),
            str_starts_with($normalized, '0') ? '+20' . substr($normalized, 1) : null,
            str_starts_with($normalized, '0') ? '20' . substr($normalized, 1) : null,
        ]);

        return array_values(array_unique($candidates));
    }

    private function convertArabicDigits(string $value): string
    {
        return strtr($value, [
            '٠' => '0',
            '١' => '1',
            '٢' => '2',
            '٣' => '3',
            '٤' => '4',
            '٥' => '5',
            '٦' => '6',
            '٧' => '7',
            '٨' => '8',
            '٩' => '9',
        ]);
    }

    // ===== نقل السلة من localStorage إلى DB =====
    private function transferLocalCart(Request $request, User $user)
    {
        $cartItems = $request->input('cart_items', []);
        if (!is_array($cartItems) || empty($cartItems)) return;

        foreach ($cartItems as $item) {
            $productId = $item['product_id'] ?? null;
            $quantity  = intval($item['quantity'] ?? 1);

            if (!$productId || $quantity < 1) continue;

            // Check product exists
            if (!\App\Models\Products::find($productId)) continue;

            Cart::updateOrCreate(
                ['user_id' => $user->id, 'product_id' => $productId],
                ['quantity' => DB::raw('quantity + ' . $quantity)]
            );
        }
    }
}
