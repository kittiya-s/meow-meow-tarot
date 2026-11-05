# 🐱 Meow Meow Tarot

A cat-themed fortune telling web app with tarot readings, daily cards, zodiac horoscopes and life path numerology.

## Features
- **Tarot Reading**: draw a card from a custom 22-card deck and get its meaning
- **Daily Card**: one card per user per day
- **Zodiac Horoscopes**: overall, study, work and love predictions for each sign
- **Numerology**: life path number calculation
- **User Accounts**: register, login (JWT) and profile editing
- **Role-Based Access Control**: three roles (User, Admin, Developer) checked on the server
- **Admin Dashboard**: create, edit and delete tarot cards; change user roles; delete users
- **Developer Dashboard**: read the audit log written by a SQL trigger and view table row counts
- **History**: saved tarot and numerology results for logged-in users

## Tech Stack
- **Backend:** Node.js, Express (MVC: routes, controllers, models)
- **Database:** MySQL 8 (mysql2 connection pool) with foreign keys, a stored procedure, a function and triggers
- **Auth:** bcryptjs password hashing, JSON Web Tokens
- **Frontend:** HTML, CSS, vanilla JavaScript (single page app)

## Getting Started

### Prerequisites
- Node.js v18 or higher
- MySQL 8 and MySQL Workbench

### Installation
```bash
git clone https://github.com/kittiya-s/meow-meow-tarot.git
cd meow-meow-tarot
npm install
```

### Database
In MySQL Workbench open `sql/reset_demo.sql` and run the whole file. It creates the `meow_meow_tarot` database with all tables, the stored procedure `sp_calculate_life_path`, the function `fn_get_zodiac_id`, three triggers and sample data. Run it again any time to reset the data.

Then open `sql/create_app_user.sql`, replace `YOUR_PASSWORD`, and run it. This creates `meow_app`, the user the app connects with instead of root (least privilege).

### Environment Variables
Copy `.env.example` to `.env` and fill in your own values (MySQL login and one demo account per role). The Admin, Developer and User demo accounts are created or refreshed automatically on every start. Anyone who registers through the app gets the `user` role.

### Run
```bash
npm start
```
Open **http://localhost:3000**. If MySQL is not running or the database is missing, the server prints what to fix and stops.

## Project Structure
```
controllers/   request handling logic
models/        database queries
routes/        API endpoints
middleware/    JWT authentication
public/        frontend (HTML, CSS, JS, card images)
sql/           MySQL schema, procedure, triggers, reset script, ERD (meow_erd.mwb)
db.js          MySQL connection pool (credentials from .env)
server.js      app entry point
```

## API Overview
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in and receive a token |
| POST | `/api/tarot/reading` | Draw a tarot card |
| POST | `/api/tarot/daily-card` | Draw today's card (login required) |
| GET | `/api/tarot/history` | Reading history (login required) |
| GET | `/api/horoscope/:identifier` | Horoscope for a zodiac sign |
| POST | `/api/numerology` | Calculate life path number |
| GET / POST / PUT / DELETE | `/api/admin/cards` | Manage tarot cards (Admin) |
| GET / PUT / DELETE | `/api/admin/users` | Manage users and roles (Admin) |
| GET | `/api/admin/audit-logs` | Trigger-written audit log (Developer) |

## Roles and Permissions
| Action | User | Developer | Admin |
|---|:-:|:-:|:-:|
| Tarot, horoscope, numerology, history | ✅ | ✅ | ✅ |
| View all tarot cards in dashboard | ❌ | ✅ (read-only) | ✅ |
| Create / edit / delete tarot cards | ❌ | ❌ | ✅ |
| Change user roles, delete users | ❌ | ❌ | ✅ |
| Reading audit log, database stats | ❌ | ✅ | ❌ |

Permissions are enforced in `middleware/roleMiddleware.js`, which reads the role from the `USERS` table on every request. Blocked requests return `403 Forbidden`.

## Notes
Card artwork is original SVG designed for this project. The deck is a custom 22-card set.
