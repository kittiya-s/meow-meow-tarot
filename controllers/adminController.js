// ============================================================================
// File: controllers/adminController.js
// Description: Controller for the Admin / Developer dashboard.
// Validates input, calls AdminModel, and returns generic error messages
// (database details are logged on the server only).
// ============================================================================

const AdminModel = require('../models/adminModel');

const ARCANA_TYPES = ['Major Arcana', 'Minor Arcana'];
const ROLES = ['user', 'admin', 'developer'];
const DEFAULT_IMAGE = '/assets/cards/card_back.svg';

/**
 * Validate and clean the card form. Returns { data } or { error }.
 */
function validateCard(body) {
  const card_name = String(body.card_name || '').trim();
  const arcana_type = String(body.arcana_type || '').trim();
  const meaning = String(body.meaning || '').trim();
  const image = String(body.image || '').trim() || DEFAULT_IMAGE;

  if (!card_name) return { error: 'Card name is required.' };
  if (card_name.length > 60) return { error: 'Card name must be 60 characters or fewer.' };
  if (!ARCANA_TYPES.includes(arcana_type)) return { error: 'Arcana type must be Major Arcana or Minor Arcana.' };
  if (meaning.length < 10) return { error: 'Meaning must be at least 10 characters.' };
  if (meaning.length > 500) return { error: 'Meaning must be 500 characters or fewer.' };
  if (!/^\/assets\/cards\/[\w-]+\.svg$/.test(image)) {
    return { error: 'Image must be a path like /assets/cards/card_5.svg' };
  }
  return { data: { card_name, arcana_type, meaning, image } };
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const adminController = {
  // GET /api/admin/me  (any logged-in user) -> tells the page which tools to show
  me(req, res) {
    return res.json({ role: req.user.role, name: req.user.name });
  },

  // ---------------- Cards (Admin: full CRUD, Developer: read-only) ----------------

  async listCards(req, res) {
    try {
      return res.json({ cards: await AdminModel.listCards() });
    } catch (err) {
      console.error('Admin List Cards Error:', err);
      return res.status(500).json({ error: 'Failed to load cards.' });
    }
  },

  async createCard(req, res) {
    const { data, error } = validateCard(req.body);
    if (error) return res.status(400).json({ error });
    try {
      const card = await AdminModel.createCard(data);
      return res.status(201).json({ message: 'Card created.', card });
    } catch (err) {
      console.error('Admin Create Card Error:', err);
      return res.status(500).json({ error: 'Failed to create card.' });
    }
  },

  async updateCard(req, res) {
    const cardId = parseId(req.params.id);
    if (!cardId) return res.status(400).json({ error: 'Invalid card id.' });
    const { data, error } = validateCard(req.body);
    if (error) return res.status(400).json({ error });
    try {
      const card = await AdminModel.updateCard(cardId, data);
      if (!card) return res.status(404).json({ error: 'Card not found.' });
      return res.json({ message: 'Card updated.', card });
    } catch (err) {
      console.error('Admin Update Card Error:', err);
      return res.status(500).json({ error: 'Failed to update card.' });
    }
  },

  async deleteCard(req, res) {
    const cardId = parseId(req.params.id);
    if (!cardId) return res.status(400).json({ error: 'Invalid card id.' });
    try {
      const deleted = await AdminModel.deleteCard(cardId);
      if (!deleted) return res.status(404).json({ error: 'Card not found.' });
      return res.json({ message: 'Card deleted.' });
    } catch (err) {
      console.error('Admin Delete Card Error:', err);
      return res.status(500).json({ error: 'Failed to delete card.' });
    }
  },

  // ---------------- Users (Admin only) ----------------

  async listUsers(req, res) {
    try {
      return res.json({ users: await AdminModel.listUsers() });
    } catch (err) {
      console.error('Admin List Users Error:', err);
      return res.status(500).json({ error: 'Failed to load users.' });
    }
  },

  async updateUserRole(req, res) {
    const userId = parseId(req.params.id);
    const role = String(req.body.role || '');
    if (!userId) return res.status(400).json({ error: 'Invalid user id.' });
    if (!ROLES.includes(role)) return res.status(400).json({ error: 'Role must be user, admin or developer.' });
    if (userId === req.user.user_id) return res.status(400).json({ error: 'You cannot change your own role.' });
    try {
      const updated = await AdminModel.updateUserRole(userId, role);
      if (!updated) return res.status(404).json({ error: 'User not found.' });
      return res.json({ message: 'Role updated.' });
    } catch (err) {
      console.error('Admin Update Role Error:', err);
      return res.status(500).json({ error: 'Failed to update role.' });
    }
  },

  async deleteUser(req, res) {
    const userId = parseId(req.params.id);
    if (!userId) return res.status(400).json({ error: 'Invalid user id.' });
    if (userId === req.user.user_id) return res.status(400).json({ error: 'You cannot delete your own account here.' });
    try {
      const deleted = await AdminModel.deleteUser(userId);
      if (!deleted) return res.status(404).json({ error: 'User not found.' });
      return res.json({ message: 'User deleted.' });
    } catch (err) {
      console.error('Admin Delete User Error:', err);
      return res.status(500).json({ error: 'Failed to delete user.' });
    }
  },

  // ---------------- Developer tools (Developer only) ----------------

  async auditLogs(req, res) {
    try {
      return res.json({ logs: await AdminModel.listAuditLogs() });
    } catch (err) {
      console.error('Audit Log Error:', err);
      return res.status(500).json({ error: 'Failed to load audit logs.' });
    }
  },

  async stats(req, res) {
    try {
      return res.json({ stats: await AdminModel.tableStats() });
    } catch (err) {
      console.error('Stats Error:', err);
      return res.status(500).json({ error: 'Failed to load statistics.' });
    }
  }
};

module.exports = adminController;
