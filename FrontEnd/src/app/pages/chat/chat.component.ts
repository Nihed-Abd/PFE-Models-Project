import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextarea } from 'primeng/inputtextarea';
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ConversationService } from '../../services/conversation.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface Message {
  id: number;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  avatar?: string;
  likes?: number;
  dislikes?: number;
  userFeedback?: 'jaime' | 'jenaimepas' | null;
  adminComment?: string;
  category?: string;
  conversationId?: number;
}

interface AIModel {
  name: string;
  value: string;
  available: boolean;
  description?: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule, 
    InputTextarea, 
    DividerModule, 
    AvatarModule,
    CardModule,
    DropdownModule,
    ToastModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  providers: [MessageService]
})
export class ChatComponent implements OnInit {
  @ViewChild('messageInput') messageInput!: ElementRef;
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  // Chat UI state
  messages: Message[] = [];
  newMessage: string = '';
  isLoading: boolean = false;
  loadingMessages: boolean = false;
  selectedFile: File | null = null;
  
  // Conversation state
  conversations: any[] = [];
  currentConversationId: number | null = null;
  currentConversationTitle: string = '';
  isNewConversation: boolean = true;
  lastSavedMessageCount: number = 0;
  
  // Evaluation statistics
  evaluationStats: {
    total: number,
    jaime: number,
    jenaimepas: number,
    has_comments: boolean
  } | null = null;
  
  // Model selection
  availableModels: AIModel[] = [
    { 
      name: 'GPT-2', 
      value: 'gpt2', 
      available: true, 
      description: 'Efficient language model for text generation' 
    },
    { 
      name: 'LLAMA', 
      value: 'llama', 
      available: true, 
      description: 'Advanced language model with document processing capabilities' 
    }
  ];
  selectedModel: AIModel = this.availableModels[0]; // Default to GPT-2

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private conversationService: ConversationService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Load chat history for the sidebar
    this.loadChatHistory();
    
