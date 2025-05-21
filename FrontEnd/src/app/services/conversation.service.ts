import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  message_user: string; // Peut contenir une chaîne JSON d'un tableau
  message_bot: string;  // Peut contenir une chaîne JSON d'un tableau
  model_type: string;
  is_saved: boolean;
  timestamp: string;
  file_id?: number;
  tickets?: TicketChat[];
  messages?: any; // Champ optionnel pour les messages structurés
}

export interface TicketChat {
  feedback_user: string | null | undefined;
  admin_comment: string | undefined;
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

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  // Update an existing conversation
  updateConversation(conversationId: number, data: { 
    message_user: string; 
    message_bot: string; 
    model_type: string; 
    title: string; 
  }): Observable<Conversation> {
    // L'endpoint correct est /conversation/{id}, pas /conversations/{id}
    return this.http.put<Conversation>(`${this.apiUrl}/conversation/${conversationId}`, data);
  }
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Get all chat history for the current user
  getChatHistory(): Observable<Conversation[]> {
    // Always return all conversations (both saved and unsaved)
    return this.http.get<Conversation[]>(`${this.apiUrl}/chat-history`);
  }

  // Get a specific conversation by ID
  getConversation(id: number): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.apiUrl}/conversation/${id}`);
  }

  // Save a new conversation
  saveConversation(data: {
    message_user: string;
    message_bot: string;
    model_type: string;
    title?: string;
    file_id?: number;
    is_saved?: boolean;
  }): Observable<Conversation> {
    // L'endpoint correct est /conversation (singulier), pas /conversations (pluriel)
    return this.http.post<Conversation>(`${this.apiUrl}/conversation`, data);
  }

  // Toggle save status for a conversation
  toggleSaveConversation(id: number): Observable<{id: number, is_saved: boolean}> {
    return this.http.post<{id: number, is_saved: boolean}>(`${this.apiUrl}/toggle-save-conversation/${id}`, {});
  }

  // Create a ticket for conversation feedback with question and response context
  createTicket(
    conversationId: number, 
    evaluation: 'jaime' | 'jenaimepas',
    question: string = '',
    response: string = ''
  ): Observable<TicketChat> {
    return this.http.post<TicketChat>(`${this.apiUrl}/create-ticket`, {
      conversation_id: conversationId,
      evaluation,
      question,
      response
    });
  }
  
  // Get all evaluations for a specific conversation
  getConversationEvaluations(conversationId: number): Observable<{
    tickets: TicketChat[],
    stats: {
      total: number,
      jaime: number,
      jenaimepas: number,
      has_comments: boolean
    }
  }> {
    return this.http.get<{
      tickets: TicketChat[],
      stats: {
        total: number,
        jaime: number,
        jenaimepas: number,
        has_comments: boolean
      }
    }>(`${this.apiUrl}/conversation/${conversationId}/evaluations`);
  }
  
  // Ajouter un message à une conversation existante
  addMessageToConversation(
    conversationId: number,
    userMessage: string,
    botMessage: string
  ): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/conversation/${conversationId}/message`, {
      message_user: userMessage,
      message_bot: botMessage
    });
  }
}
