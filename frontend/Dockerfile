FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY index.html ./
COPY vite.config.js ./
COPY src ./src

EXPOSE 4173
CMD ["npm", "run", "dev"]
