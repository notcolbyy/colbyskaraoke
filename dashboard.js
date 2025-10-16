// dashboard.js — final polished behavior with Print All Cards

(() => {
  // ---- elements ----
  const tabs = document.querySelectorAll('.tab-btn');
  const tabSections = document.querySelectorAll('.tab');
  const connectSpotifyBtn = document.getElementById('connectSpotify');
  const playlistSelect = document.getElementById('playlistSelect');
  const generateBtn = document.getElementById('generateBtn');
  const numCardsInput = document.getElementById('numCards');
  const bingoPreview = document.getElementById('bingoPreview');
  const downloadAllBtn = document.getElementById('downloadAllBtn');

  const singerName = document.getElementById('singerName');
  const songTitle = document.getElementById('songTitle');
  const addToQueueBtn = document.getElementById('addToQueue');
  const clearQueueBtn = document.getElementById('clearQueue');
  const queueList = document.getElementById('queueList');

  const accentColorInput = document.getElementById('accentColor');
  const manualTokenInput = document.getElementById('manualToken');
  const saveTokenBtn = document.getElementById('saveToken');

  // ---- state ----
  let spotifyToken = localStorage.getItem('spotifyToken') || null;
  let playlists = [];

  // ---- TAB SWITCHING ----
  tabs.forEach(btn => btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    tabSections.forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.dataset.tab;
    document.getElementById(id).classList.add('active');
  }));

  // ---- accent color persistence ----
  const savedAccent = localStorage.getItem('accentColor');
  if (savedAccent) {
    document.documentElement.style.setProperty('--accent', savedAccent);
    accentColorInput.value = savedAccent;
  }
  accentColorInput.addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--accent', e.target.value);
    localStorage.setItem('accentColor', e.target.value);
  });

  // ---- Spotify connect (server-assisted) ----
  connectSpotifyBtn.addEventListener('click', () => {
    window.open('/login', '_blank', 'width=600,height=700');
    alert('A login tab opened. After approving, wait a few seconds and the dashboard will obtain the token automatically.');
    pollForToken();
  });

  saveTokenBtn && saveTokenBtn.addEventListener('click', () => {
    const t = manualTokenInput.value.trim();
    if (!t) return alert('Paste a token first.');
    spotifyToken = t;
    localStorage.setItem('spotifyToken', t);
    fetchPlaylists();
    alert('Saved token locally.');
  });

  async function pollForToken(attempts = 0) {
    try {
      const res = await fetch('/get-token');
      if (res.ok) {
        const data = await res.json();
        spotifyToken = data.token;
        localStorage.setItem('spotifyToken', spotifyToken);
        fetchPlaylists();
        return;
      }
    } catch (e) { }
    if (attempts < 40) setTimeout(() => pollForToken(attempts + 1), 1000);
  }

  if (spotifyToken) fetchPlaylists();

  async function fetchPlaylists() {
    if (!spotifyToken) return;
    try {
      const res = await fetch('https://api.spotify.com/v1/me/playlists', { headers: { Authorization: 'Bearer ' + spotifyToken } });
      const data = await res.json();
      playlists = (data.items || []).map(p => ({ id: p.id, name: p.name }));
      renderPlaylists();
    } catch (e) { console.warn('Playlist fetch failed', e); }
  }

  function renderPlaylists() {
    playlistSelect.innerHTML = '';
    if (!playlists.length) {
      const opt = document.createElement('option'); opt.textContent = '(no playlists)';
      playlistSelect.appendChild(opt);
      return;
    }
    playlists.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      playlistSelect.appendChild(opt);
    });
  }

  // ---- Bingo card generation ----
  function wrapTextToLines(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const test = line ? (line + ' ' + words[n]) : words[n];
      const metrics = ctx.measureText(test);
      if (metrics.width > maxWidth && line) {
        lines.push(line);
        line = words[n];
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  async function generateCardCanvas(songPool, logoURL = null) {
    const W = 2480, H = 3508;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);

    // header
    const headerH = 220;
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#800000';
    ctx.fillRect(0, 0, W, headerH);

    // optional logo
    if (logoURL) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = logoURL;
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
        const imgH = headerH - 40;
        const imgW = imgH * (img.width / img.height);
        ctx.drawImage(img, 60, (headerH - imgH) / 2, imgW, imgH);
      } catch (e) { }
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Karaoke Bingo', W / 2, headerH / 2 + 10);

    const pool = Array.from(new Set(songPool)).slice();
    while (pool.length < 24) pool.push('—');

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picked = pool.slice(0, 24);

    const gridW = W - 180;
    const gridX = 90;
    const gridY = headerH + 80;
    const cell = Math.floor(gridW / 5);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.textAlign = 'center';
    const fontSize = 40;
    const lineHeight = Math.floor(fontSize * 1.15);

    let idx = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const x = gridX + c * cell;
        const y = gridY + r * cell;
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(x, y, cell, cell);

        ctx.fillStyle = '#000';
        ctx.font = `${fontSize}px Arial`;

        if (r === 2 && c === 2) {
          ctx.font = `bold ${fontSize + 6}px Arial`;
          ctx.fillText('FREE', x + cell / 2, y + cell / 2);
        } else {
          const text = picked[idx++] || '';
          const lines = wrapTextToLines(ctx, text, cell - 40);
          const totalH = lines.length * lineHeight;
          let startY = y + (cell / 2) - (totalH / 2) + (lineHeight / 2);
          for (let li = 0; li < lines.length; li++) {
            ctx.fillText(lines[li], x + cell / 2, startY + li * lineHeight);
          }
        }
      }
    }

    return canvas;
  }

 generateBtn.addEventListener('click', async () => {
  const num = Math.max(1, Math.min(20, parseInt(numCardsInput.value) || 1));
  bingoPreview.innerHTML = ''; // clear previous previews

  // fetch songs from playlist if connected
  const playlistId = playlistSelect.value;
  let songPool = [];
  if (playlistId && spotifyToken) {
    try {
      const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`, { headers: { Authorization: 'Bearer ' + spotifyToken }});
      const data = await res.json();
      songPool = data.items.map(it => it.track && it.track.name ? `${it.track.name}` : '').filter(Boolean);
    } catch(e){ console.warn('Playlist tracks fetch failed', e); }
  }
  if (!songPool.length) {
    songPool = [
      "Sweet Caroline","Bohemian Rhapsody","Don't Stop Believin'","Livin' on a Prayer",
      "Uptown Funk","Shallow","Toxic","Hey Jude","Rolling in the Deep","I Will Survive",
      "Mr Brightside","Dancing Queen","Bad Guy","Shape of You","All Star","Call Me Maybe",
      "Shake It Off","Let It Go","Someone Like You","Piano Man","Take On Me","Come Together",
      "Billie Jean","Wonderwall","Smells Like Teen Spirit"
    ];
  }

  for (let i=0; i<num; i++) {
    const canvas = await generateCardCanvas(songPool, 'logo.png'); // full-res canvas
    const preview = document.createElement('canvas');
    const scale = 0.2; // scale down for preview
    preview.width = canvas.width * scale;
    preview.height = canvas.height * scale;
    preview.getContext('2d').drawImage(canvas, 0, 0, preview.width, preview.height);
    preview.classList.add('card');
    preview.dataset.fullCanvas = canvas.toDataURL(); // store high-res for printing
    bingoPreview.appendChild(preview);
  }
});

 // ---- Print All Cards (wait for images to load) ----
downloadAllBtn.addEventListener('click', () => {
  const canvases = document.querySelectorAll('#bingoPreview canvas.card');
  if (!canvases.length) return alert('No cards to print!');

  const printWin = window.open('', '', 'width=1000,height=800');
  printWin.document.write('<html><head><title>Print Bingo Cards</title>');
  printWin.document.write('<style>body{margin:0;padding:0;}img{page-break-after:always;width:100%;height:auto;}</style></head><body>');

  const images = [];
  canvases.forEach(c => {
    const fullData = c.dataset.fullCanvas;
    if (fullData) {
      const img = printWin.document.createElement('img');
      img.src = fullData;
      images.push(img);
      printWin.document.body.appendChild(img);
    }
  });

  // wait for all images to load before printing
  const promises = images.map(img => new Promise(res => { img.onload = res; img.onerror = res; }));
  Promise.all(promises).then(() => {
    printWin.focus();
    printWin.print();
  });
});


  // ---- Queue ----
  const QUEUE_KEY = 'karaoke_queue_v1';
  let queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');

  function saveQueue() { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); }
  function renderQueue() {
    queueList.innerHTML = '';
    if (!queue.length) { queueList.innerHTML = '<div class="muted">Queue empty</div>'; return; }
    queue.forEach((entry, idx) => {
      const div = document.createElement('div');
      div.className = 'queue-item';
      div.innerHTML = `<div class="meta"><div class="name">${escapeHtml(entry.name)}</div><div class="song">${escapeHtml(entry.song)}</div></div>`;
      const right = document.createElement('div');
      const doneBtn = document.createElement('button'); doneBtn.className='btn outline'; doneBtn.textContent='Done';
      const removeBtn = document.createElement('button'); removeBtn.className='btn outline'; removeBtn.textContent='Remove';
      doneBtn.addEventListener('click', () => { div.style.opacity='0.5'; div.style.textDecoration='line-through'; });
      removeBtn.addEventListener('click', () => { queue.splice(idx,1); saveQueue(); renderQueue(); });
      right.appendChild(doneBtn); right.appendChild(removeBtn);
      div.appendChild(right);
      queueList.appendChild(div);
    });
  }

  addToQueueBtn && addToQueueBtn.addEventListener('click', () => {
    const name = (singerName && singerName.value || '').trim();
    const song = (songTitle && songTitle.value || '').trim();
    if (!name || !song) { alert('Please enter both name and song'); return; }
    queue.push({ name, song });
    saveQueue(); renderQueue();
    if (singerName) singerName.value=''; if (songTitle) songTitle.value='';
  });

  clearQueueBtn && clearQueueBtn.addEventListener('click', () => {
    if (!confirm('Clear the entire queue?')) return;
    queue = []; saveQueue(); renderQueue();
  });

  function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  renderQueue();

  // ---- Particles ----
  const pcanvas = document.getElementById('particles');
  const pctx = pcanvas.getContext('2d');
  let W = pcanvas.width = window.innerWidth;
  let H = pcanvas.height = window.innerHeight;
  window.addEventListener('resize', ()=>{ W=pcanvas.width=window.innerWidth; H=pcanvas.height=window.innerHeight; initParticles(); });

  let particles = [];
  function initParticles(){
    particles = [];
    for(let i=0;i<90;i++){
      particles.push({ x:Math.random()*W, y:Math.random()*H, r:Math.random()*2+0.6, vx:(Math.random()-0.5)*0.3, vy:(Math.random()-0.5)*0.3, color: Math.random()>.6?'#8b0000':'#520000' });
    }
  }
  function drawParticles(){
    pctx.clearRect(0,0,W,H);
    particles.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<-10)p.x=W+10;if(p.x>W+10)p.x=-10;
      if(p.y<-10)p.y=H+10;if(p.y>H+10)p.y=-10;
      pctx.beginPath();
      pctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      pctx.fillStyle=p.color;
      pctx.shadowBlur=10;
      pctx.shadowColor=p.color;
      pctx.fill();
    });
    requestAnimationFrame(drawParticles);
  }
  initParticles(); drawParticles();

  // ---- Init ----
  (function init() {
    const localTok = localStorage.getItem('spotifyToken');
    if(localTok){ spotifyToken = localTok; fetchPlaylists(); }
    pollForToken();
  })();
})();
