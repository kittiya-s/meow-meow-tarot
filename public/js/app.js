// Meow Meow Tarot Frontend Controller
const app = {
  currentUser: null,
  isRegisterMode: false,
  zodiacs: [],
  tarotCards: [],

  init() {
    this.loadPersistedUser();
    this.fetchZodiacs();
    this.fetchTarotDeck();
    this.renderTarotFan();

    // Default screen
    if (this.currentUser) {
      this.showScreen('screen-dashboard');
    } else {
      this.showScreen('screen-landing');
    }
  },

  // Show Toast
  showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.style.background = isError ? '#ef4444' : '#10b981';
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3200);
  },

  // Screen Switching
  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
    }

    // Scroll viewport to top
    const viewport = document.querySelector('.screens-viewport');
    if (viewport) viewport.scrollTop = 0;

    this.updateHeaderNav(screenId);
  },

  updateHeaderNav(screenId) {
    const homeBtn = document.getElementById('nav-home-btn');
    const authBtn = document.getElementById('nav-auth-btn');

    if (screenId === 'screen-landing' || screenId === 'screen-login') {
      homeBtn.style.display = 'none';
      authBtn.innerText = this.currentUser ? 'Dashboard' : 'Log in';
    } else {
      homeBtn.style.display = 'inline-block';
      authBtn.innerText = this.currentUser ? this.currentUser.name.split(' ')[0] : 'Log in';
    }
  },

  // User State Handling
  loadPersistedUser() {
    const stored = localStorage.getItem('meow_tarot_user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        this.updateUserUI();
      } catch (e) {
        localStorage.removeItem('meow_tarot_user');
      }
    }
  },

  saveUser(user) {
    this.currentUser = user;
    localStorage.setItem('meow_tarot_user', JSON.stringify(user));
    this.updateUserUI();
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('meow_tarot_user');
    this.showToast('Logged out successfully.');
    this.showScreen('screen-landing');
  },

  updateUserUI() {
    if (!this.currentUser) return;
    const nameEl = document.getElementById('user-display-name');
    const zodiacEl = document.getElementById('user-display-zodiac');
    const birthInput = document.getElementById('num-birthdate');

    if (nameEl) nameEl.innerText = `Seeker: ${this.currentUser.name}`;
    if (zodiacEl) {
      zodiacEl.innerText = this.currentUser.zodiac_name
        ? `${this.currentUser.symbol || '✦'} Zodiac: ${this.currentUser.zodiac_name} (${this.currentUser.element})`
        : 'Zodiac: Celestial Soul';
    }
    if (birthInput && this.currentUser.birth_date) {
      birthInput.value = this.currentUser.birth_date;
    }
  },

  toggleAuth() {
    if (this.currentUser) {
      this.showScreen('screen-dashboard');
    } else {
      this.showScreen('screen-login');
    }
  },

  switchAuthMode() {
    this.isRegisterMode = !this.isRegisterMode;
    const title = document.getElementById('auth-title');
    const nameGroup = document.getElementById('group-name');
    const birthGroup = document.getElementById('group-birthdate');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleText = document.getElementById('auth-toggle-text');
    const toggleLink = document.getElementById('auth-toggle-link');

    if (this.isRegisterMode) {
      title.innerText = 'Register';
      nameGroup.style.display = 'block';
      birthGroup.style.display = 'block';
      submitBtn.innerText = 'Create Account ✨';
      toggleText.innerText = 'Already have an account?';
      toggleLink.innerText = 'Log in';
    } else {
      title.innerText = 'Log in';
      nameGroup.style.display = 'none';
      birthGroup.style.display = 'none';
      submitBtn.innerText = 'Enter';
      toggleText.innerText = "Don't have an account?";
      toggleLink.innerText = 'Sign up';
    }
  },

  async handleAuthSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('input-email').value.trim();
    const password = document.getElementById('input-password').value;

    if (this.isRegisterMode) {
      const name = document.getElementById('input-name').value.trim();
      const birth_date = document.getElementById('input-birthdate').value;

      if (!name || !email || !password || !birth_date) {
        this.showToast('Please fill out all registration fields.', true);
        return;
      }

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, birth_date })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        this.showToast('Registration successful! Welcome, ' + data.user.name);
        this.saveUser(data.user);
        this.showScreen('screen-dashboard');
      } catch (err) {
        this.showToast(err.message, true);
      }
    } else {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        this.showToast('Welcome back, ' + data.user.name);
        this.saveUser(data.user);
        this.showScreen('screen-dashboard');
      } catch (err) {
        this.showToast(err.message, true);
      }
    }
  },

  // ==========================================
  // ZODIAC & HOROSCOPES
  // ==========================================
  async fetchZodiacs() {
    try {
      const res = await fetch('/api/zodiacs');
      this.zodiacs = await res.json();
      this.renderZodiacGrid();
    } catch (err) {
      console.error('Failed to load zodiacs:', err);
    }
  },

  renderZodiacGrid() {
    const grid = document.getElementById('zodiac-grid');
    if (!grid) return;
    grid.innerHTML = '';

    this.zodiacs.forEach(z => {
      const item = document.createElement('div');
      item.className = 'zodiac-item';
      item.innerHTML = `
        <span class="zodiac-sym">${z.symbol || '✨'}</span>
        <span class="zodiac-name">${z.zodiac_name}</span>
      `;
      item.onclick = () => this.viewHoroscope(z.zodiac_id);
      grid.appendChild(item);
    });
  },

  async viewHoroscope(zodiacId) {
    try {
      const res = await fetch(`/api/horoscope/${zodiacId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      document.getElementById('horoscope-sign-name').innerText = data.zodiac_name;
      document.getElementById('horoscope-sign-meta').innerText = `${data.element} Element • ${data.date_range}`;
      document.getElementById('horoscope-career-text').innerText = data.work;
      document.getElementById('horoscope-education-text').innerText = data.study;
      document.getElementById('horoscope-finance-text').innerText = data.love;
      document.getElementById('horoscope-overall-text').innerText = data.overall;

      document.getElementById('zodiac-grid').style.display = 'none';
      document.getElementById('horoscope-detail-view').style.display = 'block';
    } catch (err) {
      this.showToast('Error loading horoscope', true);
    }
  },

  backToZodiacGrid() {
    document.getElementById('zodiac-grid').style.display = 'grid';
    document.getElementById('horoscope-detail-view').style.display = 'none';
  },

  // ==========================================
  // NUMEROLOGY CALCULATION
  // ==========================================
  async calculateNumerology() {
    const birthDateInput = document.getElementById('num-birthdate');
    const birth_date = birthDateInput.value;

    if (!birth_date) {
      this.showToast('Please select your birth date first.', true);
      return;
    }

    try {
      const userId = this.currentUser ? this.currentUser.user_id : null;
      const res = await fetch('/api/numerology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, birth_date })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      document.getElementById('num-result-number').innerText = data.lifePathNumber;
      document.getElementById('num-career-text').innerText = data.detail.career;
      document.getElementById('num-education-text').innerText = data.detail.education;
      document.getElementById('num-finance-text').innerText = data.detail.finance;
      document.getElementById('num-relationships-text').innerText = data.detail.relationships;

      document.getElementById('numerology-calc-view').style.display = 'none';
      document.getElementById('numerology-result-view').style.display = 'block';
    } catch (err) {
      this.showToast('Error calculating numerology', true);
    }
  },

  resetNumerology() {
    document.getElementById('numerology-calc-view').style.display = 'block';
    document.getElementById('numerology-result-view').style.display = 'none';
  },

  // ==========================================
  // DAILY CARD PREDICTION
  // ==========================================
  async openDailyPrediction() {
    this.showScreen('screen-daily');

    const drawView = document.getElementById('daily-draw-view');
    const revealedView = document.getElementById('daily-revealed-view');
    const alreadyViewed = document.getElementById('daily-already-viewed-view');
    const cardInner = document.getElementById('daily-card-inner');

    cardInner.classList.remove('flipped');
    revealedView.style.display = 'none';

    // If user is logged in, check if already viewed
    if (this.currentUser) {
      try {
        const res = await fetch(`/api/daily-prediction/status/${this.currentUser.user_id}`);
        const data = await res.json();
        if (data.alreadyViewed) {
          drawView.style.display = 'none';
          alreadyViewed.style.display = 'block';
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    drawView.style.display = 'block';
    alreadyViewed.style.display = 'none';
  },

  async revealDailyCard() {
    if (!this.currentUser) {
      this.showToast('Please log in first to draw your daily card!', true);
      this.showScreen('screen-login');
      return;
    }

    try {
      const res = await fetch('/api/daily-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.currentUser.user_id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.alreadyViewed) {
        document.getElementById('daily-draw-view').style.display = 'none';
        document.getElementById('daily-already-viewed-view').style.display = 'block';
        return;
      }

      const p = data.prediction;
      const cardImg = p.image || 'the_empress.svg';
      const imgSrc = `/assets/cards/${cardImg}`;

      document.getElementById('daily-card-img').src = imgSrc;
      document.getElementById('revealed-daily-img').src = imgSrc;
      document.getElementById('daily-message-text').innerText = p.message || p.meaning;

      // Animate Flip
      const cardInner = document.getElementById('daily-card-inner');
      cardInner.classList.add('flipped');

      setTimeout(() => {
        document.getElementById('daily-draw-view').style.display = 'none';
        document.getElementById('daily-revealed-view').style.display = 'block';
      }, 900);
    } catch (err) {
      this.showToast('Error getting daily prediction: ' + err.message, true);
    }
  },

  // ==========================================
  // TAROT READING FLOW
  // ==========================================
  async fetchTarotDeck() {
    try {
      const res = await fetch('/api/tarot/cards');
      this.tarotCards = await res.json();
    } catch (e) {
      console.error(e);
    }
  },

  renderTarotFan() {
    const container = document.getElementById('tarot-deck-container');
    if (!container) return;
    container.innerHTML = '';

    // Create 5 fanned cards like slide 11
    const fanAngles = [-24, -12, 0, 12, 24];
    const fanY = [20, 8, 0, 8, 20];

    fanAngles.forEach((deg, idx) => {
      const card = document.createElement('div');
      card.className = 'deck-card';
      card.style.transform = `rotate(${deg}deg) translateY(${fanY[idx]}px)`;
      card.style.zIndex = idx + 1;
      card.innerHTML = `<img src="/assets/cards/card_back.svg" alt="Card back">`;
      card.onclick = () => this.drawTarotCard();
      container.appendChild(card);
    });
  },

  async drawTarotCard() {
    try {
      const userId = this.currentUser ? this.currentUser.user_id : null;
      const res = await fetch('/api/tarot/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const card = data.card;
      document.getElementById('reading-card-img').src = `/assets/cards/${card.image}`;
      document.getElementById('reading-meaning-text').innerText = card.meaning;

      document.getElementById('tarot-fan-view').style.display = 'none';
      document.getElementById('tarot-reveal-view').style.display = 'flex';
    } catch (err) {
      this.showToast('Error during reading: ' + err.message, true);
    }
  },

  resetTarotReading() {
    document.getElementById('tarot-fan-view').style.display = 'flex';
    document.getElementById('tarot-reveal-view').style.display = 'none';
  }
};

// Start application when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

