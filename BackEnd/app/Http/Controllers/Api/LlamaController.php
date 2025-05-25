<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\File;
use App\Services\LlamaService;

class LlamaController extends Controller
{
    /**
     * Process a prompt with Ollama, with optional file analysis
     */
    public function chat(Request $request, LlamaService $llama)
    {
        // Validate common parameters
        $request->validate([
            'prompt' => 'required|string',
            'model' => 'nullable|string',
        ]);

        try {
            // Get authenticated user
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'User not authenticated'], 401);
            }

            // Extract text prompt
            $prompt = $request->input('prompt');
            $modelOverride = $request->input('model');
            $context = '';
            $fileInfo = null;

            // Check if a file was uploaded
            if ($request->hasFile('file')) {
                // Validate file
                $request->validate([
                    'file' => 'required|file|mimes:pdf,txt,doc,docx|max:10240',
                ]);

                // Process the uploaded file
                $uploadedFile = $request->file('file');
                $originalFilename = $uploadedFile->getClientOriginalName();
                $path = $uploadedFile->store('files');

                // Extract text from file
                $fileContent = $this->extractTextFromFile($uploadedFile);
                
                // Log file info
                Log::info("File uploaded for Ollama analysis: {$originalFilename}");

                // Store file record
                $storedFile = File::create([
                    'user_id' => $user->id,
                    'file_path' => $path,
                    'file_type' => $uploadedFile->getClientOriginalExtension(),
                    'file_name' => $originalFilename,
                    'content_text' => $fileContent,
                ]);

                // Add file content as context for Ollama
                $context = "Contenu du fichier '{$originalFilename}':\n\n{$fileContent}";
                
                // Prepare file info for response
                $fileInfo = [
                    'id' => $storedFile->id,
                    'name' => $originalFilename,
                    'type' => $uploadedFile->getClientOriginalExtension(),
                    'size' => $uploadedFile->getSize(),
                ];
            }

            // Call Ollama service to get response
            $response = $llama->ask($prompt, $context, $modelOverride);

            // Prepare the response data
            $responseData = [
                'response' => $response,
            ];

            // Add file info if present
            if ($fileInfo) {
                $responseData['file'] = $fileInfo;
            }

            return response()->json($responseData);
            
        } catch (\Exception $e) {
            Log::error('Ollama API error: ' . $e->getMessage());
            return response()->json([
                'response' => 'Je suis désolé, mais je ne peux pas traiter votre demande pour le moment. Veuillez réessayer plus tard.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Extract text from various file types
     */
    private function extractTextFromFile($file)
    {
        $ext = strtolower($file->getClientOriginalExtension());
        $filePath = $file->getRealPath();
        
        try {
            // Handle text files
            if ($ext === 'txt') {
                return file_get_contents($filePath);
            }
            
            // Handle PDF files
            if ($ext === 'pdf') {
                try {
                    // Log the file info for debugging
                    Log::info("Processing PDF file: {$file->getClientOriginalName()}");
                    
                    // Use the smalot/pdfparser library we just installed
                    $parser = new \Smalot\PdfParser\Parser();
                    $pdf = $parser->parseFile($filePath);
                    $text = $pdf->getText();
                    
                    // Log success
                    Log::info("Successfully extracted PDF text using Smalot PDFParser");
                    
                    // If text is too long, truncate it to avoid token limits
                    if (strlen($text) > 50000) {
                        $text = substr($text, 0, 50000) . "\n\n[Document tronqué pour des raisons de taille...]";
                    }
                    
                    // Add a header to identify the document
                    $extractedText = "[Contenu extrait du PDF: {$file->getClientOriginalName()}]\n\n" . $text;
                    
                    // Return the extracted text to be sent to Ollama
                    Log::info("Returning PDF content of length: " . strlen($extractedText));
                    return $extractedText;
                    
                } catch (\Exception $e) {
                    // Log the error
                    Log::error("PDFParser error: " . $e->getMessage());
                    
                    // Try a fallback extraction method if PDFParser fails
                    try {
                        // Fallback to command-line tool if available
                        exec("pdftotext " . escapeshellarg($filePath) . " - 2>&1", $output, $returnCode);
                        if ($returnCode === 0 && !empty($output)) {
                            $fallbackText = implode("\n", $output);
                            Log::info("Used pdftotext fallback extraction");
                            
                            // Truncate if needed
                            if (strlen($fallbackText) > 50000) {
                                $fallbackText = substr($fallbackText, 0, 50000) . "\n\n[Document tronqué pour des raisons de taille...]";
                            }
                            
                            return "[Contenu extrait du PDF (méthode alternative): {$file->getClientOriginalName()}]\n\n" . $fallbackText;
                        }
                    } catch (\Exception $fallbackError) {
                        Log::error("Fallback extraction also failed: " . $fallbackError->getMessage());
                    }
                    
                    // If all extraction methods fail
                    return "[Erreur lors de l'extraction du PDF: {$file->getClientOriginalName()}]";
                }
            }
            
            // Handle Word documents (placeholder)
            if ($ext === 'docx' || $ext === 'doc') {
                return "[Document Word à analyser: {$file->getClientOriginalName()}]";
            }
            
            // Default placeholder for unsupported file types
            return "[Fichier {$file->getClientOriginalName()} reçu]";
            
        } catch (\Exception $e) {
            Log::error("Error extracting text from file: " . $e->getMessage());
            return "[Erreur lors de l'extraction du texte: {$file->getClientOriginalName()}]";
        }
    }
}
