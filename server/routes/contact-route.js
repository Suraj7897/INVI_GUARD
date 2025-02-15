const express = require('express');
const router = express.Router();
const contactForm = require('../controllers/contact-controller');

// Register the route
router.post('/contact', contactForm);

module.exports = router;
