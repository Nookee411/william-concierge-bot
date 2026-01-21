FROM node:24-alpine3.20
ENV NODE_ENV=development

WORKDIR /app

EXPOSE 8000
RUN yarn
CMD ["yarn", "start:dev"]
