import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { AuthService, User } from '../../services/auth.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator, DialogModule, ButtonModule, AvatarModule, MenuModule, ToastModule, DividerModule, TagModule],
    providers: [MessageService],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/">
                <img src="../../assets/logo.png" alt="erp-dashboard" style="max-height: 50px; max-width: 50px;">
                <span>ERP Dashboard</span>
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <div class="relative">
                    <button
                        class="layout-topbar-action layout-topbar-action-highlight"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <app-configurator />
                </div>
                <!-- Notification Icon -->
                <button type="button" class="layout-topbar-action" *ngIf="isLoggedIn">
                    <i class="pi pi-bell"></i>
                    <span class="layout-topbar-action-badge">2</span>
                </button>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action" *ngIf="!isLoggedIn" [routerLink]="['/']">
                        <i class="pi pi-sign-in"></i>
                        <span>Login</span>
                    </button>
                    <button type="button" class="layout-topbar-action" *ngIf="!isLoggedIn" [routerLink]="['/register']">
                        <i class="pi pi-user-plus"></i>
                        <span>Register</span>
                    </button>
                    
                    <!-- User Profile & Menu when logged in -->
                    <div *ngIf="isLoggedIn" class="flex items-center gap-2 relative">
                        <button type="button" class="layout-topbar-action flex items-center" (click)="showUserDialog()">
                            <p-avatar [image]="getUserAvatar()" styleClass="mr-2" shape="circle" size="normal"></p-avatar>
                            <span>{{ currentUser?.name || 'User' }}</span>
                        </button>
                        <button type="button" class="layout-topbar-action" (click)="logout()">
                            <i class="pi pi-sign-out"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- User Profile Dialog - Enhanced with better styling -->
            <p-dialog header="User Profile" [(visible)]="showDialog" [style]="{width: '500px'}" [modal]="true" [dismissableMask]="true">
                <div class="p-4">
                    <div class="flex flex-column align-items-center text-center mb-4">
                        <p-avatar [image]="getUserAvatar()" styleClass="mb-3 border-3 border-primary-100" shape="circle" size="xlarge"></p-avatar>
                        <h2 class="text-xl font-semibold mb-1 mt-2">{{ currentUser?.name || 'User' }}</h2>
                        <p class="text-sm text-500 mb-2">{{ currentUser?.email }}</p>
                        <p-tag [severity]="getRoleTagSeverity()" [value]="currentUser?.role?.toUpperCase() || 'USER'"></p-tag>
                    </div>
                    
                    <p-divider></p-divider>
                    
                    <div class="grid mt-3">
                        <div class="col-6 mb-3">
                            <label class="block text-sm font-medium text-500 mb-1">User ID</label>
                            <span class="font-semibold">#{{ currentUser?.id || 'N/A' }}</span>
                        </div>
                        <div class="col-6 mb-3">
                            <label class="block text-sm font-medium text-500 mb-1">Member Since</label>
                            <span class="font-semibold">{{ getFormattedDate(currentUser?.created_at) }}</span>
                        </div>
                        <div class="col-6 mb-3">
                            <label class="block text-sm font-medium text-500 mb-1">Last Login</label>
                            <span class="font-semibold">{{ getCurrentDate() }}</span>
                        </div>
                        <div class="col-6 mb-3">
                            <label class="block text-sm font-medium text-500 mb-1">Status</label>
                            <p-tag severity="success" value="ACTIVE"></p-tag>
                        </div>
                    </div>
                </div>
                <div class="flex justify-content-between p-3 border-top-1 border-300">
                    <p-button label="Edit Profile" icon="pi pi-user-edit" styleClass="p-button-outlined"></p-button>
                    <p-button label="Close" icon="pi pi-times" (click)="showDialog = false" styleClass="p-button-text"></p-button>
                </div>
            </p-dialog>
            
            <p-toast></p-toast>
        </div>
    </div>`
})
export class AppTopbar implements OnInit {
    items!: MenuItem[];
    isLoggedIn: boolean = false;
    currentUser: User | null = null;
    showDialog: boolean = false;
    
    // Colors for avatar generation
    private avatarColors = [
        '2196f3', // Blue
        '4caf50', // Green
        'f44336', // Red
        'ff9800', // Orange
        '9c27b0', // Purple
        '3f51b5'  // Indigo
    ];

    constructor(
        public layoutService: LayoutService,
        private authService: AuthService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        // Subscribe to user authentication state
        this.authService.currentUser.subscribe(user => {
            this.currentUser = user;
            this.isLoggedIn = !!user;
            
            if (user && !user.avatar) {
                // Generate avatar URL if one doesn't exist
                const avatarUrl = this.generateAvatar(user.name);
                user.avatar = avatarUrl;
            }
        });
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }
    
    showUserDialog() {
        this.showDialog = true;
    }
    
    // Generate a random avatar URL using UI Avatars API
    generateAvatar(name?: string): string {
        const randomIndex = Math.floor(Math.random() * this.avatarColors.length);
        const color = this.avatarColors[randomIndex];
        const userName = name || (this.currentUser?.name || 'User');
        const encodedName = encodeURIComponent(userName);
        return `https://ui-avatars.com/api/?name=${encodedName}&background=${color}&color=fff&size=256`;
    }
    
    // Get user avatar or generate one if not present
    getUserAvatar(): string {
        if (this.currentUser?.avatar) {
            return this.currentUser.avatar;
        }
        return this.generateAvatar(this.currentUser?.name);
    }
    
    // Get tag severity based on user role
    getRoleTagSeverity(): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
        if (!this.currentUser?.role) return 'info';
        
        const role = this.currentUser.role.toLowerCase();
        switch (role) {
            case 'admin':
                return 'danger';
            case 'client':
                return 'success';
            default:
                return 'info';
        }
    }
    
    // Format date for profile display
    getFormattedDate(date: string | Date | undefined): string {
        if (!date) return 'N/A';
        
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Get current date formatted (safe method for template usage)
    getCurrentDate(): string {
        return this.getFormattedDate(new Date());
    }
    
    logout() {
        // Confirm logout with SweetAlert
        Swal.fire({
            title: 'Logout Confirmation',
            text: 'Are you sure you want to logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        }).then((result) => {
            if (result.isConfirmed) {
                // Prevent duplicate confirmation by setting showConfirmation=false
                this.authService.logout(true, false);
                Swal.fire('Logged Out!', 'You have been successfully logged out.', 'success');
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'You have been logged out' });
            }
        });
    }
}
