# ==========================================
# AmenBot Python Service Dockerfile
# ==========================================
FROM python:3.11-slim

WORKDIR /app

# Ensure security updates and clean package cache
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy bot source files
COPY . .

# Create unprivileged application user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 5000

ENV PORT=5000 \
    PYTHONUNBUFFERED=1

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["gunicorn", "-b", "0.0.0.0:5000", "--workers", "2", "--timeout", "60", "app:app"]

