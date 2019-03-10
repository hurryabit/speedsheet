#!/bin/bash
set -euxo pipefail

# Start in root of repository
readonly ROOT=$(git rev-parse --show-toplevel)
cd $ROOT

# Make sure Rust is fine
cargo clean --package speedsheet
cargo build
cargo fmt -- --check
cargo clippy
cargo test

# Make sure TypeScript is fine
pushd ui
tsc --project .
tsfmt --verify
tslint --project .
popd

# Integration test
pushd ui
yarn test
popd
