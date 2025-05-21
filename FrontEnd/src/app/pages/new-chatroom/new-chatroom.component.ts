import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextarea } from 'primeng/inputtextarea';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { animate, style, transition, trigger } from '@angular/animations';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { DropdownModule } from 'primeng/dropdown';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { InputSwitchModule } from 'primeng/inputswitch';
import { AuthService } from '../../services/auth.service';
import { ConversationService, Conversation, TicketChat } from '../../services/conversation.service';
import { environment } from '../../../environments/environment';

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  likes: number;
  dislikes: number;
  attachments?: string[];
  avatar?: string;
  category?: string;
  conversationId?: number;
  userFeedback?: 'jaime' | 'jenaimepas' | null;
  adminComment?: string;
  ticketId?: number; // ID of the feedback ticket associated with this message
}

interface AIModel {
  name: string;
  value: string;
  available: boolean;
  description?: string;
}

interface AIResponse {
  predicted_category: string;
  question: string;
}

@Component({
  selector: 'app-new-chatroom',
  templateUrl: './new-chatroom.component.html',
  styleUrls: ['./new-chatroom.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextarea,
    DividerModule,
    AvatarModule,
    RippleModule,
    TooltipModule,
    BadgeModule,
    CardModule,
    ToastModule,
    HttpClientModule,
    ProgressSpinnerModule,
    TagModule,
    SkeletonModule,
    DropdownModule,
    OverlayPanelModule,
    InputSwitchModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('pulseAnimation', [
      transition('* => pulsing', [
        style({ boxShadow: '0 0 0 rgba(220, 38, 38, 0.7)' }),
        animate('1.5s ease-in-out', style({ boxShadow: '0 0 0 10px rgba(220, 38, 38, 0)' })),
      ]),
    ])
  ]
})
export class NewChatroomComponent implements OnInit {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;
  
  // Chat UI state
  messages: Message[] = [];
  newMessage: string = '';
  isLoading: boolean = false;
  currentConversationId: number | null = null;
  currentConversationTitle: string | null = null;
  isNewConversation: boolean = true;
  lastSavedMessageCount: number = 0;

  // AI Models
  availableModels: AIModel[] = [
    { name: 'GPT-2', value: 'gpt2', available: true, description: 'Efficient general-purpose model' },
    { name: 'Llama 2', value: 'llama', available: true, description: 'Advanced open-source model' },
    { name: 'Fine-tuned Model', value: 'finetuned', available: false, description: 'Domain-specific model (coming soon)' }
  ];
  selectedModel: AIModel = this.availableModels[0];
  
  // File handling
  selectedFile: File | null = null;
  
  constructor(
    private messageService: MessageService, 
    private http: HttpClient, 
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private conversationService: ConversationService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    // Check for conversation ID in both route params and query params
    this.route.paramMap.subscribe(params => {
      const conversationId = params.get('id');
      if (conversationId) {
        // Load existing conversation from route param
        this.loadConversation(parseInt(conversationId, 10));
      } else {
        // Check query params for conversationId
        this.route.queryParams.subscribe(queryParams => {
          const queryConversationId = queryParams['conversationId'];
          if (queryConversationId) {
            // Load existing conversation from query param
            this.loadConversation(parseInt(queryConversationId, 10));
          } else {
            // Load initial welcome message for new conversation
            this.loadMessages();
          }
        });
      }
    });
    
    // Setup the watcher for unsaved changes
    this.watchForChanges();
  }
  
  // Charger les messages initiaux pour une nouvelle conversation
  private loadMessages(): void {
    // Add welcome message from AI
    const welcomeMessage: Message = {
      id: 1,
      sender: 'assistant',
      content: 'Bonjour! Comment puis-je vous aider aujourd\'hui?',
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      avatar: 'assets/Aicon.jpg',
      category: 'Welcome'
    };
    
    this.messages = [welcomeMessage];
    this.isLoading = false;
    this.currentConversationId = null;
    this.currentConversationTitle = 'Nouvelle conversation';
    this.isNewConversation = true;
    this.lastSavedMessageCount = 0;
    
    setTimeout(() => this.scrollToBottom(), 100);
  }
  