    // Check if we have a conversation ID from route params
    this.route.paramMap.subscribe(params => {
      const conversationId = params.get('id');
      if (conversationId) {
        // Load existing conversation
        this.loadConversation(parseInt(conversationId, 10));
      } else {
        // Load initial welcome message
        this.loadWelcomeMessage();
      }
    });
  }

  // Load the chat history for the sidebar
  loadChatHistory(): void {
    this.conversationService.getChatHistory().subscribe({
      next: (conversations) => {
        this.conversations = conversations;
      },
      error: (error) => {
        console.error('Error loading chat history:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load chat history'
        });
      }
    });
  }
  
  // Load an existing conversation by ID
  loadConversation(conversationId: number): void {
    this.isLoading = true;
    this.currentConversationId = conversationId;
    this.isNewConversation = false;
    
    this.conversationService.getConversation(conversationId).subscribe({
      next: (conversation) => {
        console.log('Loaded conversation:', conversation);
        
        // Clear existing messages
        this.messages = [];
        this.loadingMessages = true;
        
        // Set conversation title
        this.currentConversationTitle = conversation.title || 'Untitled Conversation';
        
        // Set the model type
        const modelType = conversation.model_type || 'gpt2';
        this.selectedModel = this.availableModels.find(m => m.value === modelType) || this.availableModels[0];
        
        // If we have structured messages, use them
        if (conversation.messages && Array.isArray(conversation.messages)) {
          this.messages = conversation.messages.map((msg: any, index: number) => ({
            id: index + 1,
            sender: msg.sender,
            content: msg.content,
            timestamp: msg.timestamp || new Date().toISOString(),
            avatar: msg.sender === 'user' ? this.generateUserAvatar('User') : 'assets/images/ai-avatar.png',
            userFeedback: msg.userFeedback || null,
            adminComment: msg.adminComment || null
          }));
          
          this.loadingMessages = false;
          this.isLoading = false;
          
          // Scroll to bottom
          setTimeout(() => this.scrollToBottom(), 100);
          
          // Load evaluation statistics
          this.loadEvaluationStats(conversationId);
          return;
        }
        
        // Otherwise, create messages from the conversation data
        // User message
        const userMessage: Message = {
          id: 1,
          sender: 'user',
          content: conversation.message_user,
          timestamp: conversation.timestamp || new Date().toISOString(),
          avatar: this.generateUserAvatar('User')
        };
        
        // AI message
        const aiMessage: Message = {
          id: 2,
          sender: 'assistant',
          content: conversation.message_bot,
          timestamp: conversation.timestamp || new Date().toISOString(),
          avatar: 'assets/images/ai-avatar.png'
        };
        
        // Add messages to UI
        this.messages.push(userMessage, aiMessage);
        this.loadingMessages = false;
        this.isLoading = false;
        
        // Set the last saved message count
        this.lastSavedMessageCount = this.messages.length;
        
        // Load evaluation statistics
        this.loadEvaluationStats(conversationId);
        
        // Scroll to bottom
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => {
        console.error('Error loading conversation:', err);
        this.isLoading = false;
        this.loadingMessages = false;
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load conversation'
        });
        
        // Reset to new conversation
        this.currentConversationId = null;
        this.isNewConversation = true;
        this.loadWelcomeMessage();
      }
    });
  }
  
  // Load evaluation statistics for the current conversation
  loadEvaluationStats(conversationId: number): void {
    if (!conversationId) return;
    
    this.conversationService.getConversationEvaluations(conversationId).subscribe({
      next: (response) => {
        console.log('Loaded evaluation stats:', response);
        this.evaluationStats = response.stats;
        
        // Update messages with evaluation data
        if (response.tickets && response.tickets.length > 0) {
          // For each ticket, find the corresponding AI message and update it
          response.tickets.forEach(ticket => {
            // Find the AI message that matches this ticket's response
            const aiMessage = this.messages.find(m => 
              m.sender === 'assistant' && 
              m.content.includes(ticket.response.substring(0, 50))
            );
            
            if (aiMessage) {
              aiMessage.userFeedback = ticket.evaluation;
              aiMessage.adminComment = ticket.commentaire_admin || undefined;
            }
          });
        }
      },
      error: (error) => {
        console.error('Error loading evaluation stats:', error);
        this.evaluationStats = null;
      }
    });
  }
  
  // Load welcome message for new conversation
  loadWelcomeMessage(): void {
    this.messages = [];
    this.currentConversationId = null;
    this.currentConversationTitle = '';
    this.isNewConversation = true;
    
    // Add welcome message
    this.messages.push({
      id: 1,
      sender: 'assistant',
      content: 'Hello! I am your AI assistant. How can I help you today?',
      timestamp: new Date().toISOString(),
      avatar: 'assets/Aicon.jpg'
    });
  }
  
  // Send message to AI and get response
  sendMessage(): void {
    if (!this.newMessage.trim() && !this.selectedFile) {
      return; // Don't send empty messages
    }
    
    // Add user message to chat
    const userMessage: Message = {
      id: this.messages.length + 1,
      sender: 'user',
      content: this.newMessage.trim(),
      timestamp: new Date().toISOString(),
      avatar: this.generateUserAvatar('User')
    };
    
    this.messages.push(userMessage);
    this.newMessage = ''; // Clear input field
    this.isLoading = true;
    
    // Scroll to bottom
    setTimeout(() => this.scrollToBottom(), 100);
    
    // Determine API endpoint based on selected model
    let apiEndpoint = '';
    let requestData: any = {};
    
    if (this.selectedModel.value === 'gpt2') {
      // Use the /predict endpoint for GPT-2 model
      apiEndpoint = environment.predictApi;
      requestData = { prompt: userMessage.content, model: 'gpt2' };
      console.log('Sending request to:', apiEndpoint, 'with data:', requestData);
    } else if (this.selectedModel.value === 'llama') {
      apiEndpoint = `${environment.apiUrl}/chat`;
      requestData = { message: userMessage.content };
      
      // Add file if selected (for LLAMA model)
      if (this.selectedFile) {
        const formData = new FormData();
        formData.append('file', this.selectedFile);
        formData.append('message', userMessage.content || 'Please analyze this document');
        
        // First upload the file
        this.http.post(`${environment.apiUrl}/upload-file`, formData).subscribe({
          next: (fileResponse: any) => {
            console.log('File uploaded successfully:', fileResponse);
            
            // Then send the message with file reference
            requestData.file_id = fileResponse.file_id;
            this.sendMessageToAI(apiEndpoint, requestData, userMessage);
          },
          error: (error) => {
            console.error('Error uploading file:', error);
            this.isLoading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to upload file. Please try again.'
            });
          }
        });
        
        return; // Exit early as we're handling the API call in the file upload callback
      }
    }
    
    // Send message to AI (if no file upload is needed)
    this.sendMessageToAI(apiEndpoint, requestData, userMessage);
  }
  
  // Helper method to send message to AI API
  private sendMessageToAI(endpoint: string, data: any, userMessage: Message): void {
    this.http.post(endpoint, data).subscribe({
      next: (response: any) => {
        console.log('AI response:', response);
        
        // Create AI message - handle different response formats from different models
        const aiMessage: Message = {
          id: this.messages.length + 1,
          sender: 'assistant',
          content: response.response || response.message || response.generated_text || 'Sorry, I could not generate a response.',
          timestamp: new Date().toISOString(),
          avatar: 'assets/images/ai-avatar.png',
          likes: 0,
          dislikes: 0,
          userFeedback: null
        };
        
        // Add AI message to chat
        this.messages.push(aiMessage);
        this.isLoading = false;
        
        // Scroll to bottom
        setTimeout(() => this.scrollToBottom(), 100);
        
        // Auto-save conversation
        this.autoSaveConversation(userMessage, aiMessage);
      },
      error: (error) => {
        console.error('Error getting AI response:', error);
        this.isLoading = false;
        
        // Add error message to chat
        const errorMessage: Message = {
          id: this.messages.length + 1,
          sender: 'assistant',
          content: 'Sorry, an error occurred while processing your request. Please try again.',
          timestamp: new Date().toISOString(),
          avatar: 'assets/images/ai-avatar.png'
        };
        
        this.messages.push(errorMessage);
        
        // Show error toast
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to get AI response'
        });
        
        // Scroll to bottom
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }
  
  // Auto-save conversation after each message
  private autoSaveConversation(userMessage: Message, aiMessage: Message): void {
    // Only save if we have new messages since last save
    if (this.messages.length <= this.lastSavedMessageCount) {
      return;
    }
    
    if (this.isNewConversation) {
      // Generate a title from the first user message
      const title = this.truncateTitle(userMessage.content);
      this.currentConversationTitle = title;
      
      // Save as new conversation
      const data = {
        message_user: userMessage.content,
        message_bot: aiMessage.content,
        model_type: this.selectedModel.value,
        title: title
      };
      
      this.conversationService.saveConversation(data).subscribe({
        next: (response) => {
          console.log('New conversation saved:', response);
          this.currentConversationId = response.id;
          this.isNewConversation = false;
          this.lastSavedMessageCount = this.messages.length;
          
          // Update URL without reloading
          this.router.navigate(['/chat', this.currentConversationId], { replaceUrl: true });
          
          // Refresh chat history
          this.loadChatHistory();
        },
        error: (error) => {
          console.error('Error saving new conversation:', error);
        }
      });
    } else {
      // Update existing conversation by adding new messages
      this.conversationService.addMessageToConversation(
        this.currentConversationId!,
        userMessage.content,
        aiMessage.content
      ).subscribe({
        next: (response) => {
          console.log('Messages added to conversation:', response);
          this.lastSavedMessageCount = this.messages.length;
          
          // Refresh chat history
          this.loadChatHistory();
        },
        error: (error) => {
          console.error('Error updating conversation with new messages:', error);
        }
      });
    }
  }
  
  // Handle model change
  onModelChange(event: any): void {
    // Update selected model
    console.log('Model changed to:', this.selectedModel.value);
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

  // Create a random avatar for the user
  generateUserAvatar(name: string): string {
    // Generate a color based on the name
    const colors = ['amber', 'blue', 'cyan', 'green', 'indigo', 'orange', 'pink', 'purple', 'red', 'teal'];
    const colorIndex = name.length % colors.length;
    return `assets/avatars/${colors[colorIndex]}.png`;
  }
  
  // Truncate the title for display
  truncateTitle(text: string, maxLength: number = 30): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Scroll to the bottom of the chat
  scrollToBottom(): void {
    try {
      const container = this.chatContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }
  
  // Create a new conversation
  newConversation(): void {
    this.router.navigate(['/chat']);
  }
  
  // Select a conversation from history
  selectConversation(conversation: any): void {
    this.router.navigate(['/chat', conversation.id]);
  }
  
  // Save conversation to backend - this is now private as it's only called by autoSaveConversation
  private saveConversation(userMessage: Message, aiMessage: Message, modelType: string, title: string): void {
    console.log('Saving conversation with title:', title);
    
    const data = {
      message_user: userMessage.content,
      message_bot: aiMessage.content,
      model_type: modelType,
      title: title
    };
    
    // If we have a conversation ID, update it
    if (this.currentConversationId) {
      console.log('Updating existing conversation:', this.currentConversationId);
      this.conversationService.updateConversation(this.currentConversationId, data).subscribe({
        next: (response: any) => {
          console.log('Conversation updated successfully:', response);
          this.lastSavedMessageCount = this.messages.length;
          
          // Refresh the chat history
          this.loadChatHistory();
        },
        error: (error: any) => {
          console.error('Error updating conversation:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update conversation'
          });
        }
      });
    } else {
      // Create a new conversation
      console.log('Creating new conversation');
      this.conversationService.saveConversation(data).subscribe({
        next: (response) => {
          console.log('Conversation saved successfully:', response);
          this.currentConversationId = response.id;
          this.isNewConversation = false;
          this.lastSavedMessageCount = this.messages.length;
          
          // Update URL without reloading
          this.router.navigate(['/chat', this.currentConversationId], { replaceUrl: true });
          
          // Refresh the chat history
          this.loadChatHistory();
        },
        error: (error) => {
          console.error('Error saving conversation:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save conversation'
          });
        }
      });
    }
  }
  
  // Submit user feedback on AI response
  submitFeedback(message: Message, feedback: 'jaime' | 'jenaimepas'): void {
    // Check if already has the same feedback
    if (message.userFeedback === feedback) {
      return;
    }
    
    // Update feedback in UI
    message.userFeedback = feedback;
    
    // Submit feedback to backend if we have a conversation ID
    if (this.currentConversationId) {
      // Find the user message that corresponds to this AI response
      const userMessageIndex = this.messages.findIndex(m => m === message) - 1;
      const userMessage = userMessageIndex >= 0 ? this.messages[userMessageIndex].content : '';
      
      // Get AI message content for context
      const aiMessageContent = message.content || '';
      
      // Show loading indicator
      this.messageService.add({
        severity: 'info',
        summary: 'Processing',
        detail: 'Submitting your feedback...'
      });
      
      // Call the service with the required parameters
      this.conversationService.createTicket(
        this.currentConversationId,
        feedback,
        userMessage,
        aiMessageContent
      ).subscribe({
        next: (response) => {
          console.log('Feedback submitted successfully:', response);
          
          // Update the message with admin comment if available
          if (response.commentaire_admin) {
            message.adminComment = response.commentaire_admin;
          }
          
          // Set the message ID to match the ticket ID for future reference
          message.id = response.id;
          
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Your feedback has been submitted'
          });
          
          // Refresh conversation history to show evaluation status
          this.loadChatHistory();
        },
        error: (error) => {
          console.error('Error submitting feedback:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to submit feedback'
          });
          
          // Revert UI change on error
          message.userFeedback = null;
        }
      });
    } else {
      // If no conversation ID yet, we need to save the conversation first
      this.messageService.add({
        severity: 'info',
        summary: 'Info',
        detail: 'Saving conversation before submitting feedback...'
      });
      
      // Find the first user message to use as title
      const firstUserMessage = this.messages.find(m => m.sender === 'user');
      if (firstUserMessage) {
        // Auto-save the conversation first
        this.autoSaveConversation(firstUserMessage, message);
        
        // Set a timeout to retry feedback submission after saving
        setTimeout(() => {
          if (this.currentConversationId) {
            this.submitFeedback(message, feedback);
          }
        }, 1000);
      }
    }
  }
}
