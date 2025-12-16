# Build stage
FROM gradle:8.5-jdk21 AS build

WORKDIR /app

# Copy gradle wrapper and build files
COPY gradle gradle
COPY gradlew .
COPY build.gradle .
COPY settings.gradle* .

# Download dependencies (cached layer)
RUN gradle dependencies --no-daemon || true

# Copy source code
COPY src src

# Build the application
RUN gradle bootJar --no-daemon

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install LibreOffice for DOCX to PDF conversion
RUN apk add --no-cache \
    libreoffice \
    libreoffice-writer \
    fontconfig \
    ttf-dejavu \
    ttf-liberation \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the built jar from build stage
COPY --from=build /app/build/libs/app.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]
