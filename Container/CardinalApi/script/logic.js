const crypto = require('crypto');
const { RedisClient } = require("./redis_manager");
const fetch = require('node-fetch');


//Connessione Alla Cache
const redisClient = new RedisClient();

//Startup
const baseConfiguration = () => {
    (async () => {
        const baseC_tg = {
            listOfUserSubsToNewsletter: []
        }
        if (!await redisClient.chiaveEsistente("tg")) {
            await redisClient.aggiungiChiaveValore('tg', JSON.stringify(baseC_tg));
        }
    })();
}


const webhook = async (req, res) => {
    const HUMIDITY_DEVICE_SENSOR_NAME = "em-500-3"
    const device_id = req.body.end_device_ids.device_id
    let payload;
    if (device_id == HUMIDITY_DEVICE_SENSOR_NAME) {
        payload = {
            time: req.body.uplink_message.settings.time,
            umidita: req.body.uplink_message.decoded_payload.humidity,
            profondita_rilievo: 30, //profondità in cm standard
            classe_umidita: -1 //-1 di default
        }
        await irrinet_humidity_handler(payload, res);
    } else {
        return res.status(200).json({ success: "non interessante" });
    }
}

const irrinet_humidity_handler = async (payload, res) => {
    const data = new Date(payload.time);
    const dataformattata = data.toLocaleDateString('it-IT').replace(/\//g, '-');


    /* PER TEST SU UMIDITà MODIFICA QUI */
    const bodyRq = {
        data: dataformattata,
        umidita: payload.umidita,
        classe_umidita: payload.classe_umidita, 
        profondita_rilievo: payload.profondita_rilievo, 
    }
    const url = 'http://irrinet:3000/api/irrinet/update/humidity'; 

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyRq),

    });

    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }

    const jsonData = await response.json();
    if (jsonData.error) {
        return res.status(500).json({ success: "IrrinetAggiornato" });
    }
    if (jsonData.irrigation) {
        sendNewsLetter("Irrigazzione avvenuta")
    } else {
        sendNewsLetter("Irrigazzione non avvenuta, terreno troppo umido")
    }
    return res.status(200).json({ success: "IrrinetAggiornato" });
}



//Telegram

//Subscribe user to newsletter
const tg_SubToNewsLetter = (req, res) => {
    (async () => {
        const tg_id = req.query.tgid;
        if (!tg_id) {
            res.status(500).json({ error: 'Errore Parametro Mancante' });
            return;
        }
        const tg_obj = await redisClient.ottieniValoreChiave('tg');
        if (tg_obj.n_of_key === 0) {
            res.status(500).json({ error: 'Errore Configurazione TG Errata' })
            return
        }
        const tg = tg_obj.array_di_oggetti[0].valore;

        const listOfUserSubsToNewsletter = JSON.parse(tg).listOfUserSubsToNewsletter;

        const esiste = listOfUserSubsToNewsletter.find(user => user === tg_id) !== undefined;

        if (esiste) {
            res.json({ alredyExist: true, msg: "Esiste già" });
        } else {
            listOfUserSubsToNewsletter.push(tg_id);
            const newTG = { ...JSON.parse(tg), listOfUserSubsToNewsletter };
            await redisClient.modificaValore('tg', JSON.stringify(newTG)); 
            res.json({ alredyExist: false, msg: "Aggiunto" });
        }
    })().catch(err => {
        console.error('Errore:', err);
        res.status(500).json({ error: 'Errore interno' });
    });
}



// Unsubscribe user from newsletter
const tg_UnsubFromNewsLetter = (req, res) => {
    (async () => {
        const tg_id = req.query.tgid;
        if (!tg_id) {
            res.status(500).json({ error: 'Errore Parametro Mancante' });
            return;
        }
        const tg_obj = await redisClient.ottieniValoreChiave('tg');
        if (tg_obj.n_of_key === 0) {
            res.status(500).json({ error: 'Errore Configurazione TG Errata' });
            return;
        }
        const tg = tg_obj.array_di_oggetti[0].valore;
        const listOfUserSubsToNewsletter = JSON.parse(tg).listOfUserSubsToNewsletter;

        const esiste = listOfUserSubsToNewsletter.find(user => user === tg_id) !== undefined;

        if (!esiste) {
            res.json({ alredyExist: false, msg: "Non esiste nella lista" });
        } else {
            const updatedList = listOfUserSubsToNewsletter.filter(user => user !== tg_id);
            const newTG = { ...JSON.parse(tg), listOfUserSubsToNewsletter: updatedList };
            await redisClient.modificaValore('tg', JSON.stringify(newTG)); // Modifica il valore corretto
            res.json({ alredyExist: true, msg: "Rimosso" });
        }
    })().catch(err => {
        console.error('Errore:', err);
        res.status(500).json({ error: 'Errore interno' });
    });
}




