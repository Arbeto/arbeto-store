<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Catetgory_prodect;
use App\Models\InventoryItem;
use App\Models\Products;
use App\Models\ProductOptionGroup;
use App\Models\ProductOption;
use App\Models\ProductSpec;
use App\Models\Sliders;
use App\Models\User;
use App\Services\InventoryStockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class ContentApiController extends Controller
{
  public function __construct(private InventoryStockService $inventoryStockService) {}

  // ===== مساعد: بناء مصفوفة المنتج للـ JSON =====
  private function buildProductArray(Products $product): array
  {
    $product->load('optionGroups.options', 'specs', 'inventoryItem', 'inventoryItems');
    $optionGroups = $product->optionGroups->map(function ($group) {
      return [
        'id'      => $group->id,
        'title'   => $group->title,
        'options' => $group->options->map(function ($opt) {
          return [
            'id'                  => $opt->id,
            'name'                => $opt->name,
            'custom_price'        => $opt->custom_price,
            'quantity'            => $opt->quantity,
            'images'              => collect($opt->images ?? [])->map(fn($p) => asset($p))->values(),
            'primary_image_index' => $opt->primary_image_index ?? 0,
            'primary_image'       => $opt->getPrimaryImage() ? asset($opt->getPrimaryImage()) : null,
          ];
        })->values(),
      ];
    })->values();

    $specs = $product->specs->map(fn($s) => [
      'id'    => $s->id,
      'title' => $s->title,
      'value' => $s->value,
    ])->values();

    $inventoryItem = $product->inventoryItem;
    $inventoryItems = $product->inventoryItems->map(fn($item) => [
      'id'             => $item->id,
      'item_name'      => $item->item_name,
      'quantity'       => (int) $item->quantity,
      'purchase_price' => (float) $item->purchase_price,
      'image_url'      => $item->image ? asset('storage/' . $item->image) : null,
    ])->values();

    $inventoryItemIds = $inventoryItems->pluck('id')->values();
    if ($product->inventory_item_id && !$inventoryItemIds->contains((int) $product->inventory_item_id)) {
      $inventoryItemIds->prepend((int) $product->inventory_item_id);
    }

    return [
      'id'                => $product->id,
      'img'               => collect($product->img ?? [])->map(fn($p) => asset($p))->values(),
      'primary_image_index' => $product->primary_image_index ?? 0,
      'primary_image'     => $product->getPrimaryImage() ? asset($product->getPrimaryImage()) : null,
      'type'              => $product->type              ?? '',
      'added_by'            => $product->added_by ?? null,
      'name'              => $product->name              ?? '',
      'type_product'      => $product->type_product      ?? '',
      'description'       => $product->description       ?? '',
      'quantity'          => $product->getInventoryQuantity(), // Get quantity from inventory instead of product table
      'inventory_quantity' => $product->getInventoryQuantity(), // Separate field for clarity
      'price_pay'         => $product->price_pay         ?? 0,
      'price_sell'        => $product->price_sell        ?? 0,
      'discount'          => $product->discount          ?? 0,
      'category_id'       => $product->category_id       ?? null,
      'suggested_product' => $product->suggested_product ?? [],
      'suggested_search'  => $product->suggested_search  ?? [],
      'inventory_item_id' => $product->inventory_item_id,
      'inventory_item_ids' => $inventoryItemIds,
      'inventory_item'    => $inventoryItem ? [
        'id'             => $inventoryItem->id,
        'item_name'      => $inventoryItem->item_name,
        'quantity'       => (int) $inventoryItem->quantity,
        'purchase_price' => (float) $inventoryItem->purchase_price,
        'image_url'      => $inventoryItem->image ? asset('storage/' . $inventoryItem->image) : null,
      ] : null,
      'inventory_items'   => $inventoryItems,
      'option_groups'     => $optionGroups,
      'specs'             => $specs,
    ];
  }

  private function parseInventoryItemIds(Request $request): array
  {
    $ids = [];

    if ($request->has('inventory_item_ids')) {
      $raw = $request->input('inventory_item_ids');
      if (is_array($raw)) {
        $ids = $raw;
      } elseif (is_string($raw) && trim($raw) !== '') {
        $ids = [$raw];
      }
    }

    if ($request->filled('inventory_item_ids_json')) {
      $decoded = json_decode((string) $request->input('inventory_item_ids_json'), true);
      if (is_array($decoded)) {
        $ids = $decoded;
      }
    }

    return collect($ids)
      ->map(fn($id) => (int) $id)
      ->filter(fn($id) => $id > 0)
      ->unique()
      ->values()
      ->all();
  }

  // ===== مساعد: حفظ الخيارات والمواصفات =====
  private function saveOptionGroupsAndSpecs(Products $product, Request $request): void
  {
    // حذف القديم واستبداله
    $product->load('optionGroups.options');
    $product->optionGroups->each(function ($group) {
      foreach ($group->options as $opt) {
        if (!empty($opt->images)) {
          foreach ($opt->images as $imgPath) {
            $full = public_path($imgPath);
            if (File::exists($full)) File::delete($full);
          }
        }
      }
      $group->options()->delete();
    });
    $product->optionGroups()->delete();
    $product->specs()->delete();

    // ===== حفظ مجموعات الخيارات =====
    $optionGroupsJson = $request->input('option_groups_json');
    if ($optionGroupsJson) {
      $groups = json_decode($optionGroupsJson, true);
      if (is_array($groups)) {
        $folder = public_path('ArDash/options');
        if (!File::exists($folder)) File::makeDirectory($folder, 0777, true);

        foreach ($groups as $gIdx => $groupData) {
          $title = trim($groupData['title'] ?? '');
          if (!$title) continue;

          $group = ProductOptionGroup::create([
            'product_id' => $product->id,
            'title'      => $title,
          ]);

          foreach ($groupData['options'] ?? [] as $oIdx => $optData) {
            $name = trim($optData['name'] ?? '');
            if (!$name) continue;

            $imagePaths = [];
            $imageKey = "opt_img_{$gIdx}_{$oIdx}";
            if ($request->hasFile($imageKey)) {
              $imgs = $request->file($imageKey);
              if (!is_array($imgs)) $imgs = [$imgs];
              foreach (array_slice($imgs, 0, 4) as $imgFile) {
                $fn = time() . '_' . uniqid() . '.' . $imgFile->getClientOriginalExtension();
                $imgFile->move($folder, $fn);
                $imagePaths[] = 'ArDash/options/' . $fn;
              }
            }

            ProductOption::create([
              'option_group_id'     => $group->id,
              'name'                => $name,
              'custom_price'        => isset($optData['custom_price']) && $optData['custom_price'] !== '' ? (float)$optData['custom_price'] : null,
              'quantity'            => isset($optData['quantity'])     && $optData['quantity']     !== '' ? (int)$optData['quantity']     : null,
              'images'              => $imagePaths ?: null,
              'primary_image_index' => !empty($imagePaths) ? min($optData['primary_image_index'] ?? 0, count($imagePaths) - 1) : 0,
            ]);
          }
        }
      }
    }

    // ===== حفظ المواصفات =====
    $specsJson = $request->input('specs_json');
    if ($specsJson) {
      $specs = json_decode($specsJson, true);
      if (is_array($specs)) {
        foreach ($specs as $specData) {
          $title = trim($specData['title'] ?? '');
          $value = trim($specData['value'] ?? '');
          if (!$title && !$value) continue;
          ProductSpec::create([
            'product_id' => $product->id,
            'title'      => $title,
            'value'      => $value,
          ]);
        }
      }
    }
  }

  // المنتجات
  public function indexProducts()
  {
    $products = Products::with('optionGroups.options', 'specs', 'inventoryItem', 'inventoryItems')->get();
    return response()->json($products->map(fn($p) => $this->buildProductArray($p)));
  }

  public function searchProducts(Request $request)
  {
    $q = trim($request->query('q', ''));
    if (!$q) {
      return response()->json([]);
    }

    $products = Products::with('inventoryItem')->get();
    $lower = mb_strtolower($q);

    $results = $products->filter(function ($p) use ($lower) {
      if (mb_strpos(mb_strtolower($p->name ?? ''), $lower) !== false) return true;
      $hints = $p->suggested_search ?? [];
      foreach ($hints as $hint) {
        if (mb_strpos(mb_strtolower($hint), $lower) !== false) return true;
      }
      return false;
    });

    return response()->json($results->map(fn($p) => $this->buildProductArray($p))->values());
  }

  public function storeProducts(Request $request)
  {
    try {
      $request->validate([
        'img'                    => 'required|array|min:1|max:8',
        'img.*'                  => 'file|mimes:jpeg,jpg,png|max:2048',
        'primary_image_index'    => 'nullable|integer|min:0',
        'type'                   => 'required|in:product,box',
        'added_by'               => 'nullable|integer|exists:users,id',
        'name'                   => 'required|string',
        'type_product'           => 'nullable|string',
        'description'            => 'required|string',
        'quantity'               => 'required|integer',
        'price_sell'             => 'required|integer',
        'discount'               => 'required|integer',
        'category_id'            => 'nullable|integer',
        'suggested_product'      => 'nullable|array',
        'suggested_product.*'    => 'string',
        'suggested_search'       => 'nullable|array',
        'suggested_search.*'     => 'string',
        'inventory_item_id'      => 'nullable|integer|exists:inventory,id',
        'inventory_item_ids_json' => 'nullable|string',
      ]);

      $folder = public_path('ArDash/products');

      if (!File::exists($folder)) {
        File::makeDirectory($folder, 0777, true);
      }

      // حفظ جميع الصور وتجميع المسارات
      $paths = [];
      foreach ($request->file('img') as $image) {
        $fileName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
        $image->move($folder, $fileName);
        $paths[] = 'ArDash/products/' . $fileName;
      }

      $product = Products::create([
        'added_by'           => $request->filled('added_by') ? $request->added_by : Auth::id(),
        'inventory_item_id'  => $request->filled('inventory_item_id') ? (int) $request->inventory_item_id : null,
        'img'                => $paths,
        'primary_image_index' => min($request->primary_image_index ?? 0, count($paths) - 1),
        'type'               => $request->type,
        'name'               => $request->name,
        'type_product'       => $request->type_product,
        'description'        => $request->description,
        'quantity'           => $request->quantity,
        'price_pay'          => null,
        'price_sell'         => $request->price_sell,
        'discount'           => $request->discount,
        'category_id'        => $request->category_id,
        'suggested_product'  => $request->suggested_product ?? [],
        'suggested_search'   => $request->suggested_search  ?? [],
      ]);

      $this->saveOptionGroupsAndSpecs($product, $request);

      // ربط عناصر المخزن — للبوكس يتم المزامنة عبر جدول الوسيط
      $invItemIds = $this->parseInventoryItemIds($request);
      if (!empty($invItemIds)) {
        $validIds = InventoryItem::whereIn('id', $invItemIds)->pluck('id')->all();
        $product->inventoryItems()->sync($validIds);
      }

      return response()->json($this->buildProductArray($product->load(['inventoryItem', 'inventoryItems'])), 201);
    } catch (\Exception $e) {
      Log::error('Store Product Error: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString()
      ]);

      return response()->json([
        'error'   => 'حدث خطأ أثناء حفظ المنتج',
        'message' => $e->getMessage()
      ], 500);
    }
  }

  public function updateProducts(Request $request, string $id)
  {
    try {
      $product = Products::findOrFail($id);

      $request->validate([
        'img'                    => 'nullable|array|max:8',
        'img.*'                  => 'file|mimes:jpeg,jpg,png|max:2048',
        'primary_image_index'    => 'nullable|integer|min:0',
        'type'                   => 'nullable|in:product,box',
        'added_by'               => 'nullable|integer|exists:users,id',
        'name'                   => 'nullable|string',
        'type_product'           => 'nullable|string',
        'description'            => 'nullable|string',
        'quantity'               => 'nullable|integer',
        'price_sell'             => 'nullable|integer',
        'discount'               => 'nullable|integer',
        'category_id'            => 'nullable|integer',
        'suggested_product'      => 'nullable|array',
        'suggested_product.*'    => 'string',
        'suggested_search'       => 'nullable|array',
        'suggested_search.*'     => 'string',
        'inventory_item_id'      => 'nullable|integer|exists:inventory,id',
        'inventory_item_ids_json' => 'nullable|string',
      ]);

      $data = [];

      // تحديث الصور إن وُجدت
      if ($request->hasFile('img')) {
        // حذف الصور القديمة
        if (!empty($product->img)) {
          foreach ($product->img as $oldPath) {
            $fullPath = public_path($oldPath);
            if (File::exists($fullPath)) {
              File::delete($fullPath);
            }
          }
        }

        $folder = public_path('ArDash/products');
        if (!File::exists($folder)) {
          File::makeDirectory($folder, 0777, true);
        }

        $paths = [];
        foreach ($request->file('img') as $image) {
          $fileName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
          $image->move($folder, $fileName);
          $paths[] = 'ArDash/products/' . $fileName;
        }

        $data['img'] = $paths;
        // تحديث رقم الصورة الرئيسية
        if ($request->has('primary_image_index')) {
          $data['primary_image_index'] = min($request->primary_image_index ?? 0, count($paths) - 1);
        }
      } elseif ($request->has('primary_image_index')) {
        // تحديث رقم الصورة الرئيسية بدون تغيير الصور
        $currentImages = $product->img ?? [];
        if (!empty($currentImages)) {
          $data['primary_image_index'] = min($request->primary_image_index, count($currentImages) - 1);
        }
      }

      if ($request->filled('type'))              $data['type']              = $request->type;
      if ($request->filled('added_by'))          $data['added_by']          = $request->added_by;
      if ($request->filled('name'))              $data['name']              = $request->name;
      if ($request->filled('type_product'))      $data['type_product']      = $request->type_product;
      if ($request->filled('description'))       $data['description']       = $request->description;
      if ($request->filled('quantity'))          $data['quantity']          = $request->quantity;
      if ($request->filled('price_sell'))        $data['price_sell']        = $request->price_sell;
      if ($request->filled('discount'))          $data['discount']          = $request->discount;
      if ($request->filled('category_id'))       $data['category_id']       = $request->category_id;
      if ($request->has('suggested_product'))    $data['suggested_product'] = $request->suggested_product ?? [];
      if ($request->has('suggested_search'))     $data['suggested_search']  = $request->suggested_search  ?? [];
      // تحديث ربط المخزن
      if ($request->has('inventory_item_id')) {
        $data['inventory_item_id'] = $request->filled('inventory_item_id') ? (int) $request->inventory_item_id : null;
      }

      $product->update($data);

      if ($request->has('option_groups_json') || $request->has('specs_json')) {
        $this->saveOptionGroupsAndSpecs($product, $request);
      }

      // مزامنة عناصر المخزن للبوكس عند التحديث
      if ($request->has('inventory_item_ids_json') || $request->has('inventory_item_ids')) {
        $invItemIds = $this->parseInventoryItemIds($request);
        $validIds = empty($invItemIds) ? [] : InventoryItem::whereIn('id', $invItemIds)->pluck('id')->all();
        $product->inventoryItems()->sync($validIds);
      }

      return response()->json($this->buildProductArray($product->load(['inventoryItem', 'inventoryItems'])));
    } catch (\Exception $e) {
      Log::error('Update Product Error: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString()
      ]);

      return response()->json([
        'error'   => 'حدث خطأ أثناء تحديث المنتج',
        'message' => $e->getMessage()
      ], 500);
    }
  }

  public function destroyProducts(string $id)
  {
    try {
      $product = Products::findOrFail($id);

      // حذف جميع الصور المرتبطة
      if (!empty($product->img)) {
        foreach ($product->img as $oldPath) {
          $fullPath = public_path($oldPath);
          if (File::exists($fullPath)) {
            File::delete($fullPath);
          }
        }
      }

      $product->delete();

      return response()->json(['message' => 'تم حذف المنتج بنجاح']);
    } catch (\Exception $e) {
      Log::error('Delete Product Error: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString()
      ]);

      return response()->json([
        'error'   => 'حدث خطأ أثناء حذف المنتج',
        'message' => $e->getMessage()
      ], 500);
    }
  }

  // فئات المنتجات
  public function indexCategories()
  {
    return response()->json(Catetgory_prodect::all());
  }

  public function storeCategories(Request $request)
  {
    try {
      $request->validate([
        'name'        => 'required|string',
        'slug'        => 'nullable|string',
        'description' => 'nullable|string',
        'img'         => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
      ]);

      $imgPath = null;

      if ($request->hasFile('img')) {
        $folder = public_path('ArDash/categories');
        if (!File::exists($folder)) {
          File::makeDirectory($folder, 0777, true);
        }
        $fileName = time() . '_' . uniqid() . '.' . $request->file('img')->getClientOriginalExtension();
        $request->file('img')->move($folder, $fileName);
        $imgPath = 'ArDash/categories/' . $fileName;
      }

      $slugValue = $request->filled('slug')
        ? $request->slug
        : Catetgory_prodect::generateSlug($request->name);

      $category = Catetgory_prodect::create([
        'name'        => $request->name,
        'slug'        => $slugValue,
        'description' => $request->description,
        'img'         => $imgPath,
      ]);

      return response()->json([
        'id'          => $category->id,
        'name'        => $category->name,
        'slug'        => $category->slug,
        'description' => $category->description ?? '',
        'img'         => $category->img ? asset($category->img) : null,
      ], 201);
    } catch (\Exception $e) {
      Log::error('Store Category Error: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString()
      ]);
      return response()->json([
        'error'   => 'حدث خطأ أثناء حفظ الفئة',
        'message' => $e->getMessage()
      ], 500);
    }
  }

  public function updateCategories(Request $request, string $id)
  {
    try {
      $category = Catetgory_prodect::findOrFail($id);

      $request->validate([
        'name'        => 'nullable|string',
        'slug'        => 'nullable|string',
        'description' => 'nullable|string',
        'img'         => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
      ]);

      if ($request->filled('name'))        $category->name        = $request->name;
      if ($request->filled('description')) $category->description = $request->description;
      if ($request->filled('slug'))        $category->slug        = $request->slug;

      if ($request->hasFile('img')) {
        if ($category->img && File::exists(public_path($category->img))) {
          File::delete(public_path($category->img));
        }
        $folder = public_path('ArDash/categories');
        if (!File::exists($folder)) {
          File::makeDirectory($folder, 0777, true);
        }
        $fileName = time() . '_' . uniqid() . '.' . $request->file('img')->getClientOriginalExtension();
        $request->file('img')->move($folder, $fileName);
        $category->img = 'ArDash/categories/' . $fileName;
      }

      $category->save();

      return response()->json([
        'id'          => $category->id,
        'name'        => $category->name,
        'slug'        => $category->slug,
        'description' => $category->description ?? '',
        'img'         => $category->img ? asset($category->img) : null,
      ]);
    } catch (\Exception $e) {
      Log::error('Update Category Error: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString()
      ]);
      return response()->json([
        'error'   => 'حدث خطأ أثناء تحديث الفئة',
        'message' => $e->getMessage()
      ], 500);
    }
  }

  public function destroyCategories(string $id)
  {
    try {
      $category = Catetgory_prodect::findOrFail($id);
      if (!empty($category->img)) {
        $fullPath = public_path($category->img);
        if (File::exists($fullPath)) {
          File::delete($fullPath);
        }
      }
      $category->delete();

      return response()->json(['message' => 'تم حذف الفئة بنجاح']);
    } catch (\Exception $e) {
      Log::error('Delete Category Error: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString()
      ]);

      return response()->json([
        'error'   => 'حدث خطأ أثناء حذف الفئة',
        'message' => $e->getMessage()
      ], 500);
    }
  }

  //////////////////////////////////////////////////////
  // الأقسام والعروض \\
  // السلايدر
  public function indexSliders()
  {
    return response()->json(Sliders::orderBy('position', 'asc')->get());
  }

  public function storeSliders(Request $request)
  {
    try {
      $request->validate([
        'img' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        'link' => 'nullable|string',
      ]);

      $imgPath = null;

      if ($request->hasFile('img')) {
        $folder = public_path('ArDash/sliders');
        if (!File::exists($folder)) {
          File::makeDirectory($folder, 0777, true);
        }
        $fileName = time() . '_' . uniqid() . '.' . $request->file('img')->getClientOriginalExtension();
        $request->file('img')->move($folder, $fileName);
        $imgPath = 'ArDash/sliders/' . $fileName;
      }

      $maxPosition = Sliders::max('position') ?? 0;

      $slider = Sliders::create([
        'img' => $imgPath,
        'link' => $request->link,
        'position' => $maxPosition + 1,
      ]);

      return response()->json([
        'id' => $slider->id,
        'img' => $slider->img ? asset($slider->img) : null,
        'link' => $slider->link,
        'position' => $slider->position,
      ], 201);
    } catch (\Exception $e) {
      Log::error('Store Slider Error: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString()
      ]);
      return response()->json([
        'error' => 'حدث خطأ أثناء حفظ السلايدر',
        'message' => $e->getMessage()
      ], 500);
    }
  }

  public function updateSliders(Request $request, string $id)
  {
    try {
      $slider = Sliders::findOrFail($id);

      $request->validate([
        'img' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        'link' => 'nullable|string',
      ]);

      if ($request->filled('link')) $slider->link = $request->link;

      if ($request->hasFile('img')) {
        // حذف الصورة القديمة
        if ($slider->img && File::exists(public_path($slider->img))) {
          File::delete(public_path($slider->img));
        }
        $folder = public_path('ArDash/sliders');
        if (!File::exists($folder)) {
          File::makeDirectory($folder, 0777, true);
        }
        $fileName = time() . '_' . uniqid() . '.' . $request->file('img')->getClientOriginalExtension();
        $request->file('img')->move($folder, $fileName);
        $slider->img = 'ArDash/sliders/' . $fileName;
      }

      $slider->save();

      return response()->json([
        'id' => $slider->id,
        'img' => $slider->img ? asset($slider->img) : null,
        'link' => $slider->link,
      ]);
    } catch (\Exception $e) {
      Log::error('Update Slider Error: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString()
      ]);
      return response()->json([
        'error' => 'حدث خطأ أثناء تحديث السلايدر',
        'message' => $e->getMessage()
      ], 500);
    }
  }

  public function destroySliders(string $id)
  {
    try {
      $slider = Sliders::findOrFail($id);
      if (!empty($slider->img)) {
        $fullPath = public_path($slider->img);
        if (File::exists($fullPath)) {
          File::delete($fullPath);
        }
      }
      $slider->delete();

      return response()->json(['message' => 'تم حذف السلايدر بنجاح']);
    } catch (\Exception $e) {
      Log::error('Delete Slider Error: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString()
      ]);

      return response()->json([
        'error' => 'حدث خطأ أثناء حذف السلايدر',
        'message' => $e->getMessage()
      ], 500);
    }
  }

  public function reorderSliders(Request $request)
  {
    try {
      $orders = $request->input('orders'); // Array of {id, position}
      foreach ($orders as $order) {
        Sliders::where('id', $order['id'])->update(['position' => $order['position']]);
      }
      return response()->json(['message' => 'تم تحديث الترتيب بنجاح']);
    } catch (\Exception $e) {
      return response()->json(['error' => 'حدث خطأ أثناء إعادة الترتيب'], 500);
    }
  }

  // الاقسام والعروض (انشاء صفحة عروض)
  public function indexOffers()
  {
    $offers = \App\Models\OffersPage::with('products')->get();
    return response()->json($offers);
  }

  public function storeOffers(Request $request)
  {
    try {
      $request->validate([
        'title'    => 'required|string',
        'img'      => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        'slug'     => 'required|string',
        'location' => 'required|string', // comma separated from frontend
        'products' => 'nullable|array',
      ]);

      $imgPath = null;
      if ($request->hasFile('img')) {
        $folder = public_path('ArDash/offers');
        if (!File::exists($folder)) {
          File::makeDirectory($folder, 0777, true);
        }
        $fileName = time() . '_' . uniqid() . '.' . $request->file('img')->getClientOriginalExtension();
        $request->file('img')->move($folder, $fileName);
        $imgPath = 'ArDash/offers/' . $fileName;
      }

      $offer = \App\Models\OffersPage::create([
        'title'       => $request->title,
        'description' => $request->description,
        'btn_text'    => $request->btn_text,
        'img'         => $imgPath,
        'slug'        => $request->slug,
        'location'    => $request->location,
      ]);

      if ($request->has('products') && is_array($request->products)) {
        $syncData = [];
        foreach ($request->products as $p) {
          $syncData[$p['id']] = [
            'discount'      => $p['discount'] ?? 0,
            'is_decoration' => $p['is_decoration'] ?? 0,
          ];
        }
        $offer->products()->sync($syncData);
      }

      return response()->json($offer->load('products'), 201);
    } catch (\Exception $e) {
      Log::error('Store Offer Error: ' . $e->getMessage());
      return response()->json(['error' => 'حدث خطأ أثناء حفظ الصفحة', 'message' => $e->getMessage()], 500);
    }
  }

  public function updateOffers(Request $request, $id)
  {
    try {
      $offer = \App\Models\OffersPage::findOrFail($id);

      $request->validate([
        'title'    => 'nullable|string',
        'img'      => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        'slug'     => 'nullable|string',
        'location' => 'nullable|string',
        'products' => 'nullable|array',
      ]);

      if ($request->hasFile('img')) {
        if ($offer->img && File::exists(public_path($offer->img))) {
          File::delete(public_path($offer->img));
        }
        $folder = public_path('ArDash/offers');
        if (!File::exists($folder)) {
          File::makeDirectory($folder, 0777, true);
        }
        $fileName = time() . '_' . uniqid() . '.' . $request->file('img')->getClientOriginalExtension();
        $request->file('img')->move($folder, $fileName);
        $offer->img = 'ArDash/offers/' . $fileName;
      }

      if ($request->filled('title'))       $offer->title = $request->title;
      if ($request->has('description'))      $offer->description = $request->description;
      if ($request->has('btn_text'))         $offer->btn_text = $request->btn_text;
      if ($request->filled('slug'))          $offer->slug = $request->slug;
      if ($request->has('location'))         $offer->location = $request->location ?? '';

      $offer->save();

      if ($request->has('products') && is_array($request->products)) {
        $syncData = [];
        foreach ($request->products as $p) {
          $syncData[$p['id']] = [
            'discount'      => $p['discount'] ?? 0,
            'is_decoration' => $p['is_decoration'] ?? 0,
          ];
        }
        $offer->products()->sync($syncData);
      }

      return response()->json($offer->load('products'));
    } catch (\Exception $e) {
      Log::error('Update Offer Error: ' . $e->getMessage());
      return response()->json(['error' => 'حدث خطأ أثناء تحديث الصفحة', 'message' => $e->getMessage()], 500);
    }
  }

  public function destroyOffers($id)
  {
    try {
      $offer = \App\Models\OffersPage::findOrFail($id);
      if ($offer->is_fixed) {
        return response()->json(['error' => 'لا يمكن حذف العرض الثابت'], 403);
      }
      if ($offer->img && File::exists(public_path($offer->img))) {
        File::delete(public_path($offer->img));
      }
      $offer->delete();
      return response()->json(['message' => 'تم حذف الصفحة بنجاح']);
    } catch (\Exception $e) {
      return response()->json(['error' => 'حدث خطأ أثناء الحذف'], 500);
    }
  }

  //////////////////////////////////////////////////////
  // الطلبات \\
  public function indexOrders()
  {
    $orders = \App\Models\Order::with(['user', 'user.addresses', 'shippingCompany'])->get();
    return response()->json($orders);
  }

  public function storeOrders(Request $request)
  {
    try {
      $request->validate([
        'user_id' => 'required|exists:users,id',
        'items' => 'required|array',
        'total_price' => 'required|numeric',
        'express_price' => 'required|numeric',
        'payment_method' => 'required|string',
        'comments' => 'nullable|string',
        'status' => 'required|string',
      ]);

      $data = $request->only([
        'user_id',
        'items',
        'total_price',
        'express_price',
        'payment_method',
        'comments',
        'status',
        'order_type',
        'return_for_order_id',
        'return_data',
        'governorate',
        'city',
        'street',
        'payment_proof',
        'shipping_company',
        'shipping_company_id',
        'manual_shipping_cost',
        'company_notes',
        'rejection_reason',
        'failure_reason',
      ]);
      $data['added_by'] = Auth::id() ?: $request->user_id;

      $order = \App\Models\Order::create($data);
      return response()->json($order, 201);
    } catch (\Exception $e) {
      return response()->json(['error' => 'حدث خطأ أثناء حفظ الطلب', 'message' => $e->getMessage()], 500);
    }
  }

  public function updateOrders(Request $request, $id)
  {
    try {
      $order = \App\Models\Order::findOrFail($id);

      $allowed = [
        'status',
        'shipping_company',
        'shipping_company_id',
        'manual_shipping_cost',
        'company_notes',
        'rejection_reason',
        'failure_reason',
      ];

      $data = $request->only($allowed);

      // When assigning a company, also store company name for display
      if (isset($data['shipping_company_id'])) {
        $company = \App\Models\ShippingCompany::find($data['shipping_company_id']);
        if ($company) {
          $data['shipping_company'] = $company->name;
        }
      }

      $oldStatus = $order->status;
      $order->update($data);

      if (array_key_exists('status', $data)) {
        $this->inventoryStockService->restockForStatusTransition(
          $order,
          $oldStatus,
          $order->status
        );
      }

      return response()->json($order->load(['user', 'user.addresses', 'shippingCompany']));
    } catch (\Exception $e) {
      return response()->json(['error' => 'حدث خطأ أثناء تحديث الطلب', 'message' => $e->getMessage()], 500);
    }
  }

  public function destroyOrders($id)
  {
    try {
      $order = \App\Models\Order::findOrFail($id);
      $order->delete();
      return response()->json(['message' => 'تم حذف الطلب بنجاح']);
    } catch (\Exception $e) {
      return response()->json(['error' => 'حدث خطأ أثناء حذف الطلب', 'message' => $e->getMessage()], 500);
    }
  }

  //////////////////////////////////////////////////////
  // السلة (Carts) \\
  public function indexCarts()
  {
    $carts = \App\Models\Cart::with('product')->get();

    // Format cart data with properly formatted product data including primary images
    $formattedCarts = $carts->map(function ($cart) {
      $cartData = $cart->toArray();
      if ($cart->product) {
        $cartData['product'] = $this->buildProductArray($cart->product);
      }
      return $cartData;
    });

    return response()->json($formattedCarts);
  }
  public function storeCarts(Request $request)
  {
    $data = $request->validate(['user_id' => 'required|exists:users,id', 'product_id' => 'required|exists:products,id', 'quantity' => 'required|integer|min:1']);
    $cart = \App\Models\Cart::updateOrCreate(['user_id' => $data['user_id'], 'product_id' => $data['product_id']], ['quantity' => DB::raw('quantity + ' . $data['quantity'])]);
    return response()->json($cart, 201);
  }
  public function destroyCarts($id)
  {
    \App\Models\Cart::findOrFail($id)->delete();
    return response()->json(['message' => 'تم الحذف']);
  }

  //////////////////////////////////////////////////////
  // المفضلة (Favorites) \\
  public function indexFavorites()
  {
    $favorites = \App\Models\Favorites::with('product')->get();

    // Format favorites data with properly formatted product data including primary images
    $formattedFavorites = $favorites->map(function ($favorite) {
      $favoriteData = $favorite->toArray();
      if ($favorite->product) {
        $favoriteData['product'] = $this->buildProductArray($favorite->product);
      }
      return $favoriteData;
    });

    return response()->json($formattedFavorites);
  }
  public function storeFavorites(Request $request)
  {
    $data = $request->validate(['user_id' => 'required|exists:users,id', 'product_id' => 'required|exists:products,id']);
    $fav = \App\Models\Favorites::firstOrCreate($data);
    return response()->json($fav, 201);
  }
  public function destroyFavorites($id)
  {
    \App\Models\Favorites::findOrFail($id)->delete();
    return response()->json(['message' => 'تم الحذف']);
  }

  //////////////////////////////////////////////////////
  // التقييمات (Reviews) \\
  public function indexReviews()
  {
    $reviews = \App\Models\Customer_reviews::with('user', 'product')->get();
    return response()->json($reviews);
  }

  public function storeReviews(Request $request)
  {
    $data = $request->validate([
      'user_id'    => 'required|exists:users,id',
      'product_id' => 'required|exists:products,id',
      'rating'     => 'required|integer|min:1|max:5',
      'review'     => 'nullable|string',
    ]);

    $review = \App\Models\Customer_reviews::create($data);

    // Return the new review along with the updated product avg rating
    $product = \App\Models\Products::withAvg('reviews', 'rating')->withCount('reviews')->find($data['product_id']);

    return response()->json([
      'review'          => $review,
      'avg_rating'      => round($product->reviews_avg_rating ?? 0, 1),
      'reviews_count'   => $product->reviews_count ?? 0,
    ], 201);
  }

  //////////////////////////////////////////////////////
  // المستخدمين (Users) \\
  public function indexUsers()
  {
    $users = User::with('addresses')
      ->where('user_type', User::ROLE_CUSTOMER)
      ->get();

    return response()->json($users->map(function ($u) {
      $address = $u->addresses->first();
      $arr = $u->toArray();
      $arr['shipping_address_detail'] = $address ? [
        'governorate' => $address->governorate,
        'city'        => $address->city,
        'street'      => $address->street,
      ] : null;
      return $arr;
    }));
  }

  //////////////////////////////////////////////////////
  // تفاصيل العميل (Customer Details) \\
  public function showUserDetils($id)
  {
    $user = \App\Models\User::with([
      'carts.product',
      'favorites.product',
      'orders',
      'reviews.product',
      'addresses',
    ])->findOrFail($id);

    $arr     = $user->toArray();
    $address = $user->addresses->first();
    $arr['shipping_address_detail'] = $address ? [
      'governorate' => $address->governorate,
      'city'        => $address->city,
      'street'      => $address->street,
    ] : null;
    return response()->json($arr);
  }

  public function updatePassword(Request $request, $id)
  {
    $request->validate(['password' => 'required|string|min:6']);
    $user = \App\Models\User::findOrFail($id);
    $user->update(['password' => Hash::make($request->password)]);
    return response()->json(['message' => 'تم تغيير كلمة المرور بنجاح']);
  }

  public function updateWallet(Request $request, $id)
  {
    $request->validate(['wallet_balance' => 'required|numeric|min:0']);
    $user = \App\Models\User::findOrFail($id);
    $user->update(['wallet_balance' => $request->wallet_balance]);
    return response()->json(['message' => 'تم تحديث الرصيد', 'wallet_balance' => $user->wallet_balance]);
  }
  //////////////////////////////////////////////////////
  // المشرفون والتجار (Staff Members) \\
  public function indexStaffMembers()
  {
    $staffTypes = ['ceo', 'manager', 'trader'];
    $staff = \App\Models\User::whereIn('user_type', $staffTypes)->get();
    $orders = \App\Models\Order::where('order_type', 'purchase')
      ->whereIn('status', ['delivered', 'out-for-delivery', 'on-the-way', 'shipped'])
      ->get();

    return response()->json($staff->map(function ($u) use ($orders) {
      $productCount = \App\Models\Products::where('added_by', $u->id)->count();
      $userProductIds = \App\Models\Products::where('added_by', $u->id)->pluck('id')->toArray();

      $userOrders = $orders->filter(function ($order) use ($u, $userProductIds) {
        if ($order->added_by == $u->id) return true;
        foreach ($order->items ?? [] as $item) {
          if (in_array($item['product_id'] ?? null, $userProductIds)) return true;
        }
        return false;
      });

      $orderCount = $userOrders->count();
      $profit = 0;

      foreach ($userOrders as $order) {
        foreach ($order->items ?? [] as $item) {
          if (in_array($item['product_id'] ?? null, $userProductIds) || $order->added_by == $u->id) {
            $profit += floatval($item['price'] ?? 0) * intval($item['quantity'] ?? 1);
          }
        }
      }

      return [
        'id'            => $u->id,
        'first_name'    => $u->first_name,
        'last_name'     => $u->last_name,
        'email'         => $u->email,
        'phone'         => $u->phone,
        'user_type'     => $u->user_type,
        'product_count' => $productCount,
        'order_count'   => $orderCount,
        'profit'        => round($profit, 2),
      ];
    })->values());
  }
  //////////////////////////////////////////////////////
  //  \\
}
