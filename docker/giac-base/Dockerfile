FROM base/archlinux
RUN pacman -Sy
# RUN echo "1:yes" | sed s/:/\\n/g | pacman -S giac
RUN pacman -S --noconfirm texlive-most
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

ENTRYPOINT ["/bin/bash"]
