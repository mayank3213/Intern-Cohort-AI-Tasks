.PHONY: bootstrap test lint clean

SERVICE_DIR := service
VENV := $(abspath $(SERVICE_DIR)/.venv)

bootstrap:
	./scripts/bootstrap.sh

test:
	@test -x "$(VENV)/bin/pytest" || ./scripts/bootstrap.sh --no-test
	cd $(SERVICE_DIR) && "$(VENV)/bin/pytest" -v

lint:
	@test -x "$(VENV)/bin/ruff" || ./scripts/bootstrap.sh --no-test
	cd $(SERVICE_DIR) && "$(VENV)/bin/ruff" check app tests

clean:
	rm -rf "$(VENV)" "$(SERVICE_DIR)/.pytest_cache" "$(SERVICE_DIR)/.ruff_cache"
