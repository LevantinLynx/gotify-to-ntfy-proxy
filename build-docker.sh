#!/bin/bash
echo "INFO: The container will always be built with the latest tag!";
if read -rp "Please enter version number to tag Docker build with (e.g. v1.0.0): " dockerVersionTag ;then
  echo 'Logging into docker registry…';
  docker login;

  text="Building multi arch package with tag \"${dockerVersionTag}\" and pushing to registry…";
  echo $text;
  docker buildx build --platform linux/arm64,linux/arm64/v8,linux/arm/v8,linux/arm/v7 -t levantinlynx/gotify-to-ntfy-proxy:$dockerVersionTag -t levantinlynx/gotify-to-ntfy-proxy:latest --push .

  echo "Done building & pushing to registry.";
fi
