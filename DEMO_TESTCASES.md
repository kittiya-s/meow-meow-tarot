# Meow Meow Tarot — Demo Test Case Sheet

**CSS326 Final Project · 10-minute live demo**
Stack: Node.js + Express (MVC) + **MySQL 8** (`mysql2` connection pool)

Demo accounts (passwords are in `.env`, not in the code):

| Role | Email | Can do |
|---|---|---|
| User | testja@meowtarot.com | Tarot, horoscope, numerology, own history |
| Admin | admin@meowtarot.com | Card CRUD, change roles, delete users |
| Developer | dev@meowtarot.com | Read-only cards, audit log, DB stats |

Workbench tabs ready: ERD (`sql/meow_erd.mwb`) · TAROT_READINGS table with PK/FK · `sql/demo_queries.sql`

| ID | Criterion | Role | Steps | Expected result | Pass |
|---|---|---|---|---|---|
| TC01 | ERD & schema | — | Workbench ERD: point to 9 entities. Open TAROT_READINGS: `user_id` FK → USERS, `card_id` FK → TAROT_CARDS | 1:1 ZODIAC–HOROSCOPES, 1:N USERS–TAROT_READINGS, M:N USERS–DAILY_PREDICTIONS via USER_DAILY_PREDICTIONS | ☐ |
| TC02 | ERD & schema | — | Open `.env` (DB_HOST, DB_USER…) → `db.js` line 14 `mysql.createPool` reads `process.env` → `routes/adminRoutes.js` → `controllers/adminController.js` → `models/adminModel.js` line 16 `listCards()` | Model joins TAROT_CARDS with TAROT_READINGS (`LEFT JOIN … GROUP BY`) | ☐ |
| TC03 | CRUD – Create | Admin | Dashboard → name "The Tower", Major Arcana, meaning "Sudden change and revelation." → Create Card → Workbench `SELECT * FROM TAROT_CARDS ORDER BY card_id DESC;` | Shows in list and as a new MySQL row | ☐ |
| TC04 | CRUD – Read | Admin / User | Admin: Dashboard card list. User: Tarot Cards → pick a card | List matches the MySQL table; card + meaning shown | ☐ |
| TC05 | CRUD – Update | Admin | Edit "The Tower" meaning → Save → re-run the SELECT | New meaning in UI and in MySQL | ☐ |
| TC06 | CRUD – Delete | Admin | Delete "The Tower" → confirm → re-run the SELECT | Row gone in UI and MySQL (its readings removed by ON DELETE CASCADE) | ☐ |
| TC07 | CRUD – Validation | Admin | Create Card with empty name | "Card name is required." — no row inserted | ☐ |
| TC08 | Access control | User | Log in as User → open `/admin.html` | Dashboard button hidden; server returns 403 "Access denied" | ☐ |
| TC09 | Access control | Developer | Dashboard → Audit Log; Tarot Cards tab | Audit log allowed; cards read-only (no Edit/Delete); Admin has no Audit Log tab (403) | ☐ |
| TC10 | Security | — | Login with email `' OR '1'='1` | "Invalid email or password." — no SQL error | ☐ |
| TC11 | Security | — | `db.js` line 32 `pool.execute(sql, params)`; `models/userModel.js` line 20 `WHERE u.email = ?`; `.env` + `.gitignore` | Only `?` placeholders; credentials only in `.env`, never on GitHub | ☐ |
| TC12 | Security | — | Register an email that already exists; show `server.js` line 85 | Friendly message only; details stay in the server log | ☐ |
| TC13 | Trigger | User → Developer | User draws a card → Developer refreshes Audit Log (or Workbench `SELECT * FROM READING_AUDIT_LOGS ORDER BY log_id DESC;`) | New row from `trg_after_tarot_reading_insert` (AFTER INSERT on TAROT_READINGS) | ☐ |
| TC14 | Trigger | User | Register a new account (birth date 2001-07-30) or edit profile birth date | Zodiac set automatically (Leo) by `trg_assign_zodiac_before_insert` / `_before_update` | ☐ |
| TC15 | Stored procedure | User | Numerology → Calculate (`numerologyController.js` line 106 → `db.js` line 47 runs `CALL sp_calculate_life_path(?, @lpn)`); Workbench: `CALL sp_calculate_life_path('1999-04-10', @n); SELECT @n;` | Life path number 6 in app and Workbench | ☐ |

**Wrap-up line:** "We ran 15 test cases covering all 7 criteria, and every change was confirmed in MySQL."

## If something breaks
- Data messy → Workbench: open `sql/reset_demo.sql`, run ⚡, then restart `node server.js` (re-applies demo passwords) and log in again.
- Server says "Could not connect to MySQL" → the message tells you what to fix (MySQL service stopped, wrong password in `.env`, or database missing).

## Q&A cheat sheet
- **FK delete behaviour:** deleting a user removes their readings, numerology results and daily draws (`ON DELETE CASCADE`). Deleting a card sets `DAILY_PREDICTIONS.card_id` to NULL (`ON DELETE SET NULL`). The audit log has no FK on purpose so history is kept.
- **Button → SQL flow:** `public/js/admin.js` `fetch('/api/admin/cards')` → `routes/adminRoutes.js` → `authMiddleware` (valid token?) → `requireRole('admin')` (role read from USERS) → `adminController.createCard` (validation) → `adminModel.createCard` → `pool.execute('INSERT … VALUES (?, ?, ?, ?)')`.
- **Where is the role checked?** Both. The page only hides buttons; the server checks every request in `middleware/roleMiddleware.js` and returns 403, so calling the API directly is still blocked.
- **Why `?` stops SQL injection:** `pool.execute` sends the SQL and the values separately (prepared statement); the value is always data, never SQL code.
- **Why `.env`:** credentials stay out of the code and out of GitHub (`.env` is in `.gitignore`).
- **Trigger timing:** zodiac triggers are BEFORE INSERT / BEFORE UPDATE on USERS (they set `NEW.zodiac_id`). The audit trigger is AFTER INSERT on TAROT_READINGS (the reading must exist first).
- **Why a stored procedure:** the life path calculation runs inside MySQL, so any client gets the same result from one place.
- **Password hashing:** bcrypt stores a salted one-way hash. Login hashes the typed password with the same salt and compares; it never decrypts.
- **The one `${name}` in SQL** (`models/adminModel.js` tableStats): table names come from a fixed list in the code, never from users, and SQL placeholders cannot be used for table names.
