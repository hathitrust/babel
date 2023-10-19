FROM debian:bookworm AS babel-base

# # does not work bookworm - evaluate if it's needed
# RUN sed -i 's/main.*/main contrib non-free/' /etc/apt/sources.list

RUN apt-get update && apt-get install -y \
  autoconf \
  bison \
  build-essential \
  cpanminus \
  curl \
  file \
  git \
  grokj2k-tools \
  imagemagick \
  libapache-session-perl \
  libconfig-tiny-perl \
  libdata-page-perl \
  libdate-calc-perl \
  libdate-manip-perl \
  libdbd-mysql-perl \
  libdevel-cover-perl \
  libfcgi-perl \
  libfcgi-procmanager-perl \
  libimage-exiftool-perl \
  libimage-info-perl \
  libimage-size-perl \
  libio-string-perl \
  libipc-run-perl \
  libjson-xs-perl \
  liblist-moreutils-perl \
  libmailtools-perl \
  libmime-types-perl \
  libnet-dns-perl \
  libplack-perl \
  libtest-class-perl \
  libtry-tiny-perl \
  libxml-libxml-perl \
  libxml-libxslt-perl \
  libyaml-libyaml-perl \
  netcat-traditional \
  netpbm \
  perl \
  procps \
  starman \
  unzip \
  uuid-dev \
  zip \
  zlib1g-dev

RUN cpanm --notest \
  File::Pairtree \
  URI::Escape \
  CGI::PSGI \
  IP::Geolocation::MMDB \
  UUID \
  UUID::Tiny \
  YAML::Any

WORKDIR /htapps/babel/geoip
ADD --chmod=644 https://github.com/maxmind/MaxMind-DB/blob/main/test-data/GeoIP2-Country-Test.mmdb?raw=true GeoIP2-Country.mmdb

RUN ln -s /tmp /ram

RUN mkdir -p /l/local/bin
RUN ln -s /usr/bin/unzip /l/local/bin/unzip
RUN ln -s /usr/bin/convert /l/local/bin/convert
RUN ln -s /usr/bin/plackup /l/local/bin/plackup
RUN /bin/bash -c 'for cmd in pamflip jpegtopnm tifftopnm bmptopnm pngtopam ppmmake pamcomp pnmscalefixed pamscale pnmrotate pnmpad pamtotiff pnmtotiff pnmtojpeg pamrgbatopng ppmtopgm pnmtopng; do ln -s /usr/bin/$cmd /l/local/bin; done'

RUN mkdir /htapps/babel/cache
RUN chmod 4777 /htapps/babel/cache

RUN mkdir /htapps/babel/logs
RUN chmod 4777 /htapps/babel/logs

RUN ln -s /htapps/babel /htapps/test.babel
RUN cd /htapps/babel

WORKDIR /htapps/babel

FROM babel-base AS imgsrv-fcgi

WORKDIR /htapps/babel/imgsrv
CMD ["/htapps/babel/imgsrv/bin/startup_imgsrv"]

FROM babel-base AS test

WORKDIR /htapps/babel

FROM babel-base AS apache

RUN apt-get -y install apache2 libapache2-mod-fcgid

RUN a2dissite '*'
RUN a2disconf other-vhosts-access-log
RUN a2dismod 'mpm_*'
RUN a2enmod headers \ 
            mpm_prefork \
            rewrite \
            proxy \
            proxy_fcgi \
            proxy_http \
            cgi

COPY apache/000-default.conf /etc/apache2/sites-enabled
STOPSIGNAL SIGWINCH

COPY apache/apache.sh /
RUN chmod +x /apache.sh
ENTRYPOINT ["/apache.sh"]
