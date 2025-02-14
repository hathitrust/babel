FROM debian:bullseye

RUN sed -i 's/main.*/main contrib non-free/' /etc/apt/sources.list

RUN apt-get update && apt-get install -y \
  autoconf \
  bison \
  build-essential \
  cpanminus \
  curl \
  file \
  git \
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
  netpbm \
  perl \
  procps \
  starman \
  unzip \
  uuid-dev \
  zip \
  zlib1g-dev

RUN apt-get install -y \
  autoconf \
  bison \
  build-essential \
  git \
  libdevel-cover-perl \
  libffi-dev \
  libgdbm-dev \
  libncurses5-dev \
  libperl-critic-perl \
  libreadline6-dev \
  libsqlite3-dev \
  libssl-dev \
  libyaml-dev \
  openssh-server \
  unzip \
  wget \
  zip \
  zlib1g-dev

RUN cpanm --notest \
  Devel::Cover::Report::Coveralls \
  File::Pairtree \
  URI::Escape \
  CGI::PSGI \
  IP::Geolocation::MMDB \
  UUID \
  UUID::Tiny \
  YAML::Any


ENV SDRROOT /htapps/babel
WORKDIR "${SDRROOT}/ls"
