FROM debian:trixie AS babel-base

RUN apt-get update && apt-get install -y --no-install-recommends \
  autoconf \
  bison \
  build-essential \
  cpanminus \
  curl \
  file \
  git \
  imagemagick \
  libapache-session-perl \
  libcgi-compile-perl \
  libcgi-emulate-psgi-perl \
  libcgi-psgi-perl \
  libconfig-tiny-perl \
  libdata-page-perl \
  libdate-calc-perl \
  libdate-manip-perl \
  libdbd-mysql-perl \
  libdevel-cover-perl \
  libfcgi-perl \
  libfcgi-procmanager-perl \
  libfile-slurp-perl \
  libimage-exiftool-perl \
  libimage-info-perl \
  libimage-size-perl \
  libio-string-perl \
  libipc-run-perl \
  libip-geolocation-mmdb-perl \
  libjson-xs-perl \
  liblist-moreutils-perl \
  libmailtools-perl \
  libmime-types-perl \
  libnet-cidr-lite-perl \
  libnet-dns-perl \
  libplack-perl \
  libplack-builder-conditionals-perl \
  libprometheus-tiny-shared-perl \
  libtest-class-perl \
  libtest-lwp-useragent-perl \
  libtry-tiny-perl \
  liburi-perl \
  libuuid-perl \
  libuuid-tiny-perl \
  libxml-libxml-perl \
  libxml-libxslt-perl \
  libyaml-perl \
  libyaml-libyaml-perl \
  netpbm \
  perl \
  procps \
  starman \
  unzip \
  uuid-dev \
  zip \
  zlib1g-dev

RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://apt.lib.umich.edu/mlibrary-archive-keyring.gpg -o /etc/apt/keyrings/mlibrary-archive-keyring.gpg

RUN echo "deb [signed-by=/etc/apt/keyrings/mlibrary-archive-keyring.gpg] https://apt.lib.umich.edu trixie main" > /etc/apt/sources.list.d/mlibrary.list

RUN apt-get update && apt-get install -y --no-install-recommends grokj2k

RUN cpanm --notest \
  File::Pairtree

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

# Util used for testing and connecting to fast-cgi
RUN apt-get -y install --no-install-recommends libfcgi0ldbl libfcgi-bin


WORKDIR /htapps/babel/imgsrv
CMD ["/htapps/babel/imgsrv/bin/startup_imgsrv"]

FROM babel-base AS perl-dev

RUN apt-get -y install libanyevent-perl libclass-refresh-perl libcompiler-lexer-perl \
  libdata-dump-perl libio-aio-perl libjson-perl libmoose-perl libpadwalker-perl \
  libscalar-list-utils-perl libcoro-perl

RUN cpanm --notest Perl::LanguageServer

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
