FROM giac-base

WORKDIR /var/workspace/giac

COPY ./patches /var/workspace/giac/patches

RUN for i in patches/*; do patch -p1 <$i; done

RUN make -j$(nproc)
RUN make install
RUN make clean

ENTRYPOINT ["/bin/bash"]
