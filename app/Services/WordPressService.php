<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class WordPressService
{
    protected $baseUrl = 'https://naltf.gov.ng/wp-json/wp/v2';

    /**
     * Fetch latest posts
     */
    public function getPosts(array $params = [])
    {
        $cacheKey = 'wp_posts_' . md5(json_encode($params));

        return Cache::remember($cacheKey, 1800, function () use ($params) { // 30 minutes cache
            try {
                $response = Http::get($this->baseUrl . '/posts', array_merge([
                    'per_page' => 10,
                    '_embed' => true, // This gets featured images and other embedded data
                ], $params));

                if ($response->successful()) {
                    $posts = $response->json();

                    // Get total posts count from headers
                    $total = $response->header('X-WP-Total');
                    $totalPages = $response->header('X-WP-TotalPages');

                    // Process posts to add formatted data
                    foreach ($posts as &$post) {
                        $post = $this->formatPost($post);
                    }

                    return [
                        'data' => $posts,
                        'total' => $total,
                        'total_pages' => $totalPages
                    ];
                }

                return ['data' => [], 'total' => 0, 'total_pages' => 0];
            } catch (\Exception $e) {
                Log::error('WordPress API error (posts)', ['error' => $e->getMessage()]);
                return ['data' => [], 'total' => 0, 'total_pages' => 0];
            }
        });
    }

    /**
     * Fetch pages
     */
    public function getPages(array $params = [])
    {
        $cacheKey = 'wp_pages_' . md5(json_encode($params));

        return Cache::remember($cacheKey, 3600, function () use ($params) { // 1 hour cache
            try {
                $response = Http::get($this->baseUrl . '/pages', array_merge([
                    'per_page' => 20,
                    '_embed' => true,
                ], $params));

                if ($response->successful()) {
                    $pages = $response->json();

                    $total = $response->header('X-WP-Total');
                    $totalPages = $response->header('X-WP-TotalPages');

                    foreach ($pages as &$page) {
                        $page = $this->formatPost($page);
                    }

                    return [
                        'data' => $pages,
                        'total' => $total,
                        'total_pages' => $totalPages
                    ];
                }

                return ['data' => [], 'total' => 0, 'total_pages' => 0];
            } catch (\Exception $e) {
                Log::error('WordPress API error (pages)', ['error' => $e->getMessage()]);
                return ['data' => [], 'total' => 0, 'total_pages' => 0];
            }
        });
    }

    /**
     * Get a single post by ID
     */
    public function getPost($id)
    {
        try {
            $response = Http::get($this->baseUrl . '/posts/' . $id, [
                '_embed' => true
            ]);

            if ($response->successful()) {
                return $this->formatPost($response->json());
            }

            return null;
        } catch (\Exception $e) {
            Log::error('WordPress API error (single post)', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Get a single page by ID
     */
    public function getPage($id)
    {
        try {
            $response = Http::get($this->baseUrl . '/pages/' . $id, [
                '_embed' => true
            ]);

            if ($response->successful()) {
                return $this->formatPost($response->json());
            }

            return null;
        } catch (\Exception $e) {
            Log::error('WordPress API error (single page)', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Get latest news (posts) for homepage
     */
    public function getLatestNews($limit = 5)
    {
        $posts = $this->getPosts(['per_page' => $limit]);
        return $posts['data'] ?? [];
    }

    /**
     * Search WordPress content
     */
    public function search($query, $type = 'any', $perPage = 20)
    {
        $results = [];

        if ($type === 'any' || $type === 'posts') {
            $posts = $this->getPosts([
                'search' => $query,
                'per_page' => $perPage
            ]);
            $results['posts'] = $posts['data'] ?? [];
        }

        if ($type === 'any' || $type === 'pages') {
            $pages = $this->getPages([
                'search' => $query,
                'per_page' => $perPage
            ]);
            $results['pages'] = $pages['data'] ?? [];
        }

        return $results;
    }

    /**
     * Format WordPress post/page for consistent structure
     */
    private function formatPost($post)
    {
        // Extract featured image if available
        $featuredImage = null;
        if (isset($post['_embedded']['wp:featuredmedia'][0]['source_url'])) {
            $featuredImage = $post['_embedded']['wp:featuredmedia'][0]['source_url'];
        } elseif (isset($post['featured_image_url'])) {
            $featuredImage = $post['featured_image_url'];
        }

        // Format date
        $date = isset($post['date']) ? date('Y-m-d H:i:s', strtotime($post['date'])) : null;
        $modified = isset($post['modified']) ? date('Y-m-d H:i:s', strtotime($post['modified'])) : null;

        // Extract author name if available
        $authorName = null;
        if (isset($post['_embedded']['author'][0]['name'])) {
            $authorName = $post['_embedded']['author'][0]['name'];
        }

        return [
            'id' => $post['id'],
            'type' => $post['type'] ?? 'post',
            'title' => $post['title']['rendered'] ?? '',
            'excerpt' => strip_tags($post['excerpt']['rendered'] ?? ''),
            'content' => $post['content']['rendered'] ?? '',
            'slug' => $post['slug'] ?? '',
            'link' => $post['link'] ?? '',
            'date' => $date,
            'modified' => $modified,
            'author' => $authorName,
            'featured_image' => $featuredImage,
            'categories' => $post['_embedded']['wp:term'][0] ?? [],
            'tags' => $post['_embedded']['wp:term'][1] ?? []
        ];
    }
}
