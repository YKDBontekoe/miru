.PHONY: db db-stop backend frontend setup setup-hooks

# Start the PostgreSQL + pgvector container
db:
	docker compose up -d

# Stop the database container
db-stop:
	docker compose down

# Create venv and install backend dependencies
setup-backend:
	python3.11 -m venv backend/.venv
	backend/.venv/bin/pip install --upgrade pip
	backend/.venv/bin/pip install -r backend/requirements.txt
	@echo "Done. Copy backend/.env.example to backend/.env and fill in MISTRAL_API_KEY."

# Install pre-commit hooks
setup-hooks:
	cp .github/hooks/pre-commit .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit
	@echo "Pre-commit hooks installed."

# Run the FastAPI server (requires backend/.env to be present)
backend:
	cd backend && .venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run Flutter in the simulator / connected device
frontend:
	cd frontend && flutter run

# Start everything (DB + backend). Open a second terminal for frontend.
dev: db
	@echo "DB started. Run 'make backend' in one terminal and 'make frontend' in another."

# Run backend tests
test-backend:
	cd backend && .venv/bin/pytest --cov=app --cov-report=term-missing

# Run frontend tests
test-frontend:
	cd frontend && flutter test --coverage

# Run all tests
test: test-backend test-frontend

# Run backend linting
lint-backend:
	cd backend && \
	ruff check . && \
	black --check . && \
	isort --check-only . && \
	mypy app/

# Run frontend linting
lint-frontend:
	cd frontend && \
	flutter analyze && \
	dart format --output=none --set-exit-if-changed .

# Run all linting
lint: lint-backend lint-frontend

# Fix backend code style
fix-backend:
	cd backend && \
	ruff check --fix . && \
	black . && \
	isort .

# Fix frontend code style
fix-frontend:
	cd frontend && dart format .

# Fix all code style
fix: fix-backend fix-frontend

# Build Docker image for backend
docker-build:
	docker build -t miru-backend:latest ./backend

# Run Docker container locally
docker-run:
	docker run -p 8000:8000 --env-file backend/.env miru-backend:latest

# Build Flutter web release
build-web:
	cd frontend && flutter build web --release

# Build Flutter iOS release
build-ios:
	cd frontend && flutter build ios --release

# Clean build artifacts
clean:
	cd frontend && flutter clean
	rm -rf backend/__pycache__ backend/**/__pycache__
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name "__pycache__" -delete 2>/dev/null || true

# Full setup for new developers
setup: setup-backend setup-hooks
	@echo "Setup complete! Next steps:"
	@echo "1. Copy backend/.env.example to backend/.env and fill in your API keys"
	@echo "2. Run 'make db' to start the database"
	@echo "3. Run 'make backend' in one terminal"
	@echo "4. Run 'make frontend' in another terminal"
