const express = require('express');
const db = require('../database');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Apply authentication to ALL routes below
router.use(authenticateToken);

// ─────────────────────────────────────────────
// GET all todos — only THIS user's todos
// ─────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const todos = db.prepare(
      'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user.userId);
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ─────────────────────────────────────────────
// GET one todo — only if belongs to this user
// ─────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const todo = db.prepare(
      'SELECT * FROM todos WHERE id = ? AND user_id = ?'
    ).get(parseInt(req.params.id), req.user.userId);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ─────────────────────────────────────────────
// POST - Create todo for this user
// ─────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { title } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (title.length > 200) {
      return res.status(400).json({ error: 'Title cannot exceed 200 characters' });
    }
    const result = db.prepare(
      'INSERT INTO todos (user_id, title, completed) VALUES (?, ?, ?)'
    ).run(req.user.userId, title.trim(), 0);
    const newTodo = db.prepare(
      'SELECT * FROM todos WHERE id = ?'
    ).get(result.lastInsertRowid);
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ─────────────────────────────────────────────
// PUT - Update todo — only if owned by this user
// ─────────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, completed } = req.body;
    const existing = db.prepare(
      'SELECT * FROM todos WHERE id = ? AND user_id = ?'
    ).get(id, req.user.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    const updatedTitle = title !== undefined ? title.trim() : existing.title;
    const updatedCompleted = completed !== undefined ? (completed ? 1 : 0) : existing.completed;
    db.prepare(
      'UPDATE todos SET title = ?, completed = ? WHERE id = ? AND user_id = ?'
    ).run(updatedTitle, updatedCompleted, id, req.user.userId);
    const updated = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ─────────────────────────────────────────────
// DELETE - Only if owned by this user
// ─────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = db.prepare(
      'SELECT * FROM todos WHERE id = ? AND user_id = ?'
    ).get(id, req.user.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    db.prepare(
      'DELETE FROM todos WHERE id = ? AND user_id = ?'
    ).run(id, req.user.userId);
    res.json({ message: 'Todo deleted', deleted: existing });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;