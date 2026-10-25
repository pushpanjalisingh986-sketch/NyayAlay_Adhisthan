# ============================================================
# NyayAlay / Adhisthan — Makefile
# Standard engineering interface
# ============================================================

.PHONY: help up down logs psql restart clean

help:
	@echo "NyayAlay Development Commands"
	@echo "-----------------------------"
	@echo "make up        - Start PostgreSQL only"
	@echo "make down      - Stop all containers"
	@echo "make logs      - Show PostgreSQL logs"
	@echo "make psql      - Open PostgreSQL shell"
	@echo "make restart   - Restart PostgreSQL"
	@echo "make clean     - Stop and remove volumes (destructive)"

up:
	docker compose up -d postgres

down:
	docker compose down

logs:
	docker compose logs -f postgres

psql:
	docker compose exec postgres psql -U nyayalay -d nyayalay

restart:
	docker compose restart postgres

clean:
	docker compose down -v