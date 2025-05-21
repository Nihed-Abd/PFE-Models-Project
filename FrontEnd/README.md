# AI Chat Models - Frontend

This is the Angular frontend for the AI Chat Models application, providing a modern and responsive user interface for interacting with AI models.

## Step-by-Step Setup Guide

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Angular CLI (v19.0.6)

### 1. Environment Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/yourusername/ai-chat-models.git
   cd ai-chat-models/FrontEnd
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Install Angular CLI** (if not already installed):
   ```bash
   npm install -g @angular/cli
   ```

### 2. Configuration

1. **Configure API connection**:
   - Open `src/environments/environment.ts`
   - Ensure the API URL points to your backend:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:8000/api'
   };
   ```

2. **Configure environment.prod.ts** for production builds:
   - Open `src/environments/environment.prod.ts`
   - Update with your production API URL

### 3. Running the Application

1. **Start the development server**:
   ```bash
   ng serve
   ```
   The application will be available at `http://localhost:4200`

2. **Start with specific configuration**:
   ```bash
   ng serve --port 4201 --open
   ```
   This will run the app on port 4201 and automatically open it in your browser

### 4. Building for Production

1. **Create a production build**:
   ```bash
   ng build --configuration production
   ```
   The build artifacts will be stored in the `dist/` directory

2. **Testing the production build locally**:
   - Install a simple HTTP server:
   ```bash
   npm install -g http-server
   ```
   - Serve the production build:
   ```bash
   http-server dist/sakai19
   ```

### 5. Troubleshooting

- **Clear npm cache** if you encounter package issues:
  ```bash
  npm cache clean --force
  ```

- **Update Angular dependencies**:
  ```bash
  ng update
  ```

- **Check for errors in browser console** (F12 in most browsers)

## Application Structure

- `src/app/components/` - Reusable UI components
- `src/app/pages/` - Application pages and views
- `src/app/services/` - API services and data providers
- `src/app/models/` - TypeScript interfaces and models
- `src/assets/` - Static assets like images and styles

## Features

- **User Authentication**: Login, registration, and profile management
- **Chat Interface**: Interactive chat with AI models
- **Conversation History**: View and manage past conversations
- **Responsive Design**: Works on desktop and mobile devices
- **Theme Customization**: Light and dark mode support

## Development Tools

### Code Scaffolding

Generate new components, services, etc. using Angular CLI:

```bash
ng generate component component-name
ng generate service service-name
```

### Running Tests

```bash
ng test              # Run unit tests
ng e2e               # Run end-to-end tests
```

## Additional Resources

- [Angular Documentation](https://angular.dev/)
- [PrimeNG Documentation](https://primeng.org/)
- [Angular CLI Reference](https://angular.dev/tools/cli)

## License

This application is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
