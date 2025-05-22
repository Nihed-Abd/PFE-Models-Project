<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FineTunedController extends Controller
{
    /**
     * Send a prompt to the Fine-tuned model API
     */
    public function chat(Request $request)
    {
        $request->validate([
            'prompt' => 'required|string',
        ]);

        try {
            // Call the Fine-tuned model API at http://localhost:5000/predict
            $response = Http::post('http://localhost:5000/predict', [
                'prompt' => $request->prompt,
            ]);
            
            // Check if the response was successful
            if ($response->successful()) {
                return $response->json();
            } else {
                Log::error('Fine-tuned model API error: ' . $response->body());
                return response()->json([
                    'response' => 'Je suis désolé, mais je ne peux pas traiter votre demande pour le moment. Veuillez réessayer plus tard.'
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Fine-tuned model API error: ' . $e->getMessage());
            return response()->json([
                'response' => 'Je suis désolé, mais je ne peux pas traiter votre demande pour le moment. Veuillez réessayer plus tard.'
            ]);
        }
    }
}
