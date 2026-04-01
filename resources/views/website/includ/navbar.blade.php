<nav class="category-topbar">
    <ul class="add-cart">
        @foreach($categories as $category)
        <a
            class="add"
            style="font-size: 15px; padding: 5px 30px"
            href="{{ route('category.show', $category->slug) }}">

            <li>{{$category->name}}</li>
        </a>
        @endforeach
        @foreach($offerPages as $offerPage)
        @if(str_contains($offerPage->location, 'navbar'))
        <a
            class="add"
            style="font-size: 15px; padding: 5px 30px"
            href="{{ route('offer.show', $offerPage->slug) }}">
            <li>{{ $offerPage->title }}</li>
        </a>
        @endif
        @endforeach
    </ul>
</nav>