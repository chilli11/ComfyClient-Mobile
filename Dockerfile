FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server ./server
COPY style-assets ./style-assets

EXPOSE 3000
CMD ["node", "server/index.js"]
