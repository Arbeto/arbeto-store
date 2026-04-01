<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Arbeto</title>
    @if(!empty($storeSettings?->favicon))
    <link rel="icon" type="image/x-icon" href="{{ asset('storage/'.$storeSettings->favicon) }}" />
    @else
    <link rel="icon" type="image/x-icon" href="{{asset('Arbeto/images/favicoon.png')}}" />
    @endif

    <!-- ملف الاستايل الاساسي -->
    <link rel="stylesheet" href="{{asset('Arbeto/css/style.css')}}" />
    <link rel="stylesheet" href="{{asset('Arbeto/css/index.css')}}" />
    <link rel="stylesheet" href="{{asset('Arbeto/css/auth-sidebar.css')}}" />
    <link rel="stylesheet" href="{{asset('arbeto_dashboard/css/primary-images.css')}}" />
    <!-- CSRF & Auth state for JS -->
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="is-auth" content="{{ auth()->check() ? '1' : '0' }}">
    <!-- مكتية الشعارات bootstrap -->
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
    />