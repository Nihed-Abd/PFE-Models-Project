<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Conversation;
use App\Models\Ticketschat;
use App\Services\LlamaService;

class ConversationController extends Controller
{
    /**
     * Get all chat history for the authenticated user
     */
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
    
    /**
     * Get a specific conversation by ID
     */
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
    
    /**
     * Create a new conversation
     */
    public function createConversation(Request $request)
    {
        try {
            $request->validate([
                'message_user' => 'required|string',
                'message_bot' => 'required|string',
                'model_type' => 'nullable|string',
                'file_id' => 'nullable|exists:files,id',
            ]);
            
            $user = Auth::user();
            $messageUser = $request->message_user;
            $messageBot = $request->message_bot;
            $fileId = $request->file_id;
            $modelType = $request->model_type ?? 'gpt2';
            
            // Store messages as JSON arrays to support chat history
            $userMessages = json_encode([$messageUser]);
            $botMessages = json_encode([$messageBot]);
            
            // Create new conversation with messages as JSON arrays
            $conversation = new Conversation([
                'user_id' => $user->id,
                'message_user' => $userMessages,
                'message_bot' => $botMessages,
                'file_id' => $fileId
            ]);
            
            // Explicitly set the timestamp field to avoid NOT NULL constraint violation
            $conversation->timestamp = now();
            $conversation->save();
            
            // Process messages to ensure they're properly formatted arrays
            $userMessages = json_decode($conversation->message_user);
            $botMessages = json_decode($conversation->message_bot);
            
            return response()->json([
                'id' => $conversation->id,
                'user_id' => $conversation->user_id,
                'message_user' => $userMessages,
                'message_bot' => $botMessages,
                'messages' => array_map(function($user, $bot) {
                    return [
                        'user' => $user,
                        'bot' => $bot
                    ];
                }, $userMessages, $botMessages),
                'timestamp' => $conversation->timestamp,
                'file_id' => $conversation->file_id
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation error', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating conversation: ' . $e->getMessage());
            return response()->json(['error' => 'An error occurred while creating the conversation: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Add a message to an existing conversation
     */
    public function addMessage(Request $request, $id)
    {
        try {
            $request->validate([
                'message_user' => 'required|string',
                'message_bot' => 'required|string',
            ]);
            
            $user = Auth::user();
            $conversation = Conversation::where('id', $id)
                ->where('user_id', $user->id)
                ->firstOrFail();
                
            // Get existing messages or initialize new arrays
            $existingUserMessages = json_decode($conversation->message_user) ?: [];
            $existingBotMessages = json_decode($conversation->message_bot) ?: [];
            
            // Ensure existing messages are arrays
            if (!is_array($existingUserMessages)) {
                $existingUserMessages = [$conversation->message_user];
            }
            if (!is_array($existingBotMessages)) {
                $existingBotMessages = [$conversation->message_bot];
            }
            
            // Add new messages
            $existingUserMessages[] = $request->message_user;
            $existingBotMessages[] = $request->message_bot;
            
            // Update the conversation with the new message arrays
            $conversation->message_user = json_encode($existingUserMessages);
            $conversation->message_bot = json_encode($existingBotMessages);
            
            // Make sure to update the timestamp as well
            $conversation->timestamp = now();
            $conversation->save();
            
            // Process messages to ensure they're properly formatted arrays
            $userMessages = json_decode($conversation->message_user);
            $botMessages = json_decode($conversation->message_bot);
            
            return response()->json([
                'id' => $conversation->id,
                'user_id' => $conversation->user_id,
                'message_user' => $userMessages,
                'message_bot' => $botMessages,
                'messages' => array_map(function($user, $bot) {
                    return [
                        'user' => $user,
                        'bot' => $bot
                    ];
                }, $userMessages, $botMessages),
                'timestamp' => $conversation->timestamp,
                'file_id' => $conversation->file_id
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Conversation not found'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation error', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error adding message to conversation: ' . $e->getMessage());
            return response()->json(['error' => 'An error occurred while adding the message: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Delete a conversation
     */
    public function deleteConversation($id)
    {
        try {
            $user = Auth::user();
            $conversation = Conversation::where('id', $id)
                ->where('user_id', $user->id)
                ->firstOrFail();
                
            // Delete associated tickets first
            Ticketschat::where('conversation_id', $id)->delete();
            
            // Delete the conversation
            $conversation->delete();
            
            return response()->json(['message' => 'Conversation deleted successfully'], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Conversation not found'], 404);
        } catch (\Exception $e) {
            \Log::error('Error deleting conversation: ' . $e->getMessage());
            return response()->json(['error' => 'An error occurred while deleting the conversation'], 500);
        }
    }
    
    /**
     * Toggle save status for a conversation
     */
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
            'is_saved' => (bool) $conversation->is_saved
        ]);
    }
    
    /**
     * Helper method to generate a title from the user's message
     */
    private function generateTitle($message)
    {
        // Truncate message to create a title
        $title = substr($message, 0, 30);
        
        // If the message is longer than 30 chars, add ellipsis
        if (strlen($message) > 30) {
            $title .= '...';
        }
        
        return $title;
    }
}
