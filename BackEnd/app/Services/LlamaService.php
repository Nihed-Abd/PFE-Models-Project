<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\ConnectionException;

class LlamaService
{
    // Ollama API endpoint
    private $apiUrl = 'http://127.0.0.1:11434/api';
    
    // Default model to use
    private $defaultModel = 'llama3.2';
    
    // Available models
    private $availableModels = [
        'llama3.2', // Default Llama model
        'mistral', // Alternative model if available
        'gemma', // Another alternative if available
    ];
    
    /**
     * Send a question to Ollama and get a response
     * 
     * @param string $question The user's question
     * @param string|null $context Additional context (e.g., file content)
     * @param string|null $model Override the default model
     * @return string The model's response
     */
    public function ask(string $question, ?string $context = '', ?string $model = null): string
    {
        // Determine which model to use
        $modelToUse = $model ?? $this->defaultModel;
        
        // Check if Ollama is running and model is available
        if (!$this->isModelAvailable($modelToUse)) {
            Log::warning("Model {$modelToUse} is not available. Trying fallback model..");
            // Try fallback to the first available model
            $availableModels = $this->getAvailableModels();
            if (empty($availableModels)) {
                return $this->fallbackResponse("No Ollama models available");
            }
            $modelToUse = reset($availableModels);
        }
        
        // Format the prompt for better responses
        $prompt = $this->formatPrompt($question, $context);
        
        // Call Ollama API
        try {
            // Detailed logging before making the API call
            Log::info("Attempting to call Ollama API at {$this->apiUrl}/generate with model: {$modelToUse}");
            Log::info("Prompt being sent: " . substr($prompt, 0, 100) . "..."); // Log first 100 chars of prompt
            
            // Build request payload
            $payload = [
                'model' => $modelToUse,
                'prompt' => $prompt,
                'stream' => false,
                'temperature' => 0.7,
                'max_tokens' => 1024,
                'system' => "Tu es un assistant IA français professionnel, qui répond de manière précise, claire et concise. Sois poli et aide les utilisateurs du mieux que tu peux."
            ];
            
            // Log full request details
            Log::debug("Full Ollama request payload: " . json_encode($payload));
            
            // Make the API call with timeout
            $response = Http::timeout(60)->post("{$this->apiUrl}/generate", $payload);
            
            // Log the raw response
            Log::debug("Ollama raw response: " . $response->body());
            
            if ($response->successful()) {
                $result = $response->json('response');
                if (!empty($result)) {
                    // Log success for debugging
                    Log::info("Successful response from Ollama using model {$modelToUse}");
                    return $result;
                } else {
                    Log::warning("Ollama returned empty response field, full response: " . $response->body());
                    return $this->fallbackResponse("Empty response from Ollama");
                }
            }
            
            // If we get here, something went wrong with the response
            Log::error("Ollama API error - Status code: " . $response->status() . ", Body: " . $response->body());
            return $this->fallbackResponse("Invalid response from Ollama - Status: " . $response->status());
            
        } catch (ConnectionException $e) {
            Log::error("Ollama connection error: " . $e->getMessage());
            return $this->fallbackResponse("Cannot connect to Ollama server - " . $e->getMessage());
        } catch (\Exception $e) {
            Log::error("Ollama error: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
            return $this->fallbackResponse($e->getMessage());
        }
    }
    
    /**
     * Format the prompt in a way that helps the model understand and respond better
     */
    private function formatPrompt(string $question, ?string $context = ''): string
    {
        $prompt = "";
        
        // Add document context if available
        if (!empty($context)) {
            // Truncate context if it's too long (Ollama has token limits)
            $maxContextLength = 4000;
            if (strlen($context) > $maxContextLength) {
                $context = substr($context, 0, $maxContextLength) . "\n[Contenu tronqué pour raison de longueur]";
            }
            $prompt .= "### Document de référence :\n$context\n\n";
        }
        
        // Add instructions for better responses
        $prompt .= "### Instructions :\nRéponds à la question suivante en français de manière précise et concise. ";
        if (!empty($context)) {
            $prompt .= "Utilise les informations du document de référence si elles sont pertinentes. ";
        }
        $prompt .= "Si tu ne connais pas la réponse, dis-le simplement.\n\n";
        
        // Add the actual question
        $prompt .= "### Question :\n$question\n\n";
        $prompt .= "### Réponse :\n";
        
        return $prompt;
    }
    
    /**
     * Check if a specific model is available in Ollama
     */
    private function isModelAvailable(string $model): bool
    {
        try {
            $response = Http::timeout(5)->get("{$this->apiUrl}/tags");
            if ($response->successful()) {
                $models = $response->json('models', []);
                foreach ($models as $modelInfo) {
                    if (isset($modelInfo['name']) && $modelInfo['name'] === $model) {
                        return true;
                    }
                }
            }
            return false;
        } catch (\Exception $e) {
            Log::error("Error checking Ollama model availability: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get list of available models from Ollama
     */
    public function getAvailableModels(): array
    {
        try {
            $response = Http::timeout(5)->get("{$this->apiUrl}/tags");
            if ($response->successful()) {
                $result = [];
                $models = $response->json('models', []);
                foreach ($models as $modelInfo) {
                    if (isset($modelInfo['name'])) {
                        $result[] = $modelInfo['name'];
                    }
                }
                return $result;
            }
            return [];
        } catch (\Exception $e) {
            Log::error("Error getting Ollama models: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Return a fallback response if the AI service is unavailable
     */
    private function fallbackResponse(string $error = ''): string
    {   
        if (!empty($error)) {
            Log::error("LlamaService error: " . $error);
        }
        
        return 'Je suis désolé, mais je ne peux pas traiter votre demande pour le moment. Veuillez réessayer plus tard.';
    }
}
