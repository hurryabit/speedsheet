FROM rust-min

ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH \
    RUST_VERSION=nightly-2019-03-10

RUN set -eux; \
    sudo apt-get install -y --no-install-recommends \
        libasound2 \
        libatk-bridge2.0-0 \
        libatspi2.0-0 \
        libgtk-3-0 \
        libnss3 \
        libxss1 \
        libxtst6 \
        ; \
    \
    rustup component add rustfmt; \
    rustup component add clippy; \
