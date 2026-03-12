<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\NassLibraryService;

class CategoryController extends Controller
{
    protected $nassService;

    public function __construct(NassLibraryService $nassService)
    {
        $this->nassService = $nassService;
    }

    // get all categories
    public function index()
    {
        $categories = $this->nassService->getCategories();

        return response()->json([
            'success' => true,
            'message' => 'Categories fetched successfully',
            'data' => $categories,
            'count' => count($categories),
        ], 200);
    }

    // get specific category by id
    public function show($id)
    {
        $category = $this->nassService->getCategory($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found'
            ], 400);
        }

        return response()->json([
            'success' => true,
            'data' => $category
        ], 200);
    }
}
