<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LlamaController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\LLMController;
use App\Http\Controllers\Api\TicketChatController;
use App\Http\Controllers\Api\GoogleController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FineTunedController;

// Routes d'authentification publiques
Route::prefix('auth')->controller(AuthController::class)->group(function () {
    Route::post('register', 'register')->name('auth.register');
    Route::post('login', 'login')->name('auth.login');
});
// Public route to get user info by token (for Google auth callback)
Route::get('/auth/token-info', [AuthController::class, 'getUserByToken']);

// Public route for the /api/user endpoint that was failing
Route::get('/user', [AuthController::class, 'getUserByToken']);

// Routes protégées par le middleware auth:api (Passport)
Route::middleware('auth:api')->group(function () {
    // Récupérer l'utilisateur connecté
    Route::get('/auth/user', [AuthController::class, 'userInfo'])->name('auth.user');
    // Déconnexion
    Route::post('/auth/logout', [AuthController::class, 'logOut'])->name('auth.logout');
    // Toutes tes ressources sécurisées
    Route::apiResource('/users', UserController::class);
    Route::get('ticketchat/{id}', [TicketChatController::class, 'show']);
    Route::get('ticketchat/evaluations/{userId}', [TicketChatController::class, 'countEvaluationsByConversation']);
    // Ollama model API - Simplified version
    Route::post('/llama/chat', [LlamaController::class, 'chat']);
    
    // Fine-tuned model
    Route::post('/fine-tuned/chat', [FineTunedController::class, 'chat']);
    
    // Conversation Management
    Route::get('/chat-history', [ConversationController::class, 'getChatHistory']);
    Route::get('/conversation/{id}', [ConversationController::class, 'getConversation']);
    Route::post('/conversation', [ConversationController::class, 'createConversation']);
    Route::post('/conversation/{id}/message', [ConversationController::class, 'addMessage']);
    Route::delete('/conversation/{id}', [ConversationController::class, 'deleteConversation']);
    Route::post('/evaluate', [LlamaController::class, 'evaluate']);
    Route::get('/users/{user}/evaluations', [LlamaController::class, 'countEvaluationsParConversation']);
    
    // Ticket chat management
    Route::post('/create-ticket', [TicketChatController::class, 'createTicket']);
    Route::put('/update-ticket/{id}', [TicketChatController::class, 'updateTicket']);
    Route::get('/tickets', [TicketChatController::class, 'getAllTickets']);
    Route::get('/user-evaluations', [TicketChatController::class, 'getUserEvaluations']);
    Route::get('/conversation/{id}/evaluations', [TicketChatController::class, 'getConversationEvaluations']);
    Route::delete('/ticket/{id}', [TicketChatController::class, 'deleteTicket']);
    
    // Dashboard statistics
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
//funtinig_gpt2
    Route::post('/ask-llm', [LLMController::class, 'ask']);
});

Route::prefix('auth/google')->group(function () {
    // 1. Le front appelle ce GET pour récupérer l'URL d'authentification Google
    Route::get('/url', [GoogleController::class, 'getGoogleAuthUrl']);

    // 2. Google redirige l'utilisateur ici avec ?code=… après consentement
    Route::get('/callback', [GoogleController::class, 'handleGoogleCallback']);
});

// Public route to get user info by token (for Google auth callback)
Route::get('/auth/token-info', [AuthController::class, 'getUserByToken']);
