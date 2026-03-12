<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\NassLibraryService;

class FaqController extends Controller
{
    protected $nassService;

    public function __construct(NassLibraryService $nassService)
    {
        $this->nassService = $nassService;
    }

    public function index()
    {
        $faqs = $this->nassService->getFaqs();

        return response()->json([
            'success' => true,
            'data' => $faqs,
            'count' => count($faqs)
        ], 200);
    }

    public function show($id)
    {
        $faq = $this->nassService->getFaq($id);

        if (!$faq) {
            return response()->json([
                'success' => false,
                'message' => 'FAQ not found'
            ], 400);
        }

        return response()->json([
            'success' => true,
            'data' => $faq
        ], 200);
    }
}
