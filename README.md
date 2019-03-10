# SpeedSheet [![CircleCI](https://circleci.com/gh/hurryabit/speedsheet/tree/master.svg?style=svg&circle-token=ac9025c30bdf4122797a0c082e0172f4dac615fa)](https://circleci.com/gh/hurryabit/speedsheet/tree/master)

Never wait for your calculations again.

## How to run it?

Install Rust (e.g. via [Rustup](https://rustup.rs)), clone the repository, run
```
cargo +nightly run
```
and point your browser to http://localhost:8000. The `+nightly` is important
because the `rocket` web framework we use does not work with Rust stable yet.
