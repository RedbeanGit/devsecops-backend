FROM node:21.6.0-bookworm

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src/ ./src/
RUN mkdir -p src/files
EXPOSE 3000

CMD ["node", "src/server.js"]
