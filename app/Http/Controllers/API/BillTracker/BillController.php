<?php

namespace App\Http\Controllers\API\BillTracker;

use App\Http\Controllers\Controller;
use App\Services\BillTrackerService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BillController extends Controller
{
    protected $billTracker;

    public function __construct(BillTrackerService $billTracker)
    {
        $this->billTracker = $billTracker;
    }

    /**
     * Get all bills with optional filters
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['status', 'source', 'number', 'sponsorName']);
        $pagination = $request->only(['limit', 'page']);

        $bills = $this->billTracker->getBills($filters, $pagination);

        return response()->json([
            'success' => true,
            'data' => $bills,
            'count' => count($bills),
            'filters_applied' => $filters
        ]);
    }

    /**
     * Get a specific bill by ID
     */
    public function show($id): JsonResponse
    {
        $bill = $this->billTracker->getBillById($id);

        if (!$bill) {
            return response()->json([
                'success' => false,
                'message' => 'Bill not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $bill
        ]);
    }

    /**
     * Get bills by status
     */
    public function byStatus($status): JsonResponse
    {
        $bills = $this->billTracker->getBills(['status' => $status]);

        return response()->json([
            'success' => true,
            'status' => $status,
            'data' => $bills,
            'count' => count($bills)
        ]);
    }

    /**
     * Get bills by sponsor
     */
    public function bySponsor(Request $request): JsonResponse
    {
        $sponsorName = $request->input('name');

        if (!$sponsorName) {
            return response()->json([
                'success' => false,
                'message' => 'Sponsor name is required'
            ], 400);
        }

        $bills = $this->billTracker->getBills(['sponsorName' => $sponsorName]);

        return response()->json([
            'success' => true,
            'sponsor' => $sponsorName,
            'data' => $bills,
            'count' => count($bills)
        ]);
    }
}
