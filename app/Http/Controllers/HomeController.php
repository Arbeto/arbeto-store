<?php

namespace App\Http\Controllers;

use App\Models\Adress_coustomer;
use App\Models\Catetgory_prodect;
use App\Models\Favorites;
use App\Models\OffersPage;
use App\Models\Products;
use App\Models\Sliders;
use Illuminate\Http\Request;
use Illuminate\View\View;

class HomeController extends Controller
{
  public function indexWeb(): View
  {
    $products = Products::withAvg('reviews', 'rating')->withCount('reviews')->with('inventoryItem')->get();
    $sliders = Sliders::orderBy('position')->get();
    $categories = Catetgory_prodect::all();
    // Get regular (non-fixed) offers that have 'home' in their location string
    $offers = OffersPage::where('location', 'like', '%home%')->where('is_fixed', false)->get();
    // Fixed offer (صمم هديتك)
    $fixedOffer = OffersPage::where('is_fixed', true)->first();
    $offerPages = OffersPage::all();
    // Map productId => favoriteId for logged-in user
    $favoriteMap = [];
    if (auth()->check()) {
      $favoriteMap = Favorites::where('user_id', auth()->id())
        ->pluck('id', 'product_id')
        ->toArray();
    }
    return view('website.index', compact('products', 'sliders', 'categories', 'offers', 'offerPages', 'favoriteMap', 'fixedOffer'));
  }

  public function showProduct($id)
  {
    $product = Products::withAvg('reviews', 'rating')
      ->withCount('reviews')
      ->with('reviews.user', 'category', 'optionGroups.options', 'specs', 'addedBy', 'inventoryItem')
      ->findOrFail($id);
    $categories = Catetgory_prodect::all();
    $offerPages = OffersPage::all();
    $isFavorited = false;
    $favoriteId  = null;
    if (auth()->check()) {
      $fav = Favorites::where('user_id', auth()->id())->where('product_id', $id)->first();
      if ($fav) {
        $isFavorited = true;
        $favoriteId  = $fav->id;
      }
    }
    return view('website.product', compact('product', 'categories', 'offerPages', 'isFavorited', 'favoriteId'));
  }

  public function showOfferPage($slug)
  {
    $offerPage = OffersPage::where('slug', $slug)->firstOrFail();
    $products = $offerPage->products()->withAvg('reviews', 'rating')->withCount('reviews')->with('inventoryItem')->get();
    $categories = Catetgory_prodect::all();
    $offerPages = OffersPage::all();
    $favoriteMap = [];
    if (auth()->check()) {
      $favoriteMap = Favorites::where('user_id', auth()->id())
        ->pluck('id', 'product_id')
        ->toArray();
    }
    return view('website.offer-page', compact('offerPage', 'products', 'categories', 'offerPages', 'favoriteMap'));
  }

  public function showCategory($slug)
  {
    $category = Catetgory_prodect::where('slug', $slug)->firstOrFail();
    $products = $category->products()->withAvg('reviews', 'rating')->withCount('reviews')->with('inventoryItem')->get();
    $categories = Catetgory_prodect::all();
    $offerPages = OffersPage::all();
    $favoriteMap = [];
    if (auth()->check()) {
      $favoriteMap = Favorites::where('user_id', auth()->id())
        ->pluck('id', 'product_id')
        ->toArray();
    }
    return view('website.category', compact('category', 'products', 'categories', 'offerPages', 'favoriteMap'));
  }

  public function showMyFavorite()
  {
    $user      = auth()->user();
    $favorites = $user ? $user->favorites()->with('product.inventoryItem')->get() : collect();
    $categories = Catetgory_prodect::all();
    $offerPages = OffersPage::all();
    return view('website.my-favorite', compact('favorites', 'categories', 'offerPages'));
  }

  public function showMyBags()
  {
    $user    = auth()->user();
    $carts   = $user ? $user->carts()->with('product.inventoryItem')->get() : collect();
    $favMap  = [];
    if ($user) {
      $favMap = Favorites::where('user_id', $user->id)
        ->pluck('id', 'product_id')
        ->toArray();
    }
    $userAddress = $user ? Adress_coustomer::where('user_id', $user->id)->first() : null;
    $categories  = Catetgory_prodect::all();
    $offerPages  = OffersPage::all();
    return view('website.my-bags', compact('carts', 'favMap', 'categories', 'offerPages', 'userAddress'));
  }

  public function showMyAddress()
  {
    $user        = auth()->user();
    $userAddress = $user ? Adress_coustomer::where('user_id', $user->id)->first() : null;
    $categories  = Catetgory_prodect::all();
    $offerPages  = OffersPage::all();
    return view('website.my-address', compact('userAddress', 'categories', 'offerPages'));
  }

  public function showSearch(Request $request): View
  {
    $q          = trim($request->query('q', ''));
    $offerPages = OffersPage::all();
    $categories = Catetgory_prodect::all();
    return view('website.search', compact('q', 'offerPages', 'categories'));
  }

  public function showCreateGiftBox()
  {
    $products = Products::withAvg('reviews', 'rating')->withCount('reviews')->with('inventoryItem')->get();
    $categories = Catetgory_prodect::all();
    $offerPages = OffersPage::all();
    $favoriteMap = [];
    if (auth()->check()) {
      $favoriteMap = Favorites::where('user_id', auth()->id())
        ->pluck('id', 'product_id')
        ->toArray();
    }
    return view('website.create_gift', compact('products', 'categories', 'offerPages', 'favoriteMap'));
  }

  public function showAbout()
  {
    $categories = Catetgory_prodect::all();
    $offerPages = OffersPage::all();
    return view('website.about', compact('categories', 'offerPages'));
  }
}
