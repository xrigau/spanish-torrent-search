# spanish-torrent-search

A small scraper that searches for torrents in a spanish torrents website and lets you download them directly to your transmission torrent client.

## How to use

Install nodejs and npm.

```bash
# Clone this repository
git clone https://github.com/xrigau/spanish-torrent-search

# Go into the repository
cd spanish-torrent-search

# Add your config file
nano "transmission-config.json"

# It should look like:
{
  "host": "localhost",
  "username": "john_doe",
  "password": "123456"
}

# Install dependencies and run the app
npm install && npm start
```

Disclaimer: This is just an example for experimentation and demo purposes, I don't own or relate to the website used for this example, use at your own risk.