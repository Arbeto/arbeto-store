<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\InventoryItem;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SupplierController extends Controller
{
    // GET /api/suppliers
    public function index(Request $request)
    {
        $query = Supplier::withCount([
            'inventory as product_count' => fn ($q) => $q->select(DB::raw('count(distinct item_name)')),
        ])
        ->withSum('inventory as total_quantity', 'quantity')
        ->withCount('bills')
        ->with(['bills:id,supplier_id,invoice_number']);

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $suppliers = $query->get();

        return response()->json(['success' => true, 'suppliers' => $suppliers]);
    }

    // GET /api/suppliers/{id}/products
    public function products($id)
    {
        $supplier = Supplier::findOrFail($id);
        $products = $supplier->inventory()
            ->orderBy('item_name')
            ->get(['id', 'item_name', 'quantity']);

        return response()->json(['success' => true, 'products' => $products]);
    }

    // PATCH /api/suppliers/{id}/address
    public function updateAddress(Request $request, $id)
    {
        $request->validate(['address' => 'nullable|string|max:500']);
        $supplier = Supplier::findOrFail($id);
        $supplier->update(['address' => $request->address]);
        return response()->json(['success' => true, 'message' => 'تم تحديث العنوان']);
    }
}
