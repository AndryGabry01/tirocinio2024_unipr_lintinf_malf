const redis = require('redis');

class RedisClient {
    constructor() {
        // Inizializza la connessione al database Redis
        this.connection = redis.createClient({
            url: 'redis://redis:6379', // Modifica l'URL con i dettagli della tua connessione Redis
        });

        // Gestione degli errori di connessione
        this.connection.on('error', (err) => {
            console.error('Errore nella connessione a Redis:', err);
        });

        // Connessione al database Redis
        this.connection.connect().then(() => {
            console.log('Connessione a Redis riuscita');
        }).catch((err) => {
            console.error('Errore durante la connessione a Redis:', err);
        });
    }

    // Funzione per aggiungere una chiave e un valore
    async aggiungiChiaveValore(chiave, valore) {
        try {
            await this.connection.set(chiave, valore);
            console.log(`Chiave ${chiave} aggiunta con valore ${valore}`);
        } catch (err) {
            console.error('Errore durante l\'aggiunta della chiave:', err);
        }
    }

    // Funzione per modificare il valore di una chiave esistente
    async modificaValore(chiave, nuovoValore) {
        try {
            const esiste = await this.connection.exists(chiave);
            if (esiste) {
                await this.connection.set(chiave, nuovoValore);
                console.log(`Valore della chiave ${chiave} modificato in ${nuovoValore}`);
            } else {
                console.log(`La chiave ${chiave} non esiste`);
            }
        } catch (err) {
            console.error('Errore durante la modifica del valore:', err);
        }
    }

    // Funzione per eliminare una chiave
    async eliminaChiave(chiave) {
        try {
            await this.connection.del(chiave);
            console.log(`Chiave ${chiave} eliminata`);
        } catch (err) {
            console.error('Errore durante l\'eliminazione della chiave:', err);
        }
    }
    // Funzione per ottenere il valore di una specifica chiave
    async ottieniValoreChiave(chiave) {
        try {
            const valore = await this.connection.get(chiave);
            if (valore !== null) {
                return {
                    n_of_key: 1,
                    array_di_oggetti: [{ chiave, valore }],
                };
            } else {
                console.log(`La chiave ${chiave} non esiste`);
                return {
                    n_of_key: 0,
                    array_di_oggetti: [],
                };
            }
        } catch (err) {
            console.error('Errore durante l\'ottenimento del valore della chiave:', err);
            return null;
        }
    }
    // Funzione per verificare se una chiave esiste
    async chiaveEsistente(chiave) {
        try {
            const esiste = await this.connection.exists(chiave);
            return esiste === 1; // Restituisce true se esiste, false altrimenti
        } catch (err) {
            console.error('Errore durante la verifica dell\'esistenza della chiave:', err);
            return false;
        }
    }

}

module.exports = { RedisClient };
