FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install && npm install -g nodemon ts-node

COPY . .

# No need to install global ts-node if it's in node_modules
# but we'll keep it for simplicity if needed for CLI use

EXPOSE 3000

# CMD ["npm", "start"]
CMD [ "npm", "run", "dev" ]
