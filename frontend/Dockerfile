# ใช้ Node.js 18 เป็น Base Image
FROM node:18

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["npm", "start"]