  // Utility function to safely parse JSON strings and clean message content
  private parseJsonString(jsonString: any): any {
    if (!jsonString) return '';
    
    // If jsonString is already an object or array, return it as is
    if (typeof jsonString !== 'string') {
      return jsonString;
    }
    
    try {
      // Clean the string (remove BOM and non-printable characters)
      const cleanedString = jsonString.trim().replace(/^\ufeff/, '');
      
      // Check if the string looks like JSON (starts with [ or {)
      if ((cleanedString.startsWith('{') && cleanedString.endsWith('}')) || 
          (cleanedString.startsWith('[') && cleanedString.endsWith(']'))) {
        const parsed = JSON.parse(cleanedString);
        
        // If it's an array of strings with quotes, clean them
        if (Array.isArray(parsed)) {
          return parsed.map(item => {
            if (typeof item === 'string') {
              // Remove quotes from the string
              return this.cleanMessageContent(item);
            }
            return item;
          });
        }
        
        return parsed;
      }
      
      // Return the original if it's not JSON
      return this.cleanMessageContent(jsonString);
    } catch (e) {
      console.error('Failed to parse JSON:', e, 'String was:', jsonString);
      // In case of error, return the cleaned original string
      return this.cleanMessageContent(jsonString);
    }
  }
  
  // Helper method to clean message content and remove quotes
  private cleanMessageContent(content: string): string {
    if (!content) return '';
    
    let cleaned = content;
    
    // Remove quotes at beginning and end
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    
    if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
      cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    
    // Remove any remaining JSON syntax or escape characters
    cleaned = cleaned
      .replace(/\\n/g, ' ')       // Newlines
      .replace(/\\r/g, ' ')       // Carriage returns
      .replace(/\\t/g, ' ')       // Tabs
      .replace(/\\'/g, "'")       // Single quotes
      .replace(/\\"/g, '"')       // Double quotes
      .replace(/\\\//g, '/')      // Forward slashes
      .replace(/\[|\]/g, '')      // Square brackets
      .replace(/\{|\}/g, '')      // Curly braces
      .replace(/^['"]|['"]$/g, '')  // Any remaining quotes at start/end
      .trim();
      
    return cleaned;
  }
  
  // Générer un avatar par défaut pour l'utilisateur
  private generateUserAvatar(username: string): string {
    // Implantation simple - retourner une image par défaut
    return 'assets/user.jpg';
  }
  
  // Auto-save when messages change
  watchForChanges() {
    // Only auto-save if we have new messages since last save AND we're not in the middle of a save operation
    if (this.messages.length > this.lastSavedMessageCount && !this.isLoading) {
      this.saveCurrentChat();
    }
  }
  
  // Load an existing conversation by ID
  loadConversation(conversationId: number): void {
    if (!conversationId) {
      console.error('Invalid conversation ID');
      this.handleConversationLoadError();
      return;
    }
    
    this.isLoading = true;
    console.log(`Loading conversation with ID: ${conversationId}`);
    
    // First try to load via individual conversation API
    this.conversationService.getConversation(conversationId).subscribe({
      next: (conversation) => {
        console.log('Successfully loaded conversation from API:', conversation);
        if (conversation) {
          // Format the conversation title before processing
          if (conversation.title) {
            conversation.title = this.formatConversationTitle(conversation.title);
          }
          this.processConversationData(conversation);
        } else {
          console.error('Received empty conversation data');
          this.handleConversationLoadError();
        }
      },
      error: (err) => {
        console.error('Error loading conversation from API:', err);
        
        // Fallback: Si l'API de conversation individuelle échoue, essayer de la récupérer depuis l'historique
        this.messageService.add({
          severity: 'info', 
          summary: 'Récupération alternative', 
          detail: 'Tentative de récupération de la conversation depuis l\'historique...',
          life: 3000
        });
        
        this.conversationService.getChatHistory().subscribe({
          next: (conversations) => {
            console.log('Fetched chat history, searching for conversation ID:', conversationId);
            // Trouver la conversation par ID dans la liste
            const foundConversation = conversations.find(c => c.id === conversationId);
            if (foundConversation) {
              console.log('Found conversation in history:', foundConversation);
              this.processConversationData(foundConversation);
            } else {
              console.error('Conversation not found in history');
              this.handleConversationLoadError();
            }
          },
          error: (historyErr) => {
            console.error('Error loading chat history:', historyErr);
            this.handleConversationLoadError();
          }
        });
      }
    });
  }

  // Gérer l'erreur de chargement de conversation
  private handleConversationLoadError(): void {
    this.isLoading = false;
    this.messageService.add({
      severity: 'error', 
      summary: 'Erreur', 
      detail: 'Impossible de charger la conversation'
    });
    this.resetConversation();
  }
  
  // Fonction pour faire défiler jusqu'au bas de la conversation
  private scrollToBottom(): void {
    try {
      const container = this.messageContainer?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    } catch (err) {
      console.error('Erreur lors du défilement:', err);
    }
  }
  
  // Initialiser ou réinitialiser la conversation
  resetConversation(): void {
    this.messages = [];
    this.currentConversationId = null;
    this.currentConversationTitle = 'Nouvelle conversation';
    this.isNewConversation = true;
    this.lastSavedMessageCount = 0;
    
    // Ajouter un message de bienvenue
    this.messages.push({
      id: 1,
      sender: 'assistant',
      content: 'Bonjour! Comment puis-je vous aider aujourd\'hui?',
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      avatar: 'assets/Aicon.jpg',
      category: 'Welcome'
    });
    
    // Faire défiler jusqu'au bas
    setTimeout(() => this.scrollToBottom(), 100);
  }
  
  // Traiter les données de conversation, qu'elles viennent de l'API directe ou de l'historique
  private processConversationData(conversation: Conversation): void {
    console.log('Chargement de la conversation:', conversation);
    
    if (!conversation) {
      console.error('Invalid conversation data');
      this.handleConversationLoadError();
      return;
    }
    
    try {
      // Mise à jour des informations de la conversation
      this.currentConversationId = conversation.id;
      this.currentConversationTitle = this.formatConversationTitle(conversation.title) || 'Nouvelle conversation';
      this.isNewConversation = false;
      this.lastSavedMessageCount = 0; // Reset saved message count for loaded conversation
      
      // Vider les messages existants
      this.messages = [];
      
      // Vérifier d'abord si le champ messages existe et est utilisable
      if (conversation.messages) {
        let structuredMessages = this.parseJsonString(conversation.messages);
        console.log('Messages structurés parsés:', structuredMessages);
        
        if (Array.isArray(structuredMessages) && structuredMessages.length > 0) {
          console.log('Utilisation du format structuré messages');
          
          // Traiter les messages structurés format array de {user, bot}
          structuredMessages.forEach((msgPair: { user: string; bot: string; }, index: number) => {
            // Add user message with cleaned content
            if (msgPair.user) {
              this.messages.push({
                id: (index * 2) + 1,
                sender: 'user',
                content: this.cleanMessageContent(msgPair.user),
                timestamp: new Date(conversation.timestamp || new Date()).toISOString(),
                likes: 0,
                dislikes: 0,
                avatar: this.generateUserAvatar('User'),
                category: 'Historical',
                conversationId: conversation.id
              });
            }
            
            // Add bot message with cleaned content
            if (msgPair.bot) {
              this.messages.push({
                id: (index * 2) + 2,
                sender: 'assistant',
                content: this.cleanMessageContent(msgPair.bot),
                timestamp: new Date(conversation.timestamp || new Date()).toISOString(),
                likes: 0,
                dislikes: 0,
                avatar: 'assets/Aicon.jpg',
                category: 'Historical',
                conversationId: conversation.id
              });
            }
          });
          
          // Si nous avons traité les messages structurés avec succès, continuer avec les tickets
          if (this.messages.length > 0) {
            console.log('Messages chargés depuis le format structuré, total:', this.messages.length);
            
            // Ajouter les feedbacks des tickets si présents
            if (conversation.tickets && conversation.tickets.length > 0) {
              conversation.tickets.forEach(ticket => {
                // Trouver le message correspondant (pour l'instant, on prend le premier message AI)
                const aiMessage = this.messages.find(m => m.sender === 'assistant');
                
                if (aiMessage && ticket.evaluation) {
                  // Définir le feedback sur le message
                  aiMessage.userFeedback = ticket.evaluation;
                  
                  // Ajouter le commentaire admin si présent
                  if (ticket.commentaire_admin) {
                    aiMessage.adminComment = ticket.commentaire_admin;
                  }
                }
              });
            }
            
            // Faire défiler jusqu'au bas
            setTimeout(() => this.scrollToBottom(), 100);
            return;
          }
        }
      }
      
      // Fallback: traiter les messages en format JSON ou texte
      let userMessages = this.parseJsonString(conversation.message_user);
      let botMessages = this.parseJsonString(conversation.message_bot);
      
      console.log('Messages user/bot parsés:', { userMessages, botMessages });
      
      // Créer un tableau pour traiter les messages
      let messagesArray: { user: string; bot: string; }[] = [];
      
      // Si les deux sont des tableaux après parsing
      if (Array.isArray(userMessages) && Array.isArray(botMessages)) {
        const length = Math.min(userMessages.length, botMessages.length);
        
        // Créer des objets de messages appariés
        for (let i = 0; i < length; i++) {
          messagesArray.push({
            user: userMessages[i] || '',
            bot: botMessages[i] || ''
          });
        }
      }
      // Si un seul est un tableau, traiter chaque élément et l'associer à l'autre message
      else if (Array.isArray(userMessages) && !Array.isArray(botMessages)) {
        // Si un seul message bot et multiples messages utilisateur
        if (userMessages.length > 0) {
          messagesArray.push({
            user: userMessages[0] || '',
            bot: botMessages || ''
          });
        }
      }
      else if (!Array.isArray(userMessages) && Array.isArray(botMessages)) {
        // Si un seul message utilisateur et multiples messages bot
        if (botMessages.length > 0) {
          messagesArray.push({
            user: userMessages || '',
            bot: botMessages[0] || ''
          });
        }
      }
      // Fallback pour les messages uniques (non tableaux)
      else {
        messagesArray.push({
          user: userMessages || '',
          bot: botMessages || ''
        });
      }
      
      console.log('Processed messages array:', messagesArray);
      
      // Créer et ajouter les messages à l'interface
      messagesArray.forEach((msgPair, index) => {
        // User message with cleaned content
        if (msgPair.user) {
          this.messages.push({
            id: (index * 2) + 1,
            sender: 'user',
            content: this.cleanMessageContent(msgPair.user),
            timestamp: new Date(conversation.timestamp || new Date()).toISOString(),
            likes: 0, 
            dislikes: 0,
            avatar: this.generateUserAvatar('User'),
            category: 'Historical',
            conversationId: conversation.id
          });
        }
        
        // Bot message with cleaned content
        if (msgPair.bot) {
          this.messages.push({
            id: (index * 2) + 2,
            sender: 'assistant',
            content: this.cleanMessageContent(msgPair.bot),
            timestamp: new Date(conversation.timestamp || new Date()).toISOString(),
            likes: 0,
            dislikes: 0,
            avatar: 'assets/Aicon.jpg',
            category: 'Historical',
            conversationId: conversation.id
          });
        }
      });
      
      // Ajouter les feedbacks des tickets si présents
      if (conversation.tickets && conversation.tickets.length > 0) {
        conversation.tickets.forEach(ticket => {
          // Trouver le message correspondant (pour l'instant, on prend le premier message AI)
          const aiMessage = this.messages.find(m => m.sender === 'assistant');
          
          if (aiMessage && ticket.evaluation) {
            // Définir le feedback sur le message
            aiMessage.userFeedback = ticket.evaluation;
            
            // Ajouter le commentaire admin si présent
            if (ticket.commentaire_admin) {
              aiMessage.adminComment = ticket.commentaire_admin;
            }
          }
        });
      }
      
      // Faire défiler jusqu'au bas
      setTimeout(() => this.scrollToBottom(), 100);
      
    } catch (error) {
      console.error('Error processing conversation data:', error);
      this.handleConversationLoadError();
      return;
    }
    
    // Turn off loading indicator after successfully processing the conversation
    this.isLoading = false;
    console.log('Total de messages chargés:', this.messages.length);
  }

  // Save the current conversation to backend (automatically without notifications)
  saveCurrentChat(): void {
    // Only save if we have messages and a conversation title
    if (this.messages.length > 0 && this.currentConversationTitle) {
      // Filter messages - exclude welcome messages
      const userMessages = this.messages.filter(m => m.sender === 'user');
      const aiMessages = this.messages.filter(m => 
        m.sender === 'assistant' && m.category !== 'Welcome'
      );
      
      if (userMessages.length > 0 && aiMessages.length > 0) {
        // Collect all messages content
        const userMessagesContent = userMessages.map(m => m.content);
        const aiMessagesContent = aiMessages.map(m => m.content);
        
        // Create pairs of messages (user -> assistant)
        const messagePairs = [];
        
        // Create correct message pairs (one user -> one assistant)
        for (let i = 0; i < userMessages.length; i++) {
          // Find the corresponding bot response
          const botResponse = aiMessages.find((_, index) => index === i);
          if (botResponse) {
            messagePairs.push({
              user: userMessages[i].content,
              bot: botResponse.content
            });
          }
        }
        
        // Save the conversation with all messages
        this.saveConversation(
          userMessagesContent,
          aiMessagesContent,
          messagePairs,
          this.selectedModel.value,
          this.currentConversationTitle
        );
      }
    }
  }
  
  // Save conversation to backend (silently without notifications)
  saveConversation(userMessages: string[], aiMessages: string[], messagePairs: {user: string, bot: string}[], modelType: string, title: string): void {
    // Convert arrays to JSON strings to match the service interface
    const data = {
      message_user: JSON.stringify(userMessages),
      message_bot: JSON.stringify(aiMessages),
      messages: JSON.stringify(messagePairs),
      model_type: modelType,
      title: title
    };
    
    // If we have a conversation ID, update it
    if (this.currentConversationId) {
      this.conversationService.updateConversation(this.currentConversationId, {
        message_user: data.message_user,
        message_bot: data.message_bot,
        model_type: data.model_type,
        title: data.title
      }).subscribe({
        next: (response: any) => {
          console.log('Conversation updated successfully:', response);
          this.lastSavedMessageCount = this.messages.length;
          // Remove session storage flag as it's no longer needed with auto-save
          sessionStorage.removeItem('hasPendingChat');
        },
        error: (error: any) => {
          console.error('Error updating conversation:', error);
          // Only show error notifications, not success ones
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update conversation'
          });
        }
      });
    } else {
      // Create a new conversation
      this.conversationService.saveConversation({
        message_user: data.message_user,
        message_bot: data.message_bot,
        model_type: data.model_type,
        title: data.title
      }).subscribe({
        next: (response) => {
          console.log('Conversation saved successfully:', response);
          this.currentConversationId = response.id;
          this.isNewConversation = false;
          this.lastSavedMessageCount = this.messages.length;
          // Remove session storage flag as it's no longer needed with auto-save
          sessionStorage.removeItem('hasPendingChat');
        },
        error: (error) => {
          console.error('Error saving conversation:', error);
          // Only show error notifications, not success ones
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save conversation'
          });
        }
      });
    }
  }

  // Send message to AI and get response
  sendMessage(): void {
    if (!this.newMessage.trim() && !this.selectedFile) return;
    
    // Create user message
    const userQuestion = this.newMessage.trim();
    const userMessage: Message = {
      id: this.messages.length + 1,
      sender: 'user', // Using lowercase for consistency
      content: userQuestion,
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      avatar: this.generateUserAvatar('User') // Safe default until auth service is fixed
    };
    
    // Set conversation title if this is the first message
    if (this.isNewConversation && !this.currentConversationTitle) {
      this.currentConversationTitle = this.truncateTitle(userQuestion);
    }
    
    // Add message to the list
    this.messages.push(userMessage);
    
    // Clear input field
    this.newMessage = '';
    this.selectedFile = null;
    
    // Mark that we have new messages to save
    
    // Scroll to bottom after sending message
    setTimeout(() => this.scrollToBottom(), 100);
    
    // Show loading indicator
    this.isLoading = true;
    
    // Call AI API for response
    if (this.selectedModel.available) {
      this.handleAIResponse(userQuestion);
    } else {
      // Model not available yet, show placeholder response
      setTimeout(() => {
        this.addAIResponse({
          predicted_category: 'Not Available',
          question: userQuestion
        });
      }, 1000);
    }
  }

  // Format and truncate text to create a title
  private truncateTitle(content: string): string {
    // Remove excess whitespace and line breaks
    const cleanContent = content.replace(/\s+/g, ' ').trim();
    
    // Truncate to 30 characters
    if (cleanContent.length <= 30) {
      return cleanContent;
    }
    
    // Find the last space within the first 30 characters
    const truncated = cleanContent.substring(0, 30);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > 10) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
  }
  
