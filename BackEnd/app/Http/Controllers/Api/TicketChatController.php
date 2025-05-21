<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\Ticketschat;
use App\Models\Conversation;

class TicketChatController extends Controller
{
    /**
     * Create a new ticket for a conversation
     */
    public function createTicket(Request $request)
    {
        $request->validate([
            'conversation_id' => 'required|exists:conversations,id',
            'evaluation' => 'required|in:jaime,jenaimepas',
            'question' => 'nullable|string',
            'response' => 'nullable|string'
        ]);
        
        $user = auth()->user();
        
        // Get the conversation
        $conversation = \App\Models\Conversation::findOrFail($request->conversation_id);
        
        // Use provided question/response if available, otherwise use from conversation
        $question = $request->has('question') ? $request->question : $conversation->message_user;
        $response = $request->has('response') ? $request->response : $conversation->message_bot;
        
        // Create or update the ticket
        $ticket = Ticketschat::updateOrCreate(
            [
                'user_id' => $user->id,
                'conversation_id' => $conversation->id
            ],
            [
                'question' => $question,
                'response' => $response,
                'status' => 'open',
                'evaluation' => $request->evaluation
            ]
        );
        
        return response()->json($ticket, 201);
    }
    
    /**
     * Update a ticket (admin functionality)
     */
    public function updateTicket(Request $request, $id)
    {
        $request->validate([
            'status' => 'nullable|in:open,closed',
            'commentaire_admin' => 'nullable|string',
        ]);
        
        $user = auth()->user();
        
        // Only allow admins to update tickets
        if (!$user->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $ticket = Ticketschat::findOrFail($id);
        
        if ($request->has('status')) {
            $ticket->status = $request->status;
        }
        
        if ($request->has('commentaire_admin')) {
            $ticket->commentaire_admin = $request->commentaire_admin;
        }
        
        $ticket->save();
        
        return response()->json($ticket);
    }
    
    /**
     * Get all tickets (admin functionality)
     */
    public function getAllTickets(Request $request)
    {
        $user = auth()->user();
        
        // Only allow admins to view all tickets
        if (!$user->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $query = Ticketschat::with(['user', 'conversation'])
            ->orderBy('created_at', 'desc');
            
        // Filter by status
        if ($request->has('status') && in_array($request->status, ['open', 'closed'])) {
            $query->where('status', $request->status);
        }
        
        // Filter by evaluation
        if ($request->has('evaluation') && in_array($request->evaluation, ['jaime', 'jenaimepas'])) {
            $query->where('evaluation', $request->evaluation);
        }
        
        $tickets = $query->paginate(15);
        
        return response()->json($tickets);
    }
    /**
     * Compter les évaluations 'jaime' et 'jenaimepas' par conversation
     */
    public function countEvaluationsByConversation($userId)
    {
        $results = DB::table('ticketschats')
            ->select(
                'conversation_id',
                DB::raw("COUNT(CASE WHEN evaluation = 'jaime' THEN 1 END) as total_jaime"),
                DB::raw("COUNT(CASE WHEN evaluation = 'jenaimepas' THEN 1 END) as total_jenaimepas")
            )
            ->where('user_id', $userId)
            ->groupBy('conversation_id')
            ->get();

        return response()->json($results);
    }

    /**
     * Afficher un ticket spécifique par son ID
     */
    public function show($id)
    {
        $ticketChat = Ticketschat::findOrFail($id);
        return response()->json($ticketChat);
    }
    
    /**
     * Get user's evaluations
     */
    public function getUserEvaluations()
    {
        $user = Auth::user();
        
        $evaluations = Ticketschat::with('conversation')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($evaluations);
    }
    
    /**
     * Get evaluations for a specific conversation
     */
    public function getConversationEvaluations($id)
    {
        // Verify the conversation exists
        $conversation = Conversation::findOrFail($id);
        
        // Get all tickets for this conversation
        $tickets = Ticketschat::where('conversation_id', $id)
            ->with('user:id,name,email') // Include user info but limit fields
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Calculate statistics
        $stats = [
            'total' => $tickets->count(),
            'jaime' => $tickets->where('evaluation', 'jaime')->count(),
            'jenaimepas' => $tickets->where('evaluation', 'jenaimepas')->count(),
            'has_comments' => $tickets->whereNotNull('commentaire_admin')->count() > 0
        ];
        
        return response()->json([
            'tickets' => $tickets,
            'stats' => $stats
        ]);
    }
    
    /**
     * Delete a ticket
     */
    public function deleteTicket($id)
    {
        $user = Auth::user();
        $ticket = Ticketschat::findOrFail($id);
        
        // Allow both the ticket owner and admins to delete tickets
        if ($ticket->user_id !== $user->id && !$user->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $ticket->delete();
        
        return response()->json(['message' => 'Ticket deleted successfully']);
    }
}
