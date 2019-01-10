FROM node:10.15.0-stretch-slim

WORKDIR /perftestjs
COPY . /perftestjs

RUN apt-get update && \
    apt-get install vim -y && \
    npm install