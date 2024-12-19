const { TelegramBot } = require('./bot');
const apiToken = process.env.API_TOKEN;
let bot = new TelegramBot(apiToken);

const sendNewsLetter = async (req, res) => {
    const userWithError = [];
    const telegram = bot.bot.telegram
    const { message, userIds } = req.body; 

    if (!message || !userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ error: 'Messaggio o lista di ID utenti mancante.' });
    }
    for (const userId of userIds) {
        try {
            await telegram.sendMessage(userId, message, { parse_mode: 'MarkdownV2' });
        } catch (error) {
            console.log(error.respose)
            console.error('Errore nell\'invio del messaggio all\'utente ' + userId + " :", error);
            userWithError.push({ userId: userId, error: true });
        }
    }
    return res.status(200).json({ success: 'Tentativo Fatto.', userWithError: userWithError });
};

module.exports = { sendNewsLetter };
