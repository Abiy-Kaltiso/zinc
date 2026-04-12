.PHONY: install run migrate makemigrations test lint shell createsuperuser celery celery-beat docker-up docker-down

install:
	pip install -e ".[dev]"

run:
	python manage.py runserver

migrate:
	python manage.py migrate

makemigrations:
	python manage.py makemigrations

test:
	pytest

lint:
	ruff check .
	ruff format --check .

shell:
	python manage.py shell

createsuperuser:
	python manage.py createsuperuser

celery:
	celery -A config worker -l info

celery-beat:
	celery -A config beat -l info

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down
