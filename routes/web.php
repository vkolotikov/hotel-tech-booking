<?php

use Illuminate\Support\Facades\Route;

// SPA fallback — serve the React booking app for any non-API route
Route::get('/{any}', function () {
    $spaPath = public_path('spa/index.html');
    if (file_exists($spaPath)) {
        return response()->file($spaPath, ['Content-Type' => 'text/html']);
    }
    return view('welcome');
})->where('any', '^(?!api/).*$');

Route::get('/', function () {
    $spaPath = public_path('spa/index.html');
    if (file_exists($spaPath)) {
        return response()->file($spaPath, ['Content-Type' => 'text/html']);
    }
    return view('welcome');
});
