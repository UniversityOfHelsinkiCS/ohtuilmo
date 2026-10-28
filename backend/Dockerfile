# Set base image
FROM docker.io/library/node:24-alpine

# Set NODE_ENV to the image at the build stage
ARG NODE_ENV="production"

# Set timezone and working directory for the app in container
ENV TZ="Europe/Helsinki"
ENV NODE_ENV=$NODE_ENV

# alpine does not include timezone data, TZ is ignored without it
RUN apk add --no-cache tzdata

WORKDIR /opt/app-root/src

# OpenShift runs the container with a random uid that belongs to the root group,
# so the app files are owned by group 0. The build itself runs as non-root node.
RUN chown node:0 /opt/app-root/src
USER node

# Copy package.json to container's /app directory and install dependencies
COPY --chown=node:0 package* ./
RUN npm ci --production
COPY --chown=node:0 . .

# Expose container's port 8081 to the outside
EXPOSE 8081

# Launch application
CMD [ "node", "index.js" ]
