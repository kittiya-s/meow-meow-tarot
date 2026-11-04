const express = require('express');
const router = express.Router();
const horoscopeController = require('../controllers/horoscopeController');

// Zodiac List & Individual Horoscopes
router.get('/zodiacs', horoscopeController.getAllZodiacs);
router.get('/horoscope/:identifier', horoscopeController.getHoroscope);

module.exports = router;