  // Format conversation title to handle JSON strings
  private formatConversationTitle(title: string): string {
    if (!title) return 'New Conversation';
    
    try {
      // Check if the title is a JSON string
      if (title.startsWith('["') || title.startsWith('{') || title.startsWith('[')) {
        // Try to parse the JSON string
        const parsed = JSON.parse(title);
        
        // If it's an array, take the first element
        if (Array.isArray(parsed) && parsed.length > 0) {
          return this.cleanTitle(String(parsed[0]));
        }
        
        // If it's an object or other type, convert to string
        return this.cleanTitle(String(parsed));
      }
      
      // If not a JSON string, just clean and return
      return this.cleanTitle(title);
    } catch (e) {
      // If JSON parsing fails, just return the original string cleaned up
      return this.cleanTitle(title);
    }
  }
  
  // Helper to clean titles by removing JSON syntax and escape characters
  private cleanTitle(title: string): string {
    if (!title) return 'New Conversation';
    
    // Remove any JSON syntax or escape characters
    return title
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\'/g, "'")
      .replace(/\\\"/g, '"')
      .replace(/\\\//g, '/')
      .replace(/^"(.*)"$/, '$1') // Remove surrounding quotes
      .trim();
  }

  // Handle AI response logic
  private handleAIResponse(question: string): void {
    // Show loading indicator while waiting for AI response
    this.isLoading = true;
  
    // Prepare request data
    const requestData = {
      question: question,
      model: this.selectedModel.value
    };
  
    // Call API to get AI response
    const apiUrl = environment.predictApi;
  
    console.log('Sending request to:', apiUrl, requestData);
  
    // Make the HTTP request to the AI API
    this.http.post<AIResponse>(apiUrl, requestData)
      .subscribe({
        next: (response) => {
          console.log('Received AI response:', response);
          
          // Récupérer la réponse réelle du bot (prédiction/catégorie)
          const botResponse = response.predicted_category;
          const userQuestion = response.question;
          
          // Add AI response to messages UI
          this.addAIResponse(response);
  
          // Handle saving based on whether this is a new conversation or existing one
          setTimeout(() => {
            if (this.currentConversationId) {
              // If we have an existing conversation, add this message to it
              this.addMessageToExistingConversation(userQuestion, botResponse);
            } else {
              // If this is a new conversation, save it
              this.saveCurrentChat();
            }
          }, 500);
        },
        error: (error) => {
          console.error('Error getting AI response:', error);
          
          // Add error message
          const errorMessage: Message = {
            id: this.messages.length + 1,
            sender: 'assistant',
            content: 'Sorry, I encountered an error while processing your request. Please try again later.',
            timestamp: new Date().toISOString(),
            likes: 0,
            dislikes: 0,
            avatar: 'assets/Aicon.jpg',
            category: 'Error'
          };
          
          this.messages.push(errorMessage);
          this.isLoading = false;
          
          // Scroll to bottom
          setTimeout(() => this.scrollToBottom(), 100);
          
          // Show error toast
          this.messageService.add({
            severity: 'error',
            summary: 'AI Error',
            detail: 'Failed to get AI response'
          });
        }
      });
  }
  
  // Ajouter un nouveau message à une conversation existante
  private addMessageToExistingConversation(userMessage: string, botMessage: string): void {
    console.log('Adding new message to conversation:', this.currentConversationId);
    
    this.conversationService.addMessageToConversation(
      this.currentConversationId!, 
      userMessage, 
      botMessage
    ).subscribe({
      next: (response) => {
        console.log('Message added successfully to conversation:', response);
        this.lastSavedMessageCount = this.messages.length;
      },
      error: (error) => {
        console.error('Error adding message to conversation:', error);
        // Fallback to saving the entire conversation
        this.saveCurrentChat();
      }
    });
  }

  // Add AI response to messages
  private addAIResponse(response: AIResponse): void {
    // Create AI message object with the correct response content
    const aiMessage: Message = {
      id: this.messages.length + 1,
      sender: 'assistant',
      content: response.predicted_category, // Use the predicted category as the response
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      avatar: 'assets/Aicon.jpg',
      category: response.predicted_category
    };
    
    // Add to messages array
    this.messages.push(aiMessage);
    
    // Clear loading state
    this.isLoading = false;
    
    // Scroll to show the new message
    setTimeout(() => this.scrollToBottom(), 100);
    
    // Don't trigger auto-save here - it will be handled by the calling method
    // to prevent duplicate saves
  }

  // Handle enter key to send message
  handleEnterKey(event: Event): void {
    // Cast de l'événement générique vers KeyboardEvent
    const keyEvent = event as KeyboardEvent;
    
    // Si Shift est pressé, on laisse le comportement par défaut (nouvelle ligne)
    if (keyEvent.shiftKey) {
      return;
    }
    
    // Sinon, on envoie le message et on empêche le saut de ligne
    event.preventDefault();
    this.sendMessage();
  }

  // Handle file selection
  handleFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      // Add file name to message input
      if (this.selectedFile) {
        this.newMessage += `\n[File: ${this.selectedFile.name}]`;
      }
      
      // Focus back on the input
      setTimeout(() => {
        if (this.messageInput) {
          this.messageInput.nativeElement.focus();
        }
      }, 100);
    }
  }

