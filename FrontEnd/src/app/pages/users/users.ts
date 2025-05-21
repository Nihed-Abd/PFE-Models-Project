import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  avatar?: string;
  status: 'active' | 'inactive';
  conversations_count?: number;
  tickets_count?: number;
  positive_feedback_count?: number;
  negative_feedback_count?: number;
}

// No longer needed as we removed filtering

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    AvatarModule,
    BadgeModule,
    ToastModule,
    ProgressSpinnerModule,
    DropdownModule,
    TagModule,
    TableModule,
    ConfirmDialogModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="card">
      <p-toast></p-toast>
      <p-confirmDialog header="Confirmation" icon="pi pi-exclamation-triangle"></p-confirmDialog>
      
      <!-- Header with title -->
      <div class="mb-4">
        <h1 class="text-2xl font-bold mb-0">User Management</h1>
      </div>
      
      <!-- Search, filters and refresh in one line -->
      <div class="p-3 border-round mb-4 surface-card">
        <div class="flex align-items-center">
          <div class="flex-1">
            <input type="text" pInputText [(ngModel)]="searchTerm" 
                  placeholder="Search by name or email..." 
                  (input)="applySearch()" 
                  class="w-full p-2" 
                  [style]="{'height': '36px'}" />
          </div> 
        </div>
      </div>
      
      <!-- Loading spinner -->
      <div *ngIf="loading" class="flex justify-content-center py-6">
        <p-progressSpinner></p-progressSpinner>
      </div>
      
      <!-- List view -->
      <p-table 
        *ngIf="!loading" 
        [value]="filteredUsers" 
        styleClass="p-datatable-sm" 
        [tableStyle]="{'min-width': '60rem'}"
        [paginator]="true" 
        [rows]="10" 
        [showCurrentPageReport]="true" 
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
        [rowsPerPageOptions]="[10,25,50]">
        
        <ng-template pTemplate="header">
          <tr>
            <th style="width: 3rem" class="text-center">ID</th>
            <th pSortableColumn="name" class="text-left">Name <p-sortIcon field="name"></p-sortIcon></th>
            <th pSortableColumn="email" class="text-left">Email <p-sortIcon field="email"></p-sortIcon></th>
            <th pSortableColumn="conversations_count" style="width: 12rem" class="text-center">
              <div class="flex align-items-center justify-content-center gap-2">
                <i class="pi pi-comments text-primary"></i>
                <span>Conversations</span>
                <p-sortIcon field="conversations_count"></p-sortIcon>
              </div>
            </th>
            <th pSortableColumn="tickets_count" style="width: 8rem" class="text-center">
              <div class="flex align-items-center justify-content-center gap-2">
                <i class="pi pi-inbox text-orange-500"></i>
                <span>Tickets</span>
                <p-sortIcon field="tickets_count"></p-sortIcon>
              </div>
            </th>
            <th style="width: 12rem" class="text-center">
              <div class="flex align-items-center justify-content-center gap-2">
                <i class="pi pi-star text-yellow-500"></i>
                <span>Feedback</span>
              </div>
            </th>
            <th pSortableColumn="created_at" style="width: 10rem" class="text-center">
              <div class="flex align-items-center justify-content-center gap-2">
                <i class="pi pi-calendar text-blue-500"></i>
                <span>Created Date</span>
                <p-sortIcon field="created_at"></p-sortIcon>
              </div>
            </th>
          </tr>
        </ng-template>
        
        <ng-template pTemplate="body" let-user>
          <tr>
            <td>{{user.id}}</td>
            <td>
              <div class="flex align-items-center gap-2">
                <p-avatar [image]="user.avatar" icon="pi pi-user" [style]="{'background-color': '#2196F3', 'color': '#ffffff'}"></p-avatar>
                <span class="font-medium">{{user.name}}</span>
              </div>
            </td>
            <td>{{user.email}}</td>
            <td class="text-center">
              <div class="flex align-items-center justify-content-center gap-2">
                <i class="pi pi-comments text-primary" style="font-size: 1.2rem;"></i>
                <span class="font-medium">{{user.conversations_count || 0}}</span>
              </div>
            </td>
            <td class="text-center">
              <div class="flex align-items-center justify-content-center gap-2">
                <i class="pi pi-inbox text-orange-500" style="font-size: 1.2rem;"></i>
                <span class="font-medium">{{user.tickets_count || 0}}</span>
              </div>
            </td>
            <td>
              <div class="flex align-items-center justify-content-between px-2">
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-thumbs-up text-green-500" style="font-size: 1.2rem;"></i>
                  <span class="font-medium">{{user.positive_feedback_count || 0}}</span>
                </div>
                <br>
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-thumbs-down text-red-500" style="font-size: 1.2rem;"></i>
                  <span class="font-medium">{{user.negative_feedback_count || 0}}</span>
                </div>
              </div>
            </td>
            <td>{{formatDate(user.created_at)}}</td>
          </tr>
        </ng-template>
        
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="text-center p-4">
              No users found.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = false;
  searchTerm = '';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    
    this.http.get<any>(environment.apiUrl + '/users').subscribe({
      next: (data) => {
        if (data && Array.isArray(data)) {
          this.users = data.map((user: any) => ({
            ...user,
            conversations_count: user.conversations_count || 0,
            tickets_count: user.tickets_count || 0,
            positive_feedback_count: user.positive_feedback_count || 0,
            negative_feedback_count: user.negative_feedback_count || 0
          }));
          this.filteredUsers = [...this.users];
        } else {
          this.users = [];
          this.filteredUsers = [];
        }
        
        this.loading = false;
        
        if (this.users.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'No Users',
            detail: 'No users found with the current filters'
          });
        }
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load users'
        });
      }
    });
  }

  applySearch() {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
      return;
    }
    
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredUsers = this.users.filter(user => 
      user.name.toLowerCase().includes(term) || 
      user.email.toLowerCase().includes(term)
    );
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | undefined {
    switch (role) {
      case 'admin': return 'danger';
      case 'user': return 'success';
      case 'guest': return 'info';
      default: return 'secondary';
    }
  }
  
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
}
