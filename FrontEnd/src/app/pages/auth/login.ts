import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment as env } from '../../environment/environment';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, HttpClientModule, ToastModule, MessageModule, DividerModule],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, rgba(235, 146, 52)  10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <img src="assets/logo.png" class="mb-8 w-32 shrink-0 mx-auto">
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Bienvenue dans le chatBot ERP</div>
                        </div>
                        <p-toast />
                        <div>
                            <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                            <input pInputText id="email1" type="text" placeholder="Email" class="w-full md:w-[30rem] mb-8" [(ngModel)]="email" />

                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Mot de passe</label>
                            <p-password id="password1" [(ngModel)]="password" placeholder="Mot de passe" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false"></p-password>

                            <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                <div class="flex align-items-center">
                                    <p-checkbox name="remember" [binary]="true" [(ngModel)]="rememberMe" styleClass="mr-2"></p-checkbox>
                                    <label for="remember" class="text-surface-900 dark:text-surface-0 font-medium"> Remember Me</label>
                                </div>
                            </div>

                            <button pButton pRipple [loading]="loading" label="Se connecter" class="w-full md:w-[30rem] py-3 text-xl" (click)="login()"></button>

                            <div class="my-4 flex items-center">
                                <p-divider styleClass="flex-1" [layout]="'horizontal'">
                                    <span class="px-2">ou</span>
                                </p-divider>
                            </div>

                            <button pButton pRipple icon="pi pi-google" label="Se connecter avec Google" 
                                class="w-full md:w-[30rem] py-3 text-xl p-button-outlined p-button-secondary mb-8"
                                (click)="loginWithGoogle()"></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    providers: [MessageService]
})
export class Login implements OnInit {
    service: MessageService;
    email: string = '';
    password: string = '';
    rememberMe: boolean = false;
    loading: boolean = false;
    googleAuthUrl: string = '';

    constructor(
        private router: Router, 
        MessageProvider: MessageService, 
        private http: HttpClient,
        private authService: AuthService
    ) {
        this.service = MessageProvider;
    }

    ngOnInit(): void {
        // Check if already logged in
        if (this.authService.isLoggedIn()) {
            this.redirectBasedOnRole();
            return;
        }

        // Check for error parameter in URL (from OAuth redirects)
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        if (error) {
            this.showErrorViaSwal('Authentication failed', 'There was an error during the authentication process. Please try again.');
        }

        // Check for token parameter in URL (from OAuth redirects)
        const token = urlParams.get('token');
        if (token) {
            // Store the token
            localStorage.setItem('token', token);
            
            // Get user info using HTTP client
            this.http.get(`${this.authService['apiUrl']}/user`).subscribe({
                next: (response: any) => {
                    if (response && response.user) {
                        // Use the auth service to handle the authenticated user
                        this.authService.handleAuthentication(response.user, token);
                        this.showSuccessViaToast('Login successful');
                        setTimeout(() => {
                            this.redirectBasedOnRole();
                        }, 1500);
                    } else {
                        this.showErrorViaSwal('Invalid response from server');
                    }
                },
                error: (error: any) => {
                    this.showErrorViaSwal('Error retrieving user information');
                }
            });
        }

        // Get Google auth URL for the login button
        this.authService.getGoogleAuthUrl().subscribe({
            next: (response) => {
                if (response && response.url) {
                    this.googleAuthUrl = response.url;
                }
            },
            error: (error: any) => {
                console.error('Failed to get Google auth URL:', error);
            }
        });
    }

