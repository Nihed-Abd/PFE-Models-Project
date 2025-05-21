import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TicketChat } from './conversation.service';

export interface TicketResponse {
  id: number;
  ticket_id: number;
  admin_id: number;
  comment: string;
  created_at: string;
  updated_at: string;
  admin_name: string;
  admin_avatar?: string;
}

export interface TicketWithUser extends TicketChat {
  user_name: string;
  user_email: string;
  user_avatar?: string;
  responses?: TicketResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Get all tickets for admin dashboard
  getAllTickets(): Observable<TicketWithUser[]> {
    return this.http.get<TicketWithUser[]>(`${this.apiUrl}/admin/tickets`);
  }

  // Add admin comment to ticket
  addTicketComment(ticketId: number, comment: string): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(`${this.apiUrl}/admin/tickets/${ticketId}/comment`, {
      comment
    });
  }

  // Update ticket status
  updateTicketStatus(ticketId: number, status: 'open' | 'closed'): Observable<TicketChat> {
    return this.http.patch<TicketChat>(`${this.apiUrl}/admin/tickets/${ticketId}/status`, {
      status
    });
  }

  // Get all comments for a ticket
  getTicketComments(ticketId: number): Observable<TicketResponse[]> {
    return this.http.get<TicketResponse[]>(`${this.apiUrl}/admin/tickets/${ticketId}/comments`);
  }
}
