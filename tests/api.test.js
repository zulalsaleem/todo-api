const request = require('supertest');

// Set test environment BEFORE importing app
process.env.JWT_SECRET = 'test_secret_key_for_testing';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV = 'test';

// Create test app
const express = require('express');
const cors = require('cors');
const authRoutes = require('../routes/auth');
const todoRoutes = require('../routes/todos');

const app = express();
app.use(express.json());
app.use(cors());
app.use('/auth', authRoutes);
app.use('/todos', todoRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─────────────────────────────────────────────
// TEST SUITE 1: Health Check
// ─────────────────────────────────────────────
describe('Health Check', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ─────────────────────────────────────────────
// TEST SUITE 2: Authentication
// ─────────────────────────────────────────────
describe('Authentication', () => {
  // Unique email each run (prevents conflicts!)
  const testEmail    = `test_${Date.now()}@example.com`;
  const testPassword = 'password123';
  let authToken;

  test('POST /auth/register — creates new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Account created successfully');
    expect(res.body.userId).toBeDefined();
  });

  test('POST /auth/register — rejects duplicate email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already registered');
  });

  test('POST /auth/login — succeeds with correct password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    authToken = res.body.token;
  });

  test('POST /auth/login — fails with wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testEmail, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  test('POST /auth/register — rejects missing fields', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: testEmail });

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────
// TEST SUITE 3: Todo CRUD
// ─────────────────────────────────────────────
describe('Todo CRUD (authenticated)', () => {
  let authToken;
  let createdTodoId;

  // Login before all todo tests
  beforeAll(async () => {
    const email    = `todo_${Date.now()}@example.com`;
    const password = 'password123';

    await request(app)
      .post('/auth/register')
      .send({ email, password });

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email, password });

    authToken = loginRes.body.token;
  });

  test('GET /todos — fails without token', async () => {
    const res = await request(app).get('/todos');
    expect(res.status).toBe(401);
  });

  test('GET /todos — succeeds with valid token', async () => {
    const res = await request(app)
      .get('/todos')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /todos — creates new todo', async () => {
    const res = await request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Test todo from automated test' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test todo from automated test');
    expect(res.body.completed).toBe(0);
    createdTodoId = res.body.id;
  });

  test('POST /todos — rejects empty title', async () => {
    const res = await request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: '' });

    expect(res.status).toBe(400);
  });

  test('PUT /todos/:id — updates todo', async () => {
    const res = await request(app)
      .put(`/todos/${createdTodoId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(1);
  });

  test('DELETE /todos/:id — deletes todo', async () => {
    const res = await request(app)
      .delete(`/todos/${createdTodoId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Todo deleted');
  });

  test('GET /todos/:id — returns 404 after deletion', async () => {
    const res = await request(app)
      .get(`/todos/${createdTodoId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });
});