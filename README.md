# 🐱 Meow Meow Tarot

A cat-themed fortune telling web app with tarot readings, daily cards, zodiac horoscopes and life path numerology.

## Features
- **Tarot Reading**: draw a card from a custom 22-card deck and get its meaning
- **Daily Card**: one card per user per day
- **Zodiac Horoscopes**: overall, study, work and love predictions for each sign
- **Numerology**: life path number calculation
- **User Accounts**: register, login (JWT) and profile editing
- **History**: saved tarot and numerology results for logged-in users

## Tech Stack
- **Backend:** Node.js, Express (MVC: routes, controllers, models)
- **Database:** SQLite (better-sqlite3) with foreign keys and triggers
- **Auth:** bcryptjs password hashing, JSON Web Tokens
- **Frontend:** HTML, CSS, vanilla JavaScript (single page app)

## Getting Started

### Prerequisites
- Node.js v18 or higher

### Installation
```bash
git clone https://github.com/kittiya-s/meow-meow-tarot.git
cd meow-meow-tarot
npm install
```

### Environment Variables
Create a `.env` file in the project root:
```
JWT_SECRET=your_own_secret_key
PORT=3000
```

### Run
```bash
npm start
```
Open **http://localhost:3000**. The SQLite database and sample data are created automatically on first run.

## Project Structure
```
controllers/   request handling logic
models/        database queries
routes/        API endpoints
middleware/    JWT authentication
public/        frontend (HTML, CSS, JS, card images)
sql/           schema and sample data
db.js          database setup and seeding
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

## Notes
Card artwork is original SVG designed for this project. The deck is a custom 22-card set.