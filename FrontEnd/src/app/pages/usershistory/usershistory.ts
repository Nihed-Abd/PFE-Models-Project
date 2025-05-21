import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { animate, state, style, transition, trigger } from '@angular/animations';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  subscription: string;
  avatar: string;
  comments: {
    id: number;
    text: string;
    date: string;
    admin: string;
  }[];
}

@Component({
  selector: 'app-usershistory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputTextarea,
    AvatarModule,
    BadgeModule,
    ToastModule,
    HttpClientModule
  ],
  providers: [MessageService],
  animations: [
    trigger('flipCard', [
      state('front', style({
        transform: 'rotateY(0deg)'
      })),
      state('back', style({
        transform: 'rotateY(180deg)'
      })),
      transition('front <=> back', animate('500ms ease-out'))
    ])
  ],
  template: `
    <div class="surface-section p-4">
      <div class="text-3xl font-medium text-900 mb-3">Users History</div>
      <div class="text-500 mb-5">Manage user information and comments</div>
      
      <div class="grid">
        <div *ngFor="let user of users" class="col-12 md:col-6 lg:col-4 xl:col-3 p-3">
          <div class="relative perspective-1000">
            <!-- Card Container -->
            <div class="h-full relative w-full" 
                 [ngClass]="{'rotate-y-180': flippedCards.has(user.id)}"
                 style="transition: transform 0.6s; transform-style: preserve-3d;">
              
              <!-- Front of Card -->
              <div class="card-face" 
                   [ngClass]="{'hidden': flippedCards.has(user.id)}"
                   style="backface-visibility: hidden;">
                <p-card styleClass="h-full">
                  <ng-template pTemplate="header">
                    <div class="flex justify-content-center p-3 bg-primary-50">
                      <p-avatar [image]="user.avatar" size="xlarge" shape="circle" 
                               [styleClass]="'border-2 ' + getSubscriptionBorderColor(user.subscription)">
                      </p-avatar>
                    </div>
                  </ng-template>
                  
                  <div class="text-center mb-3">
                    <div class="text-xl font-medium mb-2">{{ user.name }}</div>
                    <p-badge [value]="user.subscription" [severity]="getSubscriptionSeverity(user.subscription)"></p-badge>
                  </div>
                  
                  <div class="mb-3">
                    <div class="flex align-items-center mb-2">
                      <i class="pi pi-envelope text-500 mr-2"></i>
                      <span>{{ user.email }}</span>
                    </div>
                    <div class="flex align-items-center mb-2">
                      <i class="pi pi-phone text-500 mr-2"></i>
                      <span>{{ user.phone }}</span>
                    </div>
                    <div class="flex align-items-center">
                      <i class="pi pi-map-marker text-500 mr-2"></i>
                      <span>{{ user.country }}</span>
                    </div>
                  </div>
                  
                  <div class="pt-3 border-top-1 border-300">
                    <span class="text-sm text-500 block mb-3">Send a comment to this user:</span>
                    <textarea pInputTextarea [(ngModel)]="commentText[user.id]" rows="3" class="w-full mb-3" placeholder="Type your comment here..."></textarea>
                    <div class="flex justify-content-between">
                      <p-button 
                        icon="pi pi-comments" 
                        [disabled]="user.comments.length === 0"
                        label="{{user.comments.length}} Comments" 
                        severity="secondary" 
                        text 
                        (onClick)="flipCard(user.id)">
                      </p-button>
                      <p-button 
                        icon="pi pi-send" 
                        label="Send" 
                        [disabled]="!commentText[user.id]"
                        (onClick)="addComment(user.id)">
                      </p-button>
                    </div>
                  </div>
                </p-card>
              </div>
              
              <!-- Back of Card -->
              <div class="card-face rotate-y-180" 
                   [ngClass]="{'hidden': !flippedCards.has(user.id)}"
                   style="backface-visibility: hidden; position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
                <p-card styleClass="h-full">
                  <ng-template pTemplate="header">
                    <div class="flex justify-content-between align-items-center p-3 bg-primary-50">
                      <span class="text-xl font-medium">Comments History</span>
                      <p-button 
                        icon="pi pi-arrow-left" 
                        severity="secondary" 
                        text 
                        rounded 
                        (onClick)="flipCard(user.id)">
                      </p-button>
                    </div>
                  </ng-template>
                  
                  <div *ngIf="user.comments.length === 0" class="text-center p-5">
                    <i class="pi pi-comments text-5xl text-300 mb-3"></i>
                    <div class="text-700">No comments yet</div>
                  </div>
                  
                  <div *ngFor="let comment of user.comments" class="mb-3 pb-3 border-bottom-1 border-300">
                    <div class="flex justify-content-between mb-2">
                      <span class="font-medium">{{ comment.admin }}</span>
                      <span class="text-sm text-500">{{ formatDate(comment.date) }}</span>
                    </div>
                    <p class="m-0 line-height-3">{{ comment.text }}</p>
                  </div>
                </p-card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <p-toast></p-toast>
  `,
  styles: [`
    .perspective-1000 {
      perspective: 1000px;
    }
    
    .rotate-y-180 {
      transform: rotateY(180deg);
    }
    
    .card-face {
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      transition: all 0.6s;
    }
  `]
})
export class UsersHistory implements OnInit {
  users: User[] = [];
  flippedCards = new Set<number>();
  commentText: { [key: number]: string } = {};
  
  constructor(
    private http: HttpClient,
    private messageService: MessageService
  ) {}
  
  ngOnInit() {
    this.loadUsers();
  }
  
  loadUsers() {
    this.http.get<User[]>('assets/data/users.json').subscribe(
      (data) => {
        this.users = data;
        // Initialize comment text for each user
        this.users.forEach(user => {
          this.commentText[user.id] = '';
        });
      },
      (error) => {
        console.error('Error loading users:', error);
      }
    );
  }
  
  flipCard(userId: number) {
    if (this.flippedCards.has(userId)) {
      this.flippedCards.delete(userId);
    } else {
      this.flippedCards.add(userId);
    }
  }
  
  addComment(userId: number) {
    if (!this.commentText[userId]?.trim()) return;
    
    const user = this.users.find(u => u.id === userId);
    if (!user) return;
    
    const newComment = {
      id: user.comments.length + 1,
      text: this.commentText[userId].trim(),
      date: new Date().toISOString(),
      admin: 'Admin User' // In a real app, this would come from the logged-in admin user
    };
    
    user.comments.push(newComment);
    this.commentText[userId] = '';
    
    this.messageService.add({
      severity: 'success',
      summary: 'Comment Added',
      detail: `Comment sent to ${user.name}`
    });
  }
  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }
  
  getSubscriptionSeverity(subscription: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (subscription) {
      case 'Free':
        return 'info';
      case 'Golden':
        return 'warn';
      case 'Platinum':
        return 'success';
      case 'Master':
        return 'danger';
      default:
        return 'info';
    }
  }
  
  getSubscriptionBorderColor(subscription: string): string {
    switch (subscription) {
      case 'Free':
        return 'border-blue-500';
      case 'Golden':
        return 'border-yellow-500';
      case 'Platinum':
        return 'border-green-500';
      case 'Master':
        return 'border-pink-500';
      default:
        return 'border-blue-500';
    }
  }
}
