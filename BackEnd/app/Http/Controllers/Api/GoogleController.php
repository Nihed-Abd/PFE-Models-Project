<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class GoogleController extends Controller
{
    /**
     * Fournit l'URL à laquelle le front‑end doit rediriger l'utilisateur.
     */
    public function getGoogleAuthUrl(Request $request)
    {
        try {
            // Allow CORS for the frontend
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:4200');
            
            // Get the redirect URI from the request, env, or use the default from config
            $redirectUri = $request->input('redirect_uri', 
                         env('GOOGLE_REDIRECT_URI', 'http://localhost:4200/auth/google/callback'));
            
            // Log the redirect URI being used
            Log::info('Using explicit redirect URI: ' . $redirectUri);
            
            // Configure the redirect URI for this request
            config(['services.google.redirect' => $redirectUri]);
            
            $url = Socialite::driver('google')
                            ->stateless()            // n'utilise pas la session
                            ->redirectUrl($redirectUri) // force the redirect URI
                            ->redirect()             // prépare l'URL
                            ->getTargetUrl();        // la récupère au lieu de rediriger
            
            // Log the generated URL
            Log::info('Generated Google auth URL: ' . $url);
            
            // Add CORS headers
            return response()->json([
                'url' => $url,
                'status' => 'success'
            ])
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization');
        } catch (\Exception $e) {
            // Log the error
            Log::error('Error generating Google auth URL: ' . $e->getMessage());
            
            // Return error response with CORS headers
            return response()->json([
                'error' => 'Failed to generate Google auth URL',
                'message' => $e->getMessage(),
                'status' => 'error'
            ], 500)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization');
        }
    }

    /**
     * Reçoit le `code` de Google, échange contre des tokens,
     * crée/identifie l'utilisateur, et renvoie un token API ou redirige vers le frontend.
     */
    public function handleGoogleCallback(Request $request)
    {
        try {
            // 1) Vérifier la présence du code
            $code = $request->query('code');
            if (!$code) {
                // Vérifier si c'est une requête API ou navigateur
                if ($request->expectsJson()) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Code d\'authentification Google manquant'
                    ], 400);
                } else {
                    // Rediriger vers la page de login avec un message d'erreur
                    return redirect(env('FRONTEND_URL', 'http://localhost:4200') . '?error=google_auth_failed');
                }
            }
            
            // Récupérer le state pour identifier la session
            $state = $request->query('state');
            $isBrowserRequest = !$request->expectsJson();
            
            // Log pour débogage
            Log::info('Google callback received with code: ' . substr($code, 0, 10) . '... and state: ' . $state);
            Log::info('Redirect URI configured: ' . config('services.google.redirect'));
            
            // 2) Récupérer les infos Google sans session
            try {
                // Log the complete request details for debugging
                Log::info('Google callback request details:', [
                    'code' => $code,
                    'state' => $state,
                    'redirect_uri' => config('services.google.redirect'),
                    'client_id' => config('services.google.client_id'),
                    'client_secret_length' => strlen(config('services.google.client_secret')),
                ]);
                
                // Try to get the Google user with detailed error handling
                try {
                    // Use the redirect URI configured in Google Cloud Console
                    $redirectUri = env('GOOGLE_REDIRECT_URI', 'http://localhost:4200/auth/google/callback');
                    Log::info('Using explicit redirect URI for callback: ' . $redirectUri);
                    
                    $googleUser = Socialite::driver('google')
                                        ->stateless()
                                        ->redirectUrl($redirectUri)
                                        ->user(); // échange automatiquement le code
                    
                    Log::info('Successfully retrieved Google user: ' . ($googleUser->getEmail() ?? 'No email'));
                } catch (\Exception $innerException) {
                    // Capture the specific error from Socialite
                    Log::error('Socialite error: ' . $innerException->getMessage());
                    throw $innerException;
                }
            } catch (\Exception $e) {
                Log::error('Error retrieving Google user: ' . $e->getMessage());
                Log::error('Error trace: ' . $e->getTraceAsString());
                
                if ($isBrowserRequest) {
                    // Afficher une page d'erreur HTML avec des détails
                    $frontendUrl = env('FRONTEND_URL', 'http://localhost:4200');
                    $errorMessage = 'Erreur lors de la récupération des informations Google: ' . $e->getMessage();
                    
                    $html = <<<HTML
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Erreur d'authentification Google</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                            .error { color: red; margin-bottom: 20px; }
                            .details { background-color: #f8f8f8; border: 1px solid #ddd; padding: 10px; margin: 20px auto; max-width: 600px; text-align: left; }
                            .button { display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #4285f4; color: white; text-decoration: none; border-radius: 4px; }
                        </style>
                    </head>
                    <body>
                        <h2 class="error">Erreur d'authentification</h2>
                        <p>Une erreur s'est produite lors de l'authentification avec Google.</p>
                        
                        <div class="details">
                            <p><strong>Détails techniques:</strong></p>
                            <p>$errorMessage</p>
                            <p><strong>Code:</strong> $code</p>
                            <p><strong>Redirect URI configuré:</strong> {$frontendUrl}/auth/google/callback</p>
                            <p>Vérifiez que cette URI est bien configurée dans votre console Google Cloud.</p>
                        </div>
                        
                        <p>Veuillez réessayer ou contacter l'administrateur.</p>
                        <a href="$frontendUrl" class="button">Retour à l'application</a>
                    </body>
                    </html>
                    HTML;
                    
                    return response($html)->header('Content-Type', 'text/html');
                } else {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Erreur lors de la récupération des informations Google: ' . $e->getMessage()
                    ], 500);
                }
            }
            
            // 3) Trouver ou créer l'utilisateur
            $user = User::where('email', $googleUser->getEmail())->first();
            
            if (!$user) {
                // Créer un nouvel utilisateur
                $userData = [
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'email_verified_at' => now(),
                    'password' => bcrypt(str_random(16)), // mot de passe aléatoire
                    'remember_token' => str_random(10),
                ];
                
                // Check if avatar column exists before trying to set it
                $hasAvatarColumn = Schema::hasColumn('users', 'avatar');
                if ($hasAvatarColumn && $googleUser->getAvatar()) {
                    $userData['avatar'] = $googleUser->getAvatar();
                }
                
                $user = new User($userData);
                $user->save();
            }
            
            // Check if role column exists before trying to update it
            $hasRoleColumn = Schema::hasColumn('users', 'role');
            
            // Assurer que l'utilisateur a un rôle défini si la colonne existe
            if ($hasRoleColumn) {
                try {
                    if (!$user->role) {
                        $user->role = $user->role_id == 1 ? 'ADMIN' : 'USER';
                        $user->save();
                    }
                } catch (\Exception $roleException) {
                    Log::warning('Could not update user role: ' . $roleException->getMessage());
                    // Continue with authentication despite role update failure
                }
            } else {
                Log::info('Role column does not exist in users table. Skipping role update.');
            }
            
            // Ajouter le champ is_admin pour la compatibilité avec le frontend
            $user->is_admin = false;
            if (isset($user->role_id) && $user->role_id == 1) {
                $user->is_admin = true;
            } elseif ($hasRoleColumn && strtoupper($user->role) === 'ADMIN') {
                $user->is_admin = true;
            }
            
            // 4) Générer un token (Sanctum)
            $token = $user->createToken('google-auth-token')->plainTextToken;
            
            if ($isBrowserRequest) {
                // C'est une requête directe du navigateur, créer une page HTML qui enverra les données à la fenêtre parente
                $frontendUrl = env('FRONTEND_URL', 'http://localhost:4200');
                $userData = json_encode([
                    'user' => $user,
                    'api_token' => $token,
                    'status' => 'success'
                ]);
                
                // Créer une page HTML qui envoie un message à la fenêtre parente et se ferme
                $html = <<<HTML
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Authentification Google Réussie</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                        .success { color: green; }
                        .loading { margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <h2 class="success">Authentification réussie!</h2>
                    <p>Vous êtes maintenant connecté. Cette fenêtre va se fermer automatiquement.</p>
                    <div class="loading">Redirection en cours...</div>
                    
                    <script>
                        // Envoyer les données à la fenêtre parente
                        const userData = $userData;
                        const state = "$state";
                        
                        // Essayer d'envoyer un message à la fenêtre parente
                        if (window.opener && !window.opener.closed) {
                            window.opener.postMessage({
                                type: 'google-auth-callback',
                                token: "$token",
                                data: userData,
                                channelId: state
                            }, "$frontendUrl");
                            
                            // Fermer cette fenêtre après un court délai
                            setTimeout(() => window.close(), 1500);
                        } else {
                            // Si pas de fenêtre parente, rediriger vers l'application
                            localStorage.setItem('token', "$token");
                            localStorage.setItem('google_auth_data', JSON.stringify(userData));
                            window.location.href = "$frontendUrl/auth/google/callback?token=$token";
                        }
                    </script>
                </body>
                </html>
                HTML;
                
                return response($html)->header('Content-Type', 'text/html');
            } else {
                // C'est une requête API, retourner JSON avec CORS headers
                return response()->json([
                    'user' => $user,
                    'token' => $token,
                    'status' => 'success'
                ])->header('Access-Control-Allow-Origin', '*')
                  ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                  ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization');
            }
        } catch (\Exception $e) {
            Log::error('Unhandled exception in Google callback: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Une erreur s\'est produite lors de l\'authentification Google: ' . $e->getMessage()
                ], 500)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization');
            } else {
                // Rediriger vers le frontend avec un message d'erreur
                return redirect(env('FRONTEND_URL', 'http://localhost:4200') . '/auth/google/callback?error=google_auth_failed&message=' . urlencode($e->getMessage()));
            }
        }
    }
}
