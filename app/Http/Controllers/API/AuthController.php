<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Services\NassLibraryService;
use Illuminate\Support\Facades\Cache;

class AuthController extends Controller
{
    protected $nassService;

    public function __construct(NassLibraryService $nassService)
    {
        $this->nassService = $nassService;
    }

    /**
     * Register a new user via the Nass Library API
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'sometimes|string|max:20', // Add phone as optional
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Forward registration to Nass Library API
        $response = $this->nassService->register([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'password_confirmation' => $request->password_confirmation,
            'phone' => $request->phone ?? '000-000-0000', // Provide default empty string if not provided
        ]);

        // Check if the registration was successful
        if (!isset($response['success']) || !$response['success']) {
            return response()->json([
                'status' => false,
                'message' => $response['message'] ?? 'Registration failed',
                'errors' => $response['errors'] ?? null
            ], 400);
        }

        // Cache the user data and token if available
        if (isset($response['data']['user']) && isset($response['data']['token'])) {
            $this->cacheUserData($response['data']['user'], $response['data']['token']);
        }

        return response()->json([
            'status' => true,
            'message' => 'User registered successfully on Nass Library',
            'data' => [
                'user' => $response['data']['user'] ?? null,
                'token' => $response['data']['token'] ?? null,
                'token_type' => $response['data']['token_type'] ?? 'Bearer',
            ]
        ], 201);
    }

    /**
     * Login user via Nass Library API
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|max:255',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        $response = $this->nassService->login($request->email, $request->password);

        if (!isset($response['success']) || !$response['success']) {
            return response()->json([
                'status' => false,
                'message' => $response['message'] ?? 'Login failed'
            ], 401);
        }

        // Cache the user data and token
        if (isset($response['data']['user']) && isset($response['data']['token'])) {
            $this->cacheUserData($response['data']['user'], $response['data']['token']);
        }

        return response()->json([
            'status' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $response['data']['user'] ?? $response['data'],
                'token' => $response['data']['token'] ?? null,
                'token_type' => 'Bearer',
                'expires_in' => $response['data']['expires_in'] ?? null
            ]
        ], 200);
    }

    /**
     * Get authenticated user profile from Nass Library API
     */
    public function profile(Request $request)
    {
        // Get token from request (sent by mobile app)
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'status' => false,
                'message' => 'No token provided'
            ], 401);
        }

        // Try to get from cache first
        $cachedUser = $this->getCachedUser($token);

        if ($cachedUser) {
            return response()->json([
                'status' => true,
                'message' => 'Profile fetched from cache',
                'data' => $cachedUser
            ], 200);
        }

        // Fetch fresh profile from API
        $response = $this->nassService->getProfile($token);

        if (!isset($response['success']) || !$response['success']) {
            return response()->json([
                'status' => false,
                'message' => $response['message'] ?? 'Failed to fetch profile'
            ], 401);
        }

        // Cache the profile
        $this->cacheUserData($response['data'], $token);

        return response()->json([
            'status' => true,
            'message' => 'Profile fetched successfully',
            'data' => $response['data']
        ], 200);
    }

    /**
     * Logout user from Nass Library API
     */
    public function logout(Request $request)
    {
        $token = $request->bearerToken();

        if ($token) {
            // Call API logout
            $response = $this->nassService->logout($token);

            // Clear cached user data regardless of API response
            $this->clearUserCache($token);
        }

        return response()->json([
            'status' => true,
            'message' => 'Successfully logged out'
        ], 200);
    }

    /**
     * Refresh user token
     */
    public function refreshToken(Request $request)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'status' => false,
                'message' => 'No token provided'
            ], 401);
        }

        $response = $this->nassService->refreshToken($token);

        if (!isset($response['success']) || !$response['success']) {
            return response()->json([
                'status' => false,
                'message' => $response['message'] ?? 'Token refresh failed'
            ], 401);
        }

        // Update cached data with new token
        if (isset($response['data']['user']) && isset($response['data']['token'])) {
            $this->cacheUserData($response['data']['user'], $response['data']['token']);
        }

        return response()->json([
            'status' => true,
            'message' => 'Token refreshed successfully',
            'data' => [
                'token' => $response['data']['token'] ?? null,
                'token_type' => 'Bearer',
                'expires_in' => $response['data']['expires_in'] ?? null
            ]
        ], 200);
    }

    /**
     * Update user profile via API
     */
    public function updateProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255',
            'current_password' => 'required_with:password|string',
            'password' => 'sometimes|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'status' => false,
                'message' => 'No token provided'
            ], 401);
        }

        $response = $this->nassService->updateProfile($token, $request->all());

        if (!isset($response['success']) || !$response['success']) {
            return response()->json([
                'status' => false,
                'message' => $response['message'] ?? 'Profile update failed'
            ], 400);
        }

        // Update cached user data
        if (isset($response['data']['user'])) {
            $this->cacheUserData($response['data']['user'], $token);
            $userData = $response['data']['user'];
        } elseif (isset($response['data'])) {
            $this->cacheUserData($response['data'], $token);
            $userData = $response['data'];
        } else {
            $userData = null;
        }

        return response()->json([
            'status' => true,
            'message' => 'Profile updated successfully',
            'data' => $userData
        ], 200);
    }

    /**
     * Helper method to cache user data
     */
    private function cacheUserData($user, $token)
    {
        if (!$user || !$token) {
            return;
        }

        $cacheKey = 'user_' . md5($token);
        Cache::put($cacheKey, $user, now()->addHours(1)); // Cache for 1 hour

        // Also store token-to-user mapping
        $userId = $user['id'] ?? $user['email'] ?? md5($token);
        Cache::put('token_user_' . md5($token), $userId, now()->addHours(1));
    }

    /**
     * Helper method to get cached user
     */
    private function getCachedUser($token)
    {
        $cacheKey = 'user_' . md5($token);
        return Cache::get($cacheKey);
    }

    /**
     * Helper method to clear user cache
     */
    private function clearUserCache($token)
    {
        Cache::forget('user_' . md5($token));
        Cache::forget('token_user_' . md5($token));
    }
}
