FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install && npm install -g nodemon ts-node

COPY . .

EXPOSE 3001

CMD [ "npm", "run", "dev" ]
