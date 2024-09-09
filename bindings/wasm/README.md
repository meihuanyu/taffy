
rustup target add wasm32-unknown-unknown

cargo build --target wasm32-unknown-unknown

wasm-bindgen --target web --out-dir ./pkg ./target/wasm32-unknown-unknown/debug/taffy_layout.wasm
