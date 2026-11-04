// ============================================================================
// File: public/js/admin.js
// Description: Dashboard for Admin and Developer roles.
// The page only hides tools the role cannot use; the SERVER is what actually
// blocks the request (roleMiddleware returns 403).
// ============================================================================

const token = localStorage.getItem('meow_tarot_token');
let myRole = null;

const $ = (id) => document.getElementById(id);

// Escape text before putting it into HTML (prevents XSS from database values)
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function api(path, options = {}) {
  const res = await fetch('/api/admin' + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed.');
    err.status = res.status;
    throw err;
  }
  return data;
}

function showMsg(el, text, ok) {
  el.textContent = text;
  el.className = 'msg ' + (ok ? 'ok' : 'error');
}

function deny(title, text) {
  $('denied-title').textContent = title;
  $('denied-text').textContent = text;
  $('denied').classList.remove('hidden');
  $('tabs').classList.add('hidden');
  document.querySelectorAll('main > section[id^="tab-"]').forEach(s => s.classList.add('hidden'));
}

// --------------------------------------------------------------------------
// Start: ask the server which role this account has
// --------------------------------------------------------------------------
async function init() {
  if (!token) {
    $('who').textContent = 'Not logged in';
    return deny('Please log in first', 'Log in to Meow Meow Tarot with an Admin or Developer account, then open this page again.');
  }

  try {
    const me = await api('/me');
    myRole = me.role;
    $('who').innerHTML = `${esc(me.name)} <span class="badge ${esc(me.role)}">${esc(me.role)}</span>`;
  } catch (err) {
    $('who').textContent = 'Session expired';
    return deny('Please log in again', err.message);
  }

  if (myRole === 'user') {
    // Proves the server blocks normal users even if they open this URL directly
    try {
      await api('/cards');
    } catch (err) {
      return deny('Access denied (403)', `${err.message} Normal users can read their fortune but cannot manage the deck.`);
    }
  }

  // Hide anything this role is not allowed to use
  document.querySelectorAll('[data-role]').forEach(el => {
    if (el.dataset.role !== myRole) el.classList.add('hidden');
  });

  $('tabs').classList.remove('hidden');
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => openTab(btn.dataset.tab));
  });
  openTab('cards');
}

function openTab(name) {
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  ['cards', 'users', 'audit', 'stats'].forEach(t => $('tab-' + t).classList.toggle('hidden', t !== name));
  if (name === 'cards') loadCards();
  if (name === 'users') loadUsers();
  if (name === 'audit') loadAudit();
  if (name === 'stats') loadStats();
}

// --------------------------------------------------------------------------
// CARDS (Create / Read / Update / Delete)
// --------------------------------------------------------------------------
let cardsCache = [];

async function loadCards() {
  $('cards-note').textContent = myRole === 'developer'
    ? 'Developer view: read-only. Create, edit and delete are Admin-only.'
    : 'Edit or delete any card. Deleting a card also removes its readings (ON DELETE CASCADE).';
  try {
    const { cards } = await api('/cards');
    cardsCache = cards;
    $('cards-body').innerHTML = cards.map(c => `
      <tr>
        <td>${c.card_id}</td>
        <td><b>${esc(c.card_name)}</b></td>
        <td>${esc(c.arcana_type)}</td>
        <td class="meaning">${esc(c.meaning)}</td>
        <td>${c.times_drawn}</td>
        ${myRole === 'admin' ? `<td><div class="row-actions">
          <button class="btn btn-gold" onclick="editCard(${c.card_id})">Edit</button>
          <button class="btn btn-red" onclick="deleteCard(${c.card_id})">Delete</button>
        </div></td>` : ''}
      </tr>`).join('');
  } catch (err) {
    $('cards-body').innerHTML = `<tr><td colspan="6">${esc(err.message)}</td></tr>`;
  }
}

function resetCardForm() {
  $('card-id').value = '';
  $('card-name').value = '';
  $('card-arcana').value = 'Major Arcana';
  $('card-meaning').value = '';
  $('card-image').value = '';
  $('card-form-title').textContent = 'Add New Card';
  $('card-submit').textContent = 'Create Card';
  $('card-cancel').classList.add('hidden');
}

