FROM ruby:3.2

# from https://docs.docker.com/engine/install/debian/

RUN echo "setting up docker apt repo"; \
    install -m 0755 -d /etc/apt/keyrings; \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg; \
    chmod a+r /etc/apt/keyrings/docker.gpg; \
    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      tee /etc/apt/sources.list.d/docker.list

RUN apt-get update && apt-get install -y docker-ce-cli docker-buildx-plugin docker-compose-plugin rsync

WORKDIR /usr/src/babel/stage-item

ENV BUNDLE_PATH /gems

CMD /bin/bash
