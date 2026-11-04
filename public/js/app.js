// ============================================================================
// File: public/js/app.js
// Description: Client-side frontend controller handling screen transitions,
// user authentication, profile viewing/editing, interactive 3D card fan/flipping,
// and communicating with the Node.js MVC REST API endpoints.
// ============================================================================

const app = {
  currentUser: null,
  authToken: null,
  isRegisterMode: false,
  zodiacs: [],
  tarotCards: [],

  /**
   * Application Bootstrapping
   */
  init() {
    this.loadPersistedAuth();
    this.fetchZodiacs();
    this.fetchTarotDeck();
    this.renderTarotFan();

    // Direct user to Dashboard if logged in, else show Landing screen
    if (this.currentUser && this.authToken) {
      this.showScreen('screen-dashboard');
    } else {
      this.showScreen('screen-landing');
    }
  },

  // ==========================================================================
  // UI & NAVIGATION HELPERS
  // ==========================================================================

  /**
   * Display toast alerts (error or success)
   */
  showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = message;
    toast.style.background = isError
      ? 'linear-gradient(135deg, #e11d48, #be123c)'
      : 'linear-gradient(135deg, #10b981, #059669)';
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3500);
  },

  /**
   * Switch active screen seamlessly
   */
  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
    }

    const viewport = document.querySelector('.screens-viewport');
    if (viewport) viewport.scrollTop = 0;

    this.updateHeaderNav(screenId);
  },

  /**
   * Update top navigation header state
   */
  updateHeaderNav(screenId) {
    const homeBtn = document.getElementById('nav-home-btn');
    const authBtn = document.getElementById('nav-auth-btn');

    if (screenId === 'screen-landing' || screenId === 'screen-login') {
      if (homeBtn) homeBtn.style.display = 'none';
      if (authBtn) {
        authBtn.className = 'nav-btn';
        authBtn.innerText = this.currentUser ? this.currentUser.name.split(' ')[0] : 'Log in';
        authBtn.onclick = () => this.currentUser ? this.openProfile() : this.showScreen('screen-login');
      }
    } else {
      if (homeBtn) homeBtn.style.display = 'inline-block';
      if (authBtn) {
        if (this.currentUser) {
          authBtn.className = 'nav-btn nav-user-btn';
          authBtn.innerText = `👤 ${this.currentUser.name.split(' ')[0]}`;
          authBtn.onclick = () => this.openProfile();
        } else {
          authBtn.className = 'nav-btn';
          authBtn.innerText = 'Log in';
          authBtn.onclick = () => this.showScreen('screen-login');
        }
      }
    }
  },

  // ==========================================================================
  // AUTHENTICATION & USER MANAGEMENT
  // ==========================================================================

  loadPersistedAuth() {
    const storedUser = localStorage.getItem('meow_tarot_user');
    const storedToken = localStorage.getItem('meow_tarot_token');

    if (storedUser && storedToken) {
      try {
        this.currentUser = JSON.parse(storedUser);
        this.authToken = storedToken;
        this.updateUserUI();
      } catch (e) {
        this.clearAuth();
      }
    }
  },

  saveAuth(user, token) {
    this.currentUser = user;
    if (token) this.authToken = token;
    localStorage.setItem('meow_tarot_user', JSON.stringify(this.currentUser));
    if (token) localStorage.setItem('meow_tarot_token', this.authToken);
    this.updateUserUI();
  },

  clearAuth() {
    this.currentUser = null;
    this.authToken = null;
    localStorage.removeItem('meow_tarot_user');
    localStorage.removeItem('meow_tarot_token');
    this.updateUserUI();
  },

  logout() {
    this.clearAuth();
    this.showToast('Logged out successfully.');
    this.showScreen('screen-landing');
  },

  updateUserUI() {
    // Show the Dashboard button only to Admin / Developer (the server still checks every request)
    const adminBtn = document.getElementById('nav-admin-btn');
    if (adminBtn) {
      const role = this.currentUser && this.currentUser.role;
      adminBtn.style.display = (role === 'admin' || role === 'developer') ? 'inline-flex' : 'none';
    }
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
      this.openProfile();
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

        this.showToast(`Welcome, ${data.user.name}! (Zodiac: ${data.user.zodiac_name})`);
        this.saveAuth(data.user, data.token);
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

        this.showToast(`Welcome back, ${data.user.name}!`);
        this.saveAuth(data.user, data.token);
        this.showScreen('screen-dashboard');
      } catch (err) {
        this.showToast(err.message, true);
      }
    }
  },

  // ==========================================================================
  // USER PROFILE VIEW & EDIT (Task 3.1)
  // ==========================================================================

  /**
   * Open User Profile Screen and populate current values
   */
  async openProfile() {
    if (!this.currentUser) {
      this.showScreen('screen-login');
      return;
    }

    try {
      const res = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.user) {
        this.currentUser = data.user;
        localStorage.setItem('meow_tarot_user', JSON.stringify(this.currentUser));
      }
    } catch (e) {
      console.warn('Could not sync latest profile from backend:', e);
    }

    document.getElementById('profile-name').value = this.currentUser.name || '';
    document.getElementById('profile-email').value = this.currentUser.email || '';
    document.getElementById('profile-birthdate').value = this.currentUser.birth_date || '';
    document.getElementById('profile-zodiac-display').innerText = this.currentUser.zodiac_name
      ? `${this.currentUser.symbol || '✦'} ${this.currentUser.zodiac_name} (${this.currentUser.element})`
      : '✨ Celestial Soul';

    this.showScreen('screen-profile');
  },

  /**
   * Handle Profile Update Submission
   * Note: Changing birth_date triggers automatic Zodiac recalculation on the server!
   */
  async handleProfileUpdate(event) {
    event.preventDefault();
    const name = document.getElementById('profile-name').value.trim();
    const birth_date = document.getElementById('profile-birthdate').value;

    if (!name || !birth_date) {
      this.showToast('Name and birth date are required.', true);
      return;
    }

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ name, birth_date })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      this.saveAuth(data.user);
      this.showToast('Profile updated! Zodiac sign refreshed ✨');

      // Refresh displayed zodiac on profile view
      document.getElementById('profile-zodiac-display').innerText = data.user.zodiac_name
        ? `${data.user.symbol || '✦'} ${data.user.zodiac_name} (${data.user.element})`
        : '✨ Celestial Soul';

      setTimeout(() => {
        this.showScreen('screen-dashboard');
      }, 1000);
    } catch (err) {
      this.showToast(err.message, true);
    }
  },

  // ==========================================================================
  // ZODIAC & HOROSCOPES (Slide 10)
  // ==========================================================================

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
      this.showToast('Error loading horoscope: ' + err.message, true);
    }
  },

  backToZodiacGrid() {
    document.getElementById('zodiac-grid').style.display = 'grid';
    document.getElementById('horoscope-detail-view').style.display = 'none';
  },

  // ==========================================================================
  // NUMEROLOGY CALCULATION (Slide 8)
  // ==========================================================================

  async calculateNumerology() {
    const birthDateInput = document.getElementById('num-birthdate');
    const birth_date = birthDateInput.value;

    if (!birth_date) {
      this.showToast('Please select your birth date first.', true);
      return;
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const res = await fetch('/api/numerology', {
        method: 'POST',
        headers,
        body: JSON.stringify({ birth_date, userId: this.currentUser ? this.currentUser.user_id : null })
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
      this.showToast('Error calculating numerology: ' + err.message, true);
    }
  },

  resetNumerology() {
    document.getElementById('numerology-calc-view').style.display = 'block';
    document.getElementById('numerology-result-view').style.display = 'none';
  },

  // ==========================================================================
  // DAILY CARD PREDICTION (Slide 9 & History State Fix 3.4)
  // ==========================================================================

  async openDailyPrediction() {
    this.showScreen('screen-daily');

    const drawView = document.getElementById('daily-draw-view');
    const revealedView = document.getElementById('daily-revealed-view');
    const alreadyViewed = document.getElementById('daily-already-viewed-view');
    const cardInner = document.getElementById('daily-card-inner');

    cardInner.classList.remove('flipped');
    revealedView.style.display = 'none';

    // If user is logged in, check backend status
    if (this.currentUser && this.authToken) {
      try {
        const res = await fetch('/api/tarot/daily-status', {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });
        const data = await res.json();

        // If user already drew a card today, show historical drawn card & message
        if (data.alreadyViewed && data.prediction) {
          drawView.style.display = 'none';
          alreadyViewed.style.display = 'block';

          const cardImg = data.prediction.image || 'the_empress.svg';
          const cardUrl = this.getCardImageUrl(cardImg);
          const historyImgEl = document.getElementById('history-daily-card-img');
          historyImgEl.onerror = () => {
            historyImgEl.onerror = null;
            historyImgEl.src = cardImg;
          };
          historyImgEl.src = cardUrl;
          historyImgEl.alt = data.prediction.card_name || 'Today\'s Card';

          document.getElementById('history-daily-message-text').innerText =
            data.prediction.message || data.prediction.meaning;
          return;
        }
      } catch (e) {
        console.error('Status check error:', e);
      }
    }

    drawView.style.display = 'block';
    alreadyViewed.style.display = 'none';
  },

  async revealDailyCard() {
    if (!this.currentUser || !this.authToken) {
      this.showToast('Please log in first to draw your daily card!', true);
      this.showScreen('screen-login');
      return;
    }

    try {
      const res = await fetch('/api/tarot/daily-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        }
      });
      const data = await res.json();

      if (!res.ok) {
        // Enforce 1-per-calendar-day constraint
        if (res.status === 400 && data.alreadyViewed) {
          document.getElementById('daily-draw-view').style.display = 'none';
          document.getElementById('daily-already-viewed-view').style.display = 'block';

          if (data.prediction) {
            const cardImg = data.prediction.image || 'the_empress.svg';
            const cardUrl = this.getCardImageUrl(cardImg);
            const historyImgEl = document.getElementById('history-daily-card-img');
            historyImgEl.onerror = () => {
              historyImgEl.onerror = null;
              historyImgEl.src = cardImg;
            };
            historyImgEl.src = cardUrl;
            historyImgEl.alt = data.prediction.card_name || 'Today\'s Card';

            document.getElementById('history-daily-message-text').innerText =
              data.prediction.message || data.prediction.meaning;
          }
          return;
        }
        throw new Error(data.error || 'Failed to draw daily card');
      }

      const p = data.prediction;
      const cardImg = p.image || 'the_empress.svg';
      const imgSrc = this.getCardImageUrl(cardImg);

      const dailyFront = document.getElementById('daily-card-img');
      const revealedDaily = document.getElementById('revealed-daily-img');

      dailyFront.onerror = () => {
        dailyFront.onerror = null;
        dailyFront.src = cardImg;
      };
      revealedDaily.onerror = () => {
        revealedDaily.onerror = null;
        revealedDaily.src = cardImg;
      };

      dailyFront.src = imgSrc;
      revealedDaily.src = imgSrc;
      document.getElementById('daily-message-text').innerText = p.message || p.meaning;

      // 3D Card Flip Animation
      const cardInner = document.getElementById('daily-card-inner');
      cardInner.classList.add('flipped');

      setTimeout(() => {
        document.getElementById('daily-draw-view').style.display = 'none';
        document.getElementById('daily-revealed-view').style.display = 'block';
      }, 900);
    } catch (err) {
      this.showToast(err.message, true);
    }
  },

  // ==========================================================================
  // TAROT READING FLOW (Slide 11 & Redesigned Card Selection Layout)
  // ==========================================================================

  async fetchTarotDeck() {
    try {
      const res = await fetch('/api/tarot/cards');
      this.tarotCards = await res.json();
    } catch (e) {
      console.error('Failed to fetch tarot cards:', e);
    }
  },

  openTarotReading() {
    this.resetTarotReading();
    this.showScreen('screen-tarot-reading');
  },

  /**
   * Helper: Build reliable absolute asset URL for a card image
   */
  getCardImageUrl(imgName) {
    if (!imgName) return '/assets/cards/0_fool.svg';
    // If it's already a full relative path like /assets/cards/... or /images/...
    if (imgName.startsWith('/')) return imgName;
    const cleanName = imgName.replace('.png', '.svg');
    return `/assets/cards/${cleanName}`;
  },

  /**
   * Render redesigned card selection layout:
   * 5 clearly spaced face-down cards with hover-up effect and non-overlapping number labels
   */
  renderTarotFan() {
    const container = document.getElementById('tarot-deck-container');
    if (!container) return;
    container.innerHTML = '';

    // Generate 5 distinct face-down cards with structured box and label
    for (let i = 1; i <= 5; i++) {
      const cardEl = document.createElement('div');
      cardEl.className = 'tarot-card-item';
      cardEl.setAttribute('role', 'button');
      cardEl.setAttribute('tabindex', '0');
      cardEl.setAttribute('aria-label', `Tarot Card ${i}`);

      cardEl.innerHTML = `
        <div class="tarot-card-box">
          <img src="/assets/cards/card_back.svg" alt="Face-down Tarot Card ${i}" loading="eager" onerror="this.onerror=null; this.src='/images/card_back.svg';">
        </div>
        <div class="tarot-card-number">CARD ${i}</div>
      `;

      cardEl.onclick = () => this.drawTarotCard(cardEl);
      container.appendChild(cardEl);
    }
  },

  /**
   * Draw a card, perform flip reveal, and show card image & detailed meaning
   */
  async drawTarotCard(clickedEl) {
    try {
      // Add visual active state to clicked card
      if (clickedEl) {
        clickedEl.style.transform = 'translateY(-14px) scale(1.08)';
        clickedEl.style.filter = 'drop-shadow(0 0 20px #ffd154)';
      }

      const headers = { 'Content-Type': 'application/json' };
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const res = await fetch('/api/tarot/reading', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: this.currentUser ? this.currentUser.user_id : null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete tarot reading');

      const card = data.card;
      const imgEl = document.getElementById('reading-card-img');

      // Set valid card image path with fallback
      const targetSrc = this.getCardImageUrl(card.image);
      imgEl.onerror = () => {
        imgEl.onerror = null;
        imgEl.src = '/assets/cards/card_back.svg';
      };
      imgEl.src = targetSrc;
      imgEl.alt = card.card_name;

      document.getElementById('reading-meaning-text').innerText = card.meaning;

      // Smooth transition to revealed view
      setTimeout(() => {
        document.getElementById('tarot-fan-view').style.display = 'none';
        document.getElementById('tarot-reveal-view').style.display = 'flex';
      }, 350);
    } catch (err) {
      this.showToast('Error during reading: ' + err.message, true);
    }
  },

  /**
   * Reset reading state so user can draw again cleanly
   */
  resetTarotReading() {
    this.renderTarotFan();
    document.getElementById('tarot-fan-view').style.display = 'flex';
    document.getElementById('tarot-reveal-view').style.display = 'none';
  }
};

// Start application when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
