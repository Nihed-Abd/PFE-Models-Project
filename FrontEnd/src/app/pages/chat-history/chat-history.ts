import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { CalendarModule } from 'primeng/calendar';
import { TooltipModule } from 'primeng/tooltip';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Conversation {
  id: number;
  user_id: number;
  title: string;
  message_user: string;
  message_bot: string;
  model_type: string;
  is_saved: boolean;
  timestamp: string;
  file_id?: number;
  tickets?: TicketChat[];
}

interface TicketChat {
  id: number;
  user_id: number;
  conversation_id: number;
  question: string;
  response: string;
  status: 'open' | 'closed';
  evaluation: 'jaime' | 'jenaimepas' | null;
  commentaire_admin?: string;
  created_at: string;
  updated_at: string;
}

interface ChatFilter {
  modelType: string | null;
  dateRange: Date[] | null;
  start?: Date | null;
  end?: Date | null;
}

@Component({
  selector: 'app-chat-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    AvatarModule,
    BadgeModule,
    ToastModule,
    ProgressSpinnerModule,
    DropdownModule,
    TagModule,
    InputSwitchModule,
    DividerModule,
    RippleModule,
    TableModule,
    ToolbarModule,
    ConfirmDialogModule,
    CheckboxModule,
    ChipModule,
    CalendarModule,
    TooltipModule,
    RouterModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="card">
      <p-toast></p-toast>
      <p-confirmDialog header="Confirmation" icon="pi pi-exclamation-triangle"></p-confirmDialog>
      
      <!-- Header with title and actions -->
      <div class="flex justify-content-between align-items-center mb-4">
        <h1 class="text-2xl font-bold mb-0">Chat History</h1>
        <div class="flex gap-2">
          <p-button icon="pi pi-plus" label="New Chat" severity="success" (click)="startNewChat()"></p-button>
        </div>
      </div>
      
      <!-- Toolbar with filters -->
      <p-toolbar styleClass="mb-4 gap-2">
        <ng-template pTemplate="start">
          <p-dropdown 
            [options]="modelOptions" 
            [(ngModel)]="filter.modelType" 
            placeholder="Filter by Model"
            [showClear]="true"
            styleClass="w-full md:w-15rem mr-2">
          </p-dropdown>
          
          <p-calendar 
            [(ngModel)]="filter.dateRange" 
            selectionMode="range" 
            [readonlyInput]="true"
            placeholder="Date Range"
            [showButtonBar]="true"
            styleClass="w-full md:w-20rem mr-2">
          </p-calendar>
          
          <p-button icon="pi pi-filter" label="Apply Filters" (click)="loadConversations()"></p-button>
          <p-button icon="pi pi-times" label="Reset" (click)="resetFilters()" styleClass="p-button-outlined ml-2"></p-button>
        </ng-template>
        
        <ng-template pTemplate="end">
          <div class="flex align-items-center">
            <p-button icon="pi pi-list" label="List View" styleClass="mr-2" [outlined]="viewMode !== 'list'" (click)="viewMode = 'list'"></p-button>
            <p-button icon="pi pi-th-large" label="Grid View" [outlined]="viewMode !== 'grid'" (click)="viewMode = 'grid'"></p-button>
          </div>
        </ng-template>
      </p-toolbar>
      
      <!-- Loading spinner -->
      <div *ngIf="loading" class="flex justify-content-center my-5">
        <p-progressSpinner></p-progressSpinner>
      </div>
      
      <!-- No conversations message -->
      <div *ngIf="!loading && conversations.length === 0" class="p-4 text-center surface-100 border-round">
        <i class="pi pi-comments text-5xl text-500 mb-3" style="display: block"></i>
        <p class="text-lg text-600 mb-3">No conversations found</p>
        <p-button label="Start a new conversation" icon="pi pi-plus" severity="success" (click)="startNewChat()"></p-button>
      </div>
      
      <!-- Table View -->
      <div *ngIf="!loading && conversations.length > 0 && viewMode === 'list'">
        <p-table 
          [value]="conversations" 
          [paginator]="true" 
          [rows]="10"
          [rowsPerPageOptions]="[5, 10, 25, 50]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} conversations"
          styleClass="p-datatable-sm p-datatable-gridlines">
          
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="id" style="width: 5%">ID <p-sortIcon field="id"></p-sortIcon></th>
              <th pSortableColumn="title" style="width: 25%">Title <p-sortIcon field="title"></p-sortIcon></th>
              <th pSortableColumn="model_type" style="width: 10%">Model <p-sortIcon field="model_type"></p-sortIcon></th>
              <th pSortableColumn="timestamp" style="width: 15%">Date <p-sortIcon field="timestamp"></p-sortIcon></th>
              <th style="width: 15%">First Message</th>
              <th style="width: 10%">Status</th>
              <th style="width: 20%">Actions</th>
            </tr>
          </ng-template>
          
          <ng-template pTemplate="body" let-conversation>
            <tr>
              <td>{{ conversation.id }}</td>
              <td>
                <div class="cursor-pointer text-primary font-medium hover:underline" (click)="selectConversation(conversation)">
                  {{ conversation.title }}
                </div>
              </td>
              <td>
                <p-tag [value]="conversation.model_type" [severity]="getModelSeverity(conversation.model_type)"></p-tag>
              </td>
              <td>{{ conversation.timestamp | date:'short' }}</td>
              <td>
                <div class="line-clamp-1 text-sm">{{ conversation.message_user }}</div>
              </td>
              <td>
                <p-tag 
                  [value]="conversation.is_saved ? 'Saved' : 'Unsaved'" 
                  [severity]="conversation.is_saved ? 'success' : 'warn'"
                  [icon]="conversation.is_saved ? 'pi pi-check' : 'pi pi-exclamation-triangle'">
                </p-tag>
              </td>
              <td>
                <div class="flex gap-1">
                  <p-button icon="pi pi-eye" styleClass="p-button-sm p-button-info" pTooltip="View Conversation" tooltipPosition="top" (click)="selectConversation(conversation)"></p-button>
                  <p-button 
                    [icon]="conversation.is_saved ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'" 
                    styleClass="p-button-sm p-button-warning" 
                    [pTooltip]="conversation.is_saved ? 'Unsave' : 'Save'" 
                    tooltipPosition="top"
                    (click)="toggleSaveConversation(conversation)">
                  </p-button>
                  <p-button 
                    icon="pi pi-thumbs-up" 
                    styleClass="p-button-sm p-button-success" 
                    [outlined]="!hasTicketWithEvaluation(conversation, 'jaime')"
                    pTooltip="Like" 
                    tooltipPosition="top"
                    (click)="createTicket(conversation, 'jaime')">
                  </p-button>
                  <p-button 
                    icon="pi pi-thumbs-down" 
                    styleClass="p-button-sm p-button-danger" 
                    [outlined]="!hasTicketWithEvaluation(conversation, 'jenaimepas')"
                    pTooltip="Dislike" 
                    tooltipPosition="top"
                    (click)="createTicket(conversation, 'jenaimepas')">
                  </p-button>
                  <p-button 
                    icon="pi pi-trash" 
                    styleClass="p-button-sm p-button-danger" 
                    pTooltip="Delete" 
                    tooltipPosition="top"
                    (click)="confirmDelete(conversation)">
                  </p-button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
      
      <!-- Grid View -->
      <div *ngIf="!loading && conversations.length > 0 && viewMode === 'grid'" class="grid">
        <div *ngFor="let conversation of conversations" class="col-12 md:col-6 xl:col-4 p-2">
          <p-card styleClass="h-full shadow-3 border-round-lg">
            <ng-template pTemplate="header">
              <div class="p-3 flex justify-content-between align-items-center surface-50 border-round-top">
                <div class="flex align-items-center gap-2">
                  <p-tag [value]="conversation.model_type" [severity]="getModelSeverity(conversation.model_type)"></p-tag>
                  <span class="text-sm text-500">{{ conversation.timestamp | date:'medium' }}</span>
                </div>
                <div>
                  <p-button 
                    [icon]="conversation.is_saved ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'" 
                    styleClass="p-button-rounded p-button-text" 
                    [ngClass]="{'text-yellow-500': conversation.is_saved}"
                    (click)="toggleSaveConversation(conversation)">
                  </p-button>
                </div>
              </div>
            </ng-template>
            
            <div class="mb-3 text-xl font-medium text-900 cursor-pointer hover:text-primary" (click)="selectConversation(conversation)">
              {{ conversation.title }}
            </div>
            
            <div class="mb-3 text-color-secondary line-clamp-3" style="min-height: 4.5rem;">
              {{ conversation.message_user }}
            </div>
            
            <ng-template pTemplate="footer">
              <div class="flex justify-content-between align-items-center">
                <div class="flex gap-2">
                  <p-button icon="pi pi-eye" styleClass="p-button-sm p-button-info" (click)="selectConversation(conversation)"></p-button>
                  <p-button icon="pi pi-trash" styleClass="p-button-sm p-button-danger" (click)="confirmDelete(conversation)"></p-button>
                </div>
                
                <div class="flex gap-1">
                  <p-button 
                    icon="pi pi-thumbs-up" 
                    styleClass="p-button-sm" 
                    [outlined]="!hasTicketWithEvaluation(conversation, 'jaime')"
                    severity="success"
                    (click)="createTicket(conversation, 'jaime')">
                  </p-button>
                  <p-button 
                    icon="pi pi-thumbs-down" 
                    styleClass="p-button-sm" 
                    [outlined]="!hasTicketWithEvaluation(conversation, 'jenaimepas')"
                    severity="danger"
                    (click)="createTicket(conversation, 'jenaimepas')">
                  </p-button>
                </div>
              </div>
            </ng-template>
          </p-card>
        </div>
      </div>
    </div>
  `
})
export class ChatHistoryComponent implements OnInit {
  conversations: Conversation[] = [];
  loading = false;
  viewMode: 'grid' | 'list' = 'grid';
  filter: ChatFilter = {
    modelType: null,
    dateRange: null
  };
  
  modelOptions = [
    { label: 'GPT-2', value: 'gpt2' },
    { label: 'Llama', value: 'llama' },
    { label: 'All Models', value: null }
  ];

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadConversations();
  }

  loadConversations() {
    this.loading = true;
    
    // Build query params for filtering
    let params: any = {};
    
    if (this.filter.modelType) {
      params.model_type = this.filter.modelType;
    }
    
    if (this.filter.dateRange && this.filter.dateRange.length > 0) {
      // Handle date range filtering
      if (this.filter.dateRange[0]) {
        params.start_date = this.filter.dateRange[0].toISOString().split('T')[0];
      }
      
      if (this.filter.dateRange[1]) {
        params.end_date = this.filter.dateRange[1].toISOString().split('T')[0];
      }
    }
    
    this.http.get<Conversation[]>(environment.apiUrl + '/chat-history', { params }).subscribe({
      next: (data) => {
        this.conversations = data;
        this.loading = false;
        
        if (data.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'No Conversations',
            detail: 'No conversations found with the current filters'
          });
        }
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load conversations'
        });
      }
    });
  }

  toggleSaveConversation(conversation: Conversation) {
    // Toggle the saved status in the UI immediately for better UX
    conversation.is_saved = !conversation.is_saved;
    
    // Call API to update the saved status
    this.http.post<any>(environment.apiUrl + '/conversation/' + conversation.id + '/toggle-save', {
      is_saved: conversation.is_saved
    }).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: response.is_saved ? 'Conversation saved' : 'Conversation unsaved'
        });
      },
      error: (error) => {
        // Revert the UI change on error
        conversation.is_saved = !conversation.is_saved;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to toggle save status'
        });
      }
    });
  }

  createTicket(conversation: Conversation, evaluation: 'jaime' | 'jenaimepas') {
    this.http.post<TicketChat>(environment.apiUrl + '/create-ticket', {
      conversation_id: conversation.id,
      evaluation
    }).subscribe({
      next: (ticket) => {
        // Update tickets in the conversation
        if (!conversation.tickets) {
          conversation.tickets = [];
        }
        
        // Check if the ticket already exists
        const existingTicketIndex = conversation.tickets.findIndex(t => t.id === ticket.id);
        if (existingTicketIndex >= 0) {
          // Update existing ticket
          conversation.tickets[existingTicketIndex] = ticket;
        } else {
          // Add new ticket
          conversation.tickets.push(ticket);
        }
        
        this.messageService.add({
          severity: 'success',
          summary: 'Feedback Submitted',
          detail: evaluation === 'jaime' ? 'Liked response' : 'Disliked response'
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to submit feedback'
        });
      }
    });
  }

  hasTicketWithEvaluation(conversation: Conversation, evaluation: 'jaime' | 'jenaimepas'): boolean {
    return conversation.tickets?.some(ticket => ticket.evaluation === evaluation) || false;
  }

  confirmDelete(conversation: Conversation) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this conversation?',
      accept: () => {
        // Call API to delete the conversation
        this.http.delete(environment.apiUrl + '/conversation/' + conversation.id).subscribe({
          next: () => {
            // Remove from local array
            this.conversations = this.conversations.filter(c => c.id !== conversation.id);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Conversation deleted'
            });
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete conversation'
            });
          }
        });
      }
    });
  }

  selectConversation(conversation: Conversation) {
    // Navigate to the conversation
    this.navigateToChat(conversation.id);
  }
  
  // Helper method to navigate to chat
  private navigateToChat(conversationId: number) {
    this.router.navigate(['/chat'], { queryParams: { conversationId: conversationId } });
  }

  startNewChat() {
    this.router.navigate(['/chat']);
  }

  resetFilters() {
    this.filter = {
      modelType: null,
      dateRange: null
    };
    this.loadConversations();
  }

  getModelSeverity(modelType: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (modelType) {
      case 'gpt2': return 'info';
      case 'llama': return 'warn';
      default: return 'secondary';
    }
  }
}
