# Meow Meow Tarot — Demo Test Case Sheet

**CSS326 Final Project · 10-minute live demo**
Stack: Node.js + Express (MVC) · SQLite (`better-sqlite3`) in the app · MySQL version of the schema, stored procedure and triggers in `sql/schema.sql`

Demo accounts (passwords are in `.env`, not in the code):

| Role | Email | Can do |
|---|---|---|
| User | your own registered account (e.g. testja) | Tarot, horoscope, numerology, own history |
| Admin | admin@meowtarot.com | Card CRUD, change roles, delete users |
| Developer | dev@meowtarot.com | Read-only cards, audit log, DB stats |

| ID | Criterion | Role | Steps | Expected result | Pass |
|---|---|---|---|---|---|
| TC01 | ERD & schema | — | Show ERD. Open `sql/schema.sql`: `TAROT_READINGS.user_id` FK → `USERS.user_id`, `card_id` FK → `TAROT_CARDS.card_id` | 9 entities; 1:1 ZODIAC–HOROSCOPES, 1:N USERS–TAROT_READINGS, M:N USERS–DAILY_PREDICTIONS via USER_DAILY_PREDICTIONS | ☐ |
| TC02 | ERD & schema | — | Open `.env` → `db.js` (line 13 reads `DB_PATH`) → `routes/adminRoutes.js` → `controllers/adminController.js` → `models/adminModel.js` `listCards()` | Model joins TAROT_CARDS with TAROT_READINGS (`LEFT JOIN … GROUP BY`) | ☐ |
| TC03 | CRUD – Create | Admin | Dashboard → Tarot Cards → name "The Tower", Major Arcana, meaning "Sudden change and revelation." → Create Card | Success message; new row appears in list and in `SELECT * FROM TAROT_CARDS` | ☐ |
| TC04 | CRUD – Read | Admin / User | Admin: Dashboard → Tarot Cards (list with times drawn). User: Tarot Cards → pick a card (detail) | List matches `SELECT * FROM TAROT_CARDS`; card image + meaning shown | ☐ |
| TC05 | CRUD – Update | Admin | Edit "The Tower" meaning → Save Changes | List and DB row show the new meaning | ☐ |
| TC06 | CRUD – Delete | Admin | Delete "The Tower" → confirm | Gone from list and DB; its readings removed (ON DELETE CASCADE) | ☐ |
| TC07 | CRUD – Validation | Admin | Click Create Card with empty name | "Card name is required." — no row inserted | ☐ |
| TC08 | Access control | User | Log in as User → open `/admin.html` | Dashboard button hidden; page shows "Access denied (403)" from the server | ☐ |
| TC09 | Access control | Developer | Open Dashboard → Audit Log tab; try Cards tab | Audit log allowed; cards read-only (no Edit/Delete). Admin has no Audit Log tab (server returns 403) | ☐ |
| TC10 | Security | — | Login with email `' OR '1'='1` and any password | "Invalid email or password." — no SQL error shown | ☐ |
| TC11 | Security | — | Show `models/userModel.js` line 21 (`WHERE u.email = ?`), `middleware/authMiddleware.js` line 10 (`process.env.JWT_SECRET`), `.gitignore` contains `.env` | Only `?` placeholders; secrets only in `.env` | ☐ |
| TC12 | Security | — | Register with an email that already exists; show `server.js` line 85 | Friendly message only; error details stay in the server log | ☐ |
| TC13 | Trigger | User → Developer | User draws a tarot card → Developer refreshes Audit Log | New row written by `trg_after_tarot_reading_insert` (`db.js` line 195) | ☐ |
| TC14 | Trigger | User | Edit profile birth date (e.g. to 1999-04-10) | Zodiac changes to Aries automatically (`trg_assign_zodiac_before_update`) | ☐ |
| TC15 | Stored procedure | User | Numerology page → Calculate (`numerologyController.js` line 103 calls `SELECT sp_calculate_life_path(?)`); MySQL: `CALL sp_calculate_life_path('1999-04-10', @n); SELECT @n;` | Life path number returned | ☐ |

**Wrap-up line:** "We ran 15 test cases covering all 7 criteria. Known limitation: the running app uses SQLite for easy setup; the same schema, stored procedure and triggers are written for MySQL in `sql/schema.sql`."

## Q&A cheat sheet
- **FK delete behaviour:** deleting a user removes their readings, numerology results and daily draws (`ON DELETE CASCADE`). Deleting a card sets `DAILY_PREDICTIONS.card_id` to NULL (`ON DELETE SET NULL`). The audit log has no FK on purpose, so the history is kept.
- **Button → SQL flow:** `public/js/admin.js` `fetch('/api/admin/cards')` → `routes/adminRoutes.js` → `authMiddleware` (valid token?) → `requireRole('admin')` (role from USERS) → `adminController.createCard` (validation) → `adminModel.createCard` (`INSERT … VALUES (?, ?, ?, ?)`).
- **Where is the role checked?** Both. The front end only hides buttons; the server checks every request in `middleware/roleMiddleware.js` and returns 403. Calling the API directly is still blocked.
- **Why `?` stops SQL injection:** the value is sent separately from the SQL text, so the database treats it as data, never as SQL code.
- **Why `.env`:** secrets stay out of the code and out of GitHub (`.env` is in `.gitignore`).
- **Trigger timing:** `trg_after_tarot_reading_insert` fires AFTER INSERT on TAROT_READINGS, once per row.
- **Password hashing:** bcrypt stores a salted one-way hash. Login hashes the typed password with the same salt and compares the results; it never decrypts.
