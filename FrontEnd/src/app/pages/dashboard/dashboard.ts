import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        ButtonModule,
        ChartModule,
        TableModule,
        ToastModule,
        DropdownModule,
        CalendarModule,
        ProgressSpinnerModule,
        TooltipModule
    ],
    providers: [MessageService],
    template: `
        <div class="p-4">
            <p-toast></p-toast>
            
            <!-- Date filter in top right -->
            <div class="flex justify-content-end mb-3">
                <div class="flex gap-3 align-items-center">
                    <div class="p-inputgroup">
                        <span class="p-inputgroup-addon bg-primary">
                            <i class="pi pi-calendar text-white"></i>
                        </span>
                        <p-calendar [(ngModel)]="dateRange" selectionMode="range" 
                            [readonlyInput]="true" placeholder="Select date range"
                            [showButtonBar]="true" (onSelect)="onDateRangeChange()"
                            styleClass="mr-2" [style]="{'min-width': '250px'}"></p-calendar>
                    </div>
                    
                    <p-button icon="pi pi-sync" (onClick)="loadAllData()" 
                        pTooltip="Refresh Data" tooltipPosition="bottom"
                        styleClass="p-button-rounded p-button-outlined">
                    </p-button>
                </div>
            </div>
            
            <!-- Dashboard Header -->
            <div class="flex align-items-center mb-5">
                <i class="pi pi-chart-bar text-primary mr-3" style="font-size: 2rem;"></i>
                <h1 class="text-3xl font-bold mb-0">Analytics Dashboard</h1>
            </div>
            
            <!-- Loading indicator -->
            <div *ngIf="loading" class="flex justify-content-center my-6">
                <p-progressSpinner></p-progressSpinner>
            </div>
            
            <!-- Stats Cards -->
            <div *ngIf="!loading" class="grid grid-cols-12 gap-4 mb-5">
                <!-- Users Card -->
                <div class="col-span-12 md:col-span-4 lg:col-span-2.4">
                    <div class="card border-round-2xl mb-0 h-full shadow-4 overflow-hidden" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);">
                        <div class="flex">
                            <div class="flex-shrink-0 mr-3">
                                <div class="flex align-items-center justify-content-center" style="width: 3rem; height: 3rem; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="pi pi-users text-white" style="font-size: 1.5rem; line-height: 1; margin: 0;"></i>
                                </div>
                            </div>
                            <div>
                                <span class="block text-600 font-medium mb-1">Total Users</span>
                                <div class="text-900 font-bold text-4xl">{{stats.totalUsers}}</div>
                            </div>
                        </div>
                        <div class="mt-4 pt-3 border-top-1 border-300 flex align-items-center">
                            <div class="flex align-items-center bg-green-50 border-round-2xl px-3 py-1">
                                <i class="pi pi-arrow-up text-green-500 mr-1"></i>
                                <span class="text-green-600 font-medium">{{stats.newUsers}}</span>
                                <span class="text-green-600 ml-1">new this week</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Tickets Card -->
                <div class="col-span-12 md:col-span-4 lg:col-span-2.4">
                    <div class="card border-round-2xl mb-0 h-full shadow-4 overflow-hidden" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);">
                        <div class="flex">
                            <div class="flex-shrink-0 mr-3">
                                <div class="flex align-items-center justify-content-center" style="width: 3rem; height: 3rem; background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%); box-shadow: 0 4px 12px rgba(255, 154, 158, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="pi pi-ticket text-white" style="font-size: 1.5rem; line-height: 1; margin: 0;"></i>
                                </div>
                            </div>
                            <div>
                                <span class="block text-600 font-medium mb-1">Total Tickets</span>
                                <div class="text-900 font-bold text-4xl">{{stats.totalTickets}}</div>
                            </div>
                        </div>
                        <div class="mt-4 pt-3 border-top-1 border-300 flex align-items-center justify-content-between">
                            <div class="flex align-items-center bg-green-50 border-round-2xl px-3 py-1">
                                <i class="pi pi-check-circle text-green-500 mr-1"></i>
                                <span class="text-green-600 font-medium">{{stats.repliedTickets}}</span>
                                <span class="text-green-600 ml-1">replied</span>
                            </div>
                            <div class="flex align-items-center bg-orange-50 border-round-2xl px-3 py-1">
                                <i class="pi pi-clock text-orange-500 mr-1"></i>
                                <span class="text-orange-600 font-medium">{{stats.unrepliedTickets}}</span>
                                <span class="text-orange-600 ml-1">pending</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Feedback Card -->
                <div class="col-span-12 md:col-span-4 lg:col-span-2.4">
                    <div class="card border-round-2xl mb-0 h-full shadow-4 overflow-hidden" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);">
                        <div class="flex">
                            <div class="flex-shrink-0 mr-3">
                                <div class="flex align-items-center justify-content-center" style="width: 3rem; height: 3rem; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); box-shadow: 0 4px 12px rgba(67, 233, 123, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="pi pi-star-fill text-white" style="font-size: 1.5rem; line-height: 1; margin: 0;"></i>
                                </div>
                            </div>
                            <div>
                                <span class="block text-600 font-medium mb-1">Feedback</span>
                                <div class="text-900 font-bold text-4xl">{{stats.totalFeedback}}</div>
                            </div>
                        </div>
                        <div class="mt-4 pt-3 border-top-1 border-300 flex align-items-center justify-content-between">
                            <div class="flex align-items-center bg-green-50 border-round-2xl px-3 py-1">
                                <i class="pi pi-thumbs-up text-green-500 mr-1"></i>
                                <span class="text-green-600 font-medium">{{stats.positiveFeedback}}</span>
                                <span class="text-green-600 ml-1">likes</span>
                            </div>
                            <div class="flex align-items-center bg-red-50 border-round-2xl px-3 py-1">
                                <i class="pi pi-thumbs-down text-red-500 mr-1"></i>
                                <span class="text-red-600 font-medium">{{stats.negativeFeedback}}</span>
                                <span class="text-red-600 ml-1">dislikes</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Admin Comments Card -->
                <div class="col-span-12 md:col-span-4 lg:col-span-2.4">
                    <div class="card border-round-2xl mb-0 h-full shadow-4 overflow-hidden" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);">
                        <div class="flex">
                            <div class="flex-shrink-0 mr-3">
                                <div class="flex align-items-center justify-content-center" style="width: 3rem; height: 3rem; background: linear-gradient(135deg, #0acffe 0%, #495aff 100%); box-shadow: 0 4px 12px rgba(10, 207, 254, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="pi pi-comment text-white" style="font-size: 1.5rem; line-height: 1; margin: 0;"></i>
                                </div>
                            </div>
                            <div>
                                <span class="block text-600 font-medium mb-1">Admin Comments</span>
                                <div class="text-900 font-bold text-4xl">{{stats.adminComments}}</div>
                            </div>
                        </div>
                        <div class="mt-4 pt-3 border-top-1 border-300 flex align-items-center">
                            <div class="flex align-items-center bg-blue-50 border-round-2xl px-3 py-1">
                                <i class="pi pi-reply text-blue-500 mr-1"></i>
                                <span class="text-blue-600 font-medium">{{stats.repliedTickets}}</span>
                                <span class="text-blue-600 ml-1">replied tickets</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Conversations Card -->
                <div class="col-span-12 md:col-span-4 lg:col-span-2.4">
                    <div class="card border-round-2xl mb-0 h-full shadow-4 overflow-hidden" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);">
                        <div class="flex">
                            <div class="flex-shrink-0 mr-3">
                                <div class="flex align-items-center justify-content-center" style="width: 3rem; height: 3rem; background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); box-shadow: 0 4px 12px rgba(161, 140, 209, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="pi pi-comments text-white" style="font-size: 1.5rem; line-height: 1; margin: 0;"></i>
                                </div>
                            </div>
                            <div>
                                <span class="block text-600 font-medium mb-1">Conversations</span>
                                <div class="text-900 font-bold text-4xl">{{stats.totalConversations}}</div>
                            </div>
                        </div>
                        <div class="mt-4 pt-3 border-top-1 border-300 flex align-items-center">
                            <div class="flex align-items-center bg-purple-50 border-round-2xl px-3 py-1">
                                <i class="pi pi-calendar text-purple-500 mr-1"></i>
                                <span class="text-purple-600 font-medium">{{stats.conversationsToday}}</span>
                                <span class="text-purple-600 ml-1">today</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Charts Row -->
            <div *ngIf="!loading" class="grid grid-cols-12 gap-4 mb-5">
                <!-- Feedback Chart -->
                <div class="col-span-12 lg:col-span-6">
                    <div class="card shadow-2 h-full">
                        <div class="flex align-items-center mb-3">
                            <i class="pi pi-chart-bar text-primary mr-2" style="font-size: 1.2rem;"></i>
                            <h5 class="m-0">Feedback Trends</h5>
                        </div>
                        <p-chart type="bar" [data]="feedbackChartData" [options]="feedbackChartOptions" height="350px"></p-chart>
                    </div>
                </div>
                
                <!-- Conversations Chart -->
                <div class="col-span-12 lg:col-span-6">
                    <div class="card shadow-2 h-full">
                        <div class="flex align-items-center mb-3">
                            <i class="pi pi-chart-line text-purple-500 mr-2" style="font-size: 1.2rem;"></i>
                            <h5 class="m-0">Conversations Over Time</h5>
                        </div>
                        <p-chart type="line" [data]="conversationChartData" [options]="conversationChartOptions" height="350px"></p-chart>
                    </div>
                </div>
            </div>
            
            <!-- Ticket Status and Admin Comments -->
            <div *ngIf="!loading" class="grid grid-cols-12 gap-4">
                <!-- Ticket Status Chart -->
                <div class="col-span-12 lg:col-span-6">
                    <div class="card shadow-2 h-full">
                        <div class="flex align-items-center mb-3">
                            <i class="pi pi-chart-pie text-blue-500 mr-2" style="font-size: 1.2rem;"></i>
                            <h5 class="m-0">Ticket Status</h5>
                        </div>
                        <div class="flex flex-column align-items-center justify-content-center">
                            <p-chart type="doughnut" [data]="ticketStatusChartData" [options]="ticketStatusChartOptions" [style]="{'width': '60%', 'height': '300px'}"></p-chart>
                            <div class="flex gap-4 mt-3">
                                <div class="flex align-items-center">
                                    <span class="inline-block mr-2" style="width: 12px; height: 12px; background-color: #4BC0C0; border-radius: 50%;"></span>
                                    <span class="text-600">Replied ({{stats.repliedTickets}})</span>
                                </div>
                                <div class="flex align-items-center">
                                    <span class="inline-block mr-2" style="width: 12px; height: 12px; background-color: #FF9F40; border-radius: 50%;"></span>
                                    <span class="text-600">Unreplied ({{stats.unrepliedTickets}})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Tickets Table -->
                <div class="col-span-12 lg:col-span-6">
                    <div class="card shadow-2 h-full">
                        <div class="flex align-items-center justify-content-between mb-3">
                            <div class="flex align-items-center">
                                <i class="pi pi-list text-blue-500 mr-2" style="font-size: 1.2rem;"></i>
                                <h5 class="m-0">Recent Tickets</h5>
                            </div>
                            <p-button icon="pi pi-refresh" styleClass="p-button-text p-button-rounded" (onClick)="loadAllData()"></p-button>
                        </div>
                        <p-table [value]="recentTickets" [tableStyle]="{'min-width': '50rem'}" styleClass="p-datatable-sm p-datatable-striped" [paginator]="true" [rows]="5" responsiveLayout="scroll">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>User</th>
                                    <th>Question</th>
                                    <th>Status</th>
                                    <th>Admin</th>
                                    <th>Feedback</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-ticket>
                                <tr>
                                    <td>
                                        <div class="flex align-items-center gap-2">
                                            <span class="p-avatar p-avatar-circle p-avatar-sm bg-primary text-white">
                                                {{ticket.user_name.charAt(0).toUpperCase()}}
                                            </span>
                                            <span>{{ticket.user_name}}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="text-overflow-ellipsis block" style="max-width: 200px;" [pTooltip]="ticket.question">
                                            {{ticket.question | slice:0:30}}{{ticket.question.length > 30 ? '...' : ''}}
                                        </span>
                                    </td>
                                    <td>
                                        <span [class]="'ticket-status-badge status-' + ticket.status">{{ticket.status}}</span>
                                    </td>
                                    <td class="text-center">
                                        <i *ngIf="ticket.has_admin_comment" class="pi pi-check-circle text-green-500" pTooltip="Has admin comment" style="font-size: 1.2rem;"></i>
                                        <i *ngIf="!ticket.has_admin_comment" class="pi pi-times-circle text-red-500" pTooltip="No admin comment" style="font-size: 1.2rem;"></i>
                                    </td>
                                    <td class="text-center">
                                        <i *ngIf="ticket.evaluation === 'jaime'" class="pi pi-thumbs-up text-green-500" style="font-size: 1.2rem;"></i>
                                        <i *ngIf="ticket.evaluation === 'jenaimepas'" class="pi pi-thumbs-down text-red-500" style="font-size: 1.2rem;"></i>
                                        <span *ngIf="!ticket.evaluation">-</span>
                                    </td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="emptymessage">
                                <tr>
                                    <td colspan="5" class="text-center p-4">
                                        <i class="pi pi-inbox text-500 mb-2" style="font-size: 2rem;"></i>
                                        <div>No recent tickets found</div>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .ticket-status-badge {
            border-radius: 2px;
            padding: 0.25rem 0.5rem;
            text-transform: uppercase;
            font-weight: 700;
            font-size: 0.75rem;
            letter-spacing: 0.3px;
        }
        .status-open {
            background-color: #C8E6C9;
            color: #256029;
        }
        .status-closed {
            background-color: #FFCDD2;
            color: #C63737;
        }
        .status-pending {
            background-color: #FEEDAF;
            color: #8A5340;
        }
    `]
})
export class Dashboard implements OnInit {
    loading = true;
    dateRange: Date[] = [];
    
