FROM mhart/alpine-node:7
MAINTAINER Nosebit Dev Team <dev@nosebit.com>

# Install dev dependencies
RUN build_pkgs="gcc g++ python git autoconf automake boost libtool flex bison" && \
    run_pkgs="make bash" && \
    apk --update add ${build_pkgs} ${run_pkgs}

# Install thrift
#RUN cd /tmp && \
#    git clone -b THRIFT-4010 https://github.com/nosebit/thrift.git && \
#    cd thrift && \
#    ./bootstrap.sh && \
#    ./configure --with-lua=no && \
#    make && \
#    make install

# Set working directory
WORKDIR /home

# Move code to container
ADD . ./

# Install npm global dependencies
RUN npm install -g nodemon mocha gulp-cli

# Install npm local dependencies
RUN npm install

# Remove build packages
RUN apk del ${build_pkgs}

# Set environment variables
ENV PORT 9000
ENV CHECK_PORT 8000

# The main entrypoint
ENTRYPOINT ["make"]

# The main command of this container (can be overrided by clients)
CMD ["prod"]
