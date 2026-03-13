<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\NassLibraryService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Services\BillTrackerService;
use App\Services\WordPressService;

class SearchController extends Controller
{
    protected $nassService;
    protected $billTracker;
    protected $wordPress;

    public function __construct(
        NassLibraryService $nassService,
        BillTrackerService $billTracker,
        WordPressService $wordPress
    ) {
        $this->nassService = $nassService;
        $this->billTracker = $billTracker;
        $this->wordPress = $wordPress;
    }
    /**
     * Advanced search across categories, resources, and FAQs
     * With authentication-aware file display for resources
     */
    public function advancedSearch(Request $request): JsonResponse
    {
        $query = strtolower($request->input('q', ''));
        $type = $request->input('type', 'all');
        $token = $request->bearerToken();
        $isAuthenticated = !is_null($token);

        Log::info('=== SEARCH DEBUG ===', [
            'query' => $query,
            'type' => $type,
            'authenticated' => $isAuthenticated,
            'token_exists' => !is_null($token)
        ]);

        $results = [
            'nass_library' => [
                'categories' => [],
                'resources' => [],
                'faqs' => []
            ],
            'bill_tracker' => [
                'bills' => [],
                'members' => [],
                'assemblies' => []
            ],
            'wordpress' => [
                'news' => [],
                'pages' => []
            ]
        ];

        // Search in Nass Library
        // Search in categories (always public)
        if ($type === 'all' || $type === 'categories') {
            $categories = $this->nassService->getCategories();
            $results['categories'] = array_values(array_filter($categories, function ($category) use ($query) {
                return empty($query) ||
                    str_contains(strtolower($category['name'] ?? ''), $query) ||
                    str_contains(strtolower($category['description'] ?? ''), $query);
            }));
        }

        // Search in resources (with authentication awareness)
        if ($type === 'all' || $type === 'resources') {
            // Use authenticated method if token exists
            if ($token) {
                Log::info('Fetching resources with auth token');
                $resources = $this->nassService->getResourcesWithAuth(null, $token);
            } else {
                Log::info('Fetching public resources (no token)');
                $resources = $this->nassService->getResources();
            }

            // Log total resources fetched
            Log::info('Total resources fetched', ['count' => count($resources)]);

            // Filter resources by query - PRESERVE ALL DATA during filtering
            $filteredResources = [];
            foreach ($resources as $resource) {
                if (empty($query)) {
                    $filteredResources[] = $resource;
                    continue;
                }

                $matches = str_contains(strtolower($resource['title'] ?? ''), $query)
                    || str_contains(strtolower($resource['abstract'] ?? ''), $query)
                    || str_contains(strtolower($resource['description'] ?? ''), $query)
                    || str_contains(strtolower($resource['authors'] ?? ''), $query)
                    || str_contains(strtolower($resource['tags'] ?? ''), $query);

                if ($matches) {
                    // Keep the ENTIRE resource data intact
                    $filteredResources[] = $resource;
                }
            }

            Log::info('Resources after filtering', ['count' => count($filteredResources)]);

            // Transform each resource
            $results['resources'] = array_values(array_map(function ($resource) use ($isAuthenticated, $token) {
                return $this->transformResource($resource, $isAuthenticated, $token);
            }, $filteredResources));

            // Log final transformed resources
            if (!empty($results['resources'])) {
                $sample = $results['resources'][0];
                Log::info('Final transformed resource', [
                    'id' => $sample['id'] ?? null,
                    'title' => $sample['title'] ?? null,
                    'has_file' => isset($sample['file']),
                    'file_accessible' => $sample['file_accessible'] ?? false,
                    'file_url' => $sample['file'] ?? null
                ]);
            }
        }

        // Search in FAQs (always public)
        if ($type === 'all' || $type === 'faqs') {
            $faqs = $this->nassService->getFaqs();
            $results['faqs'] = array_values(array_filter($faqs, function ($faq) use ($query) {
                return empty($query) ||
                    str_contains(strtolower($faq['question'] ?? ''), $query) ||
                    str_contains(strtolower($faq['answer'] ?? ''), $query);
            }));
        }

        // Search BillTracker
        if ($type === 'all' || $type === 'billtracker' || $type === 'bills') {
            $results['bill_tracker']['bills'] = $this->searchBills($query);
        }

        if ($type === 'all' || $type === 'billtracker' || $type === 'members') {
            $results['bill_tracker']['members'] = $this->searchMembers($query);
        }

        if ($type === 'all' || $type === 'billtracker' || $type === 'assemblies') {
            $results['bill_tracker']['assemblies'] = $this->searchAssemblies($query);
        }

        // Search WordPress (before building flat so counts are correct)
        if ($type === 'all' || $type === 'wordpress' || $type === 'news') {
            $results['wordpress']['news'] = $this->searchWordPressNews($query);
        }

        if ($type === 'all' || $type === 'wordpress' || $type === 'pages') {
            $results['wordpress']['pages'] = $this->searchWordPressPages($query);
        }

        // Flatten results for mobile: categories, resources, faqs, bill_tracker, wordpress at top level
        $flat = [
            'categories' => $results['categories'] ?? [],
            'resources' => $results['resources'] ?? [],
            'faqs' => $results['faqs'] ?? [],
            'bill_tracker' => $results['bill_tracker'],
            'wordpress' => [
                'news' => $results['wordpress']['news'] ?? [],
                'pages' => $results['wordpress']['pages'] ?? [],
            ],
        ];

        $totalCount =
            count($flat['categories']) +
            count($flat['resources']) +
            count($flat['faqs']) +
            count($flat['bill_tracker']['bills']) +
            count($flat['bill_tracker']['members']) +
            count($flat['bill_tracker']['assemblies']) +
            count($flat['wordpress']['news']) +
            count($flat['wordpress']['pages']);

        return response()->json([
            'success' => true,
            'query' => $query,
            'type' => $type,
            'results' => $flat,
            'total_count' => $totalCount,
            'counts' => [
                'categories' => count($flat['categories']),
                'resources' => count($flat['resources']),
                'faqs' => count($flat['faqs']),
                'bills' => count($flat['bill_tracker']['bills']),
                'members' => count($flat['bill_tracker']['members']),
                'assemblies' => count($flat['bill_tracker']['assemblies']),
                'news' => count($flat['wordpress']['news']),
                'pages' => count($flat['wordpress']['pages']),
            ]
        ]);
    }


