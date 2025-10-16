(async()=>{
  const $ = s=>document.querySelector(s);
  const $$ = s=>document.querySelectorAll(s);

  // -------------------- Tabs --------------------
  $$('.tabBtn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.tabBtn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      setTab(btn.dataset.tab);
    });
  });

  function setTab(tabId){
    $$('.tab').forEach(t=>t.classList.remove('active'));
    const t = document.getElementById(tabId);
    if(t) t.classList.add('active');
  }

  // -------------------- Accent Color --------------------
  const accentInput = $('#accentColor');
  accentInput.addEventListener('input', ()=>{
    document.querySelectorAll('.btn, .tabBtn.active').forEach(el=>{
      el.style.backgroundColor = accentInput.value;
    });
  });

  // -------------------- Particles --------------------
  const canvas = $('#particles');
  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  const particles=[];
  for(let i=0;i<120;i++){
    particles.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*2+1,dx:(Math.random()-0.5)*0.5,dy:(Math.random()-0.5)*0.5});
  }

  function animateParticles(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle=accentInput.value||'#800000';
    particles.forEach(p=>{
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();
      p.x+=p.dx;p.y+=p.dy;
      if(p.x>W||p.x<0)p.dx*=-1;
      if(p.y>H||p.y<0)p.dy*=-1;
    });
    requestAnimationFrame(animateParticles);
  }
  animateParticles();
  window.addEventListener('resize',()=>{W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight;});

  // -------------------- Spotify --------------------
  let spotifyToken=null;
  async function getToken(){
    if(spotifyToken) return spotifyToken;
    try{
      const res=await fetch('/get-token');
      const data=await res.json();
      spotifyToken=data.token;
      return spotifyToken;
    }catch(e){
      alert('Please connect Spotify first!');
      return null;
    }
  }

  $('#connectSpotify').addEventListener('click', ()=>{
    window.open('/login','_blank');
    alert('After approving Spotify, wait a few seconds and refresh the page.');
  });

  async function fetchPlaylists(){
    const token=await getToken();
    if(!token) return;
    const res=await fetch('https://api.spotify.com/v1/me/playlists',{headers:{Authorization:'Bearer '+token}});
    const data=await res.json();
    const select=$('#playlistSelect');
    select.innerHTML='';
    data.items.forEach(p=>{
      const opt=document.createElement('option');
      opt.value=p.id;
      opt.textContent=p.name;
      select.appendChild(opt);
    });
  }

  // Load playlists on start
  setTimeout(fetchPlaylists,2000);

  // -------------------- Bingo Card --------------------
  $('#generateBtn').addEventListener('click', async ()=>{
    const playlistId=$('#playlistSelect').value;
    if(!playlistId){alert('Select a playlist');return;}
    const numCards=parseInt($('#numCards').value)||1;
    const token=await getToken();
    const tracksRes=await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`,{headers:{Authorization:'Bearer '+token}});
    const data=await tracksRes.json();
    const songs=data.items.map(i=>i.track.name);

    $('#cardPreview').innerHTML='';

    for(let c=0;c<numCards;c++){
      const canvas=document.createElement('canvas');
      canvas.width=2480; canvas.height=3508;
      const ctx=canvas.getContext('2d');
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='#800000'; ctx.font='bold 80px League Spartan'; ctx.textAlign='center';
      ctx.fillText('Karaoke Bingo', canvas.width/2, 150);

      const gridSize=5;
      const cellWidth=canvas.width/6;
      const cellHeight=(canvas.height-300)/6;
      ctx.strokeStyle='#000'; ctx.lineWidth=4;
      ctx.font='bold 36px League Spartan';
      for(let r=0;r<gridSize;r++){
        for(let c2=0;c2<gridSize;c2++){
          const x=(c2+1)*cellWidth;
          const y=200+r*cellHeight;
          ctx.strokeRect(x,y,cellWidth,cellHeight);
          const song=songs[Math.floor(Math.random()*songs.length)];
          ctx.fillStyle='#000';
          ctx.fillText(song,x+cellWidth/2,y+cellHeight/2);
        }
      }

      $('#cardPreview').appendChild(canvas);
    }
  });

})();
