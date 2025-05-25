<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\File;
use App\Models\Conversation;
use App\Models\Ticketschat;
use App\Services\LlamaService;
use Illuminate\Support\Facades\Log;

class LlamaController extends Controller
{
    // Get all chat history for the authenticated user
    public function getChatHistory(Request $request)
    {
        $user = Auth::user();
        $query = Conversation::where('user_id', $user->id)
            ->with('tickets')
            ->orderBy('created_at', 'desc');
            
        // Filter by saved_only if provided
        if ($request->has('saved_only') && $request->saved_only === 'true') {
            $query->where('is_saved', true);
        }
        
        $conversations = $query->get()->map(function ($conversation) {
            return [
                'id' => $conversation->id,
                'user_id' => $conversation->user_id,
                'title' => $conversation->title ?? $this->generateTitle($conversation->message_user),
                'message_user' => $conversation->message_user,
                'message_bot' => $conversation->message_bot,
                'model_type' => $conversation->model_type ?? 'gpt2',
                'is_saved' => (bool) $conversation->is_saved,
                'timestamp' => $conversation->created_at,
                'file_id' => $conversation->file_id,
                'tickets' => $conversation->tickets,
            ];
        });
        
        return response()->json($conversations);
    }
    
    // Get a specific conversation by ID
    public function getConversation($id)
    {
        $user = Auth::user();
        $conversation = Conversation::with('tickets')
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();
            
        return response()->json([
            'id' => $conversation->id,
            'user_id' => $conversation->user_id,
            'title' => $conversation->title ?? $this->generateTitle($conversation->message_user),
            'message_user' => $conversation->message_user,
            'message_bot' => $conversation->message_bot,
            'model_type' => $conversation->model_type ?? 'gpt2',
            'is_saved' => (bool) $conversation->is_saved,
            'timestamp' => $conversation->created_at,
            'file_id' => $conversation->file_id,
            'tickets' => $conversation->tickets
        ]);
    }
    
    // Save a new conversation
    public function saveConversation(Request $request)
    {
        $request->validate([
            'message_user' => 'required|string',
            'message_bot' => 'required|string',
            'model_type' => 'required|string',
            'title' => 'nullable|string',
            'file_id' => 'nullable|exists:files,id',
            'is_saved' => 'nullable|boolean'
        ]);
        
        $user = Auth::user();
        
        $conversation = Conversation::create([
            'user_id' => $user->id,
            'message_user' => $request->message_user,
            'message_bot' => $request->message_bot,
            'model_type' => $request->model_type,
            'title' => $request->title ?? $this->generateTitle($request->message_user),
            'file_id' => $request->file_id,
            'is_saved' => $request->is_saved ?? false
        ]);
        
        return response()->json([
            'id' => $conversation->id,
            'user_id' => $conversation->user_id,
            'title' => $conversation->title,
            'message_user' => $conversation->message_user,
            'message_bot' => $conversation->message_bot,
            'model_type' => $conversation->model_type,
            'is_saved' => (bool) $conversation->is_saved,
            'timestamp' => $conversation->created_at,
            'file_id' => $conversation->file_id
        ], 201);
    }
    
    // Toggle save status for a conversation
    public function toggleSaveConversation($id)
    {
        $user = Auth::user();
        $conversation = Conversation::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();
            
        $conversation->is_saved = !$conversation->is_saved;
        $conversation->save();
        
        return response()->json([
            'id' => $conversation->id,
            'is_saved' => $conversation->is_saved
        ]);
    }
    
    // Helper method to generate a title from the user's message
    private function generateTitle($message)
    {
        // Generate a title based on the first few words of the message
        $words = explode(' ', $message);
        $title = implode(' ', array_slice($words, 0, 5));
        
        // Ensure it's not too long
        if (strlen($title) > 50) {
            $title = substr($title, 0, 47) . '...';
        } else if (strlen($title) < strlen($message)) {
            $title .= '...';
        }
        
        return $title;
    }
    // 1. Envoyer une question à Ollama (LLaMA)
    public function handle(Request $request, LlamaService $llama)
    {
        $request->validate([
            'prompt' => 'required|string',
            'model' => 'nullable|string',
        ]);

        // Get user info
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        // Extract data from request
        $question = $request->input('prompt');
        $modelOverride = $request->input('model');

        // Log the request for debugging
        Log::info("Ollama request received from user ID: {$user->id}, question: {$question}");

        // Call the Ollama service
        $response = $llama->ask($question, '', $modelOverride);

        // Generate a conversation title from the first question
        $title = null;
        if (strlen($question) > 0) {
            $title = $this->generateTitle($question);
        }
        
        // Save conversation to database
        $conversation = Conversation::create([
            'user_id' => $user->id,
            'message_user' => $question,
            'message_bot' => $response,
            'model_type' => 'llama',
            'title' => $title,
            'is_saved' => false, // Default to not saved
            'timestamp' => now(),
        ]);

        // Return formatted response to match expected frontend format
        return response()->json([
            'response' => $response,
            'conversation_id' => $conversation->id,
            'title' => $title,
        ]);
    }

