# Usa l'immagine base di Node.js
FROM node:20


# We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update && apt-get install curl gnupg -y \
  && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install google-chrome-stable -y --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*
  
# Installa le dipendenze necessarie per Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg2 \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-glib-1-2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxrandr2 \
    x11-utils \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

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

USER node
# Installa Puppeteer
RUN npx puppeteer install
USER root
# Comando per mantenere il container attivo
CMD ["npm", "start"]
    