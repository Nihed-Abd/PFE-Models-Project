<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class LlamaService
{
    public function ask(string $question, ?string $context = '', ?string $chatHistory = ''): string
    {
        // Build prompt with context and chat history if available
        $prompt = '';
        
        if (!empty($chatHistory)) {
            $prompt .= "Historique de la conversation :\n$chatHistory\n\n";
        }
        
        if (!empty($context)) {
            $prompt .= "Contexte :\n$context\n\n";
        }
        
        $prompt .= "Question : $question";

        // Call AI API
        try {
            $response = Http::post('http://localhost:11434/api/generate', [
                'model' => 'llama3.2',
                'prompt' => $prompt,
                'stream' => false
            ]);
            
            return $response->json('response') ?? $this->fallbackResponse();
        } catch (\Exception $e) {
            return $this->fallbackResponse($e->getMessage());
        }
    }
    
    /**
     * Return a fallback response if the AI service is unavailable
     */
    private function fallbackResponse(string $error = ''): string
    {   
        if (!empty($error)) {
            \Log::error("LlamaService error: " . $error);
        }
        
        return 'Je suis désolé, mais je ne peux pas traiter votre demande pour le moment. Veuillez réessayer plus tard.';
    }
}
