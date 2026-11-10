FROM nginx:alpine
COPY *.html *.css *.js *.svg /usr/share/nginx/html/
EXPOSE 80
