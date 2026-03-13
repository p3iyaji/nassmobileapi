<?php

namespace App\Http\Controllers\API\BillTracker;

use App\Http\Controllers\Controller;
use App\Services\BillTrackerService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MemberController extends Controller
{
    protected $billTracker;

    public function __construct(BillTrackerService $billTracker)
    {
        $this->billTracker = $billTracker;
    }

    /**
     * Get all members with optional filters
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['party', 'state', 'chamber', 'gender', 'isActive', 'name']);
        $pagination = $request->only(['limit', 'page']);

        $members = $this->billTracker->getMembers($filters, $pagination);

        return response()->json([
            'success' => true,
            'data' => $members,
            'count' => count($members),
            'filters_applied' => $filters
        ]);
    }

    /**
     * Get a specific member by ID
     */
    public function show($id): JsonResponse
    {
        $member = $this->billTracker->getMemberById($id);

        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'Member not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $member
        ]);
    }

    /**
     * Get members by state
     */
    public function byState($state): JsonResponse
    {
        $members = $this->billTracker->getMembers(['state' => $state]);

        return response()->json([
            'success' => true,
            'state' => $state,
            'data' => $members,
            'count' => count($members)
        ]);
    }

    /**
     * Get members by party
     */
    public function byParty($party): JsonResponse
    {
        $members = $this->billTracker->getMembers(['party' => $party]);

        return response()->json([
            'success' => true,
            'party' => $party,
            'data' => $members,
            'count' => count($members)
        ]);
    }

    /**
     * Get members by chamber
     */
    public function byChamber($chamber): JsonResponse
    {
        $members = $this->billTracker->getMembers(['chamber' => $chamber]);

        return response()->json([
            'success' => true,
            'chamber' => $chamber,
            'data' => $members,
            'count' => count($members)
        ]);
    }
}
