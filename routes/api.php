<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\ResourceController;
use App\Http\Controllers\API\FaqController;
use App\Http\Controllers\API\SearchController;

// All routes without middleware - your controllers handle validation
Route::prefix('v1')->group(function () {
    // Authentication
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/token/refresh', [AuthController::class, 'refreshToken']);

    // Protected routes - your controllers validate the token
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Member-only resources - your controllers validate the token
    //Route::get('/member-resources', [ResourceController::class, 'memberResources']);
    Route::get('/my-reading-list', [ResourceController::class, 'readingList']);

    // Public data
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{id}', [CategoryController::class, 'show']);
    Route::get('/resources', [ResourceController::class, 'index']);
    Route::get('/faqs', [FaqController::class, 'index']);
    Route::get('/faqs/{id}', [FaqController::class, 'show']);
    Route::get('/search', [SearchController::class, 'advancedSearch']);
});
