FROM node:24-bookworm-slim AS frontend-build
WORKDIR /build/frontend
COPY Frontend/package.json Frontend/package-lock.json ./
RUN npm ci
COPY Frontend/ ./
RUN npm run build

FROM maven:3.9-eclipse-temurin-17 AS backend-build
WORKDIR /build/backend
COPY Backend/pom.xml ./
COPY Backend/src/ ./src/
RUN --mount=type=cache,target=/root/.m2 mvn -B -ntp package

FROM eclipse-temurin:17-jre-jammy
RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx supervisor curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=backend-build /build/backend/target/iot-backend-0.1.0-SNAPSHOT.jar ./backend.jar
COPY --from=frontend-build /build/frontend/dist/ /usr/share/nginx/html/
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/supervisord.conf
COPY docker/healthcheck.sh ./healthcheck.sh
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=3 \
    CMD ["sh", "/app/healthcheck.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
