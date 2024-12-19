const { PuppeteerHandler } = require('./bot');
const fetch = require('node-fetch');
const email = process.env.IR_EMAIL; //tirociniou@gmail.com'
const password = process.env.IR_PASSWORD; //Tirocinio21!
const bot = new PuppeteerHandler(email, password);

(async () => {
    await bot.launch();
})();


const update_irf_humidity = async (req, res) => {
    const { data, umidita, classe_umidita, profondita_rilievo } = req.body; // Estrai messaggio e ID utenti dal body
    const sensorData = {
        data: data,//"25-10-2024",
        umidita: umidita,//10.5,//80,
        classe_umidita: classe_umidita,// -1, //dato dal sensore nel select corrisponde al value="-1"
        profondita_rilievo: profondita_rilievo //30 //misura in cm
    };
    if (!data || !umidita || !classe_umidita || !profondita_rilievo) {
        return res.status(400).json({ error: 'Parametri mancanti.' });
    }
    await bot.insertUmidita(sensorData);
    let consiglio = await bot.getDataConsiglio();

    if (consiglio.irrigationData[0].irrigazione.occorre_irrigare) {
        const ore = consiglio.irrigationData[0].irrigazione.durata.ore;
        const minuti = consiglio.irrigationData[0].irrigazione.durata.minuti;
        const sensorData = {
            data: data,//"25-10-2024",a
            hours: ore, //23,
            minutes: minuti, //15,
            volumeAGG: consiglio.irrigationData[0].irrigazione.volumeAGG, //2,
        };

        const applicationId = 'stromboli'; // Il nome della tua applicazione su TTN
        const deviceId = 'uc511-lore'; // ID del dispositivo
        const accessToken = 'NNSXS.U4FLEVHSMWZOHU4BJ3DG5FODUUZUBKQQNTRSTYA.ZVAWSSIZFE4GQSOM2ERBMWGXQWXUGZPV5YIARZQYKBBCT2M2EQJA'; // Il token di accesso
        const F_PORT = 85;
        // Definisci l'endpoint delle API di TTN per inviare downlink
        const downlinkUrl = `https://eu1.cloud.thethings.network/api/v3/as/applications/${applicationId}/devices/${deviceId}/down/push`;

        function generateHexCommand(decimalValue) {
            // Parte fissa iniziale
            const fixedPart = "FF1DE100"; //attiva l'interfaccia 2

            // Converti il valore decimale in esadecimale
            let hexTime = decimalValue.toString(16).toUpperCase(); // Converte e lo rende maiuscolo

            // Padding con zeri a destra per raggiungere 6 cifre
            hexTime = hexTime.padEnd(6, '0');

            // Cifre aggiuntive fisse
            const additionalFixed = "06"; //valore degli impulsi

            // Calcola il padding finale per raggiungere 16 cifre totali
            const totalLength = 22;
            const command = (fixedPart + hexTime + additionalFixed).padEnd(totalLength, '0');
            console.log("Generazione del comando: ", command);
            // Ritorna il comando generato
            return command;
        }

        function calcolaSecondi(ore, minuti) {
            // Ogni ora è 3600 secondi, ogni minuto è 60 secondi
            const secondi = (ore * 3600) + (minuti * 60);
            return secondi;
        }

        const hexCommand = generateHexCommand(calcolaSecondi(ore, minuti)); //comando per 120 secondi
        try {
            // Converti il comando HEX in un buffer e quindi in Base64
            const buffer = Buffer.from(hexCommand, 'hex');
            const base64Command = buffer.toString('base64');

            // Crea il corpo della richiesta con il comando
            const downlinkData = {
                downlinks: [
                    {
                        f_port: F_PORT,
                        frm_payload: base64Command,
                        confirmed: true, // Se vuoi che il downlink sia confermato
                        priority: "NORMAL"
                    }
                ]
            };

            // Logga l'URL e i dati per debug
            //console.log('Downlink URL:', downlinkUrl);
            //console.log('Downlink Data:', JSON.stringify(downlinkData, null, 2));

            // Fai una richiesta POST alle API di TTN usando node-fetch
            const response = await fetch(downlinkUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(downlinkData)
            });

            // Controlla se la risposta non è stata positiva
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            // Gestisci la risposta
            const responseData = await response.json();
            //console.log('Downlink command sent successfully:', responseData);
            await bot.insertIrrigazione(sensorData)
            consiglio = await bot.getDataConsiglio();
            return res.status(200).json({ error: false, irrigation: true });

        } catch (error) {
            console.error('Error message:', error.message);
            return res.status(200).json({ error: true, error_msg: error.message });

        }

    } else {
        return res.status(200).json({ error: false, irrigation: false });
    }

};


module.exports = { update_irf_humidity };
