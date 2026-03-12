<?php

namespace App\Auth\Providers;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\UserProvider;
use App\Services\NassLibraryService;
use App\Auth\NassUser;

class NassUserProvider implements UserProvider
{
    protected $nassService;

    public function __construct(NassLibraryService $nassService)
    {
        $this->nassService = $nassService;
    }

    public function retrieveById($identifier)
    {
        return null;
    }

    public function retrieveByToken($identifier, $token)
    {
        $response = $this->nassService->getProfile($token);

        if (isset($response['success']) && $response['success']) {
            return new NassUser($response['data'], $token);
        }

        return null;
    }

    public function updateRememberToken(Authenticatable $user, $token)
    {
        // Not needed
    }

    public function retrieveByCredentials(array $credentials)
    {
        return null;
    }

    public function validateCredentials(Authenticatable $user, array $credentials)
    {
        return false;
    }

    public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false)
    {
        // Not needed
    }
}
