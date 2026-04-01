<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @if(!empty($storeSettings?->favicon))
        <link rel="icon" type="image/x-icon" href="{{ asset('storage/'.$storeSettings->favicon) }}" />
    @else
        <link rel="icon" type="image/x-icon" href="{{ asset('arbeto_dashboard/image/favicoon.png') }}" />
    @endif
    <link rel="stylesheet" href="{{asset('arbeto_dashboard/css/style.css')}}">
    <title>Arbeto Dashboard</title>
        <!-- مكتية الشعارات bootstrap -->
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
    />
