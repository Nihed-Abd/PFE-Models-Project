<?php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\Role;
use Carbon\Carbon;


class AuthController extends Controller
{
     /**
    * Register a new account.
    */
   public function register(Request $request)
   {
       $validatedData = $request->validate([
           'name'     => 'required|min:4',
           'email'    => 'required|string|email|max:255|unique:users',
           'password' => 'required|min:8',
       ]);

       // Check if a role was provided, otherwise default to 'client'
       $role = $request->input('role', 'client');
       
       // Only allow 'admin' role if explicitly permitted
       if ($role === 'admin' && !$request->has('admin_secret_key')) {
           $role = 'client'; // Default back to client if trying to create admin without secret key
       }
       
       $user = User::create([
           'name'      => $validatedData['name'],
           'email'     => $validatedData['email'],
           'password'  => Hash::make($validatedData['password']),
           'join_date' => Carbon::now()->toDayDateTimeString(),
       ]);
       
       // Attach the appropriate role to the user
       try {
           $clientRole = Role::where('name', $role)->first();
           if ($clientRole) {
               $user->roles()->attach($clientRole);
           } else {
               // If the requested role doesn't exist, create it
               $newRole = Role::create(['name' => $role]);
               $user->roles()->attach($newRole);
           }
       } catch (\Exception $e) {
           // Log the error for debugging
           Log::error('Error setting user role: ' . $e->getMessage());
       }

       return response()->json([
           'response_code' => '200',
           'status'        => 'success',
           'message'       => 'Registration successful',
           'data'          => $user,
       ], 200);
   }


