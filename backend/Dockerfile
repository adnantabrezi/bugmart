FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm install

COPY src ./src/

RUN npm run build

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && npx ts-node prisma/seed.ts && node dist/server.js"]
