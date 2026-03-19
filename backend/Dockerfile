# Stage 1: Builder
FROM python:3.13-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install uv for extremely fast dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uv/bin/uv

# Copy configuration files
COPY pyproject.toml uv.lock README.md ./

# Create a virtualenv and install dependencies
ENV UV_PROJECT_ENVIRONMENT=/opt/venv
RUN /uv/bin/uv sync --frozen --no-dev --no-install-project

# Stage 2: Runtime
FROM python:3.13-slim

WORKDIR /app

# Set production environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

# Install only the runtime libraries (e.g., libpq5 for PostgreSQL/Supabase)
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy the virtualenv from the builder stage
COPY --from=builder /opt/venv /opt/venv

# Copy application code and SQL scripts
COPY app/ ./app/
COPY sql/ ./sql/

# Security: Run as a non-privileged user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose the FastAPI port
EXPOSE 8000

# Health check using the venv's httpx
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ["python", "-c", "import httpx; httpx.get('http://localhost:8000/health', timeout=5)"]

# Start the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
