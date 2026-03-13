<?php

namespace App\Http\Controllers\API\WordPress;

use App\Http\Controllers\Controller;
use App\Services\WordPressService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PostController extends Controller
{
    protected $wordPress;

    public function __construct(WordPressService $wordPress)
    {
        $this->wordPress = $wordPress;
    }

    /**
     * Get latest posts/news
     */
    public function latest(Request $request): JsonResponse
    {
        $limit = $request->input('limit', 5);
        $posts = $this->wordPress->getLatestNews($limit);

        return response()->json([
            'success' => true,
            'data' => $posts,
            'count' => count($posts)
        ]);
    }

    /**
     * Get all posts with pagination
     */
    public function index(Request $request): JsonResponse
    {
        $params = [
            'per_page' => $request->input('per_page', 10),
            'page' => $request->input('page', 1),
            'search' => $request->input('search'),
            'categories' => $request->input('categories'),
            'tags' => $request->input('tags')
        ];

        // Remove null values
        $params = array_filter($params, function ($value) {
            return $value !== null && $value !== '';
        });

        $result = $this->wordPress->getPosts($params);

        return response()->json([
            'success' => true,
            'data' => $result['data'],
            'meta' => [
                'total' => $result['total'],
                'total_pages' => $result['total_pages'],
                'current_page' => (int) $request->input('page', 1),
                'per_page' => (int) $request->input('per_page', 10)
            ]
        ]);
    }

    /**
     * Get single post by ID
     */
    public function show($id): JsonResponse
    {
        $post = $this->wordPress->getPost($id);

        if (!$post) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $post
        ]);
    }
}
