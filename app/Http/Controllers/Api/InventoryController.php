<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\StoreSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class InventoryController extends Controller
{
    // GET /api/inventory
    public function index(Request $request)
    {
        $query = InventoryItem::with(['supplier:id,name', 'primaryProducts'])
            ->orderBy('item_name');

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->filled('status')) {
            if ($request->status === 'available') {
                $query->where('quantity', '>', 0);
            } elseif ($request->status === 'out_of_stock') {
                $query->where('quantity', 0);
            }
        }

        if ($request->filled('search')) {
            $query->where('item_name', 'like', '%' . $request->search . '%');
        }

        $items = $query->paginate(12);

        $storeSettings = StoreSettings::first();
        $fallbackLogo  = $storeSettings && $storeSettings->logo
            ? asset('storage/' . $storeSettings->logo)
            : asset('arbeto_dashboard/image/logo-nunbg.png');

        $items->getCollection()->transform(function ($item) use ($fallbackLogo) {
            // Get the primary image from the related product
            $primaryProduct = $item->primaryProducts->first();
            $productPrimaryImage = null;

            if ($primaryProduct) {
                $productPrimaryImage = $primaryProduct->getPrimaryImage();
            }

            return [
                'id'             => $item->id,
                'item_name'      => $item->item_name,
                'quantity'       => $item->quantity,
                'purchase_price' => $item->purchase_price,
                'supplier_id'    => $item->supplier_id,
                'supplier_name'  => $item->supplier?->name,
                'image_url'      => $productPrimaryImage ? asset($productPrimaryImage) : $fallbackLogo,
                'has_image'      => (bool) $productPrimaryImage,
                'product_id'     => $primaryProduct?->id,
                'can_edit_image' => false, // Disable image editing
            ];
        });

        return response()->json(['success' => true, 'inventory' => $items]);
    }

    // GET /api/inventory/selectable
    public function selectable(Request $request)
    {
        $query = InventoryItem::query()->orderBy('item_name');

        // Filter by search
        if ($request->filled('search')) {
            $query->where('item_name', 'like', '%' . trim((string) $request->search) . '%');
        }

        // Filter out already used items for single products (but allow for boxes)
        $productType = $request->get('type', 'product'); // 'product' or 'box'
        $usedInventoryIds = collect(); // تهيئة المتغير

        if ($productType === 'product') {
            // For single products: exclude inventory items already linked to products
            $usedInventoryIds = \App\Models\Products::whereNotNull('inventory_item_id')
                ->pluck('inventory_item_id')
                ->filter()
                ->unique()
                ->values();

            if ($usedInventoryIds->isNotEmpty()) {
                $query->whereNotIn('id', $usedInventoryIds);
            }
        }
        // For boxes: allow reusing inventory items (no filtering)

        $items = $query->limit(300)->get(['id', 'item_name', 'quantity', 'purchase_price', 'image']);

        $storeSettings = StoreSettings::first();
        $fallbackLogo  = $storeSettings && $storeSettings->logo
            ? asset('storage/' . $storeSettings->logo)
            : asset('arbeto_dashboard/image/logo-nunbg.png');

        $result = $items->map(fn ($item) => [
            'id'             => $item->id,
            'item_name'      => $item->item_name,
            'quantity'       => (int) $item->quantity,
            'purchase_price' => (float) $item->purchase_price,
            'image_url'      => $item->image
                ? asset('storage/' . $item->image)
                : $fallbackLogo,
            'has_image'      => (bool) $item->image,
        ])->values();

        return response()->json([
            'success' => true,
            'items' => $result,
            'filtered_count' => $productType === 'product' ? ($usedInventoryIds->count() ?? 0) : 0
        ]);
    }

    // POST /api/inventory/{id}/image
    public function updateImage(Request $request, $id)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:3072',
        ]);

        $item = InventoryItem::findOrFail($id);

        if ($item->image && Storage::disk('public')->exists($item->image)) {
            Storage::disk('public')->delete($item->image);
        }

        $path = $request->file('image')->store('inventory', 'public');
        $item->update(['image' => $path]);

        return response()->json([
            'success'   => true,
            'image_url' => asset('storage/' . $path),
        ]);
    }
}
