FROM base/archlinux
RUN pacman -Sy
RUN echo "1:yes" | sed s/:/\\n/g | pacman -S giac
ENTRYPOINT ["giac"]
