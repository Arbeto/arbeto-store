<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\BillItem;
use App\Models\InventoryItem;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BillController extends Controller
{
    // GET /api/bills
    public function index(Request $request)
    {
        $query = Bill::with(['items', 'supplier']);

        if ($request->filled('year') && $request->year !== 'all') {
            $query->whereYear('date', $request->year);
        }
        if ($request->filled('month') && $request->month !== 'all') {
            $query->whereMonth('date', $request->month);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('items', fn ($q2) => $q2->where('item_name', 'like', "%{$search}%"));
            });
        }

        $bills = $query->orderBy('date', 'desc')->orderBy('id', 'desc')->paginate(10);

        $availableYears = Bill::selectRaw('YEAR(date) as year')
            ->groupBy('year')->orderBy('year', 'desc')->pluck('year');

        $availableMonths = Bill::selectRaw('MONTH(date) as month, YEAR(date) as year')
            ->groupBy('year', 'month')->orderBy('year', 'desc')->orderBy('month')
            ->get(['year', 'month']);

        return response()->json([
            'success'          => true,
            'bills'            => $bills,
            'available_years'  => $availableYears,
            'available_months' => $availableMonths,
        ]);
    }

    // GET /api/suppliers/search?q=...
    public function searchSuppliers(Request $request)
    {
        $q = $request->query('q', '');
        $suppliers = Supplier::where('name', 'like', "%{$q}%")
            ->orderBy('name')->limit(10)->get(['id', 'name']);
        return response()->json(['success' => true, 'suppliers' => $suppliers]);
    }

    // POST /api/bills
    public function store(Request $request)
    {
        $request->validate([
            'date'                   => 'required|date',
            'supplier_name'          => 'nullable|string|max:255',
            'items'                  => 'required|array|min:1',
            'items.*.item_name'      => 'required|string|max:255',
            'items.*.purchase_price' => 'required|numeric|min:0',
            'items.*.quantity'       => 'required|integer|min:1',
        ]);

        // Resolve / create supplier
        $supplierId = null;
        if ($request->filled('supplier_name')) {
            $supplier   = Supplier::firstOrCreate(['name' => trim($request->supplier_name)]);
            $supplierId = $supplier->id;
        }

        $total = collect($request->items)->sum(
            fn ($item) => floatval($item['purchase_price']) * intval($item['quantity'])
        );

        $bill = Bill::create([
            'added_by'    => Auth::id(),
            'supplier_id' => $supplierId,
            'date'        => $request->date,
            'total_price' => $total,
        ]);

        foreach ($request->items as $item) {
            $bill->items()->create([
                'item_name'      => $item['item_name'],
                'purchase_price' => $item['purchase_price'],
                'quantity'       => $item['quantity'],
            ]);

            // Upsert into inventory (accumulate quantity for same item+supplier combo)
            $inv = InventoryItem::where('item_name', $item['item_name'])
                ->where('supplier_id', $supplierId)
                ->first();

            if ($inv) {
                $inv->quantity       += intval($item['quantity']);
                $inv->purchase_price  = $item['purchase_price']; // keep latest price
                $inv->save();
            } else {
                InventoryItem::create([
                    'added_by'       => Auth::id(),
                    'supplier_id'    => $supplierId,
                    'item_name'      => $item['item_name'],
                    'purchase_price' => $item['purchase_price'],
                    'quantity'       => $item['quantity'],
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'طھظ… ط¥ط¶ط§ظپط© ط§ظ„ظپط§طھظˆط±ط© ط¨ظ†ط¬ط§ط­',
            'bill'    => $bill->load(['items', 'supplier']),
        ], 201);
    }
}