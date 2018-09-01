FROM giac-custom

RUN pacman -S --noconfirm imagemagick

RUN mkdir -p /var/workspace

WORKDIR /var/workspace

COPY ./render.sh /usr/bin/render.sh

ENTRYPOINT ["/usr/bin/render.sh"]
