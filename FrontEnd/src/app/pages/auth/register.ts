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
    selector: 'app-register',
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
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Créer un compte</div>
                        </div>
                        <p-toast />
                        <div>
                            <label for="name" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Nom complet</label>
                            <input pInputText id="name" type="text" placeholder="Nom complet" class="w-full md:w-[30rem] mb-8" [(ngModel)]="name" />

                            <label for="email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                            <input pInputText id="email" type="text" placeholder="Email" class="w-full md:w-[30rem] mb-8" [(ngModel)]="email" />

                            <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Mot de passe</label>
                            <p-password id="password" [(ngModel)]="password" placeholder="Mot de passe" [toggleMask]="true" styleClass="mb-4" [fluid]="true"></p-password>

                            <label for="confirmPassword" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Confirmer mot de passe</label>
                            <p-password id="confirmPassword" [(ngModel)]="confirmPassword" placeholder="Confirmer mot de passe" [toggleMask]="true" styleClass="mb-8" [fluid]="true" [feedback]="false"></p-password>

                            <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                <div class="flex align-items-center">
                                    <p-checkbox name="terms" [binary]="true" [(ngModel)]="termsAccepted" styleClass="mr-2"></p-checkbox>
                                    <label for="terms" class="text-surface-900 dark:text-surface-0 font-medium">J'accepte les termes et conditions</label>
                                </div>
                            </div>

                            <button pButton pRipple [loading]="loading" label="S'inscrire" class="w-full md:w-[30rem] py-3 text-xl" (click)="register()"></button>

                            <div class="my-4 flex items-center">
                                <p-divider styleClass="flex-1" [layout]="'horizontal'">
                                    <span class="px-2">ou</span>
                                </p-divider>
                            </div>

                            <button pButton pRipple icon="pi pi-google" label="S'inscrire avec Google" class="w-full md:w-[30rem] py-3 text-xl p-button-outlined p-button-secondary mb-8" (click)="loginWithGoogle()"></button>
                        </div>
                    </div>
                </div>
                <div class="mt-6 text-center text-surface-900 dark:text-surface-0">
                    Vous avez déjà un compte? <a routerLink="/" class="font-medium text-primary-500 cursor-pointer ml-2">Se connecter</a>
                </div>
            </div>
        </div>
    `,
    providers: [MessageService]
})
export class Register implements OnInit {
    service: MessageService;

    name: string = "";
    email: string = "";
    password: string = "";
    confirmPassword: string = "";
    termsAccepted: boolean = false;
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
        // Check if user is already logged in
        if (this.authService.isLoggedIn()) {
            this.redirectBasedOnRole();
        }
        
        // Get Google auth URL
        this.authService.getGoogleAuthUrl().subscribe(
            response => {
                if (response && response.url) {
                    this.googleAuthUrl = response.url;
                }
            },
            error => {
                console.error('Failed to get Google auth URL', error);
            }
        );
    }

    register() {
        if (!this.name || !this.email || !this.password || !this.confirmPassword) {
            this.showErrorViaSwal('Veuillez remplir tous les champs');
            return;
        }

        if (this.password !== this.confirmPassword) {
            this.showErrorViaSwal('Les mots de passe ne correspondent pas');
            return;
        }

        this.loading = true;

        // Use AuthService for registration
        this.authService.register(this.name.trim(), this.email.trim(), this.password)
            .subscribe({
                next: (response) => {
                    this.loading = false;
                    
                    if (response && response.status === 'success') {
                        Swal.fire({
                            title: 'Succès!',
                            text: response.message || 'Compte créé avec succès! Vous pouvez maintenant vous connecter.',
                            icon: 'success',
                            confirmButtonText: 'Aller à la connexion'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                this.router.navigate(['/']);
                            }
                        });
                    } else {
                        this.showErrorViaSwal(response?.message || 'Inscription échouée');
                    }
                },
                error: (error) => {
                    this.loading = false;
                    console.error('Erreur d\'inscription:', error);
                    
                    let errorMessage = 'Inscription échouée';
                    
                    if (error.error && error.error.message) {
                        errorMessage = error.error.message;
                    } else if (error.error && error.error.errors) {
                        // Handle validation errors
                        const errors = error.error.errors;
                        errorMessage = Object.values(errors).flat().join('\n');
                    }
                    
                    this.showErrorViaSwal(errorMessage);
                }
            });
    }

    loginWithGoogle() {
        if (this.googleAuthUrl) {
            // Open Google login in a new window
            const googleWindow = window.open(this.googleAuthUrl, '_blank', 'width=600,height=700');
            
            // Listen for messages from the popup
            window.addEventListener('message', (event) => {
                if (event.data && event.data.token) {
                    // Use the token to authenticate the user
                    this.authService.googleLogin(event.data.token).subscribe(
                        response => {
                            if (response && response.user) {
                                this.showSuccessViaToast();
                                setTimeout(() => {
                                    this.redirectBasedOnRole();
                                }, 1500);
                            } else {
                                this.showErrorViaToast(response?.message || 'Google login failed');
                            }
                        },
                        error => {
                            this.showErrorViaToast(error?.error?.message || 'Google login failed');
                        }
                    );
                }
            });
        } else {
            this.showErrorViaToast('Google authentication not available');
        }
    }
    
    redirectBasedOnRole() {
        if (this.authService.isAdmin()) {
            this.router.navigate(['/Dashboard']);
        } else {
            this.router.navigate(['/chat']);
        }
    }

    showSuccessViaToast(message: string = 'Compte créé avec succès') {
        this.service.add({ severity: 'success', summary: 'Success', detail: message });
        
        // Also show a SweetAlert for better user experience
        Swal.fire({
            title: 'Succès!',
            text: message,
            icon: 'success',
            confirmButtonText: 'OK'
        });
    }

    showErrorViaToast(message: string = "Problème lors de l'inscription") {
        this.service.add({ severity: 'error', summary: 'Erreur', detail: message });
    }
    
    // New method for SweetAlert error display
    showErrorViaSwal(message: string = "Problème lors de l'inscription") {
        Swal.fire({
            title: 'Erreur',
            text: message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}
