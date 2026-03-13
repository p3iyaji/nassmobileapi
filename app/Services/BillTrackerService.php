<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class BillTrackerService
{
    protected $baseUrl;
    protected $apiKey;

    public function __construct()
    {
        // Initialize properties in constructor, not as default values
        $this->baseUrl = 'https://billtracker.naltf.gov.ng/api/v1';
        $this->apiKey = config('services.billtracker.api_key');
    }

    /**
     * Fetch data from BillTracker API
     */
    public function fetchData(array $resources, array $filters = [], array $pagination = [])
    {
        $cacheKey = $this->generateCacheKey($resources, $filters, $pagination);

        // Cache for 5 minutes to reduce API calls
        return Cache::remember($cacheKey, 300, function () use ($resources, $filters, $pagination) {
            try {
                // Build request payload
                $payload = [
                    'resources' => $resources
                ];

                // Only add filters if they're not empty
                if (!empty($filters)) {
                    $payload['filters'] = $filters;
                }

                // Only add pagination if it's not empty AND has valid keys
                if (!empty($pagination) && (isset($pagination['limit']) || isset($pagination['page']))) {
                    // Ensure pagination is an object (associative array) with proper values
                    $paginationObj = [];
                    if (isset($pagination['limit']) && is_numeric($pagination['limit'])) {
                        $paginationObj['limit'] = (int) $pagination['limit'];
                    }
                    if (isset($pagination['page']) && is_numeric($pagination['page'])) {
                        $paginationObj['page'] = (int) $pagination['page'];
                    }
                    if (!empty($paginationObj)) {
                        $payload['pagination'] = $paginationObj;
                    }
                }

                // Log the request for debugging
                Log::info('BillTracker API Request', [
                    'url' => $this->baseUrl . '/data',
                    'api_key' => substr($this->apiKey, 0, 10) . '...',
                    'payload' => $payload
                ]);

                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json'
                ])->post($this->baseUrl . '/data', $payload);

                // Log the raw response for debugging
                Log::info('BillTracker API Raw Response', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                if ($response->successful()) {
                    return $response->json();
                }

                // Log error for debugging
                Log::warning('BillTracker API error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                return [
                    'success' => false,
                    'error' => [
                        'code' => 'API_ERROR',
                        'message' => 'BillTracker API returned error: ' . $response->status()
                    ]
                ];
            } catch (\Exception $e) {
                Log::error('BillTracker API exception', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);

                return [
                    'success' => false,
                    'error' => [
                        'code' => 'SERVICE_UNAVAILABLE',
                        'message' => 'BillTracker service is temporarily unavailable: ' . $e->getMessage()
                    ]
                ];
            }
        });
    }

    /**
     * Fetch bills with optional filters
     */
    public function getBills(array $filters = [], array $pagination = [])
    {
        $response = $this->fetchData(['bills'], ['bills' => $filters], $pagination);

        // Check if the response indicates success
        if (isset($response['success']) && $response['success'] === true) {
            // Return bills array if it exists
            if (isset($response['data']['bills'])) {
                return $response['data']['bills'];
            }
            // If data exists but not in expected structure, return what we have
            if (isset($response['data'])) {
                return $response['data'];
            }
        }

        // Log what we got for debugging
        Log::info('getBills returning empty array', ['response' => $response]);

        return [];
    }

    /**
     * Fetch members with optional filters
     */
    public function getMembers(array $filters = [], array $pagination = [])
    {
        $response = $this->fetchData(['members'], ['members' => $filters], $pagination);

        if (isset($response['success']) && $response['success'] && isset($response['data']['members'])) {
            return $response['data']['members'];
        }

        return [];
    }

    /**
     * Fetch assemblies with optional filters
     */
    public function getAssemblies(array $filters = [], array $pagination = [])
    {
        $response = $this->fetchData(['assemblies'], ['assemblies' => $filters], $pagination);

        if (isset($response['success']) && $response['success'] && isset($response['data']['assemblies'])) {
            return $response['data']['assemblies'];
        }

        return [];
    }

    /**
     * Get a single bill by ID
     */
    public function getBillById($id)
    {
        $bills = $this->getBills(['id' => $id]);
        return $bills[0] ?? null;
    }

    /**
     * Get a single member by ID
     */
    public function getMemberById($id)
    {
        $members = $this->getMembers(['id' => $id]);
        return $members[0] ?? null;
    }

    /**
     * Get a single assembly by ID
     */
    public function getAssemblyById($id)
    {
        $assemblies = $this->getAssemblies(['id' => $id]);
        return $assemblies[0] ?? null;
    }

    /**
     * Generate cache key based on request parameters
     */
    private function generateCacheKey(array $resources, array $filters, array $pagination)
    {
        return 'billtracker_' . md5(json_encode([
            'resources' => $resources,
            'filters' => $filters,
            'pagination' => $pagination
        ]));
    }
}
