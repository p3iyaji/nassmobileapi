<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NassLibraryService
{
    protected $baseUrl = 'https://nasslibrary.com/api';


    /**
     * Register a new user
     */
    public function register(array $data)
    {
        try {
            $response = Http::post("{$this->baseUrl}/register", $data);

            if ($response->successful()) {
                $jsonResponse = $response->json();

                // Transform the API response to our expected format
                return [
                    'success' => true,
                    'data' => [
                        'user' => $jsonResponse['user'] ?? null,
                        'token' => $jsonResponse['access_token'] ?? null,
                        'token_type' => $jsonResponse['token_type'] ?? 'Bearer'
                    ]
                ];
            }

            // Handle validation errors (422)
            if ($response->status() === 422) {
                $errors = $response->json();
                return [
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $errors['errors'] ?? $errors
                ];
            }

            Log::warning('Registration failed', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return [
                'success' => false,
                'message' => 'Registration failed',
                'errors' => $response->json() ?? null
            ];
        } catch (\Exception $e) {
            Log::error('Registration exception', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'message' => 'Registration service unavailable'
            ];
        }
    }

    /**
     * Login user - FIXED to match actual API response
     */
    public function login($email, $password)
    {
        try {
            $response = Http::post("{$this->baseUrl}/login", [
                'email' => $email,
                'password' => $password
            ]);

            // Check if the request was successful
            if ($response->successful()) {
                $jsonResponse = $response->json();

                // Transform the API response to our expected format
                return [
                    'success' => true,
                    'data' => [
                        'user' => $jsonResponse['user'] ?? null,
                        'token' => $jsonResponse['access_token'] ?? null,
                        'token_type' => $jsonResponse['token_type'] ?? 'Bearer'
                    ]
                ];
            }

            // Handle validation errors (422) - incorrect credentials
            if ($response->status() === 422) {
                $errors = $response->json();
                return [
                    'success' => false,
                    'message' => 'Invalid credentials',
                    'errors' => $errors['errors'] ?? $errors
                ];
            }

            // Handle other errors
            Log::warning('Login failed', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return [
                'success' => false,
                'message' => 'Login failed'
            ];
        } catch (\Exception $e) {
            Log::error('Login exception', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'message' => 'Login service unavailable'
            ];
        }
    }


    public function refreshToken($token)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$token}",
            ])->post("{$this->baseUrl}/token/refresh");
        } catch (\Exception $e) {
            Log::error('Refresh token exception', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => 'Refresh token service unavailable'
            ];
        }
        if ($response->successful()) {
            $jsonResponse = $response->json();
            return [
                'success' => true,
                'data' => $jsonResponse
            ];
        }
    }
    /**
     * Get user profile - FIXED to match actual API response
     */
    public function getProfile($token)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$token}",
                'Accept' => 'application/json'
            ])->get("{$this->baseUrl}/user");

            if ($response->successful()) {
                $jsonResponse = $response->json();

                // The API returns { "user": { ... } }
                return [
                    'success' => true,
                    'data' => $jsonResponse['user'] ?? $jsonResponse
                ];
            }

            // Handle 401 Unauthorized
            if ($response->status() === 401) {
                return [
                    'success' => false,
                    'message' => 'Invalid or expired token'
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to fetch profile'
            ];
        } catch (\Exception $e) {
            Log::error('Get profile exception', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => 'Profile service unavailable'
            ];
        }
    }

    /**
     * Logout user
     */
    public function logout($token)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$token}"
            ])->post("{$this->baseUrl}/logout");

            return [
                'success' => $response->successful(),
                'message' => $response->successful() ? 'Logged out successfully' : 'Logout failed'
            ];
        } catch (\Exception $e) {
            Log::error('Logout exception', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => 'Logout service unavailable'
            ];
        }
    }

    /**
     * Update user profile
     */
    public function updateProfile($token, array $data)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$token}"
            ])->put("{$this->baseUrl}/updateprofile", $data);

            if ($response->successful()) {
                $jsonResponse = $response->json();

                return [
                    'success' => true,
                    'data' => [
                        'user' => $jsonResponse['user'] ?? null,
                        'message' => $jsonResponse['message'] ?? 'Profile updated'
                    ]
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Profile update failed'
            ];
        } catch (\Exception $e) {
            Log::error('Profile update exception', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => 'Profile update service unavailable'
            ];
        }
    }
    // Get all categories from the Nass Library API
    public function getCategories()
    {
        return Cache::remember('nass_categories', 3600, function () {
            $response = Http::get("{$this->baseUrl}/categories");

            if ($response->successful()) {
                return $response->json()['data'] ?? [];
            }

            return [];
        });
    }

    // Get specific category by ID
    public function getCategory($id)
    {
        $response = Http::get("{$this->baseUrl}/categories/{$id}");

        if ($response->successful()) {
            return $response->json()['data'] ?? [];
        }

        return [];
    }

    // Fetch resources with optional filters
    public function getResources($categoryId = null)
    {
        $url = $categoryId ? "{$this->baseUrl}/categoryresources/{$categoryId}" :
            "{$this->baseUrl}/resources";

        $response = Http::get($url);

        if ($response->successful()) {
            return $response->json()['data'] ?? [];
        }

        return [];
    }

    /**
     * Get resources with authentication (includes file URLs for authenticated users)
     */
    /**
     * Get resources with authentication (includes file URLs for authenticated users)
     */
    public function getResourcesWithAuth($categoryId = null, $token = null)
    {
        try {
            $url = $categoryId
                ? "{$this->baseUrl}/categoryresources/{$categoryId}"
                : "{$this->baseUrl}/resources";

            Log::info('Fetching resources with auth', [
                'url' => $url,
                'token_present' => !is_null($token),
                'token_preview' => $token ? substr($token, 0, 10) . '...' : null
            ]);

            // Build the request with proper headers
            $http = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json'
            ]);

            if ($token) {
                $http = $http->withHeaders([
                    'Authorization' => "Bearer {$token}"
                ]);
                Log::info('Added Authorization header');
            }

            $response = $http->get($url);

            Log::info('Resources with auth response', [
                'status' => $response->status(),
                'has_file_in_first_item' => $this->checkFirstItemForFile($response->json())
            ]);

            if ($response->successful()) {
                $data = $response->json();

                // Log a sample resource to see if file is present
                if (isset($data['data']) && count($data['data']) > 0) {
                    $firstResource = $data['data'][0];
                    Log::info('Sample resource from API', [
                        'id' => $firstResource['id'] ?? null,
                        'title' => $firstResource['title'] ?? null,
                        'has_file' => isset($firstResource['file']),
                        'file_keys' => array_keys($firstResource)
                    ]);
                }

                return $data['data'] ?? [];
            }

            // Log error response
            Log::warning('Resources with auth failed', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return [];
        } catch (\Exception $e) {
            Log::error('Get resources with auth exception', [
                'error' => $e->getMessage(),
                'token_present' => !is_null($token)
            ]);
            return [];
        }
    }

    /**
     * Helper method to check if first item has file
     */
    private function checkFirstItemForFile($jsonResponse)
    {
        if (!$jsonResponse || !isset($jsonResponse['data']) || empty($jsonResponse['data'])) {
            return 'no_data';
        }

        $firstItem = $jsonResponse['data'][0];
        return isset($firstItem['file']) ? 'yes' : 'no';
    }

    /**
     * Get specific resource with authentication
     */
    public function getResourceWithAuth($id, $token = null)
    {
        try {
            Log::info('Fetching single resource with auth', [
                'resource_id' => $id,
                'token_present' => !is_null($token)
            ]);

            $http = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json'
            ]);

            if ($token) {
                $http = $http->withHeaders([
                    'Authorization' => "Bearer {$token}"
                ]);
            }

            $response = $http->get("{$this->baseUrl}/resources/{$id}");

            if ($response->successful()) {
                $data = $response->json();

                // Check if file is present
                $resource = $data['data'] ?? null;
                if ($resource) {
                    Log::info('Single resource fetched', [
                        'id' => $id,
                        'has_file' => isset($resource['file']),
                        'file_url' => $resource['file'] ?? null
                    ]);
                }

                return $resource;
            }

            Log::warning('Get resource with auth failed', [
                'resource_id' => $id,
                'status' => $response->status()
            ]);

            return [];
        } catch (\Exception $e) {
            Log::error('Get resource with auth exception', [
                'resource_id' => $id,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }
    public function getResourceFile($resourceId, $token)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$token}",
                'Accept' => 'application/json'
            ])->get("{$this->baseUrl}/resources/{$resourceId}/file");

            if ($response->successful()) {
                $jsonResponse = $response->json();
                return $jsonResponse['file_url'] ?? $jsonResponse['url'] ?? null;
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Get resource file exception', [
                'resource_id' => $resourceId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    // Get specific resource by ID
    public function getResource($id)
    {
        $response = Http::get("{$this->baseUrl}/resources/{$id}");

        if ($response->successful()) {
            return $response->json()['data'] ?? [];
        }

        return [];
    }



    // Get Faqs
    public function getFaqs()
    {
        return Cache::remember('nass_faqs', 3600, function () {
            $response = Http::get("{$this->baseUrl}/faqs");
            if ($response->successful()) {
                return $response->json()['data'] ?? [];
            }

            return [];
        });
    }

    // Get FAQ by ID
    public function getFaq($id)
    {
        $response = Http::get("{$this->baseUrl}/faqs/{$id}");

        if ($response->successful()) {
            return $response->json()['data'] ?? [];
        }

        return [];
    }
    // Get member's resources (requires token)
    public function getMemberResources($token)
    {
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$token}",
        ])->get("{$this->baseUrl}/member-resources");

        if ($response->successful()) {
            return $response->json()['data'] ?? [];
        }

        return [];
    }

    // Get reading list (requires token)
    public function getReadingList($token)
    {
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$token}",
        ])->get("{$this->baseUrl}/myreadinglist");

        if ($response->successful()) {
            return $response->json()['data'] ?? [];
        }

        return [];
    }
}
