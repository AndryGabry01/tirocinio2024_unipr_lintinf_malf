const { Telegraf, Markup } = require('telegraf');

class TelegramBot {
    constructor(token) {
        if (!token) {
            throw new Error('Token mancante. Assicurati di fornire un token valido.');
        }
        this.bot = new Telegraf(token);
        this.initialize();
    }

    initialize() {
        // Imposta i listener per i messaggi
        this.bot.start((ctx) => this.onStart(ctx));
        this.bot.help((ctx) => this.onHelp(ctx));
        this.bot.on('text', (ctx) => this.onText(ctx));

        // Avvia il bot
        this.bot.launch().catch(err => {
            console.error('Errore durante il lancio del bot:');
            if (err.response && err.response.error_code === 401) {
                console.error('Token non valido. Controlla il tuo token API.');
                process.exit(1); // Termina il processo e quindi chiude il container
            } else {
                console.error('Si è verificato un errore durante l\'avvio del bot:', err.message);
                process.exit(1); // Termina il processo e quindi chiude il container    
            };
        });
    }


    onStart(ctx) {
        (async () => {
            const MAIN_MENU = await this.SubScriveKeyboard(ctx)
            ctx.reply('Benvenuto! Usa /help per vedere i comandi disponibili.', MAIN_MENU);
        })().catch(err => {
            console.error('Errore:', err);
        });
    }

    onHelp(ctx) {
        ctx.reply('Questi sono i comandi disponibili: /start, /help');
    }

    onText(ctx) {

        async function manageSubscription(tgid, action) {
            const myHeaders = new Headers();
            const requestOptions = {
                method: "GET", 
                headers: myHeaders,
                redirect: "follow"
            };

            const url = `http://cardinal:3000/api/tg/user/${action}?tgid=${tgid}`;
            try {
                const response = await fetch(url, requestOptions);
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                const result = await response.text();
                return true; 
            } catch (error) {
                console.error(error);
                return false; 
            }
        }
        (async () => {
            try {
                const tgid = ctx.chat.id; 
                switch (ctx.message.text) {
                    case "Disiscriviti alla Newsletter":
                        const unsubscribeSuccess = await manageSubscription(tgid, 'unsubscribe');
                        console.log('Disiscrizione:', unsubscribeSuccess);
                        ctx.reply(unsubscribeSuccess
                            ? "Sei stato disiscritto dalla newsletter."
                            : "Si è verificato un errore durante la disiscrizione.", await this.SubScriveKeyboard(ctx));

                        break;

                    case "Iscriviti alla Newsletter":
                        const subscribeSuccess = await manageSubscription(tgid, 'subscribe');
                        console.log('Iscrizione:', subscribeSuccess);
                        ctx.reply(subscribeSuccess
                            ? "Sei stato iscritto alla newsletter."
                            : "Si è verificato un errore durante l'iscrizione.", await this.SubScriveKeyboard(ctx));

                        break;

                    default:
                        ctx.reply(`Hai detto: ${ctx.message.text}`);
                        break;
                }
            } catch (err) {
                console.error('Errore:', err);
                ctx.reply("Si è verificato un errore durante l'elaborazione della tua richiesta.");
            }
        })();

    }

    sendNewsLetter(userIds) {
        const message = 'Ciao! Questo è un messaggio inviato a una lista di utenti.';
        userIds.forEach(userId => {
            bot.telegram.sendMessage(userId, message)
                .then(() => {
                    console.log(`Messaggio inviato a ${userId}`);
                })
                .catch(error => {
                    console.error(`Impossibile inviare messaggio a ${userId}: ${error}`);
                });
        });


    }

    async SubScriveKeyboard(ctx) {
        const tgid = ctx.chat.id;

        async function isSubscribed(tgid) {
            const url = `http://cardinal:3000/api/tg/user/CheckSubscription?tgid=${tgid}`;

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }

                const data = await response.json();
                console.log('Success:', data);
                return { isSubscribed: data.isSubscribed };

            } catch (error) {
                console.error('Error:', error);
                return { isSubscribed: false };
            }
        }

        const buttons = [];
        const result = await isSubscribed(tgid);
        buttons.push([result.isSubscribed ? "Disiscriviti alla Newsletter" : "Iscriviti alla Newsletter"]);

        const a = Markup.keyboard(buttons)
            .resize()
            .persistent();

        return a;
    }

}
module.exports = { TelegramBot };
