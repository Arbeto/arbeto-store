<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShippingCompany;
use App\Models\GovernorateShippingPrice;
use App\Models\CompanyGovernoratePrice;
use App\Services\InventoryStockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class ShippingApiController extends Controller
{
    public function __construct(private InventoryStockService $inventoryStockService)
    {
    }

    // ===== Shipping Companies =====

    public function index()
    {
        $companies = ShippingCompany::all()->map(fn($c) => $this->buildCompany($c));
        return response()->json($companies);
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'name'          => 'required|string',
                'logo'          => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'shipping_type' => 'required|in:fixed,manual',
                'fixed_price'   => 'nullable|numeric|min:0',
            ]);

            $logoPath = null;
            if ($request->hasFile('logo')) {
                $folder = public_path('ArDash/shipping-companies');
                if (!File::exists($folder)) {
                    File::makeDirectory($folder, 0777, true);
                }
                $fileName = time() . '_' . uniqid() . '.' . $request->file('logo')->getClientOriginalExtension();
                $request->file('logo')->move($folder, $fileName);
                $logoPath = 'ArDash/shipping-companies/' . $fileName;
            }

            $company = ShippingCompany::create([
                'name'          => $request->name,
                'logo'          => $logoPath,
                'shipping_type' => $request->shipping_type,
                'fixed_price'   => $request->shipping_type === 'fixed' ? $request->fixed_price : null,
            ]);

            return response()->json($this->buildCompany($company), 201);
        } catch (\Exception $e) {
            Log::error('Store Shipping Company Error: ' . $e->getMessage());
            return response()->json(['error' => 'حدث خطأ أثناء حفظ الشركة', 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $company = ShippingCompany::findOrFail($id);

            $request->validate([
                'name'          => 'nullable|string',
                'logo'          => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'shipping_type' => 'nullable|in:fixed,manual',
                'fixed_price'   => 'nullable|numeric|min:0',
            ]);

            if ($request->hasFile('logo')) {
                if ($company->logo && File::exists(public_path($company->logo))) {
                    File::delete(public_path($company->logo));
                }
                $folder = public_path('ArDash/shipping-companies');
                if (!File::exists($folder)) {
                    File::makeDirectory($folder, 0777, true);
                }
                $fileName = time() . '_' . uniqid() . '.' . $request->file('logo')->getClientOriginalExtension();
                $request->file('logo')->move($folder, $fileName);
                $company->logo = 'ArDash/shipping-companies/' . $fileName;
            }

            if ($request->filled('name'))          $company->name = $request->name;
            if ($request->filled('shipping_type')) {
                $company->shipping_type = $request->shipping_type;
                $company->fixed_price   = $request->shipping_type === 'fixed' ? $request->fixed_price : null;
            }

            $company->save();
            return response()->json($this->buildCompany($company));
        } catch (\Exception $e) {
            Log::error('Update Shipping Company Error: ' . $e->getMessage());
            return response()->json(['error' => 'حدث خطأ أثناء تحديث الشركة', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $company = ShippingCompany::findOrFail($id);
            if ($company->logo && File::exists(public_path($company->logo))) {
                File::delete(public_path($company->logo));
            }
            $company->delete();
            return response()->json(['message' => 'تم حذف الشركة بنجاح']);
        } catch (\Exception $e) {
            Log::error('Delete Shipping Company Error: ' . $e->getMessage());
            return response()->json(['error' => 'حدث خطأ أثناء حذف الشركة', 'message' => $e->getMessage()], 500);
        }
    }

    // ===== Get Orders for a Company =====
    public function getCompanyOrders($id)
    {
        try {
            $company = ShippingCompany::findOrFail($id);
            $orders  = \App\Models\Order::with(['user'])
                ->where('shipping_company_id', $id)
                ->orderByDesc('updated_at')
                ->get();

            return response()->json([
                'company' => $this->buildCompany($company),
                'orders'  => $orders,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'حدث خطأ', 'message' => $e->getMessage()], 500);
        }
    }

    // ===== Update Order from Company page =====
    public function updateCompanyOrder(Request $request, $companyId, $orderId)
    {
        try {
            $order = \App\Models\Order::where('shipping_company_id', $companyId)->findOrFail($orderId);

            $allowed = ['status', 'manual_shipping_cost', 'company_notes', 'failure_reason'];
            $data    = $request->only($allowed);

            $oldStatus = $order->status;
            $order->update($data);

            if (array_key_exists('status', $data)) {
                $this->inventoryStockService->restockForStatusTransition(
                    $order,
                    $oldStatus,
                    $order->status
                );
            }

            return response()->json($order->load('user'));
        } catch (\Exception $e) {
            return response()->json(['error' => 'حدث خطأ أثناء تحديث الطلب', 'message' => $e->getMessage()], 500);
        }
    }

    private function buildCompany(ShippingCompany $c): array
    {
        return [
            'id'            => $c->id,
            'name'          => $c->name,
            'logo'          => $c->logo ? asset($c->logo) : null,
            'shipping_type' => $c->shipping_type,
            'fixed_price'   => $c->fixed_price,
        ];
    }

    // ===== Per-Company Governorate Prices =====

    public function getCompanyGovPrices($id)
    {
        try {
            $company = ShippingCompany::findOrFail($id);
            $prices  = CompanyGovernoratePrice::where('shipping_company_id', $id)->get();
            return response()->json($prices);
        } catch (\Exception $e) {
            return response()->json(['error' => 'حدث خطأ', 'message' => $e->getMessage()], 500);
        }
    }

    public function bulkUpdateCompanyGovPrices(Request $request, $id)
    {
        try {
            ShippingCompany::findOrFail($id);
            $request->validate(['prices' => 'required|array']);

            foreach ($request->prices as $item) {
                CompanyGovernoratePrice::updateOrCreate(
                    ['shipping_company_id' => $id, 'governorate_name' => $item['governorate_name']],
                    ['price' => $item['price'] ?? 0]
                );
            }

            return response()->json(['message' => 'تم حفظ أسعار المحافظات للشركة بنجاح']);
        } catch (\Exception $e) {
            Log::error('Bulk Update Company Gov Prices Error: ' . $e->getMessage());
            return response()->json(['error' => 'حدث خطأ أثناء الحفظ', 'message' => $e->getMessage()], 500);
        }
    }

    // ===== Get shipping cost for a governorate (for cart) =====
    public function getShippingCostForGov(Request $request)
    {
        $gov = $request->query('governorate', '');
        if (!$gov) return response()->json(['price' => 0]);

        $record = GovernorateShippingPrice::where('governorate_name', $gov)->first();
        return response()->json(['price' => $record ? (float) $record->price : 0, 'governorate' => $gov]);
    }

    // ===== Governorate Shipping Prices =====

    public function indexGovPrices()
    {
        return response()->json(GovernorateShippingPrice::all());
    }

    public function storeGovPrice(Request $request)
    {
        try {
            $request->validate([
                'governorate_name' => 'required|string',
                'price'            => 'required|numeric|min:0',
            ]);

            $govPrice = GovernorateShippingPrice::create([
                'governorate_name' => $request->governorate_name,
                'price'            => $request->price,
            ]);

            return response()->json($govPrice, 201);
        } catch (\Exception $e) {
            Log::error('Store Governorate Price Error: ' . $e->getMessage());
            return response()->json(['error' => 'حدث خطأ أثناء حفظ السعر', 'message' => $e->getMessage()], 500);
        }
    }

    public function updateGovPrice(Request $request, $id)
    {
        try {
            $govPrice = GovernorateShippingPrice::findOrFail($id);

            $request->validate([
                'governorate_name' => 'nullable|string',
                'price'            => 'nullable|numeric|min:0',
            ]);

            if ($request->filled('governorate_name')) $govPrice->governorate_name = $request->governorate_name;
            if ($request->has('price'))               $govPrice->price = $request->price;
            $govPrice->save();

            return response()->json($govPrice);
        } catch (\Exception $e) {
            Log::error('Update Governorate Price Error: ' . $e->getMessage());
            return response()->json(['error' => 'حدث خطأ أثناء تحديث السعر', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroyGovPrice($id)
    {
        try {
            GovernorateShippingPrice::findOrFail($id)->delete();
            return response()->json(['message' => 'تم الحذف بنجاح']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'حدث خطأ أثناء الحذف'], 500);
        }
    }

    public function bulkUpdateGovPrices(Request $request)
    {
        try {
            $request->validate(['prices' => 'required|array']);
            foreach ($request->prices as $item) {
                if (!empty($item['id'])) {
                    GovernorateShippingPrice::where('id', $item['id'])->update([
                        'governorate_name' => $item['governorate_name'],
                        'price'            => $item['price'],
                    ]);
                }
            }
            return response()->json(['message' => 'تم تحديث الأسعار بنجاح']);
        } catch (\Exception $e) {
            Log::error('Bulk Update Gov Prices Error: ' . $e->getMessage());
            return response()->json(['error' => 'حدث خطأ أثناء التحديث', 'message' => $e->getMessage()], 500);
        }
    }
}
