FROM base/archlinux
RUN pacman -Sy
# RUN echo "1:yes" | sed s/:/\\n/g | pacman -S giac
RUN pacman -S --noconfirm texlive-most
RUN pacman -S --noconfirm imagemagick
RUN echo "all" | pacman -S --noconfirm git wget base-devel
RUN pacman -S --noconfirm fltk
RUN pacman -S --noconfirm hevea
# RUN pacman -S --noconfirm texlive-lang

RUN mkdir /var/workspace

WORKDIR /var/workspace

RUN wget "http://www-fourier.ujf-grenoble.fr/~parisse/debian/dists/stable/main/source/giac_1.4.9-69.tar.gz"

RUN tar zxf giac*.tar.gz && mv giac-* giac

WORKDIR /var/workspace/giac

RUN sed -i "/curlbuild/d" ./src/misc.cc
RUN ./configure && make -j$(nproc)

COPY ./patches /var/workspace/giac/patches

RUN for i in patches/*; do patch -p1 <$i; done
# Two different makes to keep first make's cache across docker builds
RUN make -j$(nproc)
RUN make install

WORKDIR /var/workspace

COPY ./render.sh /usr/bin/render.sh

ENTRYPOINT ["/usr/bin/render.sh"]
