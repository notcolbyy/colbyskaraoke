import express from 'express';
import fetch from 'node-fetch';
import open from 'open';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8000;

const CLIENT_ID = 'd8228447a53648458dc7d27ff4bfe9ea';
const CLIENT_SECRET = 'd7b8e4117ee34a3f9a55aa1f13e58731';
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;

let spotifyToken = null;

app.use(express.static(path.join(__dirname)));

app.get('/login', (req, res) => {
  const scopes = 'playlist-read-private playlist-read-collaborative';
  const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(url);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  if (!code) return res.send('No code received');

  const body = new URLSearchParams();
  body.append('grant_type', 'authorization_code');
  body.append('code', code);
  body.append('redirect_uri', REDIRECT_URI);
  body.append('client_id', CLIENT_ID);
  body.append('client_secret', CLIENT_SECRET);

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body
    });
    const data = await tokenRes.json();
    spotifyToken = data.access_token;
    console.log('Spotify access token received!');
    res.send('<h2>Spotify connected! Close this tab and return to the dashboard.</h2>');
  } catch (err) {
    console.error(err);
    res.send('Error retrieving token');
  }
});

app.get('/get-token', (req, res) => {
  if (!spotifyToken) return res.status(401).json({ error: 'No token' });
  res.json({ token: spotifyToken });
});

app.listen(PORT, () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
  open(`http://127.0.0.1:${PORT}/index.html`);
});
