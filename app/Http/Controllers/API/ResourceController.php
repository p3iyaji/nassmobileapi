<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\NassLibraryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ResourceController extends Controller
{
    protected $nassService;

    public function __construct(NassLibraryService $nassService)
    {
        $this->nassService = $nassService;
    }

    /**
     * Get all resources (public or authenticated)
     */
    public function index(Request $request)
    {
        $categoryId = $request->query('category_id');
        $token = $request->bearerToken();

        // Use authenticated method if token exists, otherwise use public
        if ($token) {
            $resources = $this->nassService->getResourcesWithAuth($categoryId, $token);
        } else {
            $resources = $this->nassService->getResources($categoryId);
        }

        $isAuthenticated = !is_null($token);

        // Transform resources to include file only if authenticated AND file exists
        $transformedResources = array_map(function ($resource) use ($isAuthenticated, $token) {
            return $this->transformResource($resource, $isAuthenticated, $token);
        }, $resources);

        return response()->json([
            'status' => true,
            'data' => $transformedResources
        ]);
    }

    /**
     * Get a specific resource by ID
     */
    public function show(Request $request, $id)
    {
        $token = $request->bearerToken();

        // Use authenticated method if token exists
        if ($token) {
            $resource = $this->nassService->getResourceWithAuth($id, $token);
        } else {
            $resource = $this->nassService->getResource($id);
        }

        if (!$resource) {
            return response()->json([
                'status' => false,
                'message' => 'Resource not found'
            ], 404);
        }

        $isAuthenticated = !is_null($token);
        $transformedResource = $this->transformResource($resource, $isAuthenticated, $token);

        return response()->json([
            'status' => true,
            'data' => $transformedResource
        ]);
    }

    /**
     * Get member-only resources (requires authentication)
     */
    public function memberResources(Request $request)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'status' => false,
                'message' => 'Authentication required to access member resources'
            ], 401);
        }

        $resources = $this->nassService->getMemberResources($token);

        // Member resources should always include files since user is authenticated
        $transformedResources = array_map(function ($resource) use ($token) {
            return $this->transformResource($resource, true, $token);
        }, $resources);

        return response()->json([
            'status' => true,
            'data' => $transformedResources
        ]);
    }

    /**
     * Get reading list (requires authentication)
     */
    public function readingList(Request $request)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'status' => false,
                'message' => 'Authentication required to access reading list'
            ], 401);
        }

        $readingList = $this->nassService->getReadingList($token);

        $transformedResources = array_map(function ($resource) use ($token) {
            return $this->transformResource($resource, true, $token);
        }, $readingList);

        return response()->json([
            'status' => true,
            'data' => $transformedResources
        ]);
    }

    /**
     * Get resource file URL (requires authentication for restricted resources)
     */
    public function getFile(Request $request, $id)
    {
        $token = $request->bearerToken();

        // First get the resource to check if it's restricted (use authenticated method if token exists)
        if ($token) {
            $resource = $this->nassService->getResourceWithAuth($id, $token);
        } else {
            $resource = $this->nassService->getResource($id);
        }

        if (!$resource) {
            return response()->json([
                'status' => false,
                'message' => 'Resource not found'
            ], 404);
        }

        // Check if resource is restricted and user is not authenticated
        $isRestricted = $resource['is_restricted'] ?? false;

        if ($isRestricted && !$token) {
            return response()->json([
                'status' => false,
                'message' => 'Authentication required to access this file'
            ], 401);
        }

        // If we have a token, use it to get the file from the API
        if ($token) {
            $fileUrl = $this->nassService->getResourceFile($id, $token);

            if ($fileUrl) {
                return response()->json([
                    'status' => true,
                    'file_url' => $fileUrl
                ]);
            }
        }

        // For public resources, return the file if available in the resource data
        if (isset($resource['file'])) {
            return response()->json([
                'status' => true,
                'file_url' => $resource['file']
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'File not available'
        ], 404);
    }

    /**
     * Transform a resource to include/exclude file based on authentication
     */
    private function transformResource($resource, $isAuthenticated, $token = null)
    {
        // Debug log to see what's coming in
        Log::info('transformResource input', [
            'resource_id' => $resource['id'] ?? null,
            'title' => $resource['title'] ?? null,
            'has_file_input' => isset($resource['file']),
            'file_value' => $resource['file'] ?? 'not set',
            'is_authenticated' => $isAuthenticated
        ]);

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

        // CRITICAL FIX: Include file URL if authenticated AND file exists
        if ($isAuthenticated) {
            if (isset($resource['file'])) {
                $transformed['file'] = $resource['file'];
                $transformed['file_accessible'] = true;
                Log::info('File added to transformed resource', [
                    'resource_id' => $resource['id'],
                    'file_url' => $resource['file']
                ]);
            } else {
                $transformed['file_accessible'] = false;
                $transformed['can_fetch_file'] = true;
                Log::info('No file in resource, but authenticated', [
                    'resource_id' => $resource['id']
                ]);
            }
        } else {
            $transformed['file_accessible'] = false;
            $transformed['can_fetch_file'] = false;
        }

        return $transformed;
    }
}
