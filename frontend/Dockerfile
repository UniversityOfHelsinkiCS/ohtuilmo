# specify base image
FROM docker.io/library/node:24-alpine

# npm run build needs this set when building so
# it needs to be set as a build argument, not only as env var
ARG NODE_ENV="production"

ENV TZ="Europe/Helsinki"
ENV NODE_ENV=$NODE_ENV

# alpine does not include timezone data, TZ is ignored without it
RUN apk add --no-cache tzdata

WORKDIR /opt/app-root/src

# Install serve to run the app - put this first as this can be cached very well.
RUN npm install -g serve@10.1.2

# OpenShift runs the container with a random uid that belongs to the root group,
# so the app files are owned by group 0. The build itself runs as non-root node.
RUN chown node:0 /opt/app-root/src
USER node

# Copy package files separately to have them in their own cacheable layer
# and to invalidate the "RUN npm install" cache layer if the files have changed.
#
# Run "npm install" before copying src over so that if the packages remain the
# same, we can re-use the layer cache from our previous build --> no need to
# install a gigantic amount of dependencies.
COPY --chown=node:0 package*.json .

# Run "ci" instead of "install" to make sure we get exact deps we think we're
# getting. Downside is that dev deps are downloaded as well.
# As "ci" uses the $HOME/.npm package cache, we can tell Travis to cache that.
RUN npm ci --production=false

COPY --chown=node:0 . .

RUN npm run build

EXPOSE 3000

# Set entrypoint to serve the app we just built
CMD serve -s dist -p 3000
