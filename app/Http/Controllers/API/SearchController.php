<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\NassLibraryService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class SearchController extends Controller
{
    protected $nassService;

    public function __construct(NassLibraryService $nassService)
    {
        $this->nassService = $nassService;
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
            'categories' => [],
            'resources' => [],
            'faqs' => []
        ];

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

        return response()->json([
            'success' => true,
            'query' => $query,
            'authenticated' => $isAuthenticated,
            'results' => $results,
            'total_count' => count($results['categories']) +
                count($results['resources']) +
                count($results['faqs'])
        ]);
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
