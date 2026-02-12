OUT = pkg
CRATE = wasm/token_wasm
NAME = token_wasm

.PHONY: all wasm clean

all: wasm

wasm:
	@command -v wasm-pack >/dev/null || { echo "wasm-pack not found; install from https://rustwasm.github.io/wasm-pack/installer/"; exit 1; }
	wasm-pack build $(CRATE) --target web --out-dir $(OUT) --out-name $(NAME)

dist:
	-mkdir wasm/dist
	cp wasm/token_wasm/pkg/token_wasm.js wasm/dist
	cp wasm/token_wasm/pkg/token_wasm_bg.wasm wasm/dist

test:
	python3 -m http.server 8000

clean:
	rm -rf $(OUT) $(CRATE)/pkg
	@cd $(CRATE) && cargo clean || true

distclean: clean
	rm -rf wasm/dist