    /**
     * Unified search across both platforms
     */
    public function unifiedSearch(Request $request): JsonResponse
    {
        $query = strtolower($request->input('q'));
        $limit = $request->input('limit', 20);

        $allResults = [];

        // Search Nass Library
        $categories = $this->searchNassCategories($query);
        foreach ($categories as $item) {
            $allResults[] = [
                'type' => 'nass_category',
                'source' => 'Nass Library',
                'id' => $item['id'],
                'title' => $item['name'],
                'description' => $item['description'] ?? '',
                'image' => $item['cover_image'] ?? null,
                'url' => "/categories/{$item['slug']}",
                'relevance_score' => $this->calculateRelevance($query, $item['name'], $item['description'] ?? '')
            ];
        }

        // Search Nass Resources
        $resources = $this->searchNassResources($query);
        foreach ($resources as $item) {
            $allResults[] = [
                'type' => 'nass_resource',
                'source' => 'Nass Library',
                'id' => $item['id'],
                'title' => $item['title'] ?? $item['name'] ?? 'Resource',
                'description' => $item['description'] ?? '',
                'url' => "/resources/{$item['id']}",
                'relevance_score' => $this->calculateRelevance($query, $item['title'] ?? '', $item['description'] ?? '')
            ];
        }

        // Search Bills
        $bills = $this->searchBills($query);
        foreach ($bills as $item) {
            $allResults[] = [
                'type' => 'bill',
                'source' => 'BillTracker',
                'id' => $item['id'],
                'number' => $item['number'] ?? '',
                'title' => $item['title'],
                'summary' => $item['summary'] ?? '',
                'status' => $item['status'] ?? '',
                'sponsor' => $item['sponsorName'] ?? '',
                'url' => "/bills/{$item['id']}",
                'relevance_score' => $this->calculateRelevance($query, $item['title'], $item['summary'] ?? '')
            ];
        }

        // Search Members
        $members = $this->searchMembers($query);
        foreach ($members as $item) {
            $allResults[] = [
                'type' => 'member',
                'source' => 'BillTracker',
                'id' => $item['id'],
                'name' => $item['name'],
                'party' => $item['party'] ?? '',
                'state' => $item['state'] ?? '',
                'chamber' => $item['chamber'] ?? '',
                'position' => $item['position'] ?? '',
                'image' => $item['imageUrl'] ?? null,
                'url' => "/members/{$item['id']}",
                'relevance_score' => $this->calculateRelevance($query, $item['name'], $item['biography'] ?? '')
            ];
        }

        // Search Assemblies
        $assemblies = $this->searchAssemblies($query);
        foreach ($assemblies as $item) {
            $allResults[] = [
                'type' => 'assembly',
                'source' => 'BillTracker',
                'id' => $item['id'],
                'name' => $item['name'],
                'status' => $item['status'] ?? '',
                'start_date' => $item['startDate'] ?? '',
                'end_date' => $item['endDate'] ?? null,
                'url' => "/assemblies/{$item['id']}",
                'relevance_score' => $this->calculateRelevance($query, $item['name'])
            ];
        }

        // Search WordPress News (Posts)
        $news = $this->searchWordPressNews($query);
        foreach ($news as $item) {
            $allResults[] = [
                'type' => 'news',
                'source' => 'NALTF',
                'source_type' => 'News',
                'id' => $item['id'],
                'title' => $item['title'],
                'description' => $item['excerpt'] ?? '',
                'content' => $item['content'] ?? '',
                'image' => $item['featured_image'] ?? null,
                'author' => $item['author'] ?? '',
                'url' => $item['link'] ?? "/news/{$item['id']}",
                'date' => $item['date'] ?? null,
                'relevance_score' => $this->calculateRelevance($query, $item['title'], $item['excerpt'] ?? '', $item['content'] ?? '')
            ];
        }

        // Search WordPress Pages
        $pages = $this->searchWordPressPages($query);
        foreach ($pages as $item) {
            $allResults[] = [
                'type' => 'page',
                'source' => 'NALTF',
                'source_type' => 'Page',
                'id' => $item['id'],
                'title' => $item['title'],
                'description' => $item['excerpt'] ?? '',
                'content' => $item['content'] ?? '',
                'image' => $item['featured_image'] ?? null,
                'url' => $item['link'] ?? "/pages/{$item['id']}",
                'date' => $item['date'] ?? null,
                'relevance_score' => $this->calculateRelevance($query, $item['title'], $item['excerpt'] ?? '', $item['content'] ?? '')
            ];
        }

        // Sort by relevance score
        usort($allResults, function ($a, $b) {
            return $b['relevance_score'] <=> $a['relevance_score'];
        });

        // Apply limit
        $allResults = array_slice($allResults, 0, $limit);

        return response()->json([
            'success' => true,
            'query' => $query,
            'results' => $allResults,
            'total_found' => count($allResults)
        ]);
    }

