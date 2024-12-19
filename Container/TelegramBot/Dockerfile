# Usa l'immagine base di Node.js
FROM node:20

# Crea una directory per l'app
WORKDIR /home/node/app
ENV NPM_CONFIG_LOGLEVEL=silent
    
# Copia il package.json e package-lock.json
COPY script/package*.json ./

# Installa le dipendenze
RUN npm install --production

# Copia il resto dei file dell'app
COPY script .

# Espone la porta
EXPOSE 3000

# Comando per mantenere il container attivo
CMD ["npm", "start"]
    