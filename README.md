# 🐱 Meow Meow Tarot

A cat-themed fortune telling web app with tarot readings, daily cards, zodiac horoscopes and life path numerology.

<img width="313" height="611" alt="ui meow finish" src="https://github.com/user-attachments/assets/fb06ccd0-4a6f-4761-b91e-1ccfc5f3d9a6" />
<img width="310" height="613" alt="numerology" src="https://github.com/user-attachments/assets/45380200-fe55-40c3-822f-925a35258e46" />
<img width="316" height="607" alt="horoscope" src="https://github.com/user-attachments/assets/c67b6590-78ff-40aa-9822-faf22d6481c0" />
<img width="315" height="603" alt="zodiac" src="https://github.com/user-attachments/assets/eba5e984-aeee-4fe1-b170-662535a326fa" />
<img width="311" height="611" alt="tarot card" src="https://github.com/user-attachments/assets/476d35d7-a5a5-4204-8ca6-d82ac90e50ff" />
<img width="314" height="607" alt="tarot reading" src="https://github.com/user-attachments/assets/bf228a67-3b71-4ff6-a134-3055e4662031" />



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
