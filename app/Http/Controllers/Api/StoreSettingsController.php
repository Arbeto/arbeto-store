<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StoreSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StoreSettingsController extends Controller
{
    // GET /api/store-settings
    public function show()
    {
        $settings = StoreSettings::current();

        return response()->json(array_merge($settings->toArray(), [
            'logo_url'    => $settings->logo    ? asset('storage/' . $settings->logo)    : null,
            'favicon_url' => $settings->favicon ? asset('storage/' . $settings->favicon) : null,
        ]));
    }

    // POST /api/store-settings
    public function update(Request $request)
    {
        $request->validate([
            'support_email' => 'nullable|email|max:255',
            'support_phone' => 'nullable|string|max:30',
            'facebook_url'  => 'nullable|max:500',
            'instagram_url' => 'nullable|max:500',
            'twitter_url'   => 'nullable|max:500',
            'whatsapp_url'  => 'nullable|max:500',
            'youtube_url'   => 'nullable|max:500',
            'tiktok_url'    => 'nullable|max:500',
        ]);

        $settings = StoreSettings::current();
        $settings->update($request->only([
            'support_email', 'support_phone',
            'facebook_url', 'instagram_url', 'twitter_url',
            'whatsapp_url', 'youtube_url', 'tiktok_url',
        ]));

        return response()->json(['success' => true, 'message' => 'تم التحديث بنجاح']);
    }

    // POST /api/store-settings/logo
    public function updateLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|file|mimes:jpeg,jpg,png,gif,webp,svg|max:5120',
        ]);

        $settings = StoreSettings::current();

        // Delete old logo file
        if ($settings->logo && Storage::disk('public')->exists($settings->logo)) {
            Storage::disk('public')->delete($settings->logo);
        }

        $path = $request->file('logo')->store('store', 'public');
        $settings->update(['logo' => $path]);

        return response()->json([
            'success'  => true,
            'logo_url' => asset('storage/' . $path),
        ]);
    }

    // POST /api/store-settings/favicon
    public function updateFavicon(Request $request)
    {
        $request->validate([
            'favicon' => 'required|file|mimes:jpeg,jpg,png,gif,webp,ico,svg|max:5120',
        ]);

        $settings = StoreSettings::current();

        // Delete old favicon file
        if ($settings->favicon && Storage::disk('public')->exists($settings->favicon)) {
            Storage::disk('public')->delete($settings->favicon);
        }

        $path = $request->file('favicon')->store('store', 'public');
        $settings->update(['favicon' => $path]);

        return response()->json([
            'success'     => true,
            'favicon_url' => asset('storage/' . $path),
        ]);
    }
}
