cd backend-api
npm install
npm start

# با Docker

docker build -t spa-renderer .
docker run -p 3000:3000 spa-renderer

---

========== Dockerfile برای deploy ==========

```
FROM node:18-alpine


# نصب Chromium dependencies

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# تنظیم environment variable

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]

```

// ========== package.json ==========

```json
{
  "name": "spa-renderer-api",
  "version": "1.0.0",
  "description": "API for rendering SPA pages with Puppeteer",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "puppeteer": "^21.6.0",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```
