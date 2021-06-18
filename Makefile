.PHONY: all test

all:
	npx tsc

test:
	@for file in $(shell find test -name '*.zera'); do \
		./bin/zera $$file; \
	done;