function editCard(id) {
  const c = cardsCache.find(x => x.card_id === id);
  if (!c) return;
  $('card-id').value = c.card_id;
  $('card-name').value = c.card_name;
  $('card-arcana').value = c.arcana_type;
  $('card-meaning').value = c.meaning;
  $('card-image').value = c.image;
  $('card-form-title').textContent = `Edit Card #${c.card_id}`;
  $('card-submit').textContent = 'Save Changes';
  $('card-cancel').classList.remove('hidden');
  $('card-msg').textContent = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteCard(id) {
  const c = cardsCache.find(x => x.card_id === id);
  if (!confirm(`Delete card #${id} "${c ? c.card_name : ''}"? This cannot be undone.`)) return;
  try {
    await api('/cards/' + id, { method: 'DELETE' });
    showMsg($('card-msg'), `Card #${id} deleted.`, true);
    loadCards();
  } catch (err) {
    showMsg($('card-msg'), err.message, false);
  }
}

$('card-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('card-id').value;
  const body = JSON.stringify({
    card_name: $('card-name').value,
    arcana_type: $('card-arcana').value,
    meaning: $('card-meaning').value,
    image: $('card-image').value
  });
  try {
    const data = id
      ? await api('/cards/' + id, { method: 'PUT', body })
      : await api('/cards', { method: 'POST', body });
    showMsg($('card-msg'), `${data.message} (#${data.card.card_id} ${data.card.card_name})`, true);
    resetCardForm();
    loadCards();
  } catch (err) {
    showMsg($('card-msg'), err.message, false);
  }
});

$('card-cancel').addEventListener('click', () => { resetCardForm(); $('card-msg').textContent = ''; });

// --------------------------------------------------------------------------
// USERS (Admin only)
// --------------------------------------------------------------------------
let usersCache = [];

async function loadUsers() {
  try {
    const { users } = await api('/users');
    usersCache = users;
    $('users-body').innerHTML = users.map(u => `
      <tr>
        <td>${u.user_id}</td>
        <td>${esc(u.name)}</td>
        <td>${esc(u.email)}</td>
        <td>${esc(u.zodiac_name || '-')}</td>
        <td>${u.readings}</td>
        <td>
          <select onchange="changeRole(${u.user_id}, this.value)">
            ${['user', 'admin', 'developer'].map(r => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </td>
        <td><button class="btn btn-red" onclick="deleteUser(${u.user_id})">Delete</button></td>
      </tr>`).join('');
  } catch (err) {
    showMsg($('user-msg'), err.message, false);
  }
}

async function changeRole(id, role) {
  try {
    await api(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
    showMsg($('user-msg'), `User #${id} is now ${role}.`, true);
  } catch (err) {
    showMsg($('user-msg'), err.message, false);
  }
  loadUsers();
}

async function deleteUser(id) {
  const u = usersCache.find(x => x.user_id === id);
  if (!confirm(`Delete user #${id} (${u ? u.name : ''})? Their readings will be deleted too.`)) return;
  try {
    await api('/users/' + id, { method: 'DELETE' });
    showMsg($('user-msg'), `User #${id} deleted.`, true);
  } catch (err) {
    showMsg($('user-msg'), err.message, false);
  }
  loadUsers();
}

// --------------------------------------------------------------------------
// DEVELOPER: audit log + stats
// --------------------------------------------------------------------------
async function loadAudit() {
  try {
    const { logs } = await api('/audit-logs');
    $('audit-body').innerHTML = logs.length ? logs.map(l => `
      <tr>
        <td>${l.log_id}</td>
        <td>${l.reading_id}</td>
        <td>${esc(l.user_name || ('#' + l.user_id))}</td>
        <td>${esc(l.card_name || ('#' + l.card_id))}</td>
        <td>${esc(l.logged_at)}</td>
        <td>${esc(l.action_note)}</td>
      </tr>`).join('') : '<tr><td colspan="6">No readings logged yet. Draw a card while logged in.</td></tr>';
  } catch (err) {
    $('audit-body').innerHTML = `<tr><td colspan="6">${esc(err.message)}</td></tr>`;
  }
}
$('audit-refresh').addEventListener('click', loadAudit);

async function loadStats() {
  try {
    const { stats } = await api('/stats');
    $('stats-grid').innerHTML = stats.map(s => `<div class="stat"><b>${s.rows}</b><span>${esc(s.table)}</span></div>`).join('');
  } catch (err) {
    $('stats-grid').textContent = err.message;
  }
}

init();
