# Gotify to Ntfy Relay Proxy
This is intended to be used with Proxmox v8+ to get Ntfy integration with the "new" notification system. At time of writing there is no native Ntfy integration in Proxmox.

## Proxmox settings
Go to Datacenter > Notifications > Add > Gotify

In this example the proxy is running on "http://10.0.0.6:8008" topic on Ntfy is "your_topic_name" and the notify token is "tk_yoursupersecretntfytoken".

<img src="imgs/gotify-to-ntfy-proxy-1.png" alt="How to add Gotiy to Ntfy Proxy in Proxmox" width="633" style="max-width:100%;">

After adding the proxy create a "Notification Matcher" or edit the default one.
The proxy also works with Proxmox Backup Server since it uses the same notification system as Proxmox.


## Example .env file
```env
NODE_ENV=production

RELAY_HOST_IP=0.0.0.0
RELAY_PORT=8008

NTFY_SERVER=https://ntfy.sh
```

## Example topic.js file
```javascript
const topics = {
  you_topic_name_one: {
    ntfyToken: 'tk_yoursupersecretntfytoken'
  },
  you_topic_name_two: {
    ntfyToken: 'tk_yoursupersecretntfytoken'
  },
}

module.exports = topics
```

## Run local

Ensure node v20+ and yarn 1.22+ are installed

```bash
git clone https://github.com/LevantinLynx/gotify-to-ntfy-proxy.git

cd gotify-to-ntfy-proxy

cp .env.defaut .env
# Edit .env file

cp topics.defaut.js topics.js
# Edit tocics.js file
# MAKE SURE THIS IS SAVE! IT CONTAINS YOUR NTFY TOKEN/S.

yarn install

yarn start
```

## Docker
```bash
docker run \
  -p 8008:8008 \
  -v /path/to/your/.env:/home/node/app/.env \
  -v /path/to/your/topics.js:/home/node/app/topics.js \
  --restart unless-stopped \
  levantinlynx/gotify-to-ntfy-proxy:latest
```

Optionally you can also pass the environment variables instead of using the .env file or use docker compose.

```docker
version: '3.9'
services:
  gotify-to-ntfy-proxy:
    image: 'levantinlynx/gotify-to-ntfy-proxy:latest'
    restart: unless-stopped
    volumes:
      - '/path/to/your/topics.js:/home/node/app/topics.js'
    ports:
      - '8008:8008'
    environment:
      - RELAY_HOST_IP=0.0.0.0
      - RELAY_PORT=8008
      - NTFY_SERVER=https://notify.sh

```

If no environment file or variables are provided, the service will start with the following default values:

```env
NODE_ENV=production
RELAY_HOST_IP=0.0.0.0
RELAY_PORT=8008
NTFY_SERVER=https://ntfy.sh
```