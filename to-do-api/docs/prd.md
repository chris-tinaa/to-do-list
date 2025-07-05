# Product Requirements Document (PRD)
## To-Do List API with Bearer Token Authentication

### 1. Overview

**Product Name:** To-Do List API with Authentication  
**Version:** 2.0  
**Date:** July 5, 2025  
**Author:** chris-tinaa  

### 2. Product Vision

Build a secure, robust RESTful API that enables authenticated users to manage multiple task lists with full CRUD operations, deadline management, task completion tracking, and advanced filtering capabilities. The API implements Bearer Token authentication to ensure secure access and user data isolation.

### 3. Core Requirements

#### 3.1 Authentication & Security
- **User Registration:** Allow new users to create accounts
- **User Login:** Authenticate users and provide Bearer tokens
- **Bearer Token Protection:** Secure all core API endpoints with token validation
- **User Data Isolation:** Ensure users can only access their own lists and tasks
- **Token Management:** Handle token expiration and refresh mechanisms

#### 3.2 List Management
- **Multiple Lists Support:** Authenticated users can create and manage multiple task lists
- **List Operations:** Full CRUD operations (Create, Read, Update, Delete) for user's lists
- **List Display:** Ability to retrieve user's lists along with their associated tasks

#### 3.3 Task Management
- **Task Operations:** Full CRUD operations for tasks within user's lists
- **Task Assignment:** Ability to add tasks to user's specific lists
- **Task Completion:** Mark tasks as completed/incomplete
- **Deadline Management:** Set and update deadlines for tasks

#### 3.4 Advanced Features
- **Weekly Due Tasks:** Filter and retrieve user's tasks due within the current week
- **Deadline Sorting:** Order user's tasks by deadline (ascending/descending)
- **Task Status Tracking:** Track completion status of user's tasks

### 4. Functional Requirements

#### 4.1 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register a new user account | No |
| POST | `/api/auth/login` | Login and receive bearer token | No |
| POST | `/api/auth/refresh` | Refresh an expired token | Yes (Refresh Token) |
| POST | `/api/auth/logout` | Invalidate current token | Yes |
| GET | `/api/auth/me` | Get current user profile | Yes |
| PUT | `/api/auth/me` | Update user profile | Yes |

#### 4.2 List Endpoints (Protected)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/lists` | Retrieve user's lists with their tasks | Yes |
| GET | `/api/lists/{id}` | Retrieve a specific user's list with tasks | Yes |
| POST | `/api/lists` | Create a new list for user | Yes |
| PUT | `/api/lists/{id}` | Update user's existing list | Yes |
| DELETE | `/api/lists/{id}` | Delete user's list and all its tasks | Yes |

#### 4.3 Task Endpoints (Protected)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/lists/{listId}/tasks` | Get all tasks in user's specific list | Yes |
| GET | `/api/tasks/{id}` | Get a specific task owned by user | Yes |
| POST | `/api/lists/{listId}/tasks` | Add a new task to user's list | Yes |
| PUT | `/api/tasks/{id}` | Update user's existing task | Yes |
| DELETE | `/api/tasks/{id}` | Delete user's task | Yes |
| PATCH | `/api/tasks/{id}/complete` | Mark user's task as completed | Yes |
| PATCH | `/api/tasks/{id}/incomplete` | Mark user's task as incomplete | Yes |

#### 4.4 Advanced Query Endpoints (Protected)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/tasks/due-this-week` | Get user's tasks due within current week | Yes |
| GET | `/api/tasks?sort=deadline&order=asc` | Get user's tasks ordered by deadline | Yes |
| GET | `/api/lists/{listId}/tasks?sort=deadline` | Get tasks in user's list ordered by deadline | Yes |

### 5. Data Models

#### 5.1 User Model
```json
{
  "id": "string (UUID)",
  "email": "string (required, unique, valid email)",
  "password": "string (required, hashed, min 8 chars)",
  "firstName": "string (required, max 50 chars)",
  "lastName": "string (required, max 50 chars)",
  "isActive": "boolean (default: true)",
  "createdAt": "datetime (ISO 8601)",
  "updatedAt": "datetime (ISO 8601)",
  "lastLoginAt": "datetime (ISO 8601, nullable)"
}
```

#### 5.2 List Model (Updated)
```json
{
  "id": "string (UUID)",
  "userId": "string (UUID, foreign key)",
  "name": "string (required, max 100 chars)",
  "description": "string (optional, max 500 chars)",
  "createdAt": "datetime (ISO 8601)",
  "updatedAt": "datetime (ISO 8601)",
  "taskCount": "integer (computed)",
  "completedTaskCount": "integer (computed)"
}
```

