import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { ToolbarModule } from 'primeng/toolbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { RippleModule } from 'primeng/ripple';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';

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

interface TicketResponse {
  id: number;
  ticket_id: number;
  admin_id: number;
  comment: string | undefined;
  created_at: string;
  updated_at: string;
  admin_name: string;
  admin_avatar?: string;
}

interface TicketWithUser extends TicketChat {
  user_name: string;
  user_email: string;
  user_avatar?: string;
  responses?: TicketResponse[];
  newComment?: string;
  flipped?: boolean;
  user?: {
    name: string;
    email: string;
    user_avatar?: string;
  };
}

interface TicketFilter {
  evaluation: string | null;
  status: string | null;
  searchTerm: string | null;
}

interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{url: string | null, label: string, active: boolean}>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

@Component({
  selector: 'app-evaluations',
  standalone: true,
  styleUrls: ['./evaluations.css'],
  templateUrl: './evaluations.component.html',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    ToastModule,
    TagModule,
    DialogModule,
    AvatarModule,
    BadgeModule,
    DividerModule,
    ProgressSpinnerModule,
    ProgressBarModule,
    RippleModule,
    OverlayPanelModule,
    ScrollPanelModule,
    SkeletonModule,
    DropdownModule,
    ConfirmDialogModule,
    TooltipModule,
    ChipModule,
    ToolbarModule
  ],
  providers: [MessageService, ConfirmationService],
  animations: [
    trigger('flipState', [
      transition('front => back', [
        animate('400ms ease-out', style({ transform: 'rotateY(180deg)' }))
      ]),
      transition('back => front', [
        animate('400ms ease-in', style({ transform: 'rotateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('{{duration}} ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('{{duration}} ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="card">
      <p-toast></p-toast>
      <p-confirmDialog header="Confirmation" icon="pi pi-exclamation-triangle"></p-confirmDialog>
      
      <h2 class="text-2xl font-bold mb-4">User Feedback Management</h2>
      <p class="mb-4 text-slate-600">Review and respond to user evaluations on AI conversations</p>
      
      <!-- Toolbar with filters -->
      <p-toolbar styleClass="mb-4 gap-2">
        <ng-template pTemplate="start">
          <p-dropdown 
            [options]="evaluationOptions" 
            [(ngModel)]="filter.evaluation" 
            placeholder="Filter by Evaluation"
            [showClear]="true"
            styleClass="w-full md:w-15rem mr-2">
          </p-dropdown>
          
          <p-dropdown 
            [options]="statusOptions" 
            [(ngModel)]="filter.status" 
            placeholder="Filter by Status"
            [showClear]="true"
            styleClass="w-full md:w-15rem mr-2">
          </p-dropdown>
        </ng-template>
        
        <ng-template pTemplate="end">
          <span class="p-input-icon-left mr-2">
            <i class="pi pi-search"></i>
            <input type="text" pInputText [(ngModel)]="filter.searchTerm" 
                   placeholder="Search tickets" 
                   (input)="applyFilters()" 
                   class="w-full md:w-20rem" />
          </span>
          
          <p-button icon="pi pi-filter-slash" 
                   label="Reset Filters" 
                   severity="secondary" 
                   (onClick)="resetFilters()"
                   [outlined]="true">
          </p-button>
        </ng-template>
      </p-toolbar>
      
      <!-- Stats summary -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="stats-card p-3 bg-blue-50 border border-blue-200">
            <div class="flex justify-content-between mb-2">
              <span class="text-blue-800 font-medium">Total Tickets</span>
              <span class="text-blue-800 font-bold text-xl">{{filteredTickets.length}}</span>
            </div>
            <p-progressBar [value]="100" styleClass="h-1rem" [showValue]="false"></p-progressBar>
          </div>
        </div>
        
        <div class="col-12 md:col-3">
          <div class="stats-card p-3 bg-green-50 border border-green-200">
            <div class="flex justify-content-between mb-2">
              <span class="text-green-800 font-medium">Positive Feedback</span>
              <span class="text-green-800 font-bold text-xl">{{getPositiveFeedbackCount()}}</span>
            </div>
            <p-progressBar [value]="getPositiveFeedbackCount() / filteredTickets.length * 100" styleClass="h-1rem" [showValue]="false" severity="success"></p-progressBar>
          </div>
        </div>
        
        <div class="col-12 md:col-3">
          <div class="stats-card p-3 bg-red-50 border border-red-200">
            <div class="flex justify-content-between mb-2">
              <span class="text-red-800 font-medium">Negative Feedback</span>
              <span class="text-red-800 font-bold text-xl">{{getNegativeFeedbackCount()}}</span>
            </div>
            <p-progressBar [value]="getNegativeFeedbackCount() / filteredTickets.length * 100" styleClass="h-1rem" [showValue]="false" severity="danger"></p-progressBar>
          </div>
        </div>
        
        <div class="col-12 md:col-3">
          <div class="stats-card p-3 bg-yellow-50 border border-yellow-200">
            <div class="flex justify-content-between mb-2">
              <span class="text-yellow-800 font-medium">Open Tickets</span>
              <span class="text-yellow-800 font-bold text-xl">{{getOpenTicketsCount()}}</span>
            </div>
            <p-progressBar [value]="getOpenTicketsCount() / filteredTickets.length * 100" styleClass="h-1rem" [showValue]="false" severity="warning"></p-progressBar>
          </div>
        </div>
      </div>
      
      <!-- Loading template -->
      <ng-template #loadingTemplate>
        <div class="flex justify-content-center align-items-center" style="height: 400px;">
          <p-progressSpinner strokeWidth="4" [style]="{width: '50px', height: '50px'}"></p-progressSpinner>
          <span class="ml-3 text-lg">Loading tickets...</span>
        </div>
      </ng-template>
      
      <!-- Grid layout for tickets -->
      <div *ngIf="!loading; else loadingTemplate" class="mt-4">
        <div *ngIf="filteredTickets.length === 0" class="text-center p-5 bg-gray-50 rounded-lg">
          <i class="pi pi-inbox text-5xl text-gray-400 mb-3"></i>
          <p class="text-xl text-gray-600">No feedback tickets found</p>
          <p class="text-gray-500">Try adjusting your filters or check back later</p>
        </div>
        
        <!-- Grid of cards -->
        <div class="grid">
          <div *ngFor="let ticket of filteredTickets; let i = index" class="col-12 md:col-6 lg:col-4 xl:col-3 mb-4">
            <div class="card-container h-full" [class.flipped]="ticket.flipped">
              <!-- Front of card -->
              <div class="card-side front p-card p-4 border rounded-lg shadow-sm h-full"
                   [ngClass]="{
                     'border-green-200': ticket.evaluation === 'jaime',
                     'border-red-200': ticket.evaluation === 'jenaimepas'
                   }">
                <!-- Card header with user info -->
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center">
                    <p-avatar [image]="ticket.user?.user_avatar || 'assets/user.png'" 
                              shape="circle" 
                              size="large" 
                              [style]="{'background-color': '#2196F3', 'color': '#ffffff'}">
                    </p-avatar>
                    <div class="ml-3">
                      <h3 class="text-lg font-semibold mb-1">{{ticket.user?.name || 'Anonymous User'}}</h3>
                      <p class="text-sm text-slate-600">{{ticket.user?.email || 'No email provided'}}</p>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <p-tag [value]="getEvaluationLabel(ticket.evaluation)" 
                           [severity]="getEvaluationSeverity(ticket.evaluation)"
                           [icon]="ticket.evaluation === 'jaime' ? 'pi pi-thumbs-up' : 'pi pi-thumbs-down'">
                    </p-tag>
                    <p-tag [value]="ticket.status" 
                           [severity]="ticket.status === 'open' ? 'warn' : 'success'"
                           [icon]="ticket.status === 'open' ? 'pi pi-envelope' : 'pi pi-check'">
                    </p-tag>
                  </div>
                </div>
                
                <!-- Conversation content -->
                <div class="mb-4">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-semibold text-sm text-slate-700">User Question:</h4>
                  </div>
                  <div class="p-3 bg-slate-50 rounded border text-slate-800 mb-3 relative overflow-hidden">
                    <div class="max-h-24 overflow-hidden line-clamp-3">
                      {{ticket.question}}
                    </div>
                  </div>
                  
                  <h4 class="font-semibold text-sm text-slate-700 mb-2">AI Response 
                    <span [ngClass]="{'text-green-600': ticket.evaluation === 'jaime', 'text-red-600': ticket.evaluation === 'jenaimepas'}">
                      ({{ticket.evaluation === 'jaime' ? 'Liked' : 'Disliked'}})
                    </span>
                  </h4>
                  <div class="p-3 rounded border mb-3 relative overflow-hidden"
                       [ngClass]="{
                         'bg-green-50 border-green-200': ticket.evaluation === 'jaime',
                         'bg-red-50 border-red-200': ticket.evaluation === 'jenaimepas'
                       }">
                    <div class="max-h-24 overflow-hidden line-clamp-3">
                      {{ticket.response}}
                    </div>
                  </div>
                </div>
                
                <!-- Admin comment -->
                <div *ngIf="ticket.commentaire_admin" class="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <div class="flex items-center mb-2">
                    <i class="pi pi-comment text-blue-500 mr-2"></i>
                    <span class="font-medium text-blue-800">Admin Comment:</span>
                  </div>
                  <p class="text-slate-700">{{ticket.commentaire_admin}}</p>
                </div>
                
                <!-- Card actions -->
                <div class="flex justify-content-between mt-4">
                  <p-button 
                    icon="pi pi-sync" 
                    label="Flip Card" 
                    (onClick)="toggleFlip(ticket)" 
                    [text]="true">
                  </p-button>
                  
                  <div>
                    <p-button *ngIf="ticket.status === 'open'" 
                              label="Close" 
                              icon="pi pi-check" 
                              severity="success"
                              (onClick)="closeTicket(ticket)" 
                              [outlined]="true" 
                              class="mr-2">
                    </p-button>
                    
                    <p-button *ngIf="ticket.status === 'closed'" 
                              label="Reopen" 
                              icon="pi pi-refresh" 
                              severity="warn"
                              (onClick)="reopenTicket(ticket)" 
                              [outlined]="true" 
                              class="mr-2">
                  </div>
                </div>
              </div>
              
              <!-- Back of card -->
              <div class="card-side back p-card p-4 border rounded-lg shadow-sm h-full">
                <div class="flex justify-content-between items-center mb-4">
                  <h3 class="text-xl font-bold">Add Comment</h3>
                  <p-button 
                    icon="pi pi-sync" 
                    (onClick)="toggleFlip(ticket)" 
                    [rounded]="true" 
                    [text]="true">
                  </p-button>
                </div>
                
                <!-- Admin comment form -->
                <div class="mb-4">
                  <h4 class="font-semibold text-sm text-slate-700 mb-2">Add or Update Comment:</h4>
                  <textarea pInputTextarea [rows]="5" [cols]="30" 
                            [(ngModel)]="ticket.newComment" 
                            placeholder="Enter your comment here..."
                            class="w-full mb-3"></textarea>
                            
                  <div class="flex justify-content-between">
                    <div>
                      <p-button *ngIf="ticket.status === 'open'" 
                                label="Close Ticket" icon="pi pi-check" severity="success"
                                (onClick)="closeTicket(ticket)">
                      </p-button>
                      <p-button *ngIf="ticket.status === 'closed'" 
                                label="Reopen Ticket" icon="pi pi-refresh" severity="warn"
                                (onClick)="reopenTicket(ticket)">
                      </p-button>
                                
                      <p-button label="Submit Comment" icon="pi pi-send" 
                                [disabled]="!ticket.newComment?.trim()"
                                (onClick)="addResponse(ticket)">
                      </p-button>
                    </div>
                  </div>
                <div class="w-2rem h-2rem flex align-items-center justify-content-center bg-purple-100 border-circle">
                  <i class="pi pi-inbox text-purple-600"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Feedback cards -->
        <div *ngIf="!loading; else loadingTemplate" class="mt-4">
          <div *ngIf="filteredTickets.length === 0" class="text-center p-5 bg-gray-50 rounded-lg">
            <i class="pi pi-inbox text-5xl text-gray-400 mb-3"></i>
            <p class="text-xl text-gray-600">No feedback tickets found</p>
            <p class="text-gray-500">Try adjusting your filters or check back later</p>
          </div>
          
          <!-- Grid layout for cards -->
          <div class="grid">
            <div *ngFor="let ticket of filteredTickets; let i = index" class="col-12 md:col-6 lg:col-4 xl:col-3 mb-4">
              <div class="card-container h-full" [class.flipped]="ticket.flipped">
                <!-- Front of card -->
                <div class="card-side front p-card p-4 border rounded-lg shadow-sm h-full"200 hover:shadow-md transition-all duration-200">
                  <!-- Header with user info -->
                  <ng-template pTemplate="header">
                    <div class="flex p-3 bg-slate-50 border-bottom-1 border-slate-200 items-center">
                      <p-avatar [image]="ticket.user_avatar || 'assets/user.png'" 
                                shape="circle" size="large" [style]="{'background-color': '#2196F3', 'color': '#ffffff'}">
                      </p-avatar>
                      <div class="ml-3">
                        <h3 class="text-lg font-semibold mb-1">{{ticket.user_name || 'Anonymous User'}}</h3>
                        <p class="text-sm text-slate-600">{{ticket.user_email || 'No email provided'}}</p>
                      </div>
                      <div class="ml-auto flex items-center gap-2">
                        <p-tag 
                          [value]="ticket.evaluation === 'jaime' ? 'Positive' : 'Negative'" 
                          [severity]="ticket.evaluation === 'jaime' ? 'success' : 'danger'"
                          [rounded]="true">
                        </p-tag>
                        <p-tag 
                          [value]="ticket.status" 
                          [severity]="ticket.status === 'open' ? 'info' : 'secondary'"
                          [rounded]="true">
                        </p-tag>
                      </div>
                    </div>
                  </ng-template>
                  
                  <!-- Conversation content -->
                  <div class="mb-4">
                    <div class="flex items-center justify-between mb-2">
                      <h4 class="font-semibold text-sm text-slate-700">User Question:</h4>
                    </div>
                    <div class="p-3 bg-slate-50 rounded border text-slate-800 mb-3 relative overflow-hidden">
                      <div class="max-h-24 overflow-hidden">
                        {{ticket.question}}
                      </div>
                      <div *ngIf="ticket.question && ticket.question.length > 300" 
                           class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 to-transparent">
                      </div>
                    </div>
                    
                    <h4 class="font-semibold text-sm text-slate-700 mb-2">AI Response 
                      <span [ngClass]="{'text-green-600': ticket.evaluation === 'jaime', 'text-red-600': ticket.evaluation === 'jenaimepas'}">
                        ({{ticket.evaluation === 'jaime' ? 'Liked' : 'Disliked'}})
                      </span>
                    </h4>
                    <div class="p-3 rounded border mb-3 relative overflow-hidden"
                         [ngClass]="{
                           'bg-green-50 border-green-200': ticket.evaluation === 'jaime',
                           'bg-red-50 border-red-200': ticket.evaluation === 'jenaimepas'
                         }">
                      <span *ngIf="ticket.created_at !== ticket.updated_at"> · Updated on {{ticket.updated_at | date:'medium'}}</span>
                    </div>
                  </div>
                  
                  <!-- Admin responses -->
                  <div *ngIf="ticket.responses && ticket.responses.length > 0" class="mb-4">
                    <p-divider align="left">
                      <div class="flex items-center">
                        <i class="pi pi-comments mr-2 text-primary"></i>
                        <span class="text-primary font-medium">Admin Responses</span>
                      </div>
                    </p-divider>
                    
                    <div *ngFor="let response of ticket.responses; let j = index" 
                         class="py-3 px-4 mb-2 bg-slate-100 rounded border-left-3 border-primary"
                         [@slideIn]="{ value: '*', params: { duration: '300ms', delay: (j * 100) + 'ms' } }">
                      <div class="flex items-center mb-2">
                        <p-avatar [image]="response.admin_avatar || 'assets/demo/images/avatar/admin-avatar.png'" 
                                  shape="circle" [style]="{'width': '2rem', 'height': '2rem'}">
                        </p-avatar>
                        <span class="ml-2 font-medium">{{response.admin_name || 'Admin'}}</span>
                        <span class="ml-2 text-xs text-slate-500">{{response.created_at | date:'short'}}</span>
                      </div>
                      <p class="text-slate-700">{{response.comment}}</p>
                    </div>
                  </div>
                  
                  <!-- Add response form -->
                  <div *ngIf="ticket.status === 'open'" class="mt-4 p-3 bg-slate-50 rounded border border-slate-200">
                    <h5 class="font-medium text-sm text-slate-700 mb-2">Add Response</h5>
                    <div class="flex flex-column">
                      <textarea pInputTextarea [rows]="3" [cols]="30" 
                                  [(ngModel)]="ticket.newComment" 
                                  placeholder="Add your response to this feedback..."
                                  class="w-full mb-3"></textarea>
                      <div class="flex justify-content-between">
                        <p-button label="Submit Response" 
                            icon="pi pi-send" 
                            (onClick)="addResponse(ticket)"
                            [disabled]="!ticket.newComment?.trim()">
                        </p-button>
                        <p-button label="Close Ticket" 
                            icon="pi pi-check" 
                            severity="secondary" 
                            (onClick)="closeTicket(ticket)">
                        </p-button>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Closed ticket action -->
                  <div *ngIf="ticket.status === 'closed'" class="mt-4 flex justify-content-end">
                    <p-button label="Reopen Ticket" 
                        icon="pi pi-refresh" 
                        severity="secondary" 
                        (onClick)="reopenTicket(ticket)">
                    </p-button>
                  </div>
                  
                  <ng-template pTemplate="footer">
                    <div class="flex justify-content-between text-xs text-slate-500">
                      <span>Ticket ID: {{ticket.id}}</span>
                      <span>Conversation ID: {{ticket.conversation_id}}</span>
                    </div>
                  </ng-template>
                </p-avatar>
                <div class="ml-3">
                  <h3 class="text-lg font-semibold mb-1">{{ticket.user_name || 'Anonymous User'}}</h3>
                  <p class="text-sm text-slate-600">{{ticket.user_email || 'No email provided'}}</p>
                </div>
                <div class="ml-auto flex items-center gap-2">
                  <p-tag 
                    [value]="ticket.evaluation === 'jaime' ? 'Positive' : 'Negative'" 
                    [severity]="ticket.evaluation === 'jaime' ? 'success' : 'danger'"
                    [rounded]="true">
                  </p-tag>
                  <p-tag 
                    [value]="ticket.status" 
                    [severity]="ticket.status === 'open' ? 'info' : 'secondary'"
                    [rounded]="true">
                  </p-tag>
                </div>
              </div>
            </ng-template>
            
            <!-- Conversation content -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-semibold text-sm text-slate-700">User Question:</h4>
              </div>
              <div class="p-3 bg-slate-50 rounded border text-slate-800 mb-3 relative overflow-hidden">
                <div class="max-h-24 overflow-hidden">
                  {{ticket.question}}
                </div>
                <div *ngIf="ticket.question && ticket.question.length > 300" 
                     class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 to-transparent">
                </div>
              </div>
              
              <h4 class="font-semibold text-sm text-slate-700 mb-2">AI Response 
                <span [ngClass]="{'text-green-600': ticket.evaluation === 'jaime', 'text-red-600': ticket.evaluation === 'jenaimepas'}">
                  ({{ticket.evaluation === 'jaime' ? 'Liked' : 'Disliked'}})
                </span>
              </h4>
              <div class="p-3 rounded border mb-3 relative overflow-hidden"
                   [ngClass]="{
                     'bg-green-50 border-green-200': ticket.evaluation === 'jaime',
                     'bg-red-50 border-red-200': ticket.evaluation === 'jenaimepas'
                   }">
                <span *ngIf="ticket.created_at !== ticket.updated_at"> · Updated on {{ticket.updated_at | date:'medium'}}</span>
              </div>
            </div>
            
            <!-- Admin responses -->
            <div *ngIf="ticket.responses && ticket.responses.length > 0" class="mb-4">
              <p-divider align="left">
                <div class="flex items-center">
                  <i class="pi pi-comments mr-2 text-primary"></i>
                  <span class="text-primary font-medium">Admin Responses</span>
                </div>
              </p-divider>
              
              <div *ngFor="let response of ticket.responses; let j = index" 
                   class="py-3 px-4 mb-2 bg-slate-100 rounded border-left-3 border-primary"
                   [@slideIn]="{ value: '*', params: { duration: '300ms', delay: (j * 100) + 'ms' } }">
                <div class="flex items-center mb-2">
                  <p-avatar [image]="response.admin_avatar || 'assets/demo/images/avatar/admin-avatar.png'" 
                            shape="circle" [style]="{'width': '2rem', 'height': '2rem'}">
                  </p-avatar>
                  <span class="ml-2 font-medium">{{response.admin_name || 'Admin'}}</span>
                  <span class="ml-2 text-xs text-slate-500">{{response.created_at | date:'short'}}</span>
                </div>
                <p class="text-slate-700">{{response.comment}}</p>
              </div>
            </div>
            
            <!-- Add response form -->
            <div *ngIf="ticket.status === 'open'" class="mt-4 p-3 bg-slate-50 rounded border border-slate-200">
              <h5 class="font-medium text-sm text-slate-700 mb-2">Add Response</h5>
              <div class="flex flex-column">
                <textarea pInputTextarea [rows]="3" [cols]="30" 
                    [(ngModel)]="ticket.newComment" 
                    placeholder="Add your response to this feedback..."
                    class="w-full mb-3"></textarea>
                <div class="flex justify-content-between">
                  <p-button label="Submit Response" 
                      icon="pi pi-send" 
                      (onClick)="addResponse(ticket)"
                      [disabled]="!ticket.newComment?.trim()">
                  </p-button>
                  <p-button label="Close Ticket" 
                      icon="pi pi-check" 
                      severity="secondary" 
                      (onClick)="closeTicket(ticket)">
                  </p-button>
                </div>
              </div>
            </div>
            
            <!-- Closed ticket action -->
            <div *ngIf="ticket.status === 'closed'" class="mt-4 flex justify-content-end">
              <p-button label="Reopen Ticket" 
                  icon="pi pi-refresh" 
                  severity="secondary" 
                  (onClick)="reopenTicket(ticket)">
              </p-button>
            </div>
            
            <ng-template pTemplate="footer">
              <div class="flex justify-content-between text-xs text-slate-500">
                <span>Ticket ID: {{ticket.id}}</span>
                <span>Conversation ID: {{ticket.conversation_id}}</span>
              </div>
            </ng-template>
          </p-card>
        </div>
      </div>
    </div>
    
    <!-- Conversation Preview Dialog removed as per requirements -->
  `,
  // Animations are defined in the component decorator
  // No duplicate animations needed here
  
  styles: [
    `
    .stats-card {
      min-width: 150px;
      transition: all 0.3s ease;
    }
    
    .stats-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    ::ng-deep .conversation-preview-dialog .p-dialog-content {
      padding: 0;
      overflow: hidden;
    }
    `
  ]
})
export class Evaluations implements OnInit {
  tickets: TicketWithUser[] = [];
  filteredTickets: TicketWithUser[] = [];
  loading = true;
  
  filter: TicketFilter = {
    evaluation: null,
    status: null,
    searchTerm: null
  };
  
  evaluationOptions = [
    { label: 'Positive (Like)', value: 'jaime' },
    { label: 'Negative (Dislike)', value: 'jenaimepas' }
  ];
  
  statusOptions = [
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' }
  ];
  
  private apiUrl = environment.apiUrl;
  
  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}
  
  ngOnInit() {
    this.loadTickets();
  }
  
  // Toggle card flip state
  toggleFlip(ticket: TicketWithUser) {
    ticket.flipped = !ticket.flipped;
    
    // If flipping to back side, load comments
    if (ticket.flipped) {
      this.loadTicketComments(ticket);
    }
  }
  
  // Apply filters to tickets
  applyFilters() {
    if (!this.tickets) {
      this.filteredTickets = [];
      return;
    }

    this.filteredTickets = this.tickets.filter(ticket => {
      // Filter by evaluation
      if (this.filter.evaluation && ticket.evaluation !== this.filter.evaluation) {
        return false;
      }
      
      // Filter by status
      if (this.filter.status && ticket.status !== this.filter.status) {
        return false;
      }
      
      // Filter by search term - enhanced to search across multiple fields
      if (this.filter.searchTerm && this.filter.searchTerm.trim()) {
        const searchTerm = this.filter.searchTerm.toLowerCase().trim();
        
        // Search in question and response
        const contentMatch = 
          ticket.question?.toLowerCase().includes(searchTerm) || 
          ticket.response?.toLowerCase().includes(searchTerm) ||
          ticket.commentaire_admin?.toLowerCase().includes(searchTerm);
        
        // Search in user information if available
        const userMatch = 
          ticket.user?.name?.toLowerCase().includes(searchTerm) ||
          ticket.user?.email?.toLowerCase().includes(searchTerm) ||
          ticket.user_name?.toLowerCase().includes(searchTerm) ||
          ticket.user_email?.toLowerCase().includes(searchTerm);
        
        return contentMatch || userMatch;
      }
      
      return true;
    });
  }
  
  // Reset all filters
  resetFilters() {
    this.filter = {
      evaluation: null,
      status: null,
      searchTerm: null
    };
    
    this.filteredTickets = [...this.tickets];
  }
  
  loadTickets() {
    this.loading = true;
    
    this.getAllTickets().subscribe({
      next: (response) => {
        // Handle paginated response - tickets are in the data property
        if (response && response.data) {
          this.tickets = response.data.map((ticket: TicketWithUser) => ({
            ...ticket,
            flipped: false,
            newComment: ''
          }));
          this.filteredTickets = [...this.tickets];
        } else {
          console.error('Unexpected response format', response);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unexpected data format from server'
          });
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading tickets', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load feedback tickets'
        });
        this.loading = false;
      }
    });
  }
  
  getAllTickets(): Observable<PaginatedResponse<TicketWithUser>> {
    return this.http.get<PaginatedResponse<TicketWithUser>>(`${this.apiUrl}/tickets`);
  }
  
  // We don't need to load comments separately as they're included in the ticket data
  // This is a simplified version that just sets an empty array if responses don't exist
  loadTicketComments(ticket: TicketWithUser & {newComment?: string}) {
    if (!ticket.responses) {
      ticket.responses = [];
    }
  }
  
  // Instead of a separate comments endpoint, we'll use the commentaire_admin field
  // This is a dummy method that returns an empty array since we don't have a comments endpoint
  getTicketComments(ticketId: number): Observable<TicketResponse[]> {
    return new Observable<TicketResponse[]>(observer => {
      observer.next([]);
      observer.complete();
    });
  }
  
  addResponse(ticket: TicketWithUser & {newComment?: string}) {
    if (!ticket.newComment?.trim()) return;
    
    // Use the update-ticket endpoint to add admin comment
    this.updateTicketWithComment(ticket.id, ticket.newComment).subscribe({
      next: (updatedTicket) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Comment added successfully'
        });
        
        // Update the ticket with the new comment
        ticket.commentaire_admin = updatedTicket.commentaire_admin || '';
        
        // Create a response object to display in the UI
        const adminUser = {
          id: 1, // Admin ID
          name: 'Admin', // Admin name
          email: 'admin@example.com'
        };
        
        // If this is the first response, initialize the array
        if (!ticket.responses) {
          ticket.responses = [];
        }
        
        // Add the new response to the list
        if (ticket.newComment) {
          ticket.responses.push({
            id: Date.now(), // Generate a temporary ID
            ticket_id: ticket.id,
            admin_id: 1,
            comment: ticket.newComment, // This is safe now because we checked it's not undefined
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            admin_name: 'Admin',
            admin_avatar: 'assets/demo/images/avatar/admin-avatar.png'
          });
        }
        
        // Clear the input
        ticket.newComment = '';
      },
      error: (err) => {
        console.error('Error adding comment', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to add comment'
        });
      }
    });
  }
  
  updateTicketWithComment(ticketId: number, comment: string): Observable<TicketChat> {
    return this.http.put<TicketChat>(`${this.apiUrl}/update-ticket/${ticketId}`, {
      commentaire_admin: comment
    });
  }
  
  closeTicket(ticket: TicketWithUser) {
    this.updateTicketStatus(ticket.id, 'closed').subscribe({
      next: (updatedTicket) => {
        ticket.status = updatedTicket.status;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Ticket closed successfully'
        });
      },
      error: (err) => {
        console.error('Error closing ticket', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to close ticket'
        });
      }
    });
  }
  
  updateTicketStatus(ticketId: number, status: 'open' | 'closed'): Observable<TicketChat> {
    return this.http.patch<TicketChat>(`${this.apiUrl}/update-ticket/${ticketId}`, {
      status
    });
  }
  
  reopenTicket(ticket: TicketWithUser) {
    this.updateTicketStatus(ticket.id, 'open').subscribe({
      next: (updatedTicket) => {
        ticket.status = updatedTicket.status;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Ticket reopened successfully'
        });
      },
      error: (err) => {
        console.error('Error reopening ticket', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to reopen ticket'
        });
      }
    });
  }
  
  // Statistics and metrics methods
  getPositiveFeedbackCount(): number {
    return this.filteredTickets.filter(ticket => ticket.evaluation === 'jaime').length || 0;
  }
  
  getNegativeFeedbackCount(): number {
    return this.filteredTickets.filter(ticket => ticket.evaluation === 'jenaimepas').length || 0;
  }
  
  getOpenTicketsCount(): number {
    return this.filteredTickets.filter(ticket => ticket.status === 'open').length || 0;
  }
  
  getCommentedTicketsCount(): number {
    return this.filteredTickets.filter(ticket => ticket.commentaire_admin && ticket.commentaire_admin.trim() !== '').length;
  }
  
  // Get tag severity based on evaluation
  getEvaluationSeverity(evaluation: string | null): 'success' | 'info' | 'warn' | 'danger' | undefined {
    if (evaluation === 'jaime') return 'success';
    if (evaluation === 'jenaimepas') return 'danger';
    return 'info';
  }
  
  // Get tag label based on evaluation
  getEvaluationLabel(evaluation: string | null): string {
    if (evaluation === 'jaime') return 'Positive';
    if (evaluation === 'jenaimepas') return 'Negative';
    return 'No Evaluation';
  }
  
  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
}
