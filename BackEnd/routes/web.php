<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\GoogleController;

// Google Authentication Routes
Route::prefix('auth/google')->group(function () {
    // URL for frontend to get Google auth URL
    Route::get('/url', [GoogleController::class, 'getGoogleAuthUrl']);

    // Callback URL for Google OAuth
    Route::get('/callback', [GoogleController::class, 'handleGoogleCallback']);
});
