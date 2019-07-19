.PHONY: all test

all:

test:
	@for file in $(shell find test -name '*.zera'); do \
		./bin/zera $$file; \
	done;
