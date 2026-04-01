<?php

namespace App\Http\Controllers;

use App\Exceptions\InsufficientStockException;
use App\Models\Adress_coustomer;
use App\Models\Cart;
use App\Models\Favorites;
use App\Models\Order;
use App\Models\Products;
use App\Models\User;
use App\Services\InventoryStockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class WebShopController extends Controller
{
    public function __construct(private InventoryStockService $inventoryStockService)
    {
    }

    private function stockErrorResponse(InsufficientStockException $exception)
    {
        return response()->json([
            'error'              => $exception->getMessage(),
            'available_quantity' => $exception->availableQuantity,
        ], 422);
    }

    private function resolveAuthUser(): ?User
    {
        $user = Auth::user();

        return $user instanceof User ? $user : null;
    }

    // ===== CART =====

    public function addToCart(Request $request)
    {
        $user = $this->resolveAuthUser();
        if (!$user) return response()->json(['error' => 'غير مصرح'], 401);

        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity'   => 'nullable|integer|min:1',
            'selected_options' => 'nullable|array',
        ]);

        $qty = (int) ($request->quantity ?? 1);
        $product = Products::findOrFail((int) $request->product_id);
        $selectedOptions = $request->selected_options ?? [];

        // البحث عن العنصر في السلة بنفس المنتج ونفس الخيارات
        $cart = Cart::where('user_id', $user->id)
                    ->where('product_id', $request->product_id)
                    ->where(function ($query) use ($selectedOptions) {
                        if (empty($selectedOptions)) {
                            $query->whereNull('selected_options')
                                  ->orWhere('selected_options', '[]')
                                  ->orWhere('selected_options', 'null');
                        } else {
                            $query->where('selected_options', json_encode($selectedOptions));
                        }
                    })
                    ->first();

        $currentQty = (int) ($cart->quantity ?? 0);
        $newQty = $currentQty + $qty;

        try {
            $this->inventoryStockService->ensureCanUseQuantity($product, $newQty);
        } catch (InsufficientStockException $exception) {
            return $this->stockErrorResponse($exception);
        }

        if ($cart) {
            $cart->update(['quantity' => $newQty]);
        } else {
            $cart = Cart::create([
                'user_id'          => $user->id,
                'product_id'       => $request->product_id,
                'quantity'         => $qty,
                'selected_options' => $selectedOptions,
            ]);
        }

        $totalCount = $user->carts()->sum('quantity');
        return response()->json([
            'success'    => true,
            'cart_count' => $totalCount,
            'cart_id'    => $cart->id,
            'quantity'   => (int) $cart->quantity,
        ]);
    }

    public function removeFromCart($id)
    {
        $user = $this->resolveAuthUser();
        if (!$user) return response()->json(['error' => 'غير مصرح'], 401);

        $cart = Cart::where('id', $id)->where('user_id', $user->id)->firstOrFail();
        $cart->delete();

        $totalCount = $user->carts()->sum('quantity');
        return response()->json([
            'success'    => true,
            'cart_count' => $totalCount,
            'quantity'   => (int) $cart->quantity,
        ]);
    }

    public function updateCartQty(Request $request, $id)
    {
        $user = $this->resolveAuthUser();
        if (!$user) return response()->json(['error' => 'غير مصرح'], 401);

        $request->validate(['quantity' => 'required|integer|min:1']);

        $cart = Cart::where('id', $id)
            ->where('user_id', $user->id)
            ->with('product')
            ->firstOrFail();

        if (!$cart->product) {
            return response()->json(['error' => 'المنتج غير متوفر حالياً'], 422);
        }

        try {
            $this->inventoryStockService->ensureCanUseQuantity($cart->product, (int) $request->quantity);
        } catch (InsufficientStockException $exception) {
            return $this->stockErrorResponse($exception);
        }

        $cart->update(['quantity' => (int) $request->quantity]);

        $totalCount = $user->carts()->sum('quantity');
        return response()->json(['success' => true, 'cart_count' => $totalCount]);
    }

    // ===== FAVORITES =====

    public function addToFavorites(Request $request)
    {
        $user = $this->resolveAuthUser();
        if (!$user) return response()->json(['error' => 'غير مصرح'], 401);

        $request->validate(['product_id' => 'required|exists:products,id']);

        $fav = Favorites::firstOrCreate([
            'user_id'    => $user->id,
            'product_id' => $request->product_id,
        ]);

        return response()->json(['success' => true, 'favorite_id' => $fav->id]);
    }

    public function removeFromFavorites($id)
    {
        $user = $this->resolveAuthUser();
        if (!$user) return response()->json(['error' => 'غير مصرح'], 401);

        $fav = Favorites::where('id', $id)->where('user_id', $user->id)->firstOrFail();
        $fav->delete();

        return response()->json(['success' => true]);
    }

    public function moveToCart($id)
    {
        $user = $this->resolveAuthUser();
        if (!$user) return response()->json(['error' => 'غير مصرح'], 401);

        $fav = Favorites::where('id', $id)->where('user_id', $user->id)->firstOrFail();
        $productId = $fav->product_id;
        $product = Products::find($productId);

        if (!$product) {
            return response()->json(['error' => 'المنتج غير متوفر حالياً'], 422);
        }

        $cart = Cart::where('user_id', $user->id)->where('product_id', $productId)->first();

        $newQty = (int) ($cart->quantity ?? 0) + 1;

        try {
            $this->inventoryStockService->ensureCanUseQuantity($product, $newQty);
        } catch (InsufficientStockException $exception) {
            return $this->stockErrorResponse($exception);
        }

        if ($cart) {
            $cart->update(['quantity' => $newQty]);
        } else {
            $cart = Cart::create([
                'user_id'    => $user->id,
                'product_id' => $productId,
                'quantity'   => 1,
            ]);
        }

        $fav->delete();

        $totalCount = $user->carts()->sum('quantity');
        return response()->json([
            'success'    => true,
            'cart_count' => $totalCount,
            'cart_id'    => $cart->id,
            'quantity'   => (int) $cart->quantity,
        ]);
    }

    // ===== ORDERS =====

    public function placeOrder(Request $request)
    {
        $user = $this->resolveAuthUser();
        if (!$user) return response()->json(['error' => 'غير مصرح'], 401);

        $request->validate([
            'payment_method' => 'required|string|in:instapay,wallet,cod',
            'address'        => 'required|string|max:500',
            'governorate'    => 'required|string|max:100',
            'city'           => 'required|string|max:100',
            'express_price'  => 'nullable|numeric|min:0',
            'payment_proof'  => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            'promo_code'     => 'nullable|string|max:50',
        ]);

        try {
            $order = DB::transaction(function () use ($request, $user) {
                $carts = Cart::query()
                    ->where('user_id', $user->id)
                    ->with('product')
                    ->lockForUpdate()
                    ->get();

                if ($carts->isEmpty()) {
                    throw new \RuntimeException('السلة فارغة');
                }

                $items = [];

                foreach ($carts as $cart) {
                    $product = $cart->product;

                    if (!$product) {
                        throw new \RuntimeException('أحد المنتجات لم يعد متوفراً حالياً');
                    }

                    $qty = max(1, (int) $cart->quantity);
                    $price = (float) ($product->price_sell ?? 0);
                    $deduction = $this->inventoryStockService->reserveStockForProduct($product, $qty);

                    $image = null;
                    if (is_array($product->img) && !empty($product->img)) {
                        $image = $product->img[0];
                    }

                    // الخيارات المختارة
                    $selectedOptions = $cart->selected_options ?? [];

                    // إذا لم يختر المستخدم أي خيار، نختار اختيار عشوائي من الخيارات المتاحة
                    $product->load('optionGroups.options');
                    if (empty($selectedOptions) && $product->optionGroups->isNotEmpty()) {
                        $processedOptions = [];
                        foreach ($product->optionGroups as $group) {
                            $availableOptions = $group->options->where('quantity', '>', 0);
                            if ($availableOptions->isNotEmpty()) {
                                $randomOption = $availableOptions->random();
                                $processedOptions[] = [
                                    'optionId' => (string) $randomOption->id,
                                    'optionName' => $randomOption->name,
                                    'group' => $group->title,
                                    'price' => $randomOption->custom_price,
                                    'auto_selected' => true,
                                ];
                                // تقليل كمية الاختيار المختار عشوائياً
                                $randomOption->decrement('quantity', $qty);
                            }
                        }
                        $selectedOptions = $processedOptions;
                    } elseif (!empty($selectedOptions)) {
                        // تقليل كمية الخيارات المختارة من قبل المستخدم
                        foreach ($selectedOptions as &$option) {
                            if (isset($option['optionId'])) {
                                $productOption = \App\Models\ProductOption::find($option['optionId']);
                                if ($productOption && $productOption->quantity >= $qty) {
                                    $productOption->decrement('quantity', $qty);
                                } elseif ($productOption) {
                                    throw new \RuntimeException('الكمية المتاحة للاختيار "' . ($option['optionName'] ?? $option['option'] ?? '') . '" غير كافية');
                                }
                            }
                        }
                    }

                    $items[] = [
                        'product_id'          => $product->id,
                        'name'                => $product->name,
                        'quantity'            => $qty,
                        'price'               => $price,
                        'total'               => $price * $qty,
                        'img'                 => $image,
                        'inventory_deduction' => $deduction,
                        'selected_options'    => $selectedOptions,
                    ];
                }

                $subtotal = array_sum(array_column($items, 'total'));

                if ($request->filled('express_price') && floatval($request->express_price) > 0) {
                    $shippingFee = (float) $request->express_price;
                } else {
                    $govPrice = \App\Models\GovernorateShippingPrice::where('governorate_name', $request->governorate)->first();
                    $shippingFee = $govPrice ? (float) $govPrice->price : 50.00;
                }

                $promoDiscount = 0;
                if ($request->filled('promo_code')) {
                    $promoCode = \App\Models\DiscountCode::where('code', strtoupper(trim($request->promo_code)))->first();
                    if ($promoCode && !$promoCode->isExpired()) {
                        $promoDiscount = $subtotal * ($promoCode->discount / 100);
                    }
                }

                $total = $subtotal + $shippingFee - $promoDiscount;

                $proofPath = null;
                if ($request->hasFile('payment_proof')) {
                    $folder = public_path('Arbeto/payment_proofs');
                    if (!File::exists($folder)) {
                        File::makeDirectory($folder, 0777, true);
                    }
                    $fileName = time() . '_' . uniqid() . '.' . $request->file('payment_proof')->getClientOriginalExtension();
                    $request->file('payment_proof')->move($folder, $fileName);
                    $proofPath = 'Arbeto/payment_proofs/' . $fileName;
                }

                $order = Order::create([
                    'user_id'                => $user->id,
                    'added_by'               => $user->id,
                    'items'                  => $items,
                    'total_price'            => $total,
                    'express_price'          => $shippingFee,
                    'payment_method'         => $request->payment_method,
                    'address'                => $request->address,
                    'governorate'            => $request->governorate,
                    'city'                   => $request->city,
                    'street'                 => $request->address,
                    'payment_proof'          => $proofPath,
                    'comments'               => null,
                    'status'                 => 'pending',
                    'inventory_reserved_at'  => now(),
                ]);

                Adress_coustomer::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'governorate'  => $request->governorate,
                        'city'         => $request->city,
                        'street'       => $request->address,
                        'address_type' => 'home',
                    ]
                );

                Cart::query()->where('user_id', $user->id)->delete();

                return $order;
            });

            return response()->json(['success' => true, 'order_id' => $order->id]);
        } catch (InsufficientStockException $exception) {
            return $this->stockErrorResponse($exception);
        } catch (\RuntimeException $exception) {
            if ($exception->getMessage() === 'السلة فارغة') {
                return response()->json(['error' => 'السلة فارغة'], 400);
            }

            return response()->json(['error' => $exception->getMessage()], 422);
        }
    }

    // ===== Check Options Availability =====
    public function checkOptionsAvailability(Request $request, $productId)
    {
        $user = $this->resolveAuthUser();
        if (!$user) return response()->json(['error' => 'غير مصرح'], 401);

        $request->validate([
            'selected_options' => 'nullable|array',
        ]);

        $product = Products::with('optionGroups.options')->findOrFail($productId);
        $selectedOptions = $request->selected_options ?? [];

        if (empty($selectedOptions)) {
            return response()->json(['available' => true]);
        }

        foreach ($selectedOptions as $option) {
            if (isset($option['optionId'])) {
                $productOption = \App\Models\ProductOption::find($option['optionId']);
                if (!$productOption || $productOption->quantity <= 0) {
                    return response()->json(['available' => false, 'message' => 'الكمية منتهية للاختيار المحدد']);
                }
            }
        }

        return response()->json(['available' => true]);
    }

    // ===== ADDRESS =====

    public function updateAddress(Request $request)
    {
        $user = $this->resolveAuthUser();
        if (!$user) return response()->json(['error' => 'غير مصرح'], 401);

        $request->validate([
            'governorate'  => 'required|string|max:100',
            'city'         => 'required|string|max:100',
            'street'       => 'required|string|max:500',
            'address_type' => 'nullable|string|in:home,work,other',
        ]);

        Adress_coustomer::updateOrCreate(
            ['user_id' => $user->id],
            [
                'governorate'  => $request->governorate,
                'city'         => $request->city,
                'street'       => $request->street,
                'address_type' => $request->address_type ?? 'home',
            ]
        );

        return response()->json(['success' => true]);
    }
}
