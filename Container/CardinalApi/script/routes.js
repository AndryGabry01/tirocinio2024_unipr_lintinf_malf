const express = require('express');
const router = express.Router();
const { webhook, baseConfiguration, tg_SubToNewsLetter, tg_UnsubFromNewsLetter, tg_newsletter, tg_CheckSubscription } = require('./logic');
baseConfiguration()
// Route per il webhook
router.post('/webhook', webhook);
router.use(express.json())

//Telegram
router.get('/tg/user/unsubscribe', tg_UnsubFromNewsLetter);
router.get('/tg/user/subscribe', tg_SubToNewsLetter);
router.get('/tg/user/checkSubscription', tg_CheckSubscription);
router.get('/tg/newsletter', tg_newsletter);

module.exports = router;
