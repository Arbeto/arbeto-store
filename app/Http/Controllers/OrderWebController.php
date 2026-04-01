<?php

namespace App\Http\Controllers;

use App\Models\Customer_reviews;
use App\Models\Order;
use App\Models\User;
use App\Services\InventoryStockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;

class OrderWebController extends Controller
{
    public function __construct(private InventoryStockService $inventoryStockService)
    {
    }

    private function resolveAuthUser(): ?User
    {
        $user = Auth::user();

        return $user instanceof User ? $user : null;
    }

    // ── List orders (web page) ──────────────────────────────────────────────
    public function index()
    {
        $user   = $this->resolveAuthUser();
        if (!$user) return redirect('/');

        $orders = $user->orders()->latest()->get();

        // Build available filter labels based on actual order dates
        $now        = Carbon::now();
        $has3m      = $orders->contains(fn($o) => $o->created_at->gte($now->copy()->subMonths(3)));
        $has6m      = $orders->contains(fn($o) => $o->created_at->gte($now->copy()->subMonths(6)));
        $years      = $orders->map(fn($o) => $o->created_at->year)->unique()->sortDesc()->values();
        $filters    = [];
        if ($has3m)                          $filters[] = ['key' => '3m',  'label' => 'آخر 3 أشهر'];
        if ($has6m && !$has3m)               $filters[] = ['key' => '6m',  'label' => 'آخر 6 أشهر'];
        if ($has6m && $has3m && $orders->contains(fn($o) => $o->created_at->lt($now->copy()->subMonths(3))))
                                             $filters[] = ['key' => '6m',  'label' => 'آخر 6 أشهر'];
        foreach ($years as $yr) {
            if ($yr < $now->year || ($yr === $now->year && !$has3m)) {
                $filters[] = ['key' => "y{$yr}", 'label' => (string)$yr];
            }
        }
        if ($orders->count())               $filters[] = ['key' => 'all', 'label' => 'الكل'];

        // Deduplicate & keep order: 3m → 6m → years → all
        $seen = []; $uniqFilters = [];
        foreach ($filters as $f) {
            if (!isset($seen[$f['key']])) { $seen[$f['key']] = true; $uniqFilters[] = $f; }
        }

        // Per-order reviews grouped by order_id
        $reviewsByOrder = Customer_reviews::where('user_id', $user->id)
            ->whereNotNull('order_id')
            ->get()
            ->groupBy('order_id');

        // Purchase order IDs that already have a return order submitted
        $purchaseOrderIds = $orders->where('order_type', '!=', 'return')->pluck('id');
        $returnedOrderIds = Order::whereIn('return_for_order_id', $purchaseOrderIds)
            ->where('order_type', 'return')
            ->pluck('return_for_order_id')
            ->toArray();

        // Inject JS-needed data into each order
        $ordersData = $orders->map(function ($order) use ($reviewsByOrder, $returnedOrderIds, $user) {
            $orderReviews = $reviewsByOrder->get($order->id, collect())->map(function ($r) {
                $images = is_array($r->images)
                    ? $r->images
                    : json_decode($r->images ?? '[]', true);
                return [
                    'product_id' => (string) $r->product_id,
                    'rating'     => $r->rating,
                    'review'     => $r->review ?? '',
                    'images'     => array_values(array_filter((array) $images)),
                    'likes'      => 0,
                ];
            })->values()->toArray();

            return [
                'id'               => $order->id,
                'status'           => $order->status,
                
                'order_type'       => $order->order_type ?? 'purchase',
                'return_for_order_id' => $order->return_for_order_id ?? null,
                'return_data'      => $order->return_data ?? null,
                'has_return'       => in_array($order->id, $returnedOrderIds),
                'updated_at'       => $order->updated_at->toIso8601String(),
                'created_at'       => $order->created_at->toIso8601String(),
                'total_price'      => number_format($order->total_price, 2),
                'express_price'    => number_format($order->express_price, 2),
                'payment_method'   => $order->payment_method,
                'street'           => $order->street ?? '',
                'governorate'      => $order->governorate ?? '',
                'city'             => $order->city ?? '',
                'phone'            => $user->phone ?? '',
                'items'            => $order->items ?? [],
                'reviews'          => $orderReviews,
                'reviewed'         => count($orderReviews) > 0,
                'rejection_reason' => $order->rejection_reason ?? $order->comments ?? '',
                'failure_reason'   => $order->failure_reason ?? '',
                'payment_proof'    => $order->payment_proof ? asset($order->payment_proof) : null,
                'year'             => $order->created_at->year,
                'months_ago'       => $order->created_at->diffInMonths(now()),
            ];
        })->values()->toArray();

        $categories = \App\Models\Catetgory_prodect::all();
        $offerPages = \App\Models\OffersPage::all();

        return view('website.my-orders', compact('ordersData', 'uniqFilters', 'categories', 'offerPages'));
    }