  // Submit feedback (like/dislike) for a message
  submitFeedback(message: Message, feedback: 'jaime' | 'jenaimepas'): void {
    // Check if already has the same feedback
    if (message.userFeedback === feedback) {
      return;
    }
    
    // Update feedback in UI
    message.userFeedback = feedback;
    
    // If no conversation ID, save first
    if (!this.currentConversationId) {
      this.saveCurrentChat();
      return;
    }
    
    // Submit feedback to backend if we have a conversation ID
    if (this.currentConversationId) {
      // Find the user message that corresponds to this AI response
      // We'll look for the user message that came before this AI message
      let userMessageContent = '';
      const messageIndex = this.messages.findIndex(m => m === message);
      if (messageIndex > 0 && this.messages[messageIndex - 1].sender === 'user') {
        userMessageContent = this.messages[messageIndex - 1].content || '';
      } else {
        // Fallback to any user message if we can't find the corresponding one
        userMessageContent = this.messages.find(m => m.sender === 'user')?.content || '';
      }
      
      // Get AI message content for context
      const aiMessageContent = message.content || '';
      
      // Call the service with the required parameters
      this.conversationService.createTicket(
        this.currentConversationId,
        feedback,
        userMessageContent,
        aiMessageContent
      ).subscribe({
        next: (response) => {
          console.log('Feedback submitted successfully:', response);
          
          // Update the message with the evaluation status
          message.userFeedback = feedback;
          
          // Store the ticket ID for reference
          message.ticketId = response.id;
          
          // Show success notification
          this.messageService.add({
            severity: 'success',
            summary: 'Feedback Submitted',
            detail: 'Thank you for your feedback!'
          });
        },
        error: (error) => {
          console.error('Error submitting feedback:', error);
          // Revert UI change on error
          message.userFeedback = null;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to submit feedback'
          });
        }
      });
    }
  }
}