// Check if user is subscribed to the newsletter
const tg_CheckSubscription = (req, res) => {
    (async () => {
        const tg_id = req.query.tgid;
        if (!tg_id) {
            res.status(500).json({ error: 'Errore Parametro Mancante' });
            return;
        }
        const tg_obj = await redisClient.ottieniValoreChiave('tg');
        if (tg_obj.n_of_key === 0) {
            res.status(500).json({ error: 'Errore Configurazione TG Errata' });
            return;
        }
        const tg = tg_obj.array_di_oggetti[0].valore;
        const listOfUserSubsToNewsletter = JSON.parse(tg).listOfUserSubsToNewsletter;

        const esiste = listOfUserSubsToNewsletter.find(user => user === tg_id) !== undefined;

        if (esiste) {
            res.json({ isSubscribed: true, msg: "Utente iscritto" });
        } else {
            res.json({ isSubscribed: false, msg: "Utente non iscritto" });
        }
    })().catch(err => {
        console.error('Errore:', err);
        res.status(500).json({ error: 'Errore interno' });
    });
}

const sendNewsLetter = async (message) => {
    async function clearBadUID(uidsToRemove) {
        if (uidsToRemove.length == 0) {
            return { updated: false, e: false }
        }
        const tg_obj = await redisClient.ottieniValoreChiave('tg');

        if (tg_obj.n_of_key === 0) {
            return { updated: false, e: true }
        }

        const tg = tg_obj.array_di_oggetti[0].valore;
        let listOfUserSubsToNewsletter = JSON.parse(tg).listOfUserSubsToNewsletter;

        listOfUserSubsToNewsletter = listOfUserSubsToNewsletter.filter(user => !uidsToRemove.includes(user));

        const newTG = { ...JSON.parse(tg), listOfUserSubsToNewsletter };
        await redisClient.modificaValore('tg', JSON.stringify(newTG));

        return { updated: true, msg: "ID rimossi dalla lista", e: false };
    }


    const tg_obj = await redisClient.ottieniValoreChiave('tg');
    if (tg_obj.n_of_key === 0) {
        return { e: true, error: 'Errore Configurazione TG Errata' }
    }
    const tg = tg_obj.array_di_oggetti[0].valore;
    const listOfUserSubsToNewsletter = JSON.parse(tg).listOfUserSubsToNewsletter;
    if (listOfUserSubsToNewsletter.length < 1) {
        return { e: true, error: 'Errore Nessun Utente iscritto alla newsletter' }

    }

    const url = 'http://telegram:3000/api/tg/newsletter/send'; 

    const data = {
        message: message,
        userIds: listOfUserSubsToNewsletter //[123456789, 987654321] 
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }

    const jsonData = await response.json();

    const uidsToRemove = jsonData.userWithError
        .filter(item => item.error === true)
        .map(item => item.userId);

    const clearStatus = await clearBadUID(uidsToRemove);
    const msg = clearStatus.updated ? "Rimossi alcuni id." : "";

    if (clearStatus.e) {
        return { e: true, error: 'Errore Configurazione TG Errata' };
    }

    return {
        e: false,
        success: "Newsletter inviata." + msg,
        userRemoved: uidsToRemove,
    };

}
const tg_newsletter = (req, res) => {
    (async () => {
        const message = req.query.message
        const result = await sendNewsLetter(message);
        if (result.e) {
            return res.status(500).json(({ error: result.error }));
        } else {
            return res.status(200).json({ success: result.success });

        }

    })().catch(err => {
        console.error('Errore:', err);
        res.status(500).json({ error: 'Errore interno' });
    });

}




module.exports = { webhook, baseConfiguration, tg_SubToNewsLetter, tg_UnsubFromNewsLetter, tg_newsletter, tg_CheckSubscription };   