   /**
    * Handle login requests.
    */


    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|string|email',
            'password' => 'required|string',
        ]);

        // Vérifier si les informations d'identification sont correctes
        if (Auth::attempt($credentials)) {
            /** @var \App\Models\User $user **/
            $user = Auth::user();

            // Vérifier si l'utilisateur existe
            if ($user) {
                // Révoquer tous les anciens tokens
                $user->tokens()->delete();
                
                // Créer le token d'accès avec Sanctum
                $token = $user->createToken('auth-token')->plainTextToken;

                // Get user roles from the roles relationship
                try {
                    $roleNames = $user->roles()->pluck('name');
                    
                    // If user has no roles, assign the default client role
                    if ($roleNames->count() === 0) {
                        $clientRole = Role::where('name', 'client')->first();
                        if (!$clientRole) {
                            $clientRole = Role::create(['name' => 'client']);
                        }
                        $user->roles()->attach($clientRole);
                        $roleNames = collect(['client']);
                    }
                } catch (\Exception $e) {
                    Log::error('Error getting user roles: ' . $e->getMessage());
                    $roleNames = collect(['client']); // Default if error occurs
                }
                
                // Get the primary role (first one) for backward compatibility
                $primaryRole = $roleNames->first() ?? 'client';
                
                return response()->json([
                    'response_code' => '200',
                    'status'        => 'success',
                    'message'       => 'Login successful',
                    'data' => [
                        'user'         => $user,
                        'role'         => $primaryRole, // Primary role for backward compatibility
                        'roles'        => $roleNames->toArray(), // All user roles
                        'accessToken'  => $token,
                    ],
                ], 200);
            }

            // Si l'utilisateur est null
            return response()->json([
                'response_code' => '401',
                'status'        => 'error',
                'message'       => 'User not found',
            ], 401);
        }

        return response()->json([
            'response_code' => '401',
            'status'        => 'error',
            'message'       => 'Invalid credentials',
        ], 401);
    }


   /**
    * Retrieve paginated user information.
    */
   public function userInfo()
   {
       try {
           $users = User::latest()->paginate(10);

           return response()->json([
               'response_code' => '200',
               'status'        => 'success',
               'message'       => 'User list retrieved successfully',
               'data' => [
                   'users' => $users->items(),
                   'pagination' => [
                       'total'        => $users->total(),
                       'per_page'     => $users->perPage(),
                       'current_page' => $users->currentPage(),
                       'last_page'    => $users->lastPage(),
                   ],
               ],
           ], 200);
       } catch (\Exception $e) {
           Log::error($e);
           return response()->json([
               'response_code' => '500',
               'status'        => 'error',
               'message'       => 'Failed to retrieve user list',
           ], 500);
       }
   }
   
   /**
    * Get user information by token
    * This is a public endpoint used for Google authentication callback
    */
   public function getUserByToken(Request $request)
   {
       try {
           $token = $request->header('Authorization');
           
           if (!$token) {
               // If no Authorization header, try to get token from query string
               $token = $request->query('token');
               
               // If still no token, check if there's a token in localStorage via cookies
               if (!$token) {
                   $token = $request->cookie('token');
               }
               
               // If still no token, check if there's a token in the session
               if (!$token && session()->has('token')) {
                   $token = session('token');
               }
               
               // If no token found anywhere, check if we have a Google user in session
               if (!$token && session()->has('google_user')) {
                   $googleUser = session('google_user');
                   
                   // Find the user by email
                   $user = User::where('email', $googleUser->email)->first();
                   
                   if ($user) {
                       // Get user roles
                       try {
                           $roleNames = $user->roles()->pluck('name');
                           $primaryRole = $roleNames->first() ?? 'client';
                       } catch (\Exception $e) {
                           $roleNames = collect(['client']);
                           $primaryRole = 'client';
                       }
                       
                       return response()->json([
                           'response_code' => '200',
                           'status'        => 'success',
                           'message'       => 'User information retrieved successfully',
                           'user'          => $user,
                           'role'          => $primaryRole,
                           'roles'         => $roleNames->toArray(),
                       ], 200);
                   }
               }
               
               // If we still don't have a token or user, return an error
               if (!$token) {
                   // For the /api/user endpoint, return a default response with empty user
                   // This prevents the frontend from breaking
                   if ($request->path() === 'api/user') {
                       return response()->json([
                           'response_code' => '200',
                           'status'        => 'success',
                           'message'       => 'No authenticated user',
                           'user'          => null,
                       ], 200);
                   }
                   
                   return response()->json([
                       'response_code' => '401',
                       'status'        => 'error',
                       'message'       => 'No token provided',
                   ], 401);
               }
               
               $token = 'Bearer ' . $token;
           }
           
           // Extract the token without 'Bearer '
           $tokenValue = str_replace('Bearer ', '', $token);
           
           // Find the token in the database
           $tokenModel = \Laravel\Sanctum\PersonalAccessToken::findToken($tokenValue);
           
           if (!$tokenModel) {
               return response()->json([
                   'response_code' => '401',
                   'status'        => 'error',
                   'message'       => 'Invalid token',
               ], 401);
           }
           
           // Get the user associated with the token
           $user = $tokenModel->tokenable;
           
           if (!$user) {
               return response()->json([
                   'response_code' => '404',
                   'status'        => 'error',
                   'message'       => 'User not found',
               ], 404);
           }
           
           // Get user roles
           try {
               $roleNames = $user->roles()->pluck('name');
               
               // If user has no roles, assign the default client role
               if ($roleNames->count() === 0) {
                   $clientRole = Role::where('name', 'client')->first();
                   if (!$clientRole) {
                       $clientRole = Role::create(['name' => 'client']);
                   }
                   $user->roles()->attach($clientRole);
                   $roleNames = collect(['client']);
               }
           } catch (\Exception $e) {
               Log::error('Error getting user roles: ' . $e->getMessage());
               $roleNames = collect(['client']); // Default if error occurs
           }
           
           // Get the primary role (first one) for backward compatibility
           $primaryRole = $roleNames->first() ?? 'client';
           
           return response()->json([
               'response_code' => '200',
               'status'        => 'success',
               'message'       => 'User information retrieved successfully',
               'user'          => $user,
               'role'          => $primaryRole,
               'roles'         => $roleNames->toArray()
           ], 200);
       } catch (\Exception $e) {
           Log::error('Error in getUserByToken: ' . $e->getMessage());
           return response()->json([
               'response_code' => '500',
               'status'        => 'error',
               'message'       => 'Failed to retrieve user information',
               'error'         => $e->getMessage(),
           ], 500);
       }
   }
   
   /**
    * Log the user out (Revoke the token)
    *
    * @return \Illuminate\Http\JsonResponse
    */
   public function logOut(Request $request)
   {
       try {
           // Get the authenticated user
           $user = Auth::user();
           
           if ($user) {
               // Revoke all of the user's tokens
               $user->tokens()->delete();
               
               return response()->json([
                   'response_code' => '200',
                   'status'        => 'success',
                   'message'       => 'Successfully logged out',
               ], 200);
           }
           
           return response()->json([
               'response_code' => '401',
               'status'        => 'error',
               'message'       => 'No authenticated user found',
           ], 401);
           
       } catch (\Exception $e) {
           Log::error('Logout error: ' . $e->getMessage());
           
           return response()->json([
               'response_code' => '500',
               'status'        => 'error',
               'message'       => 'An error occurred during logout',
               'error'         => $e->getMessage(),
           ], 500);
       }
   }
}
