<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Models\Conversation;
use App\Services\FunTunedGPT2Service;
class LLMController extends Controller
{
    protected $llmService;

    public function demo(Request $request, FunTunedGPT2Service $gpt2)
    {
        $question = $request->input('question');
        $response = $gpt2->poserQuestion($question);

        // Enregistrer la conversation
        $conversation = Conversation::create([
            'user_id' => Auth::id(),
            'message_user' => $question,
            'message_bot' => $response,
            'timestamp' => now(),
        ]);
        dd($response); // Affiche la réponse dans le navigateur
    }
    public function history()
    {
        $history = Conversation::where('user_id', Auth::id())
            ->with('file') // pour voir le nom du fichier
            ->orderBy('timestamp', 'desc')
            ->get();

        return response()->json($history);
    }
}
