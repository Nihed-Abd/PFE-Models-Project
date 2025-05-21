import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { MessageService } from 'primeng/api';

// Modern approach using functional guards to prevent circular dependencies
export const AuthGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Try to get MessageService but don't fail if it's not available
  let messageService;
  try {
    messageService = inject(MessageService, { optional: true });
  } catch (e) {
    console.log('MessageService not available in AuthGuard');
  }
  
  // Don't apply auth guard to login and register pages
  if (state.url === '/' || state.url === '/register') {
    return true;
  }
  
  // Check if user is logged in
  if (authService.isLoggedIn()) {
    
    // Check if route requires admin role
    if (route.data['requiresAdmin'] && !authService.isAdmin()) {
      // Redirect non-admin users to chat
      if (messageService) {
        messageService.add({
          severity: 'error',
          summary: 'Access Denied',
          detail: 'You do not have permission to access this area'
        });
      }
      router.navigate(['/chat']);
      return false;
    }
    
    return true;
  }
  
  // Not logged in, redirect to login page with message
  if (messageService) {
    messageService.add({
      severity: 'warn',
      summary: 'Authentication Required',
      detail: 'Please login to access this page'
    });
  }
  router.navigate(['/']);
  return false;
};
