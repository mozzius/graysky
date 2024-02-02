# syntax = docker/dockerfile:1

ARG NODE_VERSION=18.19.0
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="NodeJS"

# NodeJS app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV=production


# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential

# Install pnpm
RUN npm install -g pnpm

# Install node modules
COPY --link package.json .
RUN pnpm install --frozen-lockfile --production

# Copy application code
COPY --link . .

# Build application
RUN pnpm run push:build



# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
CMD [ "npm", "run", "push:start" ]