    // ── Cancel order ────────────────────────────────────────────────────────
    public function cancel(Request $request, $id)
    {
        $user = $this->resolveAuthUser();
        if (!$user) return response()->json(['error' => 'غير مصرح'], 401);

        $order = Order::where('id', $id)->where('user_id', $user->id)->firstOrFail();

        $cancellableStatuses = [
            Order::STATUS_PENDING,
            Order::STATUS_OUT_FOR_DELIVERY,
            Order::STATUS_ON_THE_WAY,
        ];

        if (!in_array($order->status, $cancellableStatuses)) {
            return response()->json(['error' => 'لا يمكن إلغاء هذه الطلبية'], 422);
        }

        $oldStatus = $order->status;

        $order->update([
            'status'   => Order::STATUS_CANCELLED,
            'comments' => $request->input('reason', ''),
        ]);

        $this->inventoryStockService->restockForStatusTransition(
            $order,
            $oldStatus,
            $order->status
        );

        return response()->json([
            'success'    => true,
            'updated_at' => $order->fresh()->updated_at->toIso8601String(),
        ]);
    }

    // ── Submit review ───────────────────────────────────────────────────────
    public function submitReview(Request $request, $orderId)
    {
        $user = $this->resolveAuthUser();
        if (!$user) return response()->json(['error' => 'غير مصرح'], 401);

        $request->validate([
            'product_id' => 'required|exists:products,id',
            'rating'     => 'required|integer|min:1|max:5',
            'review'     => 'nullable|string|max:1000',
            'images.*'   => 'nullable|image|mimes:jpeg,png,jpg|max:4096',
        ]);

        $order = Order::where('id', $orderId)->where('user_id', $user->id)->firstOrFail();

        if ($order->status !== Order::STATUS_DELIVERED) {
            return response()->json(['error' => 'لا يمكن التقييم قبل استلام الطلبية'], 422);
        }

        // Prevent duplicate review for same order
        $existing = Customer_reviews::where('user_id', $user->id)
            ->where('order_id', $orderId)
            ->first();
        if ($existing) {
            return response()->json(['error' => 'لقد قمت بتقييم هذه الطلبية من قبل'], 422);
        }

        // Upload images
        $imagePaths = [];
        if ($request->hasFile('images')) {
            $folder = public_path('Arbeto/review_images');
            if (!File::exists($folder)) File::makeDirectory($folder, 0777, true);
            foreach ($request->file('images') as $img) {
                $name         = time() . '_' . uniqid() . '.' . $img->getClientOriginalExtension();
                $img->move($folder, $name);
                $imagePaths[] = 'Arbeto/review_images/' . $name;
            }
        }

        Customer_reviews::create([
            'user_id'    => $user->id,
            'product_id' => $request->product_id,
            'order_id'   => $orderId,
            'rating'     => $request->rating,
            'review'     => $request->review,
            'images'     => $imagePaths ?: null,
        ]);

        return response()->json(['success' => true]);
    }