    // 2. Upload de fichier pour analyse avec Ollama
    public function upload(Request $request, LlamaService $llama)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,txt,doc,docx|max:10240',
            'prompt' => 'required|string', // Changed from 'question' to 'prompt' to match frontend naming
            'model' => 'nullable|string',
        ]);
        
        // Verify user authentication
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        try {
            // 1. Store the uploaded file
            $uploadedFile = $request->file('file');
            $originalFilename = $uploadedFile->getClientOriginalName();
            $path = $uploadedFile->store('files');

            // Extract text from the file
            $text = $this->extractTextFromFile($uploadedFile);
            
            // Log file upload for debugging
            Log::info("File uploaded by user ID: {$user->id}, filename: {$originalFilename}, size: {$uploadedFile->getSize()} bytes");

            // Save file record in database
            $storedFile = File::create([
                'user_id' => $user->id,
                'file_path' => $path,
                'file_type' => $uploadedFile->getClientOriginalExtension(),
                'file_name' => $originalFilename,
                'content_text' => $text,
            ]);

            // 2. Prepare the context and prompt
            $question = $request->input('prompt');
            $context = $storedFile->content_text;
            $modelOverride = $request->input('model');
            
            // 3. Process with Ollama
            $response = $llama->ask($question, $context, $modelOverride);

            // Generate title from question
            $title = $this->generateTitle($question);

            // 4. Save the conversation
            $conversation = Conversation::create([
                'user_id' => $user->id,
                'file_id' => $storedFile->id,
                'message_user' => $question,
                'message_bot' => $response,
                'model_type' => 'llama',
                'title' => $title,
                'is_saved' => false, // Default to not saved
                'timestamp' => now(),
            ]);

            // Return response in expected format for frontend
            return response()->json([
                'response' => $response,
                'conversation_id' => $conversation->id,
                'title' => $title,
                'file' => [
                    'id' => $storedFile->id,
                    'name' => $originalFilename,
                    'type' => $uploadedFile->getClientOriginalExtension(),
                    'size' => $uploadedFile->getSize(),
                ],
            ]);
            
        } catch (\Exception $e) {
            Log::error("File upload error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to process file: ' . $e->getMessage()], 500);
        }
    }
    // 3. Historique des conversations
    public function history()
    {
        $history = Conversation::where('user_id', Auth::id())
            ->with('file') // pour voir le nom du fichier
            ->orderBy('timestamp', 'desc')
            ->get();

        return response()->json($history);
    }

    // 4. Évaluation
    public function evaluate(Request $request)
    {
        $request->validate([
            'conversation_id' => 'required|exists:conversations,id', // Vérifie si la conversation existe
            'evaluation' => 'required|in:jaime,jenaimepas', //
        ]);

        // Trouver la conversation
        $conversation = Conversation::findOrFail($request->conversation_id);

        if ($request->evaluation === 'jenaimepas') {
            Ticketschat::create([
                'user_id' => $conversation->user_id,
                'question' => $conversation->message_user,
                'response' => $conversation->message_bot,
                'status' => 'open',
                'evaluation' => 'jenaimepas',
                'conversation_id' => $conversation->id,
                'commentaire_admin'=>''
            ]);
        }
        else if ($request->evaluation === 'jaime'){
            Ticketschat::create([
            'user_id' => $conversation->user_id,
            'question' => $conversation->message_user,
            'response' => $conversation->message_bot,
            'status' => 'open',
            'evaluation' => 'jaime',
            'conversation_id' => $conversation->id,
            'commentaire_admin'=>''
            ]);
        }

        // Mettre à jour la conversation avec l'évaluation
        $conversation->evaluation = $request->evaluation;
        $conversation->save();

        return response()->json(['message' => 'Feedback enregistré avec succès.']);
    }


    // 5. Extraction de texte (version simplifiée)
    private function extractTextFromFile($file)
    {
        $ext = strtolower($file->getClientOriginalExtension());

        if ($ext === 'txt') {
            return file_get_contents($file->getRealPath());
        }

        if ($ext === 'pdf') {
            return shell_exec("pdftotext " . escapeshellarg($file->getRealPath()) . " -"); // Nécessite `poppler-utils`
        }

        return 'Texte non extrait pour ce type de fichier.';
    }
}
