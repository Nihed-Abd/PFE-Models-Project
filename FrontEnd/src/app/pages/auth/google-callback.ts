import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <h2 class="text-2xl mb-4">Authentification Google en cours...</h2>
        <p>Veuillez patienter pendant que nous traitons votre connexion.</p>
        <div class="mt-4">
          <div class="spinner-border text-primary" role="status">
            <span class="sr-only">Chargement...</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GoogleCallback implements OnInit {
  private apiUrl = environment.apiUrl || 'http://127.0.0.1:8000/api';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Get the token or error from the query parameters
    const token = this.route.snapshot.queryParamMap.get('token');
    const error = this.route.snapshot.queryParamMap.get('error');
    const code = this.route.snapshot.queryParamMap.get('code');

    // Handle token (successful authentication)
    if (token) {
      // Store the token in localStorage
      localStorage.setItem('token', token);
      
      // Show loading indicator
      Swal.fire({
        title: 'Authentification en cours...',
        text: 'Veuillez patienter pendant que nous récupérons vos informations',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      // Fetch user information using the token
      this.http.get(`${this.apiUrl}/auth/token-info?token=${token}`).subscribe({
        next: (response: any) => {
          // Close loading indicator
          Swal.close();
          
          if (response && response.user) {
            // Store user information
            const userData = {
              ...response.user,
              role: response.role
            };
            
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            // Send a message to the parent window (if this is in a popup)
            if (window.opener) {
              window.opener.postMessage({
                type: 'google-auth-callback',
                token: token,
                user: userData
              }, '*');
              
              // Close the popup
              window.close();
            } else {
              // If not in a popup, redirect to the dashboard or chat
              const isAdmin = userData.role?.toUpperCase() === 'ADMIN';
              this.router.navigate([isAdmin ? '/dashboard' : '/chat']);
            }
          } else {
            this.handleError('Impossible de récupérer les informations utilisateur');
          }
        },
        error: (error) => {
          Swal.close();
          this.handleError('Erreur lors de la récupération des informations utilisateur: ' + (error.message || 'Erreur inconnue'));
        }
      });
    } 
    // Handle error
    else if (error) {
      this.handleError(error);
    }
    // Handle code (redirect to backend)
    else if (code) {
      // If we got a code but not a token, we need to send it to the backend
      // This is a fallback in case the backend didn't handle it properly
      window.location.href = `http://127.0.0.1:8000/auth/google/callback?code=${code}`;
    }
    // No token, error, or code - redirect to login
    else {
      this.router.navigate(['/']);
    }
  }
  
  /**
   * Handle authentication errors
   */
  private handleError(errorMessage: string): void {
    // Show error message
    Swal.fire({
      title: 'Erreur d\'authentification',
      text: errorMessage || 'Une erreur s\'est produite lors de l\'authentification avec Google.',
      icon: 'error',
      confirmButtonText: 'OK'
    }).then(() => {
      // Redirect to login page
      if (window.opener) {
        window.opener.postMessage({
          type: 'google-auth-callback',
          error: errorMessage
        }, '*');
        window.close();
      } else {
        this.router.navigate(['/']);
      }
    });
  }

}
