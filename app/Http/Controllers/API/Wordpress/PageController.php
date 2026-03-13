<?php

namespace App\Http\Controllers\API\WordPress;

use App\Http\Controllers\Controller;
use App\Services\WordPressService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PageController extends Controller
{
    protected $wordPress;

    public function __construct(WordPressService $wordPress)
    {
        $this->wordPress = $wordPress;
    }

    /**
     * Get all pages
     */
    public function index(Request $request): JsonResponse
    {
        $params = [
            'per_page' => $request->input('per_page', 20),
            'page' => $request->input('page', 1),
            'search' => $request->input('search'),
            'parent' => $request->input('parent')
        ];

        $params = array_filter($params, function ($value) {
            return $value !== null && $value !== '';
        });

        $result = $this->wordPress->getPages($params);

        return response()->json([
            'success' => true,
            'data' => $result['data'],
            'meta' => [
                'total' => $result['total'],
                'total_pages' => $result['total_pages'],
                'current_page' => (int) $request->input('page', 1),
                'per_page' => (int) $request->input('per_page', 20)
            ]
        ]);
    }

    /**
     * Get single page by ID
     */
    public function show($id): JsonResponse
    {
        $page = $this->wordPress->getPage($id);

        if (!$page) {
            return response()->json([
                'success' => false,
                'message' => 'Page not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $page
        ]);
    }
}
