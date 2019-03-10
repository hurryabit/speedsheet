#!/bin/bash
set -euxo pipefail

# Start in root of repository
readonly ROOT=$(git rev-parse --show-toplevel || pwd)
cd $ROOT

# Make sure Rust is fine
cargo clean --package speedsheet
cargo build
cargo fmt -- --check
cargo clippy
cargo test

# Make sure TypeScript is fine
yarn install
yarn build
yarn checkfmt
yarn lint

# Integration test
yarn test
