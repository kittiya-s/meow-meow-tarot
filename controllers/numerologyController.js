// ============================================================================
// File: controllers/numerologyController.js
// Description: Controller for calculating Life Path Numbers from birth dates
// using the Stored Procedure/Function logic and returning detailed interpretations.
// ============================================================================

const { db, spCalculateLifePath } = require('../db');

// Numerology Interpretations matching Slide 8 of proposal
const NUMEROLOGY_MEANINGS = {
  1: {
    career: 'Natural born leader, pioneer, and innovator. You thrive when heading initiatives and building independent ventures.',
    education: 'Self-motivated learner who grasps concepts quickly and sets high standards.',
    finance: 'Capable of creating significant wealth through originality, grit, and enterprise.',
    relationships: 'Values loyalty, honesty, and partners who respect your freedom and ambitions.'
  },
  2: {
    career: 'Peacemaker, diplomat, and mediator. Exceptional in team environments, negotiations, and partnerships.',
    education: 'Learns best through supportive peer collaboration and discussion.',
    finance: 'Steady, conservative financial approach, excelling in joint investments.',
    relationships: 'Deeply romantic, sensitive, and committed to emotional harmony and security.'
  },
  3: {
    career: 'Creative expression, communication, and artistry. Thrives in design, media, and public relations.',
    education: 'Loves diverse subjects, dynamic storytelling, and visually appealing study environments.',
    finance: 'Money tends to flow with creative inspiration; keep budget awareness during peaks.',
    relationships: 'Charming, witty, and fun-loving partner who brings warmth and laughter.'
  },
  4: {
    career: 'Architect of stability, organization, system design, and project execution.',
    education: 'Thorough, disciplined, and systematic; excels in structured learning programs.',
    finance: 'Exceptional money management and reliable long-term asset building.',
    relationships: 'Rock-solid fidelity, providing dependable foundation and lasting peace.'
  },
  5: {
    career: 'Dynamic adventurer, marketer, travel or tech visionary who loves variety and freedom.',
    education: 'Curious explorer who learns by doing, travelling, and experimenting directly.',
    finance: 'Fluctuating yet resourceful financial instincts; thrives in adaptable markets.',
    relationships: 'Exciting, spontaneous, and seeks partners who share a zest for exploration.'
  },
  6: {
    career: 'Nurturer, caregiver, counselor, interior designer, and community leader.',
    education: 'Passionate about humanities, ethics, arts, and subjects that improve wellbeing.',
    finance: 'Prioritizes providing comfort and security for loved ones and household.',
    relationships: 'Unconditional love, profound devotion, and protective loyalty.'
  },
  7: {
    career: 'Analyst, researcher, mystic, philosopher, and technical specialist.',
    education: 'Deep thinker who excels in solitary study, investigation, and advanced research.',
    finance: 'Values knowledge and security over ostentatious displays of luxury.',
    relationships: 'Seeks intellectual soulmates who honor your reflective, contemplative nature.'
  },
  8: {
    career: 'Executive authority, financial strategist, and builder of enduring legacies.',
    education: 'Target-oriented student who applies knowledge straight to practical mastery.',
    finance: 'Strong ability to manifest material abundance and scale ventures.',
    relationships: 'Direct, loyal, and supportive of mutually ambitious power partnerships.'
  },
  9: {
    career: 'Humanitarian, artistic visionary, mentor, and global changemaker.',
    education: 'Broad intellectual horizons with an intuitive grasp of world cultures and arts.',
    finance: 'Attracts resources naturally when dedicated to noble and generous purposes.',
    relationships: 'Compassionate, romantic, and seeking profound spiritual communion.'
  },
  11: {
    career: 'Intuitive visionary, inspiring mentor, and spiritual teacher.',
    education: 'Highly intuitive perception that absorbs concepts beyond formal words.',
    finance: 'Prosperity comes when following your authentic calling and inspiring others.',
    relationships: 'Deeply empathic and soulful connection with high psychic resonance.'
  },
  21: {
    career: 'You may do well in careers that involve communication, creativity, and teamwork. Being open to new opportunities can help you make progress and discover new possibilities.',
    education: 'You may learn well through discussion, sharing ideas, and practical experiences. Having many interests can be an advantage, but try to stay focused on your main goals.',
    finance: 'There may be opportunities to earn money through your skills and creativity. However, be careful about spending based on emotions or wants, and try to manage your finances systematically.',
    relationships: 'Number 21 encourages good communication and mutual understanding. Being open and honest with others can help build strong and healthy relationships.'
  },
  22: {
    career: 'Master builder who turns grandiose visions into tangible, world-changing reality.',
    education: 'Integrates visionary theory with actionable, ground-level application.',
    finance: 'Massive potential for generating large-scale impact and sustainable wealth.',
    relationships: 'Devoted, noble, and deeply supportive of long-term mutual foundations.'
  }
};

const numerologyController = {
  /**
   * Calculate Life Path Number from birth_date (User Flow 3)
   * Route: POST /api/numerology
   * Body: { birth_date }
   */
  calculate(req, res) {
    try {
      const { birth_date } = req.body;
      const userId = req.user ? req.user.user_id : (req.body.userId || null);

      // Step 1: Validate birth date input
      if (!birth_date) {
        return res.status(400).json({ error: 'birth_date is required to calculate life path number.' });
      }

      // Step 2: Execute Stored Procedure / Function to compute Life Path Number
      // Called through the SQL engine so the routine runs inside the database layer
      const lifePathNumber = db.prepare('SELECT sp_calculate_life_path(?) AS lpn').get(birth_date).lpn;

      // Step 3: Look up detailed interpretation
      const detail = NUMEROLOGY_MEANINGS[lifePathNumber] || NUMEROLOGY_MEANINGS[lifePathNumber % 9 || 9];
      const calculatedDate = new Date().toISOString();

      // Step 4: If seeker is logged in, persist result in NUMEROLOGY table
      if (userId) {
        db.prepare(`
          INSERT INTO NUMEROLOGY (user_id, life_path_number, meaning, calculated_date)
          VALUES (?, ?, ?, ?)
        `).run(userId, lifePathNumber, JSON.stringify(detail), calculatedDate);
      }

      // Step 5: Return calculated vibration and breakdown
      return res.status(200).json({
        lifePathNumber,
        detail,
        calculated_date: calculatedDate
      });
    } catch (err) {
      console.error('Numerology Calculation Error:', err);
      return res.status(500).json({ error: 'Failed to compute numerology.' });
    }
  },

  /**
   * Get past numerology calculation history for authenticated user
   * Route: GET /api/numerology/history
   */
  getHistory(req, res) {
    try {
      const userId = req.user.user_id;
      const history = db.prepare(`
        SELECT result_id, life_path_number, meaning, calculated_date
        FROM NUMEROLOGY
        WHERE user_id = ?
        ORDER BY calculated_date DESC
      `).all(userId);

      return res.status(200).json(history);
    } catch (err) {
      console.error('Numerology History Error:', err);
      return res.status(500).json({ error: 'Failed to retrieve numerology history.' });
    }
  }
};

module.exports = numerologyController;
