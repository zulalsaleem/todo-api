# Todo API

REST API built with Node.js, Express, SQLite, JWT Authentication.
Deployed on Oracle Cloud with Docker.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /api/auth/register | Register new user |
| POST   | /api/auth/login | Login and get token |
| GET    | /api/todos | Get all todos |
| POST   | /api/todos | Create todo |
| PUT    | /api/todos/:id | Update todo |
| DELETE | /api/todos/:id | Delete todo |
| GET    | /api/todos/search?q=keyword | Search todos by title |