    login(): void {
        if (!this.email || !this.password) {
            this.showErrorViaSwal('Please enter your email and password');
            return;
        }

        this.loading = true;

        this.authService.login(this.email, this.password).subscribe({
            next: (response) => {
                this.loading = false;
                if (response && response.access_token) {
                    this.showSuccessViaToast('Login successful');
                    setTimeout(() => {
                        this.redirectBasedOnRole();
                    }, 1500);
                } else {
                    this.showErrorViaSwal('Invalid response from server');
                }
            },
            error: (error: any) => {
                this.loading = false;
                if (error.status === 401) {
                    this.showErrorViaSwal('Invalid credentials', 'The email or password you entered is incorrect.');
                } else if (error.status === 429) {
                    this.showErrorViaSwal('Too many attempts', 'Please try again later.');
                } else if (error.error && error.error.message) {
                    this.showErrorViaSwal(error.error.message);
                } else {
                    this.showErrorViaSwal('Login failed', 'An unexpected error occurred. Please try again later.');
                }
            }
        });
    }

    // Mock login for testing
    mockAdminLogin(): void {
        this.loading = true;
        
        setTimeout(() => {
            this.loading = false;
            // Simulate successful login
            const mockUser = {
                id: 1,
                name: 'Admin User',
                email: 'admin@example.com',
                role: 'ADMIN',
                role_id: 1
            };
            // Store user in localStorage
            localStorage.setItem('currentUser', JSON.stringify(mockUser));
            localStorage.setItem('token', 'mock-token-admin');
            this.showSuccessViaToast('Admin login successful');
            this.router.navigate(['/Dashboard']);
        }, 1000);
    }

    mockUserLogin(): void {
        this.loading = true;
        
        setTimeout(() => {
            this.loading = false;
            // Simulate successful login
            const mockUser = {
                id: 2,
                name: 'Regular User',
                email: 'user@example.com',
                role: 'USER',
                role_id: 2
            };
            // Store user in localStorage
            localStorage.setItem('currentUser', JSON.stringify(mockUser));
            localStorage.setItem('token', 'mock-token-user');
            this.showSuccessViaToast('User login successful');
            this.router.navigate(['/chat']);
        }, 1000);
    }

