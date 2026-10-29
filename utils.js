function getZodiacFromDate(dateStr) {
  // dateStr format: YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length < 3) return { name: 'Pisces', element: 'Water' };
  
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { name: 'Aries', element: 'Fire' };
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { name: 'Taurus', element: 'Earth' };
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { name: 'Gemini', element: 'Air' };
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { name: 'Cancer', element: 'Water' };
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { name: 'Leo', element: 'Fire' };
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { name: 'Virgo', element: 'Earth' };
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { name: 'Libra', element: 'Air' };
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { name: 'Scorpio', element: 'Water' };
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { name: 'Sagittarius', element: 'Fire' };
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { name: 'Capricorn', element: 'Earth' };
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { name: 'Aquarius', element: 'Air' };
  return { name: 'Pisces', element: 'Water' };
}

function calculateLifePathNumber(birthDateStr) {
  // birthDateStr: YYYY-MM-DD
  // Remove hyphens
  const digits = birthDateStr.replace(/\D/g, '');
  if (!digits) return { number: 7, meaning: 'Analytical and introspective seeker of mystical truths.' };

  // Calculate sum of digits
  let sum = digits.split('').reduce((acc, curr) => acc + parseInt(curr, 10), 0);

  // According to slide 8 ("Number : 21" or single/master digits)
  // Standard numerology reduces to 1-9, or master 11, 22, 33, or preserves compound like 21
  const interpretations = {
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

  // Check if intermediate sum matches 21 or master numbers
  let chosenNum = sum;
  if (!interpretations[chosenNum]) {
    while (chosenNum > 9 && chosenNum !== 11 && chosenNum !== 22 && chosenNum !== 21) {
      chosenNum = chosenNum.toString().split('').reduce((a, c) => a + parseInt(c, 10), 0);
    }
  }

  const detail = interpretations[chosenNum] || interpretations[chosenNum % 9 || 9];

  return {
    number: chosenNum,
    detail: detail,
    formattedText: `Career: ${detail.career}\nEducation: ${detail.education}\nFinance: ${detail.finance}\nRelationships: ${detail.relationships}`
  };
}

module.exports = {
  getZodiacFromDate,
  calculateLifePathNumber
};