    // ── Submit return request ───────────────────────────────────────────────
    public function submitReturn(Request $request)
    {
        $user = $this->resolveAuthUser();
        if (!$user) return response()->json(['error' => 'غير مصرح'], 401);

        $request->validate([
            'order_id'       => 'required|integer',
            'products'       => 'required|array|min:1',
            'quantities'     => 'nullable|array',
            'quantities.*'   => 'nullable|integer|min:1',
            'reason_type'    => 'required|in:damaged,not_working,other',
            'reason_detail'  => 'nullable|string|max:1000',
            'payment_method' => 'required|in:instapay,wallet',
            'account_number' => 'nullable|string|max:100',
            'images.*'       => 'nullable|image|mimes:jpeg,png,jpg|max:8192',
        ]);

        $originalOrder = Order::where('id', $request->order_id)
            ->where('user_id', $user->id)
            ->where('status', 'delivered')
            ->first();

        if (!$originalOrder) {
            return response()->json(['error' => 'الطلبية غير موجودة أو لم يتم تسليمها'], 422);
        }

        // Enforce 72-hour window
        if ($originalOrder->updated_at->lt(now()->subHours(72))) {
            return response()->json(['error' => 'انتهت مهلة طلب الاسترجاع (72 ساعة من تاريخ التسليم)'], 422);
        }

        // Check not already returned
        $alreadyReturned = Order::where('return_for_order_id', $originalOrder->id)
            ->where('order_type', 'return')
            ->exists();
        if ($alreadyReturned) {
            return response()->json(['error' => 'تم تقديم طلب استرجاع لهذه الطلبية من قبل'], 422);
        }

        // Upload images
        $imagePaths = [];
        if ($request->hasFile('images')) {
            $folder = public_path('Arbeto/return_images');
            if (!File::exists($folder)) File::makeDirectory($folder, 0777, true);
            foreach (array_slice($request->file('images'), 0, 6) as $img) {
                $name         = time() . '_' . uniqid() . '.' . $img->getClientOriginalExtension();
                $img->move($folder, $name);
                $imagePaths[] = 'Arbeto/return_images/' . $name;
            }
        }

        // Build returned products list with chosen quantities
        $quantitiesInput = $request->quantities ?? [];
        $allItems = is_array($originalOrder->items) ? $originalOrder->items : [];

        $itemsByProduct = [];
        foreach ($allItems as $item) {
            $itemPid = (string) ($item['product_id'] ?? $item['id'] ?? '');
            if ($itemPid !== '' && !isset($itemsByProduct[$itemPid])) {
                $itemsByProduct[$itemPid] = $item;
            }
        }

        $returnedProducts = [];
        $returnItems = [];
        $seenProducts = [];

        foreach ($request->products as $i => $pid) {
            $productId = (string) $pid;

            if ($productId === '' || isset($seenProducts[$productId])) {
                continue;
            }

            if (!isset($itemsByProduct[$productId])) {
                return response()->json(['error' => 'أحد المنتجات المختارة غير موجود في الطلب الأصلي'], 422);
            }

            $sourceItem = $itemsByProduct[$productId];
            $orderedQty = max(1, (int) ($sourceItem['quantity'] ?? $sourceItem['qty'] ?? 1));
            $requestedQty = max(1, (int) ($quantitiesInput[$i] ?? 1));

            if ($requestedQty > $orderedQty) {
                return response()->json(['error' => 'كمية المرتجع لا يمكن أن تتجاوز الكمية المشتراة'], 422);
            }

            $returnedProducts[] = [
                'product_id' => $productId,
                'qty'        => $requestedQty,
            ];

            $returnItem = $sourceItem;
            $returnItem['quantity'] = $requestedQty;
            $returnItem['qty'] = $requestedQty;

            $partialDeduction = $this->inventoryStockService->buildPartialDeduction($sourceItem, $requestedQty);
            if (!empty($partialDeduction)) {
                $returnItem['inventory_deduction'] = $partialDeduction;
            }

            $returnItems[] = $returnItem;
            $seenProducts[$productId] = true;
        }

        if (empty($returnItems)) {
            return response()->json(['error' => 'الرجاء اختيار منتجات صالحة للاسترجاع'], 422);
        }

        $returnData = [
            'products'       => $returnedProducts,
            'reason_type'    => $request->reason_type,
            'reason_detail'  => $request->reason_detail ?? null,
            'payment_method' => $request->payment_method,
            'account_number' => $request->account_number ?? null,
            'images'         => $imagePaths,
        ];

        $returnOrder = Order::create([
            'user_id'             => $user->id,
            'added_by'            => $user->id,
            'order_type'          => 'return',
            'return_for_order_id' => $originalOrder->id,
            'return_data'         => $returnData,
            'status'              => 'pending',
            'items'               => $returnItems,
            'total_price'         => $originalOrder->total_price,
            'express_price'       => $originalOrder->express_price,
            'payment_method'      => $request->payment_method,
            'governorate'         => $originalOrder->governorate,
            'city'                => $originalOrder->city,
            'street'              => $originalOrder->street,
        ]);

        return response()->json(['success' => true, 'return_order_id' => $returnOrder->id]);
    }

    // ── Update shipping cost ────────────────────────────────────────────────
    public function updateShippingCost(Request $request, $id)
    {
        $request->validate([
            'express_price' => 'required|numeric|min:0',
        ]);

        $order = Order::findOrFail($id);

        // Only allow updating return orders or shipped orders
        if (!in_array($order->order_type, ['return']) && !in_array($order->status, ['shipped', 'out-for-delivery', 'delivered', 'failed-delivery', 'cancelled'])) {
            return response()->json(['error' => 'لا يمكن تعديل قيمة الشحن لهذه الطلبية'], 422);
        }

        $order->update([
            'express_price' => $request->express_price
        ]);

        return response()->json([
            'success' => true,
            'express_price' => $order->express_price,
            'message' => 'تم تحديث قيمة الشحن بنجاح'
        ]);
    }

    // ── Upload refund receipt ───────────────────────────────────────────────
    public function uploadRefundReceipt(Request $request, $id)
    {
        $request->validate([
            'refund_receipt' => 'required|image|mimes:jpeg,png,jpg|max:8192',
            'refund' => 'required|in:delivered',
        ]);

        $order = Order::findOrFail($id);

        // Only allow for return orders that are delivered
        if ($order->order_type !== 'return' || $order->status !== 'delivered') {
            return response()->json(['error' => 'لا يمكن رفع إيصال الاسترداد لهذه الطلبية'], 422);
        }

        // Upload the receipt image
        $receiptPath = null;
        if ($request->hasFile('refund_receipt')) {
            $folder = public_path('Arbeto/refund_receipts');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $file = $request->file('refund_receipt');
            $fileName = 'refund_' . $order->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move($folder, $fileName);
            $receiptPath = 'Arbeto/refund_receipts/' . $fileName;
        }

        // Update order with refund information
        $order->update([
            'refund' => $request->refund,
            'refund_receipt' => $receiptPath,
        ]);

        return response()->json([
            'success' => true,
            'refund_receipt' => asset($receiptPath),
            'message' => 'تم حفظ إيصال التحويل بنجاح'
        ]);
    }
}
