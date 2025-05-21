import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TicketChat } from './conversation.service';
import { MessageService } from 'primeng/api';
import { AuthService } from './auth.service';

export interface Notification {
  id: number;
  type: 'ticket' | 'message' | 'system';
  content: string;
  is_read: boolean;
  created_at: string;
  data?: any; // Can contain ticket info or other relevant data
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiUrl;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private pollingSubscription: any;
  private unreadCount = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCount.asObservable();
  
  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private authService: AuthService
  ) { 
    // Start polling for notifications if user is admin
    this.authService.currentUser.subscribe(user => {
      if (user && this.authService.isAdmin()) {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    });
  }
  
  // Start polling for new notifications (for admins only)
  private startPolling() {
    console.log('Starting notification polling for admin');
    // Poll every 30 seconds
    this.pollingSubscription = timer(0, 30000).pipe(
      switchMap(() => this.getNotifications())
    ).subscribe(notifications => {
      const prevNotifications = this.notificationsSubject.value;
      const newNotifications = notifications.filter(notification => 
        !prevNotifications.some(prevNotification => prevNotification.id === notification.id));
      
      // Show toast for new notifications
      newNotifications.forEach(notification => {
        if (!notification.is_read) {
          this.messageService.add({
            severity: 'info',
            summary: 'New Feedback',
            detail: notification.content,
            sticky: true,
            life: 5000
          });
        }
      });
      
      this.notificationsSubject.next(notifications);
      this.updateUnreadCount(notifications);
    });
  }
  
  private stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }
  
  private updateUnreadCount(notifications: Notification[]) {
    const unreadCount = notifications.filter(notification => !notification.is_read).length;
    this.unreadCount.next(unreadCount);
  }
  
  // Get all notifications
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/admin/notifications`);
  }
  
  // Mark notification as read
  markAsRead(notificationId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/notifications/${notificationId}/read`, {}).pipe(
      tap(() => {
        // Update local state
        const notifications = this.notificationsSubject.value;
        const updatedNotifications = notifications.map(notification => {
          if (notification.id === notificationId) {
            return { ...notification, is_read: true };
          }
          return notification;
        });
        this.notificationsSubject.next(updatedNotifications);
        this.updateUnreadCount(updatedNotifications);
      })
    );
  }
  
  // Mark all notifications as read
  markAllAsRead(): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/notifications/read-all`, {}).pipe(
      tap(() => {
        // Update local state
        const notifications = this.notificationsSubject.value;
        const updatedNotifications = notifications.map(notification => ({
          ...notification, is_read: true
        }));
        this.notificationsSubject.next(updatedNotifications);
        this.unreadCount.next(0);
      })
    );
  }
  
  // Get real-time notification for a new ticket (simulate a websocket)
  simulateNewTicketNotification(ticket: TicketChat, username: string) {
    if (this.authService.isAdmin()) {
      const notification: Notification = {
        id: Math.floor(Math.random() * 10000), // Temporary ID
        type: 'ticket',
        content: `New ${ticket.evaluation === 'jaime' ? 'positive' : 'negative'} feedback from ${username}`,
        is_read: false,
        created_at: new Date().toISOString(),
        data: ticket
      };
      
      // Add to notifications
      const currentNotifications = this.notificationsSubject.value;
      const updatedNotifications = [notification, ...currentNotifications];
      this.notificationsSubject.next(updatedNotifications);
      this.updateUnreadCount(updatedNotifications);
      
      // Show toast
      this.messageService.add({
        severity: ticket.evaluation === 'jaime' ? 'success' : 'warn',
        summary: 'New Feedback',
        detail: notification.content,
        sticky: true,
        life: 5000
      });
    }
  }
}