    /**
     * Search Nass Library categories
     */
    private function searchNassCategories($query)
    {
        $categories = $this->nassService->getCategories();

        return array_filter($categories, function ($category) use ($query) {
            return str_contains(strtolower($category['name'] ?? ''), $query)
                || str_contains(strtolower($category['description'] ?? ''), $query);
        });
    }

    /**
     * Search Nass Library resources
     */
    private function searchNassResources($query)
    {
        $resources = $this->nassService->getResources();

        return array_filter($resources, function ($resource) use ($query) {
            return str_contains(strtolower($resource['title'] ?? ''), $query)
                || str_contains(strtolower($resource['description'] ?? ''), $query)
                || str_contains(strtolower($resource['content'] ?? ''), $query);
        });
    }

    /**
     * Search Nass Library FAQs
     */
    private function searchNassFaqs($query)
    {
        $faqs = $this->nassService->getFaqs();

        return array_filter($faqs, function ($faq) use ($query) {
            return str_contains(strtolower($faq['question'] ?? ''), $query)
                || str_contains(strtolower($faq['answer'] ?? ''), $query);
        });
    }

    /**
     * Search bills
     */
    private function searchBills($query)
    {
        $bills = $this->billTracker->getBills();

        return array_filter($bills, function ($bill) use ($query) {
            return str_contains(strtolower($bill['title'] ?? ''), $query)
                || str_contains(strtolower($bill['summary'] ?? ''), $query)
                || str_contains(strtolower($bill['number'] ?? ''), $query)
                || str_contains(strtolower($bill['sponsorName'] ?? ''), $query)
                || $this->arrayContains($bill['tags'] ?? [], $query);
        });
    }

    /**
     * Search members
     */
    private function searchMembers($query)
    {
        $members = $this->billTracker->getMembers();

        return array_filter($members, function ($member) use ($query) {
            return str_contains(strtolower($member['name'] ?? ''), $query)
                || str_contains(strtolower($member['party'] ?? ''), $query)
                || str_contains(strtolower($member['state'] ?? ''), $query)
                || str_contains(strtolower($member['chamber'] ?? ''), $query)
                || str_contains(strtolower($member['district'] ?? ''), $query)
                || str_contains(strtolower($member['biography'] ?? ''), $query);
        });
    }

    /**
     * Search assemblies
     */
    private function searchAssemblies($query)
    {
        $assemblies = $this->billTracker->getAssemblies();

        return array_filter($assemblies, function ($assembly) use ($query) {
            return str_contains(strtolower($assembly['name'] ?? ''), $query);
        });
    }

    /**
     * Get latest news from WordPress
     */
    public function latestNews(Request $request): JsonResponse
    {
        $limit = $request->input('limit', 5);
        $news = $this->wordPress->getLatestNews($limit);

        return response()->json([
            'success' => true,
            'data' => $news,
            'count' => count($news)
        ]);
    }
    
    // ... (keep all your existing search methods)

