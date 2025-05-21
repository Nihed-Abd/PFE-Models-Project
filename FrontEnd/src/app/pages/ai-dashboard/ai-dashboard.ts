import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { animate, style, transition, trigger } from '@angular/animations';
import { ProgressBarModule } from 'primeng/progressbar';

interface Stats {
  users: {
    total: number;
    bySubscription: {
      Free: number;
      Golden: number;
      Platinum: number;
      Master: number;
    };
    newThisMonth: number;
    growth: number;
    activeToday: number;
  };
  chats: {
    total: number;
    avgDuration: string;
    avgMessagesPerChat: number;
    satisfactionRate: number;
    topTopics: {
      name: string;
      count: number;
    }[];
    weeklyActivity: {
      day: string;
      count: number;
    }[];
  };
  comments: {
    total: number;
    pendingReview: number;
    avgReplyTime: string;
    byAdmin: {
      name: string;
      count: number;
    }[];
  };
  aiUsage: {
    totalTokens: number;
    costThisMonth: string;
    avgTokensPerChat: number;
    peakHours: {
      hour: string;
      usage: number;
    }[];
    modelDistribution: {
      model: string;
      percentage: number;
    }[];
  };
}

@Component({
  selector: 'app-ai-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    DividerModule,
    HttpClientModule,
    ProgressBarModule
  ],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="surface-section p-4">
      <div class="text-3xl font-medium text-900 mb-3">AI Dashboard</div>
      <div class="text-500 mb-5">Analytics and statistics for the chatbot system</div>
      
      <!-- Key Statistics Cards -->
      <div @fadeInUp class="grid mb-5">
        <div class="col-12 md:col-6 lg:col-3">
          <p-card styleClass="h-full">
            <div class="flex flex-column align-items-center">
              <div class="text-xl text-500 mb-1">Total Users</div>
              <div class="text-5xl font-bold text-primary mb-3">{{ stats?.users?.total || 0 }}</div>
              <div class="flex align-items-center">
                <i [ngClass]="(stats?.users?.growth || 0) > 0 ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'" class="mr-1"></i>
                <span [ngClass]="(stats?.users?.growth || 0) > 0 ? 'text-green-500' : 'text-red-500'">{{ stats?.users?.growth || 0 }}%</span>
                <span class="text-500 ml-2">this month</span>
              </div>
            </div>
          </p-card>
        </div>
        
        <div class="col-12 md:col-6 lg:col-3">
          <p-card styleClass="h-full">
            <div class="flex flex-column align-items-center">
              <div class="text-xl text-500 mb-1">Total Chats</div>
              <div class="text-5xl font-bold text-primary mb-3">{{ stats?.chats?.total || 0 }}</div>
              <div class="flex align-items-center">
                <span class="text-500">Avg. Duration: </span>
                <span class="text-700 ml-1">{{ stats?.chats?.avgDuration || '0m 0s' }}</span>
              </div>
            </div>
          </p-card>
        </div>
        
        <div class="col-12 md:col-6 lg:col-3">
          <p-card styleClass="h-full">
            <div class="flex flex-column align-items-center">
              <div class="text-xl text-500 mb-1">Comments</div>
              <div class="text-5xl font-bold text-primary mb-3">{{ stats?.comments?.total || 0 }}</div>
              <div class="flex align-items-center">
                <span class="text-orange-500 font-medium">{{ stats?.comments?.pendingReview || 0 }}</span>
                <span class="text-500 ml-1">pending review</span>
              </div>
            </div>
          </p-card>
        </div>
        
        <div class="col-12 md:col-6 lg:col-3">
          <p-card styleClass="h-full">
            <div class="flex flex-column align-items-center">
              <div class="text-xl text-500 mb-1">AI Cost</div>
              <div class="text-5xl font-bold text-primary mb-3">{{ stats?.aiUsage?.costThisMonth || '$0.00' }}</div>
              <div class="flex align-items-center">
                <span class="text-500">{{ formatNumber(stats?.aiUsage?.totalTokens || 0) }} tokens</span>
              </div>
            </div>
          </p-card>
        </div>
      </div>
      
      <!-- Charts and Detailed Stats -->
      <div class="grid">
        <!-- Subscription Distribution -->
        <div @fadeInUp class="col-12 md:col-6 lg:col-4">
          <p-card header="User Subscription Distribution" styleClass="h-full">
            <div class="surface-section">
              <div style="height: 300px" class="flex justify-content-center align-items-center">
                <div class="chart-container">
                  <!-- Chart placeholder since Chart.js is not properly configured -->
                  <div class="p-5 text-center">
                    <div class="subscription-chart-placeholder">
                      <div class="chart-legend">
                        <div *ngFor="let item of ['Free', 'Golden', 'Platinum', 'Master']; let i = index" class="legend-item">
                          <div [ngClass]="['color-box', 'bg-' + getLegendColor(i)]"></div>
                          <span>{{item}}: {{getSubscriptionCount(item)}}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="grid mt-3">
                <div class="col-6 mb-2">
                  <div class="flex align-items-center">
                    <span class="w-1rem h-1rem border-round bg-blue-500 mr-2"></span>
                    <span class="text-900">Free</span>
                    <span class="text-700 ml-auto">{{ stats?.users?.bySubscription?.Free || 0 }}</span>
                  </div>
                </div>
                <div class="col-6 mb-2">
                  <div class="flex align-items-center">
                    <span class="w-1rem h-1rem border-round bg-yellow-500 mr-2"></span>
                    <span class="text-900">Golden</span>
                    <span class="text-700 ml-auto">{{ stats?.users?.bySubscription?.Golden || 0 }}</span>
                  </div>
                </div>
                <div class="col-6 mb-2">
                  <div class="flex align-items-center">
                    <span class="w-1rem h-1rem border-round bg-green-500 mr-2"></span>
                    <span class="text-900">Platinum</span>
                    <span class="text-700 ml-auto">{{ stats?.users?.bySubscription?.Platinum || 0 }}</span>
                  </div>
                </div>
                <div class="col-6 mb-2">
                  <div class="flex align-items-center">
                    <span class="w-1rem h-1rem border-round bg-pink-500 mr-2"></span>
                    <span class="text-900">Master</span>
                    <span class="text-700 ml-auto">{{ stats?.users?.bySubscription?.Master || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </p-card>
        </div>
        
        <!-- Weekly Activity Chart -->
        <div @fadeInUp class="col-12 md:col-6 lg:col-8">
          <p-card header="Weekly Chat Activity" styleClass="h-full">
            <div class="surface-section">
              <div style="height: 350px">
                <!-- Weekly activity chart placeholder -->
                <div class="p-3 text-center">
                  <div class="weekly-chart">
                    <div *ngFor="let day of stats?.chats?.weeklyActivity" class="weekly-bar">
                      <div class="bar-label">{{day.day}}</div>
                      <div class="bar-value" [style.height.%]="getDayPercentage(day.count)"></div>
                      <div class="bar-count">{{day.count}}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </p-card>
        </div>
        
        <!-- AI Usage by Hour -->
        <div @fadeInUp class="col-12 lg:col-6">
          <p-card header="AI Usage by Hour" styleClass="h-full">
            <div class="surface-section">
              <div style="height: 300px">
                <!-- Hourly usage chart placeholder -->
                <div class="p-3 text-center">
                  <div class="usage-chart">
                    <div *ngFor="let hour of stats?.aiUsage?.peakHours" class="usage-point">
                      <div class="hour-label">{{hour.hour}}</div>
                      <div class="hour-value">{{hour.usage}}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </p-card>
        </div>
        
        <!-- AI Model Distribution -->
        <div @fadeInUp class="col-12 lg:col-6">
          <p-card header="AI Model Distribution" styleClass="h-full">
            <div class="surface-section">
              <div class="grid">
                <div *ngFor="let model of stats?.aiUsage?.modelDistribution" class="col-12 mb-3">
                  <div class="text-900 font-medium mb-2 flex justify-content-between align-items-center">
                    <span>{{ model.model }}</span>
                    <span>{{ model.percentage }}%</span>
                  </div>
                  <p-progressBar [value]="model.percentage" [showValue]="false" 
                    [style]="{'height': '10px'}" 
                    [styleClass]="getModelClass(model.model)">
                  </p-progressBar>
                </div>
              </div>
            </div>
          </p-card>
        </div>
        
        <!-- Top Chat Topics -->
        <div @fadeInUp class="col-12 md:col-6">
          <p-card header="Top Chat Topics" styleClass="h-full">
            <p-table [value]="stats?.chats?.topTopics || []" [tableStyle]="{'min-width': '60rem'}">
              <ng-template pTemplate="header">
                <tr>
                  <th>Topic</th>
                  <th style="width: 25%">Count</th>
                  <th style="width: 25%">Progress</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-topic>
                <tr>
                  <td>{{ topic.name }}</td>
                  <td>{{ topic.count }}</td>
                  <td>
                    <p-progressBar [value]="getTopicPercentage(topic.count)" [showValue]="false"></p-progressBar>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </p-card>
        </div>
        
        <!-- Comments by Admin -->
        <div @fadeInUp class="col-12 md:col-6">
          <p-card header="Comments by Admin" styleClass="h-full">
            <p-table [value]="stats?.comments?.byAdmin || []" [tableStyle]="{'min-width': '60rem'}">
              <ng-template pTemplate="header">
                <tr>
                  <th>Admin Name</th>
                  <th style="width: 25%">Count</th>
                  <th style="width: 25%">Progress</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-admin>
                <tr>
                  <td>{{ admin.name }}</td>
                  <td>{{ admin.count }}</td>
                  <td>
                    <p-progressBar [value]="getAdminPercentage(admin.count)" [showValue]="false"></p-progressBar>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </p-card>
        </div>
        
        <!-- Chat Satisfaction & AI Performance -->
        <div @fadeInUp class="col-12">
          <p-card header="Chat Performance Metrics" styleClass="h-full">
            <div class="grid">
              <div class="col-12 md:col-4">
                <div class="flex flex-column align-items-center">
                  <h3 class="mt-0 mb-3 text-900">Satisfaction Rate</h3>
                  <div class="knob-container text-center">
                    <div class="satisfaction-display">
                      <span class="satisfaction-value">{{stats?.chats?.satisfactionRate || 0}}%</span>
                    </div>
                  </div>
                  <div class="text-center mt-3">
                    <span class="text-green-500 font-medium">{{ stats?.chats?.satisfactionRate || 0 }}%</span>
                    <span class="text-500 ml-2">positive feedback</span>
                  </div>
                </div>
              </div>
              
              <div class="col-12 md:col-4">
                <div class="flex flex-column align-items-center">
                  <h3 class="mt-0 mb-3 text-900">Avg. Messages</h3>
                  <div class="text-center">
                    <div class="text-6xl font-bold text-primary mb-2">{{ stats?.chats?.avgMessagesPerChat || 0 }}</div>
                    <span class="text-500">messages per chat</span>
                  </div>
                </div>
              </div>
              
              <div class="col-12 md:col-4">
                <div class="flex flex-column align-items-center">
                  <h3 class="mt-0 mb-3 text-900">Avg. Token Usage</h3>
                  <div class="text-center">
                    <div class="text-6xl font-bold text-primary mb-2">{{ formatNumber(stats?.aiUsage?.avgTokensPerChat || 0, 0) }}</div>
                    <span class="text-500">tokens per chat</span>
                  </div>
                </div>
              </div>
            </div>
          </p-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-card .p-card-content {
        padding: 0;
      }
      
      .p-progressbar {
        height: 0.5rem;
      }
      
      .p-progressbar.gpt4-bar .p-progressbar-value {
        background-color: #4338CA;
      }
      
      .p-progressbar.gpt35-bar .p-progressbar-value {
        background-color: #10B981;
      }
      
      .p-progressbar.claude-bar .p-progressbar-value {
        background-color: #F59E0B;
      }
      
      .p-progressbar.other-bar .p-progressbar-value {
        background-color: #6B7280;
      }
    }
  `]
})
export class AiDashboard implements OnInit {
  stats: Stats | null = {
    users: {
      total: 0,
      bySubscription: {
        Free: 0,
        Golden: 0,
        Platinum: 0,
        Master: 0
      },
      newThisMonth: 0,
      growth: 0,
      activeToday: 0
    },
    chats: {
      total: 0,
      avgDuration: "0m 0s",
      avgMessagesPerChat: 0,
      satisfactionRate: 0,
      topTopics: [],
      weeklyActivity: []
    },
    comments: {
      total: 0,
      pendingReview: 0,
      avgReplyTime: "0h 0m",
      byAdmin: []
    },
    aiUsage: {
      totalTokens: 0,
      costThisMonth: "$0.00",
      avgTokensPerChat: 0,
      peakHours: [],
      modelDistribution: []
    }
  };
  
  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    this.loadStats();
  }
  
  loadStats() {
    this.http.get<Stats>('assets/data/stats.json').subscribe(
      (data: Stats) => {
        this.stats = data;
      },
      (error: any) => {
        console.error('Error loading stats:', error);
      }
    );
  }
  
  getTopicPercentage(count: number): number {
    if (!this.stats || !this.stats.chats.topTopics.length) return 0;
    const maxCount = Math.max(...this.stats.chats.topTopics.map(t => t.count));
    return (count / maxCount) * 100;
  }
  
  getAdminPercentage(count: number): number {
    if (!this.stats || !this.stats.comments.byAdmin.length) return 0;
    const maxCount = Math.max(...this.stats.comments.byAdmin.map(a => a.count));
    return (count / maxCount) * 100;
  }
  
  getModelClass(model: string): string {
    switch (model.toLowerCase()) {
      case 'gpt-4':
        return 'gpt4-bar';
      case 'gpt-3.5':
        return 'gpt35-bar';
      case 'claude':
        return 'claude-bar';
      default:
        return 'other-bar';
    }
  }
  
  formatNumber(num: number | undefined, decimals: number = 0): string {
    if (num === undefined) return '0';
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(decimals) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(decimals) + 'K';
    }
    return num.toFixed(decimals);
  }
  
  getLegendColor(index: number): string {
    switch (index) {
      case 0:
        return 'blue';
      case 1:
        return 'yellow';
      case 2:
        return 'green';
      case 3:
        return 'pink';
      default:
        return 'gray';
    }
  }
  
  getSubscriptionCount(item: string): number {
    if (!this.stats) return 0;
    
    switch (item) {
      case 'Free':
        return this.stats.users.bySubscription.Free || 0;
      case 'Golden':
        return this.stats.users.bySubscription.Golden || 0;
      case 'Platinum':
        return this.stats.users.bySubscription.Platinum || 0;
      case 'Master':
        return this.stats.users.bySubscription.Master || 0;
      default:
        return 0;
    }
  }
  
  getDayPercentage(count: number): number {
    if (!this.stats || !this.stats.chats.weeklyActivity.length) return 0;
    const maxCount = Math.max(...this.stats.chats.weeklyActivity.map(d => d.count));
    return (count / maxCount) * 100;
  }
}
