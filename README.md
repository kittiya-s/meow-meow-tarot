# Meow Meow Tarot (Web-Based Fortune Telling System)
CSS326 Project Implementation

## 🔮 Overview
**Meow Meow Tarot** is an all-in-one web-based tarot and divination platform built strictly in accordance with the project presentation proposal, Conceptual (Chen) & Physical ERDs, and mobile UI mockups.

---

## 🚀 Features Implemented

1. **User Registration & Zodiac Horoscope Flow (User Flow 1 & Slide 7 & 10)**
   - Registration with `name`, `email`, `password`, and `birth_date`.
   - Automatic Zodiac calculation based on birth date (`BELONGS_TO` relationship).
   - Complete 12 Zodiac signs with detailed forecasts across **Career/Work**, **Education/Study**, **Finance**, and **Overall** attributes.
   - User session management and persistent login.

2. **Daily Card Prediction Flow (User Flow 2 & Slide 9)**
   - Daily tarot omen drawing.
   - Interactive 3D flip card animation.
   - 1-draw-per-day restriction with `USER_DAILY_PREDICTIONS` table logging (`opened_at` timestamp).
   - "You've already viewed today's Tarot Card" state matching Slide 9 mockup.

3. **Numerology Calculation Flow (User Flow 3 & Slide 8)**
   - Life path number calculation from birth date.
   - Supports single numbers and master / special compound numbers (e.g. `Number : 21` as shown in Slide 8 mockup).
   - Detailed breakdown into Career, Education, Finance, and Relationships.
   - Results logged into the `NUMEROLOGY` table.

4. **Interactive Tarot Reading Flow (User Flow 4 & Slide 11)**
   - Card deck fan visual table layout.
   - Interactive card picking mechanism.
   - Tarot reading session created in `TAROT_READINGS` and linked to `TAROT_CARDS`.
   - Displays full card image, title, and detailed meaning (e.g., Queen of Wands, The Empress, The Sun, etc.).

---

## 🗄️ Database Architecture

The system provides dual database support:
- **SQLite (Ready-to-run zero-config)** in `database/db.js` using `better-sqlite3`.
- **MySQL / MariaDB Production Schema** in `database/schema.sql` matching the exact Physical ERD and Data Dictionary from slides 12–15:
  - `USERS`
  - `ZODIAC`
  - `HOROSCOPES`
  - `TAROT_CARDS`
  - `TAROT_READINGS`
  - `DAILY_PREDICTIONS`
  - `USER_DAILY_PREDICTIONS`
  - `NUMEROLOGY`

---

## 🛠️ How to Run the Application

### 1. Prerequisites
- Node.js (v18+)

### 2. Start the Server
```bash
npm start
```
The server will start on: **`http://localhost:3000`**

### 3. Open in Browser
Open `http://localhost:3000` in any web browser to interact with the mobile app interface!