    loginWithGoogle(): void {
        // Show loading indicator
        Swal.fire({
            title: 'Connexion en cours...',
            text: 'Redirection vers Google...',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });

        // Get the Google auth URL from the backend
        this.authService.getGoogleAuthUrl().subscribe({
            next: (response: any) => {
                if (response && response.url) {
                    console.log('Received Google auth URL:', response.url);
                    
                    // Log the redirect URI for debugging
                    try {
                        const urlObj = new URL(response.url);
                        const redirectUri = urlObj.searchParams.get('redirect_uri');
                        console.log('Redirect URI from URL:', redirectUri);
                        
                        // Verify the redirect URI is one of the authorized URIs in Google Console
                        const validRedirectUris = [
                            'http://127.0.0.1:8000/auth/google/callback',
                            'http://localhost:8000/auth/google/callback',
                            'http://localhost:4200/auth/google/callback',
                            'http://127.0.0.1:4200/auth/google/callback'
                        ];
                        
                        if (redirectUri && !validRedirectUris.includes(redirectUri)) {
                            console.warn('Warning: Redirect URI may not be authorized in Google Console:', redirectUri);
                        }
                    } catch (e) {
                        console.error('Error parsing Google auth URL:', e);
                    }
                    
                    // Open Google auth in a popup
                    const googleAuthWindow = window.open(
                        response.url,
                        'googleAuthPopup',
                        'width=500,height=600'
                    );

                    // Check if popup was blocked
                    if (!googleAuthWindow || googleAuthWindow.closed || typeof googleAuthWindow.closed === 'undefined') {
                        Swal.fire({
                            title: 'Popup bloqué',
                            text: 'Veuillez autoriser les popups pour ce site afin de vous connecter avec Google.',
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                        return;
                    }

                    // Create a function to handle the message event
                    const messageHandler = (event: MessageEvent) => {
                        // Verify origin and data
                        if (event.data && event.data.type === 'google-auth-callback') {
                            // Remove the event listener once we've received the message
                            window.removeEventListener('message', messageHandler);
                            
                            // Close the loading dialog
                            Swal.close();
                            
                            // Handle the authentication result
                            if (event.data.token) {
                                // Store the token
                                const token = event.data.token;
                                localStorage.setItem('token', token);
                                
                                // If we already have user data from the callback
                                if (event.data.user) {
                                    const userData = event.data.user;
                                    localStorage.setItem('currentUser', JSON.stringify(userData));
                                    this.authService.handleAuthentication(userData, token);
                                    this.showSuccessViaToast('Google login successful');
                                    
                                    setTimeout(() => {
                                        this.redirectBasedOnRole();
                                    }, 1500);
                                } else {
                                    // Use HTTP client to get user info
                                    this.http.get(`${this.authService['apiUrl']}/user?token=${token}`).subscribe({
                                        next: (response: any) => {
                                            this.loading = false;
                                            if (response && response.user) {
                                                // Use the auth service to handle the authenticated user
                                                this.authService.handleAuthentication(response.user, token);
                                                this.showSuccessViaToast('Google login successful');
                                                setTimeout(() => {
                                                    this.redirectBasedOnRole();
                                                }, 1500);
                                            } else {
                                                this.showErrorViaSwal(response?.message || 'Invalid response from Google authentication');
                                            }
                                        },
                                        error: (error: any) => {
                                            this.loading = false;
                                            this.showErrorViaSwal(error?.error?.message || 'Google authentication failed');
                                        }
                                    });
                                }
                            } else if (event.data.error) {
                                this.loading = false;
                                this.showErrorViaSwal(`Google authentication error: ${event.data.error}`);
                            }
                        }
                    };
                    
                    // Listen for messages from the popup
                    window.addEventListener('message', messageHandler);
                    
                    // Set a timeout to stop loading if no response is received
                    setTimeout(() => {
                        if (this.loading) {
                            this.loading = false;
                            window.removeEventListener('message', messageHandler);
                            this.showErrorViaSwal('Google authentication timed out. Please try again.', 
                                'The authentication process took too long to complete. This might be due to network issues or Google service unavailability.');
                        }
                    }, 120000); // 2 minute timeout
                } else {
                    this.loading = false;
                    this.showErrorViaSwal('Google authentication not available', 
                        'Unable to connect to Google authentication service. This might be because the backend server is not running or there are network connectivity issues. Please check your connection and try again later.');
                    
                    // Log detailed error for debugging
                    console.error('Google auth URL not available. Backend server might be down or not properly configured.');
                }
            },
            error: (error: any) => {
                Swal.close();
                this.loading = false;
                this.showErrorViaSwal('Failed to connect to authentication service', 
                    'Unable to start the Google authentication process. Please check your connection and try again.');
                console.error('Error getting Google auth URL:', error);
            }
        });
    }

    redirectBasedOnRole(): void {
        if (this.authService.isAdmin()) {
            this.router.navigate(['/Dashboard']);
        } else {
            this.router.navigate(['/chat']);
        }
    }

    // Helper method to show success toast and alert
    showSuccessViaToast(message: string = 'Login successful'): void {
        this.service.add({ severity: 'success', summary: 'Success', detail: message });
        
        // Also show a SweetAlert for better user experience
        Swal.fire({
            title: 'Succès!',
            text: message,
            icon: 'success',
            confirmButtonText: 'OK'
        });
    }

    // Helper method to show error toast
    showErrorViaToast(message: string = 'Problème de connexion'): void {
        this.service.add({ severity: 'error', summary: 'Error', detail: message });
    }
    
    // SweetAlert error display with optional detailed message
    showErrorViaSwal(message: string = 'Problème de connexion', detailedMessage?: string): void {
        Swal.fire({
            title: 'Erreur',
            text: message,
            icon: 'error',
            confirmButtonText: 'OK',
            ...(detailedMessage && {
                footer: `<div class="text-sm text-gray-500">${detailedMessage}</div>`,
                showClass: {
                    popup: 'animate__animated animate__fadeInDown'
                },
                hideClass: {
                    popup: 'animate__animated animate__fadeOutUp'
                }
            })
        });
    }
}
