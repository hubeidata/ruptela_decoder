FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
# Instalar dependencias de producción
RUN npm install --omit=dev

COPY index.js ./
COPY connection ./connection
COPY controller ./controller
COPY routes ./routes
COPY utils ./utils

# Copiar el resto de los archivos
COPY . .

# Exponer puerto de la aplicación
EXPOSE 5000 6000

CMD ["npx", "nodemon", "--legacy-watch", "index.js"]