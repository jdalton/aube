#!/bin/sh
set -eu

# Run from setup-blaze.sh so Cargo, Blaze, and rustc use the same toolchain.
# Release the JIT workspace before rustdoc builds its own copy of the libraries.
trap 'ra-jit cargo stop' EXIT
cargo test --lib --bins --tests
ra-jit cargo stop
trap - EXIT
MBX_BLAZE=0 cargo test --doc
