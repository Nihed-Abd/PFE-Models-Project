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
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // API URL for backend
  private apiUrl = 'http://127.0.0.1:8000/api';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();
  
  // Colors for avatar generation
  private avatarColors = [
    '2196f3', // Blue
    '4caf50', // Green
    'f44336', // Red
    'ff9800', // Orange
    '9c27b0', // Purple
    '3f51b5'  // Indigo
  ];

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  // Load user from localStorage with session recovery
  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        
        // Verify token is still valid with backend
        this.validateToken(token).subscribe({
          next: (userData) => {
            // Update user data if it's available from the backend
            if (userData && userData.user) {
              const updatedUser = userData.user;
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
              this.currentUserSubject.next(updatedUser);
            }
          },
          error: () => {
            // Token invalid, clear storage
            this.logout(false);
          }
        });
      } catch (error) {
        console.error('Error parsing stored user', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
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
        if (response && response.data) {
          const user = response.data.user;
          const token = response.data.accessToken;
          
          // Set role if available in roles array
          if (response.data.roles && response.data.roles.length > 0) {
            user.role = response.data.roles[0];
          } else {
            user.role = 'user'; // Default role
          }
          
          // Store user data and token
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
    // Convert role to lowercase and handle both string and number formats
    const roleLower = (role || '').toString().toLowerCase();
    
    console.log('Redirecting based on role:', roleLower);
    
    if (roleLower === 'admin' || roleLower === '1') {
      // Admin user - redirect to admin dashboard
      this.router.navigate(['/admin/dashboard']);
    } else {
      // Regular user - redirect to chat page
      this.router.navigate(['/chat']);
    }
  }

  // Logout user with confirmation
  logout(callApi: boolean = true): void {
    Swal.fire({
      title: 'Logout Confirmation',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
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
            this.completeLogout();
          });
        } else {
          this.completeLogout();
        }
      }
    });
  }
  
  // Complete the logout process
  private completeLogout(): void {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    
    // Show success message
    Swal.fire({
      icon: 'success',
      title: 'Logged Out',
      text: 'You have been successfully logged out',
      timer: 2000,
      showConfirmButton: false
    });
    
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
  
  // Generate a random avatar URL using UI Avatars API
  private getRandomAvatar(name?: string): string {
    const randomIndex = Math.floor(Math.random() * this.avatarColors.length);
    const color = this.avatarColors[randomIndex];
    const userName = name || (this.currentUserValue?.name || 'User');
    const encodedName = encodeURIComponent(userName);
    return `https://ui-avatars.com/api/?name=${encodedName}&background=${color}&color=fff&size=256`;
  }
}
