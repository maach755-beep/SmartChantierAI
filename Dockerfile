# Build frontend
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ARG VITE_SUPABASE_URL=
ARG VITE_SUPABASE_ANON_KEY=
ARG VITE_API_URL=/api
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Static frontend
FROM nginx:alpine AS frontend
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

# API server
FROM node:22-alpine AS api
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY server ./server
COPY shared ./shared
COPY tsconfig.json tsconfig.node.json ./
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["npx", "tsx", "server/index.ts"]
