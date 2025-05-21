# AI Chat Models Application

A comprehensive chat application with AI model integration, user management, and conversation history tracking.

## Project Structure

The project consists of three main components:

1. **Frontend**: Angular application with PrimeNG UI components
2. **Backend**: Laravel PHP API server
3. **AI Model**: Python-based AI model service

## Prerequisites

- Node.js (v14+) and npm (v6+)
- PHP (v8.0+) and Composer
- Python (v3.8+) and pip
- MySQL or MariaDB database
- Git

## Installation and Setup

### Clone the Repository

```bash
git clone https://github.com/yourusername/ai-chat-models.git
cd ai-chat-models
```

### Backend Setup (Laravel)

1. Navigate to the backend directory:

```bash
cd BackEnd
```

2. Install PHP dependencies:

```bash
composer install
```

3. Create and configure the environment file:

```bash
cp .env.example .env
```

4. Edit the `.env` file with your database credentials:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_database_username
DB_PASSWORD=your_database_password
```

5. Generate application key:

```bash
php artisan key:generate
```

6. Run database migrations and seed the database:

```bash
php artisan migrate --seed
```

7. Create a symbolic link for storage:

```bash
php artisan storage:link
```

8. Start the Laravel development server:

```bash
php artisan serve
```

The backend API will be available at `http://localhost:8000`.

### Frontend Setup (Angular)

1. Navigate to the frontend directory:

```bash
cd ../FrontEnd
```

2. Install Node.js dependencies:

```bash
npm install
```

3. Configure the environment file:

Open `src/environments/environment.ts` and ensure the API URL points to your backend:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
```

4. Start the Angular development server:

```bash
ng serve
```

The frontend application will be available at `http://localhost:4200`.

### AI Model Setup (Python)

1. Navigate to the AI model directory:

```bash
cd ../AiModel
```

2. Create and activate a virtual environment:

```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

4. Start the AI model server:

```bash
python app.py
```

The AI model service will be available at `http://localhost:5000`.

## Usage

1. Open your browser and navigate to `http://localhost:4200`
2. Log in with the default admin credentials:
   - Email: admin@example.com
   - Password: password
3. Explore the application features:
   - Start new chat conversations
   - View chat history
   - Manage users and permissions
   - Provide feedback on AI responses

## Features

- **User Authentication**: Secure login, registration, and user management
- **AI Chat Interface**: Interactive chat with AI models
- **Conversation History**: View and manage past conversations
- **User Management**: Admin panel for managing users and roles
- **Feedback System**: Provide feedback on AI responses
- **Responsive Design**: Works on desktop and mobile devices

## Development

### Frontend Development

The frontend is built with Angular and uses PrimeNG components for the UI. Key files and directories:

- `src/app/pages`: Contains the main application pages
- `src/app/layout`: Layout components and navigation
- `src/app/services`: Angular services for API communication

To build the production version:

```bash
ng build --prod
```

### Backend Development

The backend is built with Laravel. Key files and directories:

- `app/Http/Controllers`: API controllers
- `app/Models`: Database models
- `routes/api.php`: API route definitions

### AI Model Development

The AI model service is built with Python. Key files:

- `app.py`: Main application file
- `model.py`: AI model implementation

## Deployment

### Frontend Deployment

1. Build the production version:

```bash
cd FrontEnd
ng build --prod
```

2. Deploy the contents of the `dist` directory to your web server.

### Backend Deployment

1. Set up a production web server (Apache, Nginx) with PHP support.
2. Configure the web server to point to the `public` directory.
3. Set up proper environment variables for production.

### AI Model Deployment

1. Set up a Python environment on your server.
2. Install dependencies from `requirements.txt`.
3. Configure a production WSGI server (Gunicorn, uWSGI).

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Angular team for the frontend framework
- Laravel team for the backend framework
- PrimeNG for the UI components
- AI model developers and contributors
