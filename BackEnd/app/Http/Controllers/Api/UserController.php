<?php
namespace App\Http\Controllers\Api;
use App\Models\User as ModelsUser;
use App\Models\Conversation;
use App\Models\Ticketschat;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;

class UserController extends Controller
{
    public function index()
    {
        return response()->json($this->getUsersWithStats());
    }
    
    /**
     * Get all users with their statistics (conversations, tickets, feedback)
     * 
     * @return array
     */
    private function getUsersWithStats()
    {
        // Get all users
        $users = ModelsUser::all();
        
        // For each user, get their statistics
        foreach ($users as $user) {
            // Count conversations
            $conversationsCount = Conversation::where('user_id', $user->id)->count();
            $user->conversations_count = $conversationsCount;
            
            // Count tickets
            $ticketsCount = Ticketschat::where('user_id', $user->id)->count();
            $user->tickets_count = $ticketsCount;
            
            // Count positive feedback (j'aime)
            $positiveFeedbackCount = Ticketschat::where('user_id', $user->id)
                ->where('evaluation', 'jaime')
                ->count();
            $user->positive_feedback_count = $positiveFeedbackCount;
            
            // Count negative feedback (je n'aime pas)
            $negativeFeedbackCount = Ticketschat::where('user_id', $user->id)
                ->where('evaluation', 'jenaimepas')
                ->count();
            $user->negative_feedback_count = $negativeFeedbackCount;
        }
        
        return $users;
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
        ]);

        $user = ModelsUser::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);
        return response()->json($user, 201);
    }
    public function show(string $id)
    {
        $user = ModelsUser::find($id);

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        return response()->json($user, 200);

    }

    public function update(Request $request, string $id):RedirectResponse
    {
        $user = ModelsUser::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'password' => 'sometimes|min:6',
        ]);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }

        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }

        if (isset($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return redirect('/users');

    }
    public function destroy(string $id)
    {
        $user = ModelsUser::find($id);

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé'], 200);
    }
}

