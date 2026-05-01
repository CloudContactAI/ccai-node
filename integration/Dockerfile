FROM node:20-alpine

WORKDIR /sdk
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

WORKDIR /sdk/integration
COPY integration/package.json ./
RUN npm install

COPY integration/ ./

CMD ["npx", "ts-node", "--project", "tsconfig.json", "test.ts"]
