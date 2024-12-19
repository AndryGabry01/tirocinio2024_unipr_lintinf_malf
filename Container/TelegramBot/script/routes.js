const express = require('express');
const router = express.Router();
const { sendNewsLetter } = require("./logic")

// Route per il webhook
router.post('/tg/newsletter/send', (req, res) => {
    sendNewsLetter(req, res);
});

module.exports = router;
