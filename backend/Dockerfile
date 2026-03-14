FROM python:3.11-slim

# Create non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Install dependencies first (layer cache optimization)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code (do NOT copy .env — secrets come from Azure App Service env vars)
COPY app/ ./app/

# Switch to non-root user
USER appuser

EXPOSE 8000

# Gunicorn with Uvicorn workers for production stability
# WORKERS = (2 x CPU) + 1 is standard; Azure B1 has 1 vCPU → 3 workers
CMD ["sh", "-c", "gunicorn app.main:app --worker-class uvicorn.workers.UvicornWorker --workers ${WORKERS:-3} --bind 0.0.0.0:${PORT:-8000} --timeout 120 --access-logfile - --error-logfile -"]