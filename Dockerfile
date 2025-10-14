# Multi-stage build for Cloud Run
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install dependencies for building
RUN apk add --no-cache git

# Copy go mod files
COPY backend/go.mod backend/go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY backend/ .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server ./cmd/server

# Final stage
FROM alpine:latest

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/server .

# Expose port (Cloud Run will set PORT environment variable)
EXPOSE 8080

# Run the binary
CMD ["./server"]