    /**
     * Search WordPress news (posts)
     */
    private function searchWordPressNews($query)
    {
        $result = $this->wordPress->search($query, 'posts', 10);
        return $result['posts'] ?? [];
    }

    /**
     * Search WordPress pages
     */
    private function searchWordPressPages($query)
    {
        $result = $this->wordPress->search($query, 'pages', 10);
        return $result['pages'] ?? [];
    }

    /**
     * Calculate relevance score for sorting
     */
    private function calculateRelevance($query, ...$fields)
    {
        $score = 0;
        $query = strtolower($query);

        foreach ($fields as $field) {
            $field = strtolower($field ?? '');
            if (strpos($field, $query) !== false) {
                // Exact match at start gets highest score
                if (strpos($field, $query) === 0) {
                    $score += 10;
                }
                // Word boundary match gets medium score
                elseif (preg_match("/\b" . preg_quote($query, '/') . "/", $field)) {
                    $score += 5;
                }
                // Any match gets base score
                else {
                    $score += 1;
                }
            }
        }

        return $score;
    }

    /**
     * Check if array contains query string
     */
    private function arrayContains($array, $query)
    {
        if (!is_array($array)) {
            return false;
        }

        foreach ($array as $item) {
            if (str_contains(strtolower($item ?? ''), $query)) {
                return true;
            }
        }

        return false;
    }
    /**
     * Search specifically within member-only resources
     */
    public function memberSearch(Request $request): JsonResponse
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'status' => false,
                'message' => 'Authentication required to search member resources'
            ], 401);
        }

        $query = strtolower($request->input('q'));

        // Get member resources
        $memberResources = $this->nassService->getMemberResources($token);

        // Filter by query
        $filteredResources = array_filter($memberResources, function ($resource) use ($query) {
            return empty($query) ||
                str_contains(strtolower($resource['title'] ?? ''), $query) ||
                str_contains(strtolower($resource['abstract'] ?? ''), $query) ||
                str_contains(strtolower($resource['authors'] ?? ''), $query);
        });

        // Transform resources (authenticated = true, so files will be included)
        $transformedResources = array_map(function ($resource) use ($token) {
            return $this->transformResource($resource, true, $token);
        }, array_values($filteredResources));

        return response()->json([
            'success' => true,
            'query' => $query,
            'authenticated' => true,
            'results' => $transformedResources,
            'total_count' => count($transformedResources)
        ]);
    }

    /**
     * Transform a resource to include/exclude file based on authentication
     * (Identical to the method in ResourceController)
     */
    private function transformResource($resource, $isAuthenticated, $token = null)
    {
        // Create base resource without file
        $transformed = [
            'id' => $resource['id'] ?? null,
            'title' => $resource['title'] ?? null,
            'slug' => $resource['slug'] ?? null,
            'category_id' => $resource['category_id'] ?? null,
            'authors' => $resource['authors'] ?? null,
            'authors_affiliation' => $resource['authors_affiliation'] ?? null,
            'publisher' => $resource['publisher'] ?? null,
            'date_of_publication' => $resource['date_of_publication'] ?? null,
            'year_of_publication' => $resource['year_of_publication'] ?? null,
            'issn_isbn_doi' => $resource['issn_isbn_doi'] ?? null,
            'edition' => $resource['edition'] ?? null,
            'volume' => $resource['volume'] ?? null,
            'issue' => $resource['issue'] ?? null,
            'abstract' => $resource['abstract'] ?? null,
            'references' => $resource['references'] ?? null,
            'tags' => $resource['tags'] ?? null,
            'pages' => $resource['pages'] ?? null,
            'cover_image' => $resource['cover_image'] ?? null,
            'is_restricted' => $resource['is_restricted'] ?? false,
            'view_count' => $resource['view_count'] ?? 0,
        ];

        // Include file URL only if authenticated AND file exists in the response
        if ($isAuthenticated && isset($resource['file'])) {
            $transformed['file'] = $resource['file'];
        }

        // Add a flag indicating if file is accessible
        $transformed['file_accessible'] = $isAuthenticated && isset($resource['file']);

        // If authenticated but file not in resource, try to fetch it
        if ($isAuthenticated && !isset($resource['file']) && isset($resource['id']) && $token) {
            // We don't fetch here to avoid N+1 queries, but we could add a flag
            $transformed['file_available'] = false;
            $transformed['can_fetch_file'] = true; // Client can call /file endpoint
        }

        return $transformed;
    }

    /**
     * Get file for a specific resource from search results
     */
    public function getResourceFile(Request $request, $id)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'status' => false,
                'message' => 'Authentication required to access files'
            ], 401);
        }

        $fileUrl = $this->nassService->getResourceFile($id, $token);

        if ($fileUrl) {
            return response()->json([
                'status' => true,
                'file_url' => $fileUrl
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'File not available'
        ], 404);
    }
}
