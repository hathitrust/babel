# FROM hathitrust/feed_base:bullseye

FROM debian:bookworm

RUN apt-get update && apt-get install -y \
  build-essential \
  cpanminus \
  curl \
  file \
  libapache-session-perl \
  libcgi-pm-perl \
  libconfig-tiny-perl \
  libdate-calc-perl \
  libdate-manip-perl \
  libdbd-mysql-perl \
  libdevel-cover-perl \
  libipc-run-perl \
  libjson-xs-perl \
  libmailtools-perl \
  libtest-class-perl \
  libwww-perl \
  libxml-libxml-perl \
  libxml-libxslt-perl \
  netcat-traditional \
  perl \
  procps \
  unzip \
  zip

RUN cpanm --notest \
  File::Pairtree \
  Prometheus::Tiny::Shared

RUN ln -s /tmp /ram

RUN mkdir -p /l/local/bin
RUN ln -s /usr/bin/unzip /l/local/bin/unzip

WORKDIR /htapps/babel/slip

RUN ln -s /htapps/babel /htapps/test.babel
RUN cd /htapps/babel

COPY . /htapps/babel/slip
RUN ln -s slip/vendor/common-lib/lib ../mdp-lib
RUN ln -s imgsrv/web/common-web ../mdp-web
