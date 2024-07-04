FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

ENV AUTH_TOKEN EVEN_MORE_SECRET

CMD ["node", "app.js"]
