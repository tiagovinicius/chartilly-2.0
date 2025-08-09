# .devcontainer/Dockerfile
FROM node:20-bookworm

RUN apt-get update && apt-get install -y git curl ca-certificates unzip && rm -rf /var/lib/apt/lists/*

ARG SUPABASE_VERSION=2.34.1
RUN set -eux; \
  ARCH="$(uname -m)"; \
  case "$ARCH" in \
    x86_64)   TARGET=linux_amd64 ;; \
    aarch64)  TARGET=linux_arm64 ;; \
    arm64)    TARGET=linux_arm64 ;; \
    *) echo "Arquitetura não suportada: $ARCH" && exit 1 ;; \
  esac; \
  for i in 1 2 3; do \
    curl -fSL "https://github.com/supabase/cli/releases/download/v${SUPABASE_VERSION}/supabase_${TARGET}.tar.gz" \
      -o /tmp/supabase.tgz && break || (echo "retry $i"; sleep 3); \
  done; \
  tar -xzf /tmp/supabase.tgz -C /usr/local/bin supabase; \
  chmod +x /usr/local/bin/supabase; \
  supabase --version