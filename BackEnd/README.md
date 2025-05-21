# AI Chat Models - Backend

This is the Laravel backend for the AI Chat Models application, providing API endpoints for user management, authentication, and AI model integration.

## Step-by-Step Setup Guide

### Prerequisites

- PHP 8.0 or higher
- Composer
- MySQL or MariaDB database
- Web server (Apache/Nginx) or PHP's built-in server

### 1. Environment Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/yourusername/ai-chat-models.git
   cd ai-chat-models/BackEnd
   ```

2. **Install PHP dependencies**:
   ```bash
   composer install
   ```

3. **Create and configure environment file**:
   ```bash
   cp .env.example .env
   ```

4. **Generate application key**:
   ```bash
   php artisan key:generate
   ```

5. **Configure database connection** in the `.env` file:
   ```
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=your_database_name
   DB_USERNAME=your_database_username
   DB_PASSWORD=your_database_password
   ```

### 2. Database Setup

1. **Create the database** (using MySQL command line or a tool like phpMyAdmin)

2. **Run migrations and seed the database**:
   ```bash
   php artisan migrate --seed
   ```

3. **Create storage link** for file uploads:
   ```bash
   php artisan storage:link
   ```

### 3. Configure API Connections

1. **Set up AI Model connection** in the `.env` file:
   ```
   AI_MODEL_API_URL=http://localhost:5000
   ```

2. **Configure CORS** if needed in `config/cors.php`

### 4. Running the Application

1. **Start the Laravel development server**:
   ```bash
   php artisan serve
   ```
   The API will be available at `http://localhost:8000`

2. **Alternative: Use a production web server** (Apache/Nginx)
   - Configure your web server to point to the `public` directory
   - Ensure proper permissions are set

### 5. Testing the API

1. **Run built-in tests**:
   ```bash
   php artisan test
   ```

2. **Manual API testing**:
   - Use Postman or another API testing tool
   - Default API endpoints:
     - Authentication: `/api/auth/login`, `/api/auth/register`
     - User Management: `/api/users`
     - Chat: `/api/conversations`, `/api/messages`

### 6. Troubleshooting

- **Check logs** in `storage/logs/laravel.log`
- **Clear cache** if you encounter issues:
  ```bash
  php artisan cache:clear
  php artisan config:clear
  php artisan route:clear
  ```

## API Documentation

The API provides endpoints for:
- User authentication and management
- Chat conversations and messages
- AI model integration
- User feedback and preferences

For detailed API documentation, refer to the API documentation or use the following command to generate it:
```bash
php artisan l5-swagger:generate
```

## Production Deployment

For production deployment:
1. Set `APP_ENV=production` and `APP_DEBUG=false` in `.env`
2. Optimize the application:
   ```bash
   php artisan optimize
   ```
3. Ensure proper server configurations and security measures

## License

This application is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
