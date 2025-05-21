<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\File;
use App\Models\Conversation;
use App\Models\Ticketschat;
use App\Services\LlamaService;

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
    // 1. Envoyer une question à LLaMA
    public function handle(Request $request, LlamaService $llama)
    {
        $question = $request->input('question');

        // Envoyer la question avec contexte (texte du fichier)
        $response = $llama->ask($question);

        // Enregistrer la conversation
        $conversation = Conversation::create([
            'user_id' => Auth::id(),
            'message_user' => $question,
            'message_bot' => $response,
            'timestamp' => now(),
        ]);

        return response()->json([
            'response' => $response,
            'conversation_id' => $conversation->id,
        ]);
    }

    // 2. Upload de fichier
    public function upload(Request $request, LlamaService $llama)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,txt,doc,docx|max:10240',
            'question' => 'required|string',
        ]);

        // 1. Stockage du fichier
        $uploadedFile = $request->file('file');
        $path = $uploadedFile->store('files');

        $text = $this->extractTextFromFile($uploadedFile);

        $storedFile = File::create([
            'user_id' => Auth::id(),
            'file_path' => $path,
            'file_type' => $uploadedFile->getClientOriginalExtension(),
            'content_text' => $text,
        ]);

        // 2. Préparation du contexte
        $question = $request->input('question');
        $context = $storedFile->content_text;

        // 3. Appel à LLaMA
        $response = $llama->ask($question, $context);

        // 4. Enregistrement de la conversation
        Conversation::create([
            'user_id' => Auth::id(),
            'file_id' => $storedFile->id,
            'message_user' => $question,
            'message_bot' => $response,
            'timestamp' => now(),
        ]);

        return response()->json([
            'file' => $storedFile,
            'conversation' => [
                'question' => $question,
                'reponse' => $response,
            ],
        ]);
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
