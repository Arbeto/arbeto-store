<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiscountCode;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DiscountCodeController extends Controller
{
    public function index()
    {
        $codes = DiscountCode::orderByDesc('created_at')->get();
        return response()->json($codes);
    }

    public function store(Request $request)
    {
        $discountType = $request->discount_type === 'fixed' ? 'fixed' : 'percentage';

        if ($discountType === 'percentage') {
            $request->validate([
                'code'       => 'required|string|max:50|unique:discount_codes,code',
                'discount'   => 'required|integer|min:1|max:100',
                'expires_at' => 'nullable|date',
            ]);
        } else {
            $request->validate([
                'code'            => 'required|string|max:50|unique:discount_codes,code',
                'discount_amount' => 'required|numeric|min:1',
                'expires_at'      => 'nullable|date',
            ]);
        }

        $expiresAt = $request->expires_at ? Carbon::parse($request->expires_at) : null;

        $code = DiscountCode::create([
            'code'             => strtoupper(trim($request->code)),
            'discount_type'    => $discountType,
            'discount_percent' => $discountType === 'percentage' ? (int) $request->discount : 0,
            'discount_amount'  => $discountType === 'fixed' ? (float) $request->discount_amount : null,
            'expiry_type'      => $expiresAt ? 'date' : 'permanent',
            'expires_at'       => $expiresAt,
        ]);

        return response()->json($code, 201);
    }

    public function update(Request $request, $id)
    {
        $code = DiscountCode::findOrFail($id);
        $discountType = $request->discount_type === 'fixed' ? 'fixed' : 'percentage';

        if ($discountType === 'percentage') {
            $request->validate([
                'code'       => 'required|string|max:50|unique:discount_codes,code,' . $id,
                'discount'   => 'required|integer|min:1|max:100',
                'expires_at' => 'nullable|date',
            ]);
        } else {
            $request->validate([
                'code'            => 'required|string|max:50|unique:discount_codes,code,' . $id,
                'discount_amount' => 'required|numeric|min:1',
                'expires_at'      => 'nullable|date',
            ]);
        }

        $expiresAt = $request->expires_at ? Carbon::parse($request->expires_at) : null;

        $code->update([
            'code'             => strtoupper(trim($request->code)),
            'discount_type'    => $discountType,
            'discount_percent' => $discountType === 'percentage' ? (int) $request->discount : 0,
            'discount_amount'  => $discountType === 'fixed' ? (float) $request->discount_amount : null,
            'expiry_type'      => $expiresAt ? 'date' : 'permanent',
            'expires_at'       => $expiresAt,
        ]);

        $code->refresh();
        return response()->json($code);
    }

    public function destroy($id)
    {
        DiscountCode::findOrFail($id)->delete();
        return response()->json(['message' => 'تم حذف الكود بنجاح']);
    }

    /** Validate a code for the cart */
    public function validateCode(Request $request)
    {
        $rawCode = trim($request->query('code', ''));
        if (!$rawCode) {
            return response()->json(['valid' => false, 'error' => 'no_code']);
        }

        $code = DiscountCode::where('code', strtoupper($rawCode))->first();

        if (!$code) {
            return response()->json(['valid' => false, 'error' => 'not_found']);
        }

        if ($code->isExpired()) {
            return response()->json(['valid' => false, 'error' => 'expired']);
        }

        return response()->json([
            'valid'         => true,
            'code'          => $code->code,
            'discount'      => $code->discount_percent,
            'discount_type' => $code->discount_type ?? 'percentage',
            'discount_amount' => $code->discount_amount,
        ]);
    }
}
