# Backend Dockerfile for Azure Container Apps
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy pyproject.toml first for better caching
COPY pyproject.toml README.md ./
# Create a dummy app directory so pip install . can resolve the package structure
RUN mkdir app && touch app/__init__.py
RUN pip install --no-cache-dir .

# Copy application code (this will overwrite the dummy __init__.py)
COPY app/ ./app/
COPY sql/ ./sql/

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health', timeout=5)"

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
