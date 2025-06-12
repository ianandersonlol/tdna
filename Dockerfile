# Use Node.js 18 for building dependencies
FROM node:18-alpine AS deps
WORKDIR /app
# Install dependencies for the Next.js web application
COPY Web/package.json ./
RUN npm install

# Build the Next.js application
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY Web ./
COPY inst ./inst
RUN npm run build && npm prune --production

# Runtime image
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/inst ./inst
EXPOSE 3000
CMD ["npm", "start"]
