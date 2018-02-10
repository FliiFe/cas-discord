FROM base/archlinux
RUN pacman -Sy
RUN echo "1:yes" | sed s/:/\\n/g | pacman -S giac
RUN pacman -S --noconfirm texlive-most
RUN pacman -S --noconfirm imagemagick
# RUN pacman -S --noconfirm texlive-lang

RUN mkdir /var/workspace
# For debugging purposes, mount this file with -v
COPY ./render.sh /usr/bin/render.sh

ENTRYPOINT ["/usr/bin/render.sh"]
