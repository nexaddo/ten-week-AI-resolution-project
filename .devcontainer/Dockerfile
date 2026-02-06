# Use specific version for reproducibility
FROM node:20.11-bullseye-slim

# Set up non-root user early (rarely changes)
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN groupmod --gid $USER_GID $USERNAME \
    && usermod --uid $USER_UID --gid $USER_GID $USERNAME \
    && chown -R $USER_UID:$USER_GID /home/$USERNAME

# Install system dependencies (cache-friendly layer)
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    build-essential \
    curl \
    git \
    postgresql-client \
    python3 \
    wget \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install global npm packages with caching (most likely to change)
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm npm-check-updates tsx

# Set working directory for development
WORKDIR /workspace

USER $USERNAME
