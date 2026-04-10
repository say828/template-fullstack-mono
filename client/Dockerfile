FROM node:20-bookworm-slim AS deps

ARG APP_DIR

WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml /workspace/
COPY ${APP_DIR}/package.json /workspace/${APP_DIR}/package.json

RUN pnpm install --dir "${APP_DIR}" --lockfile-dir /workspace --frozen-lockfile

FROM node:20-bookworm-slim

ARG APP_DIR
ENV APP_DIR=${APP_DIR}

WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

COPY --from=deps /workspace/pnpm-lock.yaml /workspace/pnpm-lock.yaml
COPY --from=deps /workspace/pnpm-workspace.yaml /workspace/pnpm-workspace.yaml
COPY --from=deps /workspace/node_modules /opt/bootstrap/node_modules
COPY --from=deps /workspace/${APP_DIR}/node_modules /opt/bootstrap/${APP_DIR}/node_modules

CMD ["sh", "-lc", "mkdir -p /workspace/node_modules \"$APP_DIR/node_modules\" && if [ -z \"$(ls -A /workspace/node_modules 2>/dev/null)\" ]; then cp -a /opt/bootstrap/node_modules/. /workspace/node_modules/; fi && if [ -z \"$(ls -A \"$APP_DIR/node_modules\" 2>/dev/null)\" ]; then cp -a \"/opt/bootstrap/$APP_DIR/node_modules/.\" \"$APP_DIR/node_modules/\"; fi && pnpm --dir \"$APP_DIR\" dev"]
