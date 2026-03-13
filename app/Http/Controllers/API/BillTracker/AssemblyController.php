<?php

namespace App\Http\Controllers\API\BillTracker;

use App\Http\Controllers\Controller;
use App\Services\BillTrackerService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AssemblyController extends Controller
{
    protected $billTracker;

    public function __construct(BillTrackerService $billTracker)
    {
        $this->billTracker = $billTracker;
    }

    /**
     * Get all assemblies with optional filters
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['status', 'name']);
        $pagination = $request->only(['limit', 'page']);

        $assemblies = $this->billTracker->getAssemblies($filters, $pagination);

        return response()->json([
            'success' => true,
            'data' => $assemblies,
            'count' => count($assemblies),
            'filters_applied' => $filters
        ]);
    }

    /**
     * Get a specific assembly by ID
     */
    public function show($id): JsonResponse
    {
        $assembly = $this->billTracker->getAssemblyById($id);

        if (!$assembly) {
            return response()->json([
                'success' => false,
                'message' => 'Assembly not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $assembly
        ]);
    }

    /**
     * Get active assemblies
     */
    public function active(): JsonResponse
    {
        $assemblies = $this->billTracker->getAssemblies(['status' => 'active']);

        return response()->json([
            'success' => true,
            'data' => $assemblies,
            'count' => count($assemblies)
        ]);
    }
}