    // Statistics
    stats = {
        totalUsers: 0,
        newUsers: 0,
        totalTickets: 0,
        repliedTickets: 0,
        unrepliedTickets: 0,
        totalFeedback: 0,
        positiveFeedback: 0,
        negativeFeedback: 0,
        adminComments: 0,
        totalConversations: 0,
        conversationsToday: 0
    };
    
    // Chart data
    feedbackChartData: any;
    feedbackChartOptions: any;
    conversationChartData: any;
    conversationChartOptions: any;
    ticketStatusChartData: any;
    ticketStatusChartOptions: any;
    ticketEvaluationChartData: any;
    ticketEvaluationChartOptions: any;
    
    // Recent tickets
    recentTickets: any[] = [];
    
    constructor(
        private http: HttpClient,
        private messageService: MessageService
    ) {
        // Set default date range to last 7 days
        const today = new Date();
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        this.dateRange = [lastWeek, today];
        
        // Initialize chart options
        this.initChartOptions();
    }
    
    ngOnInit() {
        this.loadAllData();
    }
    
    loadAllData() {
        this.loading = true;
        
        // Get date range params
        let params: any = {};
        if (this.dateRange && this.dateRange.length === 2) {
            params.start_date = this.formatDate(this.dateRange[0]);
            params.end_date = this.formatDate(this.dateRange[1]);
        }
        
        // Load dashboard stats
        this.http.get<any>(`${environment.apiUrl}/dashboard/stats`, { params })
            .subscribe({
                next: (data) => {
                    this.stats = data.stats;
                    this.updateChartData(data);
                    this.recentTickets = data.recentTickets || [];
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Error loading dashboard data:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load dashboard data'
                    });
                    this.loading = false;
                    
                    // Load dummy data for preview
                    this.loadDummyData();
                }
            });
    }
    
    onDateRangeChange() {
        if (this.dateRange && this.dateRange.length === 2) {
            this.loadAllData();
        }
    }
    
    initChartOptions() {
        // Feedback chart options
        this.feedbackChartOptions = {
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        };
        
        // Conversation chart options
        this.conversationChartOptions = {
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        };
        
        // Ticket status chart options
        this.ticketStatusChartOptions = {
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            responsive: true,
            maintainAspectRatio: false
        };
        
        // Ticket evaluation chart options
        this.ticketEvaluationChartOptions = {
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        };
    }
    
    updateChartData(data: any) {
        // Update feedback chart data
        this.feedbackChartData = {
            labels: data.feedbackChartData?.labels || this.getLast7Days(),
            datasets: [
                {
                    label: 'Positive Feedback',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1,
                    data: data.feedbackChartData?.positive || [0, 0, 0, 0, 0, 0, 0]
                },
                {
                    label: 'Negative Feedback',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1,
                    data: data.feedbackChartData?.negative || [0, 0, 0, 0, 0, 0, 0]
                }
            ]
        };
        
        // Update ticket evaluation chart data
        this.ticketEvaluationChartData = {
            labels: data.ticketEvaluationChartData?.labels || this.getLast7Days(),
            datasets: [
                {
                    label: 'Positive Evaluations',
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    borderColor: 'rgb(40, 167, 69)',
                    borderWidth: 1,
                    data: data.ticketEvaluationChartData?.positive || [0, 0, 0, 0, 0, 0, 0]
                },
                {
                    label: 'Negative Evaluations',
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    borderColor: 'rgb(220, 53, 69)',
                    borderWidth: 1,
                    data: data.ticketEvaluationChartData?.negative || [0, 0, 0, 0, 0, 0, 0]
                }
            ]
        };
        
        // Update conversation chart data
        this.conversationChartData = {
            labels: data.conversationChartData?.labels || this.getLast7Days(),
            datasets: [
                {
                    label: 'Conversations',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgb(153, 102, 255)',
                    tension: 0.4,
                    fill: true,
                    data: data.conversationChartData?.data || [0, 0, 0, 0, 0, 0, 0]
                }
            ]
        };
        
        // Update ticket status chart data
        this.ticketStatusChartData = {
            labels: ['Replied', 'Unreplied'],
            datasets: [
                {
                    data: [this.stats.repliedTickets, this.stats.unrepliedTickets],
                    backgroundColor: ['#4BC0C0', '#FF9F40'],
                    hoverBackgroundColor: ['#3BA7A7', '#E8892D']
                }
            ]
        };
    }
    
    getLast7Days(): string[] {
        const dates: string[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        return dates;
    }
    
    formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }
    
    loadDummyData() {
        // Set dummy stats
        this.stats = {
            totalUsers: 125,
            newUsers: 12,
            totalTickets: 348,
            repliedTickets: 287,
            unrepliedTickets: 61,
            totalFeedback: 215,
            positiveFeedback: 178,
            negativeFeedback: 37,
            adminComments: 245,  // Added adminComments property
            totalConversations: 562,
            conversationsToday: 24
        };
        
        // Set dummy chart data
        const labels = this.getLast7Days();
        
        // Feedback chart data
        this.feedbackChartData = {
            labels,
            datasets: [
                {
                    label: 'Positive Feedback',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1,
                    data: [12, 19, 15, 22, 18, 25, 17]
                },
                {
                    label: 'Negative Feedback',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1,
                    data: [5, 3, 7, 4, 6, 2, 5]
                }
            ]
        };
        
        // Ticket evaluation chart data
        this.ticketEvaluationChartData = {
            labels,
            datasets: [
                {
                    label: 'Positive Evaluations',
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    borderColor: 'rgb(40, 167, 69)',
                    borderWidth: 1,
                    data: [8, 15, 12, 18, 14, 21, 13]
                },
                {
                    label: 'Negative Evaluations',
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    borderColor: 'rgb(220, 53, 69)',
                    borderWidth: 1,
                    data: [3, 2, 5, 3, 4, 1, 3]
                }
            ]
        };
        
        // Conversation chart data
        this.conversationChartData = {
            labels,
            datasets: [
                {
                    label: 'Conversations',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgb(153, 102, 255)',
                    tension: 0.4,
                    fill: true,
                    data: [42, 35, 48, 56, 38, 65, 24]
                }
            ]
        };
        
        // Ticket status chart data
        this.ticketStatusChartData = {
            labels: ['Replied', 'Unreplied'],
            datasets: [
                {
                    data: [287, 61],
                    backgroundColor: ['#4BC0C0', '#FF9F40'],
                    hoverBackgroundColor: ['#3BA7A7', '#E8892D']
                }
            ]
        };
        
        // Dummy recent tickets
        this.recentTickets = [
            { user_name: 'John Doe', question: 'How can I integrate the API with my application?', status: 'open', evaluation: 'jaime', has_admin_comment: true },
            { user_name: 'Jane Smith', question: 'Is there a way to export the data as CSV?', status: 'closed', evaluation: 'jaime', has_admin_comment: true },
            { user_name: 'Robert Johnson', question: 'The search functionality is not working properly', status: 'open', evaluation: 'jenaimepas', has_admin_comment: false },
            { user_name: 'Emily Davis', question: 'How do I reset my password?', status: 'closed', evaluation: null, has_admin_comment: true },
            { user_name: 'Michael Brown', question: 'Can you provide more documentation on the new features?', status: 'pending', evaluation: 'jaime', has_admin_comment: true }
        ];
    }
}
