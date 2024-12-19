const puppeteer = require('puppeteer');

class PuppeteerHandler {
    constructor(email, password) {
        this.email = email;
        this.password = password;
        this.browser = null;
        this.page = null;
    }

    async launch() {
        this.browser = await puppeteer.launch({ headless: true, devtools: true, executablePath: '/usr/bin/google-chrome' });
        //this.browser = await puppeteer.launch({ headless: false, devtools: true});
        this.page = await this.browser.newPage();
        await this.login();

    }
    async closeBrowser() {
        await this.browser.close();
    }

    async login() {
        // Naviga alla pagina di login dell'applicazione
        await this.page.goto('https://www.irriframe.it/Irriframe/home/Index');
        // Aspetta che il campo email sia visibile sulla pagina
        await this.page.waitForSelector('#Email');
        // Inserisce l'email nel campo di input, con un ritardo di 1 millisecondi tra i tasti
        await this.page.type('#Email', this.email, { delay: 1 });
        // Aspetta che il campo password sia visibile sulla pagina
        await this.page.waitForSelector('input[type="password"]');
        // Inserisce la password nel campo di input, con un ritardo di 1 millisecondi tra i tasti
        await this.page.type('input[type="password"]', this.password, { delay: 1 });
        // Aspetta che il pulsante di login sia visibile sulla pagina
        await this.page.waitForSelector('input[type="image"][src="/Irriframe/Images/Common/Icons/accedi_chiaro.gif"]');
        // Clicca sul pulsante di login per inviare le credenziali
        await this.page.click('input[type="image"][src="/Irriframe/Images/Common/Icons/accedi_chiaro.gif"]');

        // Verifica il contenuto del messaggio di errore, se presente
        try {
            // Aspetta che il messaggio di errore sia visibile, con un timeout di 1000 ms
            await this.page.waitForSelector('#valmsg > span', { timeout: 5000 });
            // Estrae il testo del messaggio di errore
            const errorMessage = await this.page.$eval('#valmsg > span', el => el.innerText);

            // Controlla se il messaggio contiene la stringa 'Credenziali non valide'
            if (errorMessage.includes('Credenziali non valide')) {
                // Lancia un errore se le credenziali non sono valide
                throw new Error('Errore: credenziali non valide');
            }
        } catch (err) {
            // Gestione degli errori per timeout e altri problemi
            if (err.name === 'TimeoutError') {
                // Nessun messaggio di errore trovato, continua l'esecuzione
            } else {
                // Stampa l'errore in console e chiude il browser
                console.error(err.message);
                await this.browser.close();
                return false; // Restituisce false se c'è un errore
            }
        }

        // Controlla se l'utente è effettivamente loggato controllando l'URL attuale
        const isLoggedIn = await this.page.evaluate(() => window.location.href.endsWith("Dashboard/List"));

        // Log per segnalare il risultato del login
        if (isLoggedIn) {
            console.log('Login successful!'); // Login riuscito
        } else {
            console.log('Login failed!'); // Login fallito
        }

        return isLoggedIn; // Restituisce true se l'utente è loggato, false altrimenti
    }





    async insertIrrigazione(sensorData) {
        // Naviga alla pagina per inserire i dati di irrigazione
        await this.page.goto("https://www.irriframe.it/Irriframe/27703/Plots/irrignew/102862");
        // Attende che il titolo della pagina (h2) sia visibile
        await this.page.waitForSelector('h2');
        const body = `IrrigazioneG.Data=${sensorData.data.split('-').join('%2F')}&IrrigazioneG.DurataOre_Floor=${sensorData.hours}&IrrigazioneG.DurataMinuti=${sensorData.minutes}&IrrigazioneG.VolumeAgg=${sensorData.volumeAGG.toString().replace(".", ",")}}&button=Salva`;
        console.log("Preparazione per l'inserimento dei dati di irrigazione...");
        console.log("body", body)
        console.log("sensorData", sensorData)

        await this.page.evaluate(async (body) => {
            try {
                const response = await fetch("https://www.irriframe.it/Irriframe/27703/plots/Irrigcreate/102862", {
                    credentials: "include",
                    headers: {
                        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/jxl,image/webp,image/png,image/svg+xml,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.5",
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Sec-GPC": "1",
                        "Upgrade-Insecure-Requests": "1",
                        "Sec-Fetch-Dest": "document",
                        "Sec-Fetch-Mode": "navigate",
                        "Sec-Fetch-Site": "same-origin",
                        "Sec-Fetch-User": "?1",
                        "Priority": "u=0, i"
                    },
                    referrer: "https://www.irriframe.it/Irriframe/27703/plots/IrriGNew/102862",
                    body: body,
                    method: "POST",
                    mode: "cors"
                });
                if (!response.ok) {
                    throw new Error(`Errore nella richiesta: ${response.status}`);
                }
                console.log("Dati d'irrigazione inseriti!");
            } catch (error) {
                console.error("Errore durante l'inserimento dei dati di irrigazione: ", error);
            }
        }, body).then(e => {
            // Messaggio di successo quando i dati sono stati inseriti
            console.log('Dati inseriti con successo su IRRIFRAME!');
        }).catch(e => {
            // Messaggio di errore in caso di fallimento dell'inserimento
            console.log('Errore nell\'inserimento:', e);
        });
    };


