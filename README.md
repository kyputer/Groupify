# Groupify
A crowdsourced, crowdcurated DJ!
Created at DandyHacks 2017!

# .env Setup
Ensure to configure this file with Spotify and MariaDB credentials prior to deployment.

# mariadb Setup
- mariadb -u root -p
- create user 'groupify'@localhost identified by 'groupify'
- grant all privileges on groupify.* to groupify@localhost;
- flush privileges;

```
USERNAME=groupify
PASSWORD=

SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=

SPOTIFY_ACCESS_TOKEN=

SPOTIFY_PLAYLIST_ID=
SPOTIFY_USER_ID=

TIME_STAMP=0
```

# Setup
## Arch Linux
* npm install
* systemctl start mariadb
* npm start
## Amazon Linux
* npm install
* sudo service mariadb start
* npm start

## Logging and Timeout

All routes now include logging for each request and a timeout mechanism to prevent requests from hanging indefinitely. If a request takes longer than 10 seconds, it will be terminated with a 504 status code.

# TODO
- [ ] dynamic refresh
- [ ] drop-down song search
- [ ] masonary UI
- [ ] different parties

Enjoy :)
