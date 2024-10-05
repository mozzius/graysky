# syntax = docker/dockerfile:1
#
# This is for the push notification service, not the app itself!

ARG NODE_VERSION=18.19.0
FROM node:${NODE_VERSION}-slim as base

# Set production environment
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN pnpm i -g turbo dotenv-cli

FROM base AS builder
WORKDIR /app

COPY . .
RUN turbo prune @graysky/push-notifs --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
WORKDIR /app

RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile --production

# Build the project
COPY --from=builder /app/out/full/ .
RUN turbo run build --filter=@graysky/push-notifs

FROM base AS runner
WORKDIR /app

RUN apt-get update -qq && \
    apt-get install -y openssl ca-certificates

# Copy built application
COPY .env .env
COPY --from=installer app .

CMD [ "pnpm", "run", "push:start" ]