#### 5.3 Task Model (Updated)
```json
{
  "id": "string (UUID)",
  "listId": "string (UUID, foreign key)",
  "userId": "string (UUID, foreign key)",
  "title": "string (required, max 200 chars)",
  "description": "string (optional, max 1000 chars)",
  "deadline": "datetime (ISO 8601, optional)",
  "isCompleted": "boolean (default: false)",
  "priority": "enum (low, medium, high, optional)",
  "createdAt": "datetime (ISO 8601)",
  "updatedAt": "datetime (ISO 8601)",
  "completedAt": "datetime (ISO 8601, nullable)"
}
```

#### 5.4 Token Model
```json
{
  "id": "string (UUID)",
  "userId": "string (UUID, foreign key)",
  "accessToken": "string (JWT)",
  "refreshToken": "string (UUID)",
  "accessTokenExpiresAt": "datetime (ISO 8601)",
  "refreshTokenExpiresAt": "datetime (ISO 8601)",
  "isRevoked": "boolean (default: false)",
  "createdAt": "datetime (ISO 8601)",
  "revokedAt": "datetime (ISO 8601, nullable)"
}
```

### 6. Authentication Flow

#### 6.1 Registration Flow
1. User submits registration data (email, password, firstName, lastName)
2. Server validates input (email format, password strength, unique email)
3. Password is hashed using bcrypt
4. User record is created in database
5. Response returns success confirmation (no automatic login)

#### 6.2 Login Flow
1. User submits credentials (email, password)
2. Server validates credentials against database
3. If valid, generate JWT access token and refresh token
4. Store token information in database
5. Return tokens to client with expiration times

#### 6.3 Protected Endpoint Access Flow
1. Client includes Bearer token in Authorization header
2. Server validates token signature and expiration
3. Server extracts user ID from token payload
4. Server ensures user owns requested resources
5. Process request with user context

#### 6.4 Token Refresh Flow
1. Client detects expired access token
2. Client sends refresh token to `/api/auth/refresh`
3. Server validates refresh token
4. If valid, generate new access token
5. Return new access token to client

### 7. Security Requirements

#### 7.1 Password Security
- Minimum 8 characters
- Must contain: uppercase, lowercase, number, special character
- Passwords hashed with bcrypt (cost factor 12)
- No password storage in plain text

#### 7.2 Token Security
- JWT access tokens signed with RS256 algorithm
- Access token expiration: 1 hour
- Refresh token expiration: 7 days
- Secure token storage recommendations for clients
- Token blacklisting on logout

#### 7.3 API Security
- Rate limiting: 100 requests per minute per IP
- Request size limits: 1MB maximum
- CORS configuration for frontend domains
- HTTPS enforcement in production
- Input validation and sanitization
- SQL injection prevention

#### 7.4 Data Security
- User data isolation (users can only access own data)
- Soft delete for audit trails
- Regular security audits
- Secure environment variable management

### 8. API Response Formats

#### 8.1 Success Response Format
```json
{
  "success": true,
  "data": {},
  "message": "string (optional)"
}
```

#### 8.2 Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  }
}
```

#### 8.3 Authentication Error Responses
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "details": {
      "tokenExpired": true
    }
  }
}
```

### 9. Detailed Use Cases

#### 9.1 Authentication Use Cases

**UC-001: User Registration**
- **Input:** Email, password, firstName, lastName
- **Process:** Validate input, check email uniqueness, hash password, create user
- **Output:** Success confirmation with user ID

**UC-002: User Login**
- **Input:** Email, password
- **Process:** Validate credentials, generate tokens, store session
- **Output:** Access token, refresh token, user profile

**UC-003: Token Validation**
- **Input:** Bearer token from Authorization header
- **Process:** Verify signature, check expiration, extract user ID
- **Output:** User context for request processing

**UC-004: Token Refresh**
- **Input:** Refresh token
- **Process:** Validate refresh token, generate new access token
- **Output:** New access token with expiration

#### 9.2 Protected Resource Use Cases

**UC-005: Create User List**
- **Input:** Bearer token, list name, optional description
- **Process:** Validate token, extract user ID, create list for user
- **Output:** Created list object

**UC-006: Get User's Lists**
- **Input:** Bearer token
- **Process:** Validate token, extract user ID, fetch user's lists only
- **Output:** Array of user's lists with task counts

**UC-007: Add Task to User's List**
- **Input:** Bearer token, list ID, task details
- **Process:** Validate token, verify user owns list, create task
- **Output:** Created task object

### 10. API Examples

#### 10.1 User Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "chris@example.com",
  "password": "SecurePass123!",
  "firstName": "Chris",
  "lastName": "Tina"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "chris@example.com",
    "firstName": "Chris",
    "lastName": "Tina",
    "createdAt": "2025-07-05T08:33:16Z"
  },
  "message": "User registered successfully"
}
```

#### 10.2 User Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "chris@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
    "accessTokenExpiresAt": "2025-07-05T09:33:16Z",
    "refreshTokenExpiresAt": "2025-07-12T08:33:16Z",
    "user": {
      "id": "user-123",
      "email": "chris@example.com",
      "firstName": "Chris",
      "lastName": "Tina"
    }
  }
}
```

