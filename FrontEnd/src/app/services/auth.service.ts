import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  role_id?: number;
  is_admin?: boolean;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  getCurrentUser() {
    throw new Error('Method not implemented.');
  }
  // API URL for backend
  private apiUrl = 'http://127.0.0.1:8000/api';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();
  
  // Flag to track if initial load/token validation has completed
  public hasInitialLoadCompleted = false;
  
  // Colors for avatar generation
  private avatarColors = [
    '2196f3', // Blue
    '4caf50', // Green
    'f44336', // Red
    'ff9800', // Orange
    '9c27b0', // Purple
    '3f51b5'  // Indigo
  ];

  // Flag to prevent confirmation dialog during initialization
  private isInitializing = true;
  
  constructor(private http: HttpClient, private router: Router) {
    // Add a small delay to allow app to initialize before validating token
    // This prevents logout confirmation dialog from showing on page reload
    setTimeout(() => {
      this.loadUserFromStorage();
      // Wait 500ms after loading to set initialization flag to false 
      setTimeout(() => {
        this.isInitializing = false;
        console.log('App initialization complete');
      }, 500);
    }, 100);
  }

  // Load user from localStorage with session recovery
  private loadUserFromStorage(): void {
    console.log('Loading user from storage');
    const storedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    localStorage.setItem('lastPath', window.location.pathname); // Remember current path
    
    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        
        // Get user role and current path
        const userRoleLower = (user.role || '').toString().toLowerCase();
        const isAdmin = userRoleLower === 'admin' || userRoleLower === '1' || userRoleLower === 'administrator';
        const currentPath = window.location.pathname;
        
        // Debug logs
        console.log('Current path:', currentPath);
        console.log('User role:', userRoleLower);
        console.log('Is admin:', isAdmin);
        
        // Flag for admin path and chat path
        const isAdminPath = currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin');
        const isChatPath = currentPath.startsWith('/chat');
        
        // Force admins to dashboard on reload, except for explicit admin path
        if (isAdmin && isChatPath) {
          // Admin is on chat page - redirect to dashboard immediately
          console.log('Admin on /chat page, redirecting to dashboard');
          setTimeout(() => this.router.navigate(['/dashboard']), 100);
        } else if (!isAdmin && isAdminPath) {
          // Non-admin on admin page - flag for potential redirect after validation
          console.log('Non-admin trying to access admin page, will verify with backend');
        }
        
        // Verify token is still valid with backend
        this.validateToken(token).subscribe({
          next: (userData) => {
            console.log('Token validation successful');
            // Update user data if it's available from the backend
            if (userData && userData.user) {
              const updatedUser = userData.user;
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
              this.currentUserSubject.next(updatedUser);
              
              // Get updated role info
              const userRole = (updatedUser.role || '').toString().toLowerCase();
              const isAdmin = userRole === 'admin' || userRole === '1' || userRole === 'administrator';
              
              // Check current path and apply correct route based on role
              const currentPath = window.location.pathname;
              const isAdminPath = currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin');
              const isChatPath = currentPath.startsWith('/chat');
              
              console.log('Path check: isAdminPath=', isAdminPath, 'isChatPath=', isChatPath, 'isAdmin=', isAdmin);
              
              // Apply routing logic - ADMIN SHOULD ALWAYS BE ON DASHBOARD
              if (isAdminPath && !isAdmin) {
                // Non-admin on admin page - redirect to chat
                console.log('Validated user is not admin, redirecting from admin page');
                setTimeout(() => this.router.navigate(['/chat']), 100);
              } else if (isAdmin && !isAdminPath) {
                // Admin anywhere but admin pages (including root and chat) - redirect to dashboard
                console.log('Admin detected outside dashboard area, redirecting to dashboard');
                setTimeout(() => this.router.navigate(['/dashboard']), 100);
              }
            }
            // Mark initial load as complete after successful validation
            this.hasInitialLoadCompleted = true;
          },
          error: (err) => {
            console.log('Token validation failed:', err);
            
            // Don't clear storage immediately on validation failure 
            // This preserves the session when the backend is temporarily unavailable
            if (err.status === 401 || err.status === 403) {
              // Only logout for actual authorization errors
              console.log('Clearing session due to authorization error');
              this.logout(false, false);
            } else {
              console.log('Keeping session despite backend error - using cached credentials');
              // Keep the current user for non-auth errors (e.g., network issues)
              
              // Check and redirect based on cached role
              const userRole = (user.role || '').toString().toLowerCase();
              const isAdmin = userRole === 'admin' || userRole === '1' || userRole === 'administrator';
              
              // Get current path details
              const currentPath = window.location.pathname;
              const isAdminPath = currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin');
              
              console.log('Network error path check: isAdmin=', isAdmin, 'path=', currentPath);
              
              if (isAdminPath && !isAdmin) {
                // Non-admin on admin page - redirect to chat
                console.log('Cached user is not admin, redirecting from admin page');
                setTimeout(() => this.router.navigate(['/chat']), 100);
              } else if (isAdmin && !isAdminPath) {
                // Admin anywhere but admin pages - force redirect to dashboard
                console.log('Admin outside dashboard area, redirecting despite network error');
                setTimeout(() => this.router.navigate(['/dashboard']), 100);
              }
            }
            
            // Mark initial load as complete even after failed validation
            this.hasInitialLoadCompleted = true;
          }
        });
      } catch (error) {
        console.error('Error parsing stored user', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        this.hasInitialLoadCompleted = true;
      }
    } else {
      // No user data in storage, mark initial load as complete
      this.hasInitialLoadCompleted = true;
      
      // If no auth but on restricted page, redirect to login
      const currentPath = window.location.pathname;
      const isRestrictedPath = currentPath.startsWith('/dashboard') || 
                              currentPath.startsWith('/admin') || 
                              currentPath.startsWith('/chat');
      
      if (isRestrictedPath) {
        console.log('No auth found on restricted page, redirecting to login');
        setTimeout(() => this.router.navigate(['/']), 100);
      }
    }
  }
  
  // Register a new user
  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, {
      name,
      email,
      password,
      password_confirmation: password
    }).pipe(
      tap((response: any) => {
        if (response && response.status === 'success') {
          // Show success message
          Swal.fire({
            icon: 'success',
            title: 'Registration Successful',
            text: 'Your account has been created successfully!',
            timer: 2000,
            showConfirmButton: false
          });
          
          // Redirect to login page
          this.router.navigate(['/auth/login']);
        }
      }),
      catchError(error => {
        console.error('Registration error:', error);
        
        // Show error with SweetAlert
        let errorMessage = 'Registration failed';
        
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.error && error.error.errors) {
          // Handle validation errors
          const errors = error.error.errors;
          errorMessage = Object.values(errors).flat().join('\n');
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: errorMessage,
          confirmButtonText: 'Try Again'
        });
        
        return throwError(() => error);
      })
    );
  }

  // Login user with Sanctum token
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      map((response: any) => {
        console.log('Login response:', response);
        
        // Handle Sanctum response format
        if (response) {
          let user, token;
          
          // Support different response formats
          if (response.data && response.data.user) {
            // Standard Sanctum format
            user = response.data.user;
            token = response.data.accessToken;
            
            // Set role if available in roles array
            if (response.data.roles && response.data.roles.length > 0) {
              user.role = response.data.roles[0];
            }
          } else if (response.user) {
            // Alternative format
            user = response.user;
            token = response.token || response.access_token;
          }
          
          // Fallback if no role is set
          if (!user.role) {
            user.role = user.is_admin ? 'admin' : 'user';
          }
          
          console.log('User data:', user);
          console.log('Token:', token);
          
          // Store user data and token
          if (user && token) {
            localStorage.setItem('token', token);
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);
            
            // Show success message
            Swal.fire({
              icon: 'success',
              title: 'Login Successful',
              text: `Welcome back, ${user.name}!`,
              timer: 2000,
              showConfirmButton: false
            });
            
            // Redirect based on role
            this.redirectBasedOnRole(user.role);
          }
        }
        
        return response;
      }),
      catchError(error => {
        console.error('Login error:', error);
        
        // Show error with SweetAlert
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: error.error?.message || 'Invalid credentials',
          confirmButtonText: 'Try Again'
        });
        
        return throwError(() => error);
      })
    );
  }

  // Get current user value
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    // First check stored token for immediate response during page reload
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('currentUser');
    
    // During initial page load, trust the local storage data to prevent redirect
    if (!this.hasInitialLoadCompleted) {
      console.log('Using localStorage for auth check during initial load');
      return !!token && !!storedUser;
    }
    
    // After initial load, use the BehaviorSubject value
    return !!this.currentUserValue;
  }

  // Check if user is admin (case-insensitive)
  isAdmin(): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    
    // Case-insensitive role check with toString for type safety
    const role = (user.role || '').toString().toUpperCase();
    return role === 'ADMIN' || role === '1';
  }

  // Get authentication token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Redirect based on user role
  redirectBasedOnRole(role: string): void {
    // Convert role to lowercase and handle different role formats
    const roleLower = (role || '').toString().toLowerCase();
    
    console.log('Redirecting based on role:', roleLower);
    
    // Use a slightly longer delay to ensure the Angular router is ready
    setTimeout(() => {
      if (roleLower === 'admin' || roleLower === '1' || roleLower === 'administrator') {
        // Admin user - redirect to dashboard
        console.log('Redirecting to /dashboard');
        this.router.navigateByUrl('/dashboard').then(() => {
          console.log('Navigation to dashboard complete');
        }).catch(err => {
          console.error('Navigation error:', err);
          // Fallback to chat if admin navigation fails
          this.router.navigateByUrl('/chat');
        });
      } else {
        // Regular user - redirect to chat page
        console.log('Redirecting to /chat');
        this.router.navigateByUrl('/chat').then(() => {
          console.log('Navigation to chat complete');
        }).catch(err => {
          console.error('Navigation error:', err);
        });
      }
    }, 500); // Longer delay to ensure navigation works
  }

  // Logout user with optional confirmation
  logout(callApi: boolean = true, showConfirmation: boolean = true): void {
    console.log('Logout called with params:', { callApi, showConfirmation, isInitializing: this.isInitializing });
    
    // Never show confirmation during initialization
    const shouldShowConfirmation = showConfirmation && !this.isInitializing;
    
    // Function to perform the actual logout
    const performLogout = () => {
      if (callApi && this.getToken()) {
        // Call the logout API with Sanctum token
        this.http.post(`${this.apiUrl}/auth/logout`, {}, {
          headers: new HttpHeaders({
            'Authorization': `Bearer ${this.getToken()}`
          })
        }).pipe(
          catchError(error => {
            console.error('Logout error:', error);
            return of(null); // Always continue with local logout
          })
        ).subscribe(() => {
          // Don't show success message during initialization
          this.completeLogout(!this.isInitializing && showConfirmation);
        });
      } else {
        // Don't show success message during initialization
        this.completeLogout(!this.isInitializing && showConfirmation);
      }
    };

    // Show confirmation dialog only if requested and not during initialization
    if (shouldShowConfirmation) {
      console.log('Showing logout confirmation dialog');
      Swal.fire({
        title: 'Logout Confirmation',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          performLogout();
        }
      });
    } else {
      // Directly logout without confirmation
      console.log('Skipping confirmation dialog, performing logout directly');
      performLogout();
    }
  }
  
  // Complete the logout process
  private completeLogout(showMessage: boolean = true): void {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    
    // Only show success message if explicitly requested
    if (showMessage) {
      Swal.fire({
        icon: 'success',
        title: 'Logged Out',
        text: 'You have been successfully logged out',
        timer: 2000,
        showConfirmButton: false
      });
    }
    
    // Redirect to login page
    this.router.navigate(['/']);
  }
  
  // Validate token with backend
  private validateToken(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/user`, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    });
  }
  
  // Google login support
  googleLogin(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/google/callback`, { token }).pipe(
      tap((response: any) => {
        if (response && response.user) {
          const user = response.user;
          const authToken = response.access_token || response.api_token || response.token;
          
          // Ensure role is set
          if (!user.role) {
            user.role = user.is_admin ? 'ADMIN' : 'USER';
          }
          
          // Store the user and token
          this.handleAuthentication(user, authToken);
        }
      }),
      catchError(error => {
        console.error('Google login error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: error.error?.message || 'Google authentication failed',
          confirmButtonText: 'Try Again'
        });
        return throwError(() => error);
      })
    );
  }
  
  // Process Google auth code directly
  processGoogleAuthCode(code: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/google/callback?code=${code}`).pipe(
      tap((response: any) => {
        if (response && response.user) {
          const user = response.user;
          const authToken = response.api_token || response.access_token || response.token;
          
          // Ensure role is set
          if (!user.role) {
            user.role = user.is_admin ? 'ADMIN' : 'USER';
          }
          
          // Store the user and token
          this.handleAuthentication(user, authToken);
        }
      }),
      catchError(error => {
        console.error('Google auth code processing error:', error);
        return throwError(() => error);
      })
    );
  }
  
  // Get Google auth URL
  getGoogleAuthUrl(): Observable<any> {
    // Use the base URL without /api prefix for Google auth
    const baseUrl = this.apiUrl.replace('/api', '');
    
    console.log('Getting Google auth URL from:', `${baseUrl}/auth/google/url`);
    
    // First try the web route
    return this.http.get(`${baseUrl}/auth/google/url`).pipe(
      map((response: any) => {
        // Ensure the response contains a URL
        if (response && response.url) {
          // Log the full URL for debugging
          console.log('Successfully got Google auth URL:', response.url);
          
          // Check if the URL contains the correct redirect_uri
          if (response.url.includes('redirect_uri=')) {
            const redirectUriParam = new URL(response.url).searchParams.get('redirect_uri');
            console.log('Redirect URI in Google auth URL:', redirectUriParam);
          }
          
          return response;
        } else {
          throw new Error('Invalid Google auth URL response');
        }
      }),
      catchError(error => {
        console.error('Failed to get Google auth URL:', error);
        
        // Try the API route as fallback
        console.log('Trying API route as fallback:', `${this.apiUrl}/auth/google/url`);
        return this.http.get(`${this.apiUrl}/auth/google/url`).pipe(
          map((response: any) => {
            if (response && response.url) {
              console.log('Successfully got Google auth URL from API route:', response.url);
              return response;
            } else {
              throw new Error('Invalid Google auth URL response from API route');
            }
          }),
          catchError(apiError => {
            console.error('Failed to get Google auth URL from both routes:', apiError);
            return throwError(() => apiError);
          })
        );
      })
    );
  }
  
  // Handle authentication
  handleAuthentication(user: User, token: string): void {
    // Assign a random avatar if none is provided
    if (!user.avatar) {
      user.avatar = this.getRandomAvatar(user.name);
    }
    
    // Ensure role is properly set - handle multiple role formats
    if (!user.role && user.role_id) {
      user.role = user.role_id === 1 ? 'ADMIN' : 'USER';
    } else if (!user.role && user.is_admin) {
      user.role = user.is_admin ? 'ADMIN' : 'USER';
    } else if (!user.role) {
      // Default to USER if no role information is available
      user.role = 'USER';
    }
    
    // Normalize role to uppercase for consistency
    if (typeof user.role === 'string') {
      user.role = user.role.toUpperCase();
    }
    
    // Store user and token
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
    
    console.log('User authenticated:', user);
    this.hasInitialLoadCompleted = true;
    
    // Redirect based on role
    this.redirectBasedOnRole(user.role);
  }
  
  // Generate a random avatar URL using UI Avatars API
  private getRandomAvatar(name?: string): string {
    const randomIndex = Math.floor(Math.random() * this.avatarColors.length);
    const color = this.avatarColors[randomIndex];
    const userName = name || (this.currentUserValue?.name || 'User');
    const encodedName = encodeURIComponent(userName);
    return `https://ui-avatars.com/api/?name=${encodedName}&background=${color}&color=fff&size=256`;
  }
}