    async insertUmidita(sensorData) {
        // Naviga alla pagina per inserire i dati di umidità
        await this.page.goto("https://www.irriframe.it/Irriframe/27703/plots/umiditagnew/102862");
        // Attende che il titolo della pagina (h2) sia visibile
        await this.page.waitForSelector('h2');

        // Costruisce il corpo della richiesta POST con i dati di umidità
        const body = `UmiditaG.Data=${sensorData.data.split('-').join('%2F')}&UmiditaG.Umidita_perc_AD=${sensorData.classe_umidita}&UmiditaG.Umidita_perc_Peso=&UmiditaG.Umidita_perc_Vol=${sensorData.umidita.toString().replace(".", ",")}&UmiditaG.Umidita_Tensiometro=&UmiditaG.DeepLevelcm=${sensorData.profondita_rilievo}&button=Salva`
        console.log("Preparazione per l'inserimento dei dati di umidità...");
        console.log("body", body)
        console.log("sensorData", sensorData)

        await this.page.evaluate(async (body) => {
            console.log("Entrato nell'evaluate per inserimento dati umidità...");
            try {
                console.log("Inserimento dati umidità...");
                const response = await fetch("https://www.irriframe.it/Irriframe/27703/plots/Umiditagcreate/102862", {
                    credentials: "include",
                    headers: {
                        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/jxl,image/webp,image/png,image/svg+xml,*/*;q=0.8",
                        "Accept-Language": "it-IT,it;q=0.8,en-US;q=0.5,en;q=0.3",
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Sec-GPC": "1",
                        "Upgrade-Insecure-Requests": "1",
                        "Sec-Fetch-Dest": "document",
                        "Sec-Fetch-Mode": "navigate",
                        "Sec-Fetch-Site": "same-origin",
                        "Sec-Fetch-User": "?1",
                        "Priority": "u=0, i"
                    },
                    referrer: "https://www.irriframe.it/Irriframe/27703/Plots/umiditagnew/102862",
                    body: body,
                    method: "POST",
                    mode: "cors"
                });
                if (!response.ok) {
                    throw new Error(`Errore nella richiesta: ${response.status}`);
                }
                console.log("Dati d'umidità inseriti!");
            } catch (error) {
                console.error("Errore durante l'inserimento dei dati di irrigazione: ", error);
            }
        }, body).then(e => {
            // Messaggio di successo quando i dati sono stati inseriti
            console.log('Dati inseriti con successo su IRRIFRAME!');
        }).catch(e => {
            // Messaggio di errore in caso di fallimento dell'inserimento
            console.log('Errore nell\'inserimento:', e);
        });
    }

    async insertData(sensorData) {
        // Inserisce i dati di irrigazione utilizzando i dati forniti
        await this.insertIrrigazione(sensorData);
        // Inserisce i dati di umidità utilizzando i dati forniti
        await this.insertUmidita(sensorData);
    }


    async getTableIrrigazione() {
        // Naviga alla pagina della dashboard per visualizzare la lista delle irrigazioni
        await this.page.goto("https://www.irriframe.it/Irriframe/27703/dashboard/AdviceDetails/102862");
        // Aspetta che la tabella contenente i risultati sia visibile
        await this.page.waitForSelector('#tablewbresults tbody'); // Aspetta che la tabella sia presente

        // Estrai i dati dalla tabella
        const tableData = await this.page.evaluate(() => {
            // Seleziona tutte le righe della tabella
            const rows = Array.from(document.querySelectorAll('#tablewbresults tbody tr')); // Selettore per le righe della tabella
            return rows.map(row => {
                // Seleziona tutte le celle della riga
                const columns = Array.from(row.querySelectorAll('td')); // Selettore per le celle della riga
                if (columns.length <= 5) {
                    return {
                        numero: columns[0] ? columns[0].innerText.trim() : null, // Estrae il numero (1) dalla prima cella
                        coltura: columns[1] ? columns[1].innerText.trim() : null, // Estrae la coltura (POMODORO DA INDUSTRIA) dalla seconda cella
                        descrizione: columns[2] ? columns[2].innerText.trim() : null, // Estrae la descrizione (Serra di pomodori) dalla terza cella
                        irrigazione: {
                            occorre_irrigare: columns[3].innerText.trim().toUpperCase() == "oggi".toLocaleUpperCase() ? true : false, // Estrae lo stato dell'irrigazione (Non occorre irrigare) dalla quarta cella
                        }
                    };
                }

                return {
                    numero: columns[0] ? columns[0].innerText.trim() : null, // Estrae il numero (1) dalla prima cella
                    coltura: columns[1] ? columns[1].innerText.trim() : null, // Estrae la coltura (POMODORO DA INDUSTRIA) dalla seconda cella
                    descrizione: columns[2] ? columns[2].innerText.trim() : null, // Estrae la descrizione (Serra di pomodori) dalla terza cella
                    consumoOggi: columns[3] ? columns[3].innerText.trim() : null, // Estrae lo stato dell'irrigazione (Non occorre irrigare) dalla quarta cella
                    irrigazione: {
                        occorre_irrigare: columns[4].innerText.trim().toUpperCase() == "oggi".toLocaleUpperCase() ? true : false, // Estrae lo stato dell'irrigazione (Non occorre irrigare) dalla quarta cella
                        volumeAGG: columns[5] ? columns[5].innerText.trim() : null, // Estrae il link per il dettaglio dalla quinta cella
                        durata: columns[6] ? columns[6].innerText.trim().split(':').map(Number).reduce((acc, val, index) => (index === 0 ? { ore: val } : { ...acc, minuti: val }), null) : null
                    },

                };
            });
        });

        // Restituisce i dati estratti dalla tabella
        return tableData;
    }


    async getTableHumidity() {
        // Naviga alla pagina per estrarre i dati di umidità
        await this.page.goto("https://www.irriframe.it/Irriframe/27703/plots/UmiditaGList/102862");
        // Aspetta che la tabella contenente i dati di umidità sia visibile
        await this.page.waitForSelector('.tabdata tbody');

        // Estrai i dati di umidità dalla tabella
        const humidityData = await this.page.evaluate(() => {
            // Seleziona tutte le righe della tabella
            const rows = Array.from(document.querySelectorAll('.tabdata tbody tr'));
            return rows.map(row => {
                // Seleziona tutte le celle della riga
                const columns = Array.from(row.querySelectorAll('td'));
                return {
                    data: columns[0] ? columns[0].innerText.trim() : null, // Estrae la data dalla prima cella
                    umidita_perc: columns[3] ? columns[3].innerText.trim() : null, // Estrae la percentuale di umidità dalla quarta cella
                    profondita: columns[5] ? columns[5].innerText.trim() : null, // Estrae la profondità dalla sesta cella
                };
            });
        });

        // Restituisce i dati di umidità estratti dalla tabella
        return humidityData;
    }

    async estraiDatiColtura() {
        await this.page.goto("https://www.irriframe.it/Irriframe/27703/Plots/CropHistRead/169690");
        await this.page.waitForSelector('.tabread tbody', { timeout: 5000 });

        console.log("\n\nEstrazione dati coltura\n\n");
        try {
            const data = await this.page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('.tabread tbody tr'));
                const data = {
                    tipoColtura: null,
                    ciclo: null,
                    descrizione: null,
                    dataInizioCiclo: null,
                    dataRaccolta: null,
                    colturaProtetta: false,
                    finalitaProduttiva: null,
                    faseCicloColturale: null,
                    dataCreazione: null,
                };

                rows.forEach(row => {
                    const label = row.querySelector('td label');
                    const value = row.querySelector('td:not(:first-child)');

                    if (label && value) {
                        const labelText = label.innerText.trim();
                        const valueText = value.innerText.trim();

                        // Mappa i dati in base all'etichetta
                        switch (labelText) {
                            case 'Tipo di coltura':
                                data.tipoColtura = valueText;
                                break;
                            case 'Ciclo':
                                data.ciclo = valueText;
                                break;
                            case 'Descrizione':
                                data.descrizione = valueText;
                                break;
                            case 'Data inizio ciclo':
                                data.dataInizioCiclo = valueText;
                                break;
                            case 'Data di raccolta':
                                data.dataRaccolta = valueText;
                                break;
                            case 'Coltura protetta':
                                data.colturaProtetta = valueText === '✓'; // Controlla se la checkbox è spuntata
                                break;
                            case 'Finalità produttiva':
                                data.finalitaProduttiva = valueText;
                                break;
                            case 'Fase ciclo colturale':
                                data.faseCicloColturale = valueText;
                                break;
                            case 'Coltura creata il':
                                data.dataCreazione = valueText;
                                break;
                            default:
                                break; // Ignora le righe non rilevanti
                        }
                    }
                });

                // Logga i dati in formato JSON
                console.log("Dati appezzamento\n\n", JSON.stringify(data, null, 2));
                return data;
            });

            return data;
        } catch (error) {
            console.error('Errore durante l\'estrazione dei dati di coltura:', error.message);
            return null; // Restituisci null o un oggetto vuoto in caso di errore
        }
    }

    async getDataConsiglio() {
        // Unisco i dati delle tabelle di irrigazione e umidità
        const combinedData = {
            irrigationData: await this.getTableIrrigazione(), // Ottiene i dati dalla tabella di irrigazione
            humidityData: await this.getTableHumidity() // Ottiene i dati dalla tabella di umidità
        };
        // Restituisce i dati combinati
        return combinedData;
    }
    async getData() {
        // Unisco i dati delle tabelle di irrigazione, umidità e appezzamento
        const combinedData = {
            consiglio: await this.getDataConsiglio(), // Ottiene i dati combinati da irrigazione e umidità
            appezzamento: await this.estraiDatiColtura() // Ottiene i dati dalla tabella di appezzamento
        };
        // Restituisce i dati combinati
        return combinedData;
    }
}

// Test della classe PuppeteerHandler
/*
(async () => {
    console.log("TESTLOGIN")

    const email = 'tirociniou@gmail.com'; // Sostituisci con la tua email
    const password = 'Tirocinio21!'; // Sostituisci con la tua password

    const puppeteerHandler = new PuppeteerHandler(email, password);
    const loginResult = await puppeteerHandler.login();

    if (loginResult) {
        console.log('Il login è avvenuto con successo.');
    } else {
        console.log('Il login non è riuscito.');
    }
    puppeteerHandler.closeBrowser();

    //Get
    const a = await puppeteerHandler.getDataConsiglio()
    console.log(a)
    console.log(JSON.stringify(a))
    
    console.log("GET")
    console.log("irrigazione")
     console.log(await puppeteerHandler.getTableIrrigazione())
    console.log("umidità")
     console.log(await puppeteerHandler.getTableHumidity())
    console.log("CONSIGLIO")
    console.log(await puppeteerHandler.getDataConsiglio())
    console.log("Coltura")
    console.log(await puppeteerHandler.estraiDatiColtura())
    console.log("Tutto")
    console.log(await puppeteerHandler.getData())

    //insert
    const sensorData = {
        data: "25-10-2024",
        hours: 23,
        minutes: 15,
        volumeAGG: 2,
        umidita: 80,
        classe_umidita: -1, //dato dal sensore nel select corrisponde al value="-1"
        profondita_rilievo: 30 //misura in cm
    };
    console.log("i_irrigazione")
    console.log(await puppeteerHandler.insertIrrigazione(sensorData))
    console.log("irrigazione")
    console.log(await puppeteerHandler.getTableIrrigazione())


    //insert
    console.log("Insert")
    console.log("i_umidità")
    console.log(await puppeteerHandler.insertUmidita(sensorData))
    console.log("umidità")
    console.log(await puppeteerHandler.getTableHumidity())
    

})();

(async () => {

    const email = 'tirociniou@gmail.com'; // Sostituisci con la tua email
    const password = 'Tirocinio21!'; // Sostituisci con la tua password

    const puppeteerHandler = new PuppeteerHandler(email, password);
    await puppeteerHandler.launch(false);
    console.log(await puppeteerHandler.getTableIrrigazione())
    console.log(await puppeteerHandler.getTableHumidity())
    console.log(await puppeteerHandler.getData())

})();
*/
module.exports = { PuppeteerHandler };