#### 10.3 Create Protected List
```http
POST /api/lists
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Work Tasks",
  "description": "Tasks related to work projects"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "list-456",
    "userId": "user-123",
    "name": "Work Tasks",
    "description": "Tasks related to work projects",
    "createdAt": "2025-07-05T08:33:16Z",
    "updatedAt": "2025-07-05T08:33:16Z",
    "taskCount": 0,
    "completedTaskCount": 0
  }
}
```

#### 10.4 Unauthorized Access Response
```http
GET /api/lists
# Missing Authorization header
```

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authorization header is required"
  }
}
```

### 11. JWT Token Structure

#### 11.1 Access Token Payload
```json
{
  "sub": "user-123",
  "email": "chris@example.com",
  "iat": 1720166396,
  "exp": 1720169996,
  "tokenType": "access"
}
```

#### 11.2 Token Headers
```json
{
  "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 12. Error Handling

#### 12.1 Authentication Errors
- `INVALID_CREDENTIALS`: Wrong email/password combination
- `USER_NOT_FOUND`: Email not registered
- `EMAIL_ALREADY_EXISTS`: Registration with existing email
- `WEAK_PASSWORD`: Password doesn't meet requirements
- `INVALID_TOKEN`: Malformed or invalid JWT
- `TOKEN_EXPIRED`: Access token has expired
- `TOKEN_REVOKED`: Token has been blacklisted

#### 12.2 Authorization Errors
- `INSUFFICIENT_PERMISSIONS`: User doesn't own requested resource
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist for user
- `LIST_NOT_OWNED`: User trying to access another user's list
- `TASK_NOT_OWNED`: User trying to access another user's task

### 13. Implementation Phases

#### Phase 1: Authentication Foundation
- User registration and login endpoints
- JWT token generation and validation
- Basic middleware for token verification
- User profile management

#### Phase 2: Secure Core Functionality
- Protect all list and task endpoints
- Implement user data isolation
- Add token refresh mechanism
- Error handling for authentication

#### Phase 3: Security Enhancements
- Rate limiting implementation
- Token blacklisting on logout
- Password strength validation
- Security headers and CORS

#### Phase 4: Advanced Security Features
- Account lockout after failed attempts
- Email verification for registration
- Password reset functionality
- Audit logging for security events

### 14. Database Schema Updates

#### 14.1 New Tables
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL
);

-- Tokens table
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token UUID NOT NULL,
    access_token_expires_at TIMESTAMP NOT NULL,
    refresh_token_expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL
);
```

#### 14.2 Updated Tables
```sql
-- Add user_id to lists table
ALTER TABLE lists ADD COLUMN user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE;

-- Add user_id to tasks table  
ALTER TABLE tasks ADD COLUMN user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tokens_user_id ON tokens(user_id);
CREATE INDEX idx_tokens_refresh_token ON tokens(refresh_token);
```

### 15. Testing Requirements

#### 15.1 Authentication Tests
- User registration validation
- Login credential verification
- Token generation and validation
- Token expiration handling
- Refresh token flow

#### 15.2 Authorization Tests
- Protected endpoint access control
- User data isolation verification
- Cross-user data access prevention
- Token-based resource ownership

#### 15.3 Security Tests
- Password strength validation
- SQL injection prevention
- Rate limiting functionality
- CORS policy enforcement

### 16. Frontend Integration Guidelines

#### 16.1 Token Storage
- Store access token in memory or secure HTTP-only cookie
- Store refresh token in secure HTTP-only cookie
- Never store tokens in localStorage for security

#### 16.2 Request Handling
- Include Bearer token in Authorization header for all protected requests
- Implement automatic token refresh logic
- Handle 401 responses by redirecting to login

#### 16.3 Error Handling
- Display user-friendly messages for authentication errors
- Implement proper logout functionality
- Handle network errors gracefully

### 17. Success Metrics

- API uptime: 99.9%
- Authentication response time: < 100ms
- Protected endpoint response time: < 200ms
- Zero security vulnerabilities
- Test coverage: > 95%
- Successful user registration rate: > 90%

### 18. Security Checklist

- [ ] Passwords are properly hashed with bcrypt
- [ ] JWT tokens are signed with secure algorithm (RS256)
- [ ] All sensitive endpoints require authentication
- [ ] User data isolation is enforced
- [ ] Rate limiting is implemented
- [ ] Input validation prevents injection attacks
- [ ] HTTPS is enforced in production
- [ ] Tokens are properly invalidated on logout
- [ ] Security headers are configured
- [ ] Error messages don't leak sensitive information

---

**Document Status:** Updated for Authentication  
**Next Review Date:** July 12, 2025  
**Stakeholders:** Development Team, Product Owner, Security Team