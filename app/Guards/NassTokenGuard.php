<?php

namespace App\Guards;

use Illuminate\Auth\GuardHelpers;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;
use App\Services\NassLibraryService;

class NassTokenGuard implements Guard
{
    use GuardHelpers;

    protected $request;
    protected $nassService;
    protected $user = null;

    public function __construct(Request $request, NassLibraryService $nassService)
    {
        $this->request = $request;
        $this->nassService = $nassService;
    }

    public function user()
    {
        if ($this->user !== null) {
            return $this->user;
        }

        $token = $this->request->bearerToken();

        if (!$token) {
            return null;
        }

        // Fetch user from API using token
        $user = $this->nassService->getProfile($token);

        if ($user) {
            $this->user = $user;
        }

        return $this->user;
    }

    public function validate(array $credentials = [])
    {
        // Implement token validation logic
        return $this->user() !== null;
    }
}
