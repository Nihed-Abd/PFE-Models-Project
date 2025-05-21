import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { DialogModule } from 'primeng/dialog';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import Swal from 'sweetalert2';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { MessageService, MenuItem } from 'primeng/api';
import { AuthService, User } from '../../services/auth.service';
import { ConversationService, Conversation } from '../../services/conversation.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'app-client-layout',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule,
        RouterModule, 
        ButtonModule, 
        AvatarModule, 
        BadgeModule,
        OverlayPanelModule,
        DialogModule,
        RippleModule,
        TooltipModule,
        DividerModule,
        MenuModule,
        ToastModule,
        ProgressSpinnerModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
    <div class="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-800 shadow-sm">
            <div class="flex items-center gap-2">
                <button 
                    pButton 
                    pRipple 
                    icon="pi pi-bars" 
                    class="p-button-text p-button-rounded"
                    (click)="toggleSidebar()"
                    pTooltip="Toggle sidebar"
                    tooltipPosition="bottom">
                </button>
                <div class="flex items-center">
                    <img src="assets/logo.png" alt="TuniHire" class="h-16 mr-10">
                </div>
            </div>
            
            <div class="flex items-center gap-3">
                <p-button 
                    icon="pi pi-moon" 
                    severity="secondary" 
                    text 
                    rounded 
                    aria-label="Toggle dark mode"
                    (onClick)="toggleDarkMode()"
                    pTooltip="Toggle dark mode"
                    tooltipPosition="bottom">
                </p-button>
                
                <div>
                    <p-avatar 
                        [image]="currentUser?.avatar || 'assets/demo/images/avatar/avatar-1.png'" 
                        shape="circle" 
                        [style]="{ cursor: 'pointer' }"
                        (click)="userMenu.toggle($event)"
                        class="border-2 border-primary-100 hover:border-primary-300 transition-all duration-200"
                        pTooltip="User menu"
                        tooltipPosition="bottom">
                    </p-avatar>
                    
                    <p-menu #userMenu [popup]="true" [model]="menuItems"></p-menu>
                </div>
            </div>
        </div>

        <!-- Main Content with Sidebar -->
        <div class="flex-1 flex overflow-hidden">
            <!-- Sidebar -->
            <div 
                class="bg-white dark:bg-slate-800 border-right shadow-md overflow-hidden transition-all duration-300 ease-in-out"
                [ngClass]="{'w-72': showSidebar, 'w-0': !showSidebar}">
                
                <div class="p-4 h-full flex flex-col">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-lg font-semibold text-slate-800 dark:text-white m-0">Chat History</h2>
                        <div class="flex gap-2">
                            <button 
                                pButton 
                                pRipple 
                                icon="pi pi-refresh" 
                                class="p-button-rounded p-button-text"
                                pTooltip="Refresh history"
                                tooltipPosition="bottom"
                                (click)="loadChatHistory()"
                                [disabled]="isLoading">
                            </button>
                            <button 
                                pButton 
                                pRipple 
                                icon="pi pi-plus" 
                                class="p-button-rounded p-button-text"
                                pTooltip="New chat"
                                tooltipPosition="bottom"
                                (click)="startNewChat()">
                            </button>
                        </div>
                    </div>
                    
                    <!-- Filter option -->
                    <div class="mb-3 flex items-center">
                        <!-- Checkbox for filtering removed - all conversations shown by default -->
                    </div>
                    
                    <!-- Loading indicator -->
                    <div *ngIf="isLoading" class="flex justify-content-center my-3">
                        <p-progressSpinner [style]="{width: '30px', height: '30px'}"></p-progressSpinner>
                    </div>
                    
                    <!-- No conversations message -->
                    <div *ngIf="!isLoading && conversations.length === 0" class="flex-1 flex flex-col justify-center items-center text-center p-4">
                        <i class="pi pi-comments text-4xl text-slate-400 mb-2"></i>
                        <p class="text-slate-500">No conversations found</p>
                        <button 
                            pButton 
                            label="Start a new chat" 
                            icon="pi pi-plus"
                            class="p-button-sm mt-3"
                            (click)="startNewChat()">
                        </button>
                    </div>
                    
                    <!-- Conversations list -->
                    <div *ngIf="!isLoading && conversations.length > 0" class="flex-1 overflow-y-auto">
                        <div 
                            *ngFor="let chat of conversations; let i = index" 
                            class="p-3 mb-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                            [ngClass]="{'bg-primary-50 dark:bg-primary-900': i === activeChat}"
                            (click)="selectConversation(chat, i)">
                            <div class="flex items-center gap-3">
                                <div class="flex-none" [ngSwitch]="chat.model_type">
                                    <i *ngSwitchCase="'gpt2'" class="pi pi-bolt text-primary-500"></i>
                                    <i *ngSwitchCase="'llama'" class="pi pi-star text-warning-500"></i>
                                    <i *ngSwitchDefault class="pi pi-comments text-primary-500"></i>
                                </div>
                                <div class="flex-1 truncate">{{ formatTitle(chat.title) }}</div>
                                <div class="flex items-center gap-1">
                                    <i *ngIf="chat.is_saved" class="pi pi-bookmark-fill text-yellow-500"></i>
                                    <span class="text-xs text-slate-500">{{ chat.timestamp | date:'shortDate' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div class="flex flex-col gap-2">
                            <button 
                                pButton 
                                pRipple 
                                icon="pi pi-cog" 
                                label="Settings" 
                                class="p-button-text p-button-secondary justify-start">
                            </button>
                            <button 
                                pButton 
                                pRipple 
                                icon="pi pi-question-circle" 
                                label="Help & FAQ" 
                                class="p-button-text p-button-secondary justify-start">
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Main Chat Content Area -->
            <div class="flex-1 overflow-hidden relative">
                <router-outlet></router-outlet>
            </div>
        </div>
        
        <p-toast></p-toast>
        <p-confirmDialog header="Confirmation" icon="pi pi-exclamation-triangle"></p-confirmDialog>
        
        <!-- User Profile Dialog -->
        <p-dialog 
            [(visible)]="showProfileDialog" 
            [modal]="true" 
            [dismissableMask]="true"
            header="User Profile" 
            [style]="{width: '450px'}"
            [draggable]="false" 
            [resizable]="false">
            
            <div class="flex flex-col items-center p-4">
                <p-avatar 
                    [image]="currentUser?.avatar || 'assets/demo/images/avatar/avatar-1.png'" 
                    size="xlarge" 
                    shape="circle"
                    class="mb-4 border-4 border-primary-100">
                </p-avatar>
                
                <h2 class="text-2xl font-semibold mb-1">{{ currentUser?.name || 'User' }}</h2>
                <p class="text-slate-500 mb-4">{{ currentUser?.email || 'No email available' }}</p>
                
                <p-divider></p-divider>
                
                <div class="w-full">
                    <div class="flex justify-between py-3">
                        <span class="text-slate-600 font-medium">Subscription</span>
                        <span class="text-primary-600 font-medium">Premium</span>
                    </div>
                    <div class="flex justify-between py-3">
                        <span class="text-slate-600 font-medium">Member Since</span>
                        <span>March 12, 2025</span>
                    </div>
                    <div class="flex justify-between py-3">
                        <span class="text-slate-600 font-medium">Last Login</span>
                        <span>Today</span>
                    </div>
                </div>
                
                <div class="flex gap-3 mt-4 w-full">
                    <button 
                        pButton 
                        pRipple 
                        label="Edit Profile" 
                        icon="pi pi-user-edit" 
                        class="p-button-outlined flex-1">
                    </button>
                    <button 
                        pButton 
                        pRipple 
                        label="Sign Out" 
                        icon="pi pi-sign-out" 
                        severity="danger" 
                        class="p-button-outlined flex-1"
                        (click)="logout()">
                    </button>
                </div>
            </div>
        </p-dialog>
    </div>
    `,
    styles: [`
      :host ::ng-deep {
        .p-avatar:hover {
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
        
        .p-avatar img {
          object-fit: cover;
        }
      }
    `]
})
export class ClientLayout implements OnInit {
    darkMode = false;
    showSidebar = true;
    showProfileDialog = false;
    activeChat = 0;
    currentUser: User | null = null;
    
    // Chat history management
    conversations: Conversation[] = [];
    isLoading = false;
    // Property showSavedOnly removed - all conversations displayed by default
    selectedConversationId: number | null = null;
    
    menuItems: MenuItem[] = [
        {
            label: 'Profile',
            icon: 'pi pi-user',
            command: () => {
                this.showProfileDialog = true;
            }
        },
        {
            label: 'Settings',
            icon: 'pi pi-cog'
        },
        {
            separator: true
        },
        {
            label: 'Sign Out',
            icon: 'pi pi-sign-out',
            command: () => {
                this.logout();
            }
        }
    ];
    
    constructor(
        private authService: AuthService, 
        private router: Router,
        private conversationService: ConversationService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        if (this.darkMode) {
            document.documentElement.classList.add('app-dark');
        } else {
            document.documentElement.classList.remove('app-dark');
        }
    }
    
    toggleSidebar() {
        this.showSidebar = !this.showSidebar;
    }
    
    ngOnInit() {
        // Get current user data
        this.authService.currentUser.subscribe(user => {
            this.currentUser = user;
            console.log('ClientLayout received user:', user);
            
            // Check if user is logged in - only redirect if not an initial page load
            if (!user && this.authService.hasInitialLoadCompleted) {
                console.log('No user found in ClientLayout, redirecting to login');
                // User is not logged in, redirect to login without showing confirmation
                this.router.navigate(['/']);
            } else if (user) {
                // Load chat history once user is authenticated
                this.loadChatHistory();
            }
        });
        
        // Initialize dark mode from saved preference if any
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            this.darkMode = true;
            document.documentElement.classList.add('app-dark');
        }
    }
    
    // Load chat history from the API
    loadChatHistory() {
        this.isLoading = true;
        
        this.conversationService.getChatHistory().subscribe({
            next: (data) => {
                this.conversations = data;
                this.isLoading = false;
                
                if (this.conversations.length === 0) {
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Info',
                        detail: 'No saved conversations found'
                    });
                }
            },
            error: (err) => {
                console.error('Error loading chat history:', err);
                this.isLoading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load chat history'
                });
            }
        });
    }
    
    // Select a conversation and navigate to the chat room with the conversation ID
    selectConversation(conversation: Conversation, index: number) {
        this.activeChat = index;
        this.selectedConversationId = conversation.id;
        
        // Navigate to chat with the conversation ID directly in the path parameter, not as a query param
        this.router.navigate([`/chat/${conversation.id}`]);
    }
    
    // Start a new chat (no confirmation needed due to auto-save)
    startNewChat() {
        // Since all conversations are auto-saved, we can directly navigate to a new chat
        this.resetChatAndNavigate();
    }
    
    // Helper method to reset chat selection and navigate to a new conversation
    resetChatAndNavigate() {
        // Reset selection
        this.selectedConversationId = null;
        this.activeChat = -1;
        
        // Navigate to chat without a conversation ID for a new conversation
        this.router.navigate(['/chat']);
    }
    
    // Format the title to simply display the first message without quotes
    formatTitle(title: string): string {
        if (!title) return 'Untitled Conversation';
        
        try {
            // Check if the title is a JSON string
            if (title.startsWith('[') || title.startsWith('{')) {
                try {
                    // Parse the JSON string
                    const parsed = JSON.parse(title);
                    
                    // If it's an array, take the first element
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        // Return the first message without quotes
                        return this.cleanAndTruncateTitle(String(parsed[0]));
                    }
                    
                    // If it's an object, convert to string
                    return this.cleanAndTruncateTitle(String(parsed));
                } catch (parseError) {
                    // If JSON parsing fails, try to extract content between quotes manually
                    if (title.startsWith('["') && title.endsWith('"]')) {
                        return this.cleanAndTruncateTitle(title.substring(2, title.length - 2));
                    }
                    
                    // For other formats, just clean the original title
                    return this.cleanAndTruncateTitle(title);
                }
            }
            
            // If not a JSON string, just clean and return
            return this.cleanAndTruncateTitle(title);
        } catch (e) {
            // If any error occurs, just return the original string cleaned up
            return this.cleanAndTruncateTitle(title);
        }
    }
    
    // Helper to clean and truncate titles - simplified to just show the message text
    cleanAndTruncateTitle(title: string): string {
        if (!title) return 'Untitled Conversation';
        
        // First, remove any surrounding quotes of any type
        let cleaned = title;
        
        // Remove quotes at beginning and end (double quotes)
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.substring(1, cleaned.length - 1);
        }
        
        // Remove quotes at beginning and end (single quotes)
        if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
            cleaned = cleaned.substring(1, cleaned.length - 1);
        }
        
        // Remove all formatting characters and brackets
        cleaned = cleaned
            .replace(/\\n/g, ' ')       // Newlines
            .replace(/\\r/g, ' ')       // Carriage returns
            .replace(/\\t/g, ' ')       // Tabs
            .replace(/\\'/g, "'")       // Single quotes
            .replace(/\\"/g, '"')       // Double quotes
            // Removed problematic forward slashes regex
            .replace(/\[|\]/g, '')      // Square brackets
            .replace(/\{|\}/g, '')      // Curly braces
            .replace(/\\\\/g, '\\')    // Backslashes
            .replace(/^['"]|['"]$/g, '')  // Any remaining quotes at start/end
            .trim();
        
        // Truncate if too long (show more of the message)
        return cleaned.length > 50 ? cleaned.substring(0, 47) + '...' : cleaned;
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
                // Call logout with showConfirmation=false to prevent duplicate dialogs
                this.authService.logout(true, false);
            }
        });
    }
}
