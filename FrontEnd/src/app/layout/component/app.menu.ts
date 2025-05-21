import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Admin Dashboard',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] },
                    { label: 'Users', icon: 'pi pi-fw pi-users', routerLink: ['/dashboard/users'] },
                    { label: 'Evaluations', icon: 'pi pi-fw pi-star', routerLink: ['/dashboard/evaluations'] },
                ]
            }
        ];
    }
    
    // Add logout handler
    handleLogout() {
        // Find the AuthService and call logout
        const authServiceElement = document.createElement('div');
        authServiceElement.setAttribute('id', 'auth-service-logout');
        authServiceElement.style.display = 'none';
        authServiceElement.setAttribute('data-action', 'logout');
        document.body.appendChild(authServiceElement);
        
        // Trigger a custom event that can be listened to by the app component
        const event = new CustomEvent('auth-logout', { bubbles: true });
        authServiceElement.dispatchEvent(event);
        
        // Remove the element
        setTimeout(() => {
            document.body.removeChild(authServiceElement);
        }, 100);
    }
}
