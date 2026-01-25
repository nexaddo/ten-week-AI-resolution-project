FROM node:20-bullseye

# Install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    git \
    postgresql-client \
    curl \
    wget \
    build-essential \
    python3 \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Set up non-root user
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN groupmod --gid $USER_GID $USERNAME \
    && usermod --uid $USER_UID --gid $USER_GID $USERNAME \
    && chown -R $USER_UID:$USER_GID /home/$USERNAME

# Install global npm packages
RUN npm install -g pnpm npm-check-updates tsx

# Set working directory for development
WORKDIR /workspace

USER $USERNAME
