<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\ResourceController;
use App\Http\Controllers\API\FaqController;
use App\Http\Controllers\API\SearchController;
use App\Http\Controllers\API\BillTracker\BillController;
use App\Http\Controllers\API\BillTracker\MemberController;
use App\Http\Controllers\API\BillTracker\AssemblyController;
use App\Http\Controllers\API\WordPress\PostController;
use App\Http\Controllers\API\WordPress\PageController;

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
    Route::get('/resources/{id}', [ResourceController::class, 'show']);
    Route::get('/resources/{id}/file', [ResourceController::class, 'getFile']);
    Route::get('/faqs', [FaqController::class, 'index']);
    Route::get('/faqs/{id}', [FaqController::class, 'show']);

    // BillTracker Public Data
    Route::prefix('billtracker')->group(function () {
        // Bills
        Route::get('/bills', [BillController::class, 'index']);
        Route::get('/bills/{id}', [BillController::class, 'show']);
        Route::get('/bills/status/{status}', [BillController::class, 'byStatus']);
        Route::get('/bills/sponsor', [BillController::class, 'bySponsor']);

        // Members
        Route::get('/members', [MemberController::class, 'index']);
        Route::get('/members/{id}', [MemberController::class, 'show']);
        Route::get('/members/state/{state}', [MemberController::class, 'byState']);
        Route::get('/members/party/{party}', [MemberController::class, 'byParty']);
        Route::get('/members/chamber/{chamber}', [MemberController::class, 'byChamber']);

        // Assemblies
        Route::get('/assemblies', [AssemblyController::class, 'index']);
        Route::get('/assemblies/{id}', [AssemblyController::class, 'show']);
        Route::get('/assemblies/active', [AssemblyController::class, 'active']);
    });


    // WordPress Routes
    Route::prefix('wordpress')->group(function () {
        // Posts / News
        Route::get('/news', [PostController::class, 'latest']);
        Route::get('/posts', [PostController::class, 'index']);
        Route::get('/posts/{id}', [PostController::class, 'show']);

        // Pages
        Route::get('/pages', [PageController::class, 'index']);
        Route::get('/pages/{id}', [PageController::class, 'show']);
    });

    // Search
    Route::get('/search', [SearchController::class, 'advancedSearch']);
    Route::get('/search/unified', [SearchController::class, 'unifiedSearch']);
    Route::get('/news/latest', [SearchController::class, 'latestNews']);
});
