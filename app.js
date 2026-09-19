(() => {
  'use strict';
  const data = window.CRICKET_PUBLIC || {};
  const pets = Array.isArray(data.pets) ? data.pets : [];
  const downloads = data.downloads || {};
  const $ = selector => document.querySelector(selector);
  const make = (tag,className,text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined && text !== null) node.textContent = text; return node; };
  const add = (node,...children) => { children.flat().filter(Boolean).forEach(child => node.append(child)); return node; };
  const revision = encodeURIComponent(data.updated_at || '20260918-motion2');
  const safe = value => { const url = String(value || '').trim(); if(/^(?:javascript|data|vbscript|file):/i.test(url))return ''; return /^(?:assets|media|downloads)\//.test(url) ? `${url}${url.includes('?')?'&':'?'}v=${revision}` : url; };
  const external = (label,url) => { const a = make('a','',label); a.href = safe(url); a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; };
  const normalize = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const roleNames = {batter:'Batter',bowler:'Bowler',keeper:'Wicketkeeper',allrounder:'All-rounder',commentator:'Commentator',umpire:'Umpire',guest:'12th man'};
  const countryLabel = pet => pet.country || (pet.role === 'guest' ? 'The Pavilion' : 'Cricket Kennel');
  const name = pet => pet.name || pet.display_name || pet.id;
  const profileKey = profile => profile.id || `${profile.dog_id}-${profile.format}`;
  const globalProfiles = Array.isArray(data.format_profiles) ? data.format_profiles : (data.format_profiles?.profiles || []);
  const profiles = [...new Map([...globalProfiles,...pets.flatMap(pet => (pet.format_profiles || []).map(profile => ({...profile,dog_id:profile.dog_id || pet.id,dog_name:profile.dog_name || name(pet)})))].map(profile => [profileKey(profile),profile])).values()];
  const state = {country:'All teammates',collection:'all',query:'',selected:null,media:'horizontal',gifPlaying:false};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dogProfiles = pet => profiles.filter(profile => profile.dog_id === pet.id);
  const usableActions = pet => (pet.actions || []).filter(action => action.src && !/running-study|running study/i.test(`${action.id} ${action.title} ${action.src}`));

  function renderHero() {
    if (!pets.length) { $('.hero-art').hidden = true; return; }
    const hero = pets.find(pet => pet.id === 'monty-spanesar') || pets.find(pet => pet.id === 'brian') || pets[0];
    const friend = pets.find(pet => pet.id === 'brian' && pet.id !== hero.id) || pets.find(pet => pet.id !== hero.id);
    $('#hero-image').src = safe(hero.portrait); $('#hero-image').alt = `${name(hero)}, ${hero.breed}, an original cricket dog.`;
    $('#hero-name').textContent = name(hero); $('#hero-breed').textContent = `${hero.breed} · ${hero.country}`; $('#hero-signature').textContent = hero.signature || '';
    if (friend) { $('#hero-friend-image').src = safe(friend.portrait); $('#hero-friend-image').alt = `${name(friend)}, an original cricket dog.`; $('#hero-friend-name').textContent = name(friend); }
    else $('.hero-small').hidden = true;
    $('#series-count').textContent = data.series_count || pets.length;
    const chosen = [pets.find(pet => pet.id === 'brian'),pets.find(pet => pet.id === 'monty-spanesar'),pets.find(pet => pet.id === 'adam-gilhound')].filter(Boolean);
    for (const pet of (chosen.length >= 3 ? chosen : pets.slice(0,3))) { const img = make('img'); img.src = safe(pet.portrait); img.alt = ''; img.loading = 'lazy'; $('#sticker-fan').append(img); }
  }

  function renderFilters() {
    const container = $('#nation-filters'); container.replaceChildren();
    for (const country of ['All teammates',...new Set(pets.map(pet => pet.country).filter(Boolean))]) {
      const button = make('button','nation-button',country); button.type = 'button'; button.setAttribute('aria-pressed',String(state.country === country));
      button.addEventListener('click',() => { state.country = country; for (const other of container.children) other.setAttribute('aria-pressed',String(other === button)); renderTeam(); }); container.append(button);
    }
  }

  function renderTeam() {
    const results = pets.filter(pet => (state.collection==='all' || (state.collection==='featured' && pet.featured) || (state.collection==='native' && pet.native) || (state.collection==='commentary' && pet.commentary) || (state.collection==='women' && pet.competition==='women' && pet.role!=='commentator')) && (state.country === 'All teammates' || pet.country === state.country) && normalize([name(pet),pet.breed,pet.player,pet.signature,pet.country,pet.role,...(pet.tags || [])].join(' ')).includes(normalize(state.query)));
    const grid = $('#team-grid'); grid.replaceChildren(); $('#result-count').textContent = `${results.length} ${results.length === 1 ? 'teammate' : 'teammates'}`;
    if (!results.length) { grid.append(make('p','empty',pets.length ? 'No teammates match that search. Try a different name, breed or nation.' : 'The first illustrated teammates will appear here as the collection arrives.')); return; }
    for (const pet of results) {
      const card = make('button','pet-card'); card.type = 'button'; card.setAttribute('aria-label',`Meet ${name(pet)}, ${pet.breed}`);
      const picture = make('div','pet-image'); const img = pet.portrait?make('img'):make('span','portrait-pending','Portrait in progress'); if(pet.portrait){img.src = safe(pet.portrait); img.alt = `${name(pet)}, ${pet.breed}`; img.width = 640; img.height = 640; img.loading = 'lazy';
        const layout = pet.portrait_layout;
        if (layout && ['width','height','left','top'].every(key => Number.isFinite(layout[key])) && layout.width > 0 && layout.height > 0) {
          picture.classList.add('has-portrait-layout');
          for (const key of ['width','height','left','top']) img.style[key] = `${layout[key]}%`;
        }
      }
      add(picture,img,make('span','pet-number',`CK / ${String(pets.indexOf(pet) + 1).padStart(2,'0')}`),make('span','pet-arrow','↗'));
      add(card,picture,make('h3','',name(pet)),make('span','pet-breed',`${pet.breed} · ${countryLabel(pet)}`),make('span','pet-role',roleNames[pet.role] || pet.role || 'Cricket companion'),make('span',`pet-availability ${pet.native?'available':''}`,pet.native?(pet.portrait?'Pet + artwork available':'Animated pet available'):pet.portrait?'Character artwork available':'Character profile · portrait in progress'));
      card.addEventListener('click',() => openCharacter(pet)); grid.append(card);
    }
  }

  function openCharacter(pet) {
    state.selected = pet.id;
    $('#character-name').textContent = name(pet); $('#character-country').textContent = `${countryLabel(pet)} · ${roleNames[pet.role] || pet.role || 'Cricketer'}`;
    $('#character-breed').textContent = `${pet.breed}${pet.inspiration_label ? ` · ${pet.inspiration_label}` : pet.player ? ` · Cricket inspiration: ${pet.player}` : ''}`;
    $('#character-signature').textContent = pet.signature || '';
    $('#character-tags').replaceChildren(...(pet.tags || []).map(tag => make('span','',tag)));
    const fact = $('#character-fact'),history=(pet.facts?.length?pet.facts:[pet.fact]).filter(f=>f?.fact);let factIndex=Math.floor(Date.now()/86400000)%Math.max(history.length,1);
    const showFact=()=>{fact.replaceChildren();fact.hidden=!history.length;if(!history.length)return;const current=history[factIndex];add(fact,make('p','eyebrow','From the cricket almanack'),make('blockquote','',current.fact),current.source_url?external(`${current.source_title||'Read the source'} ↗`,current.source_url):null);if(history.length>1){const next=make('button','fact-next','Another innings from history →');next.type='button';next.onclick=()=>{factIndex=(factIndex+1)%history.length;showFact();};fact.append(next);}};showFact();
    const commentary=$('#character-commentary');commentary.replaceChildren();commentary.hidden=!pet.commentary;
    if(pet.commentary){add(commentary,make('p','eyebrow','In the commentary box'));if(!history.some(item=>item.fact===pet.commentary.fact.fact))add(commentary,make('p','',pet.commentary.fact.fact),external(`${pet.commentary.fact.source_title} ↗`,pet.commentary.fact.source_url));add(commentary,make('p','original-dialogue',pet.commentary.caption),make('small','','Original character dialogue; not a broadcaster quotation.'));}
    const actions = [...(pet.portrait?[{id:'portrait',title:'Character portrait',src:pet.portrait}]:[]),...usableActions(pet)];
    const strip = $('#character-actions'); strip.replaceChildren();
    const show = action => { $('#character-image').src = safe(action.src); $('#character-image').alt = `${name(pet)} — ${action.title}`; $('#character-image-label').textContent = action.id === 'portrait' ? 'Character portrait · original illustration' : `${action.title.replace(/\s*·\s*illustration$/i,'')} · still artwork`; for (const button of strip.children) button.setAttribute('aria-pressed',String(button.dataset.action === action.id)); };
    for (const action of actions) { const button = make('button','character-action'); button.type = 'button'; button.dataset.action = action.id; button.setAttribute('aria-label',`View ${action.title}`); const img = make('img'); img.src = safe(action.src); img.alt = ''; img.loading = 'lazy'; add(button,img,make('span','',action.title.replace(/\s*·\s*illustration$/i,''))); button.addEventListener('click',() => show(action)); strip.append(button); }
    $('#character-image').hidden=!actions.length;if(actions.length)show(actions[0]);else{$('#character-image').removeAttribute('src');$('#character-image-label').textContent='This character’s portrait is in progress.';} strip.hidden = actions.length < 2;
    const available = dogProfiles(pet); $('#character-format-link').hidden = !available.length;
    $('#character-format-link').onclick = () => { if (available[0]) { $('#format-select').value = profileKey(available[0]); renderFormat(); } $('#character-dialog').close(); };
    $('#character-download-link').onclick = () => $('#character-dialog').close();
    $('#character-art-download').hidden=!pet.portrait;$('#character-art-download').href=safe(pet.portrait); $('#character-art-download').download=pet.id+'.webp';
    $('#character-availability').textContent=pet.native?`Animated pet available · ${pet.native.label || 'Test whites'}`:pet.portrait?'Character artwork available. A downloadable pet animation is not available yet.':'Character profile available. Portrait and pet animation are not available yet.';
    $('#character-pet-link').hidden=!pet.native;
    $('#character-pet-link').onclick=()=>{ $('#native-pet').value=pet.id; loadNative(); $('#character-dialog').close(); };
    $('#character-dialog').showModal();
  }

  function setupFormats() {
    if (!profiles.length) return;
    $('#formats').hidden = false; $('#format-count').textContent = profiles.length;
    for (const profile of profiles) { const pet = pets.find(item => item.id === profile.dog_id); const option = make('option','',`${profile.dog_name || (pet ? name(pet) : profile.player)} · ${String(profile.format).toUpperCase()} · ${profile.title}`); option.value = profileKey(profile); $('#format-select').append(option); }
    $('#format-select').addEventListener('change',renderFormat); renderFormat();
  }

  function formatBlock(title,text) { if (!text) return null; return add(make('section','format-detail-block'),make('h4','',title),make('p','',text)); }

  function renderFormat() {
    const profile = profiles.find(item => profileKey(item) === $('#format-select').value) || profiles[0]; if (!profile) return;
    const body = $('#format-body'); body.replaceChildren();
    const palette = $('#format-palette'); palette.replaceChildren();
    for (const key of ['primary','secondary','accent']) { const color = profile.kit_colors?.[key]; if (!/^#[0-9a-f]{3,8}$/i.test(color || '')) continue; const swatch = make('span','format-swatch'); swatch.style.backgroundColor = color; swatch.title = `${key}: ${color}`; swatch.setAttribute('aria-label',`${key} colour ${color}`); palette.append(swatch); }
    add(body,make('p','eyebrow',`${profile.dog_name || profile.player} · ${String(profile.format).toUpperCase()} art study`),make('h3','',profile.title),make('p','format-era',profile.era),make('p','format-difference',profile.format_difference));
    const illustration = typeof profile.illustration === 'string' ? profile.illustration : profile.illustration?.src;
    if (illustration && illustration.startsWith('assets/')) {
      const figure = make('figure','format-illustration'); const img = make('img'); img.src = safe(illustration); img.alt = `${profile.dog_name || profile.player} — ${String(profile.format).toUpperCase()} standalone portrait`; img.loading = 'lazy';
      const caption = make('figcaption'); add(caption,make('strong','','A first look at this format.'),make('span','','Standalone illustration. The action sequences below are still proposed.')); add(figure,img,caption); img.addEventListener('error',() => figure.remove(),{once:true}); body.append(figure);
    }
    const details = make('details','format-details'); add(details,make('summary','','The kit, stance and signature actions'),formatBlock('The colours',profile.kit_colors?.description),formatBlock('The stance',profile.stance),formatBlock('The cricket kit',profile.props?.default_visible));
    const actions = make('div','format-actions'); for (const action of profile.signature_actions || []) add(actions,add(make('article','format-action'),make('h4','',action.label || action.name),make('p','',action.pose))); details.append(actions); body.append(details);
    if (profile.historical_anchor) { const fact = make('aside','format-fact'); add(fact,make('blockquote','',profile.historical_anchor)); for (const source of profile.source_links || []) if (source.url) fact.append(external(`${source.title} ↗`,source.url)); body.append(fact); }
  }

  function setMedia(mode) {
    state.media = mode; state.gifPlaying = false;
    const video = $('#film-video'); video.pause(); video.removeAttribute('src'); video.load();
    $('#gif-image').hidden = true; $('#gif-image').removeAttribute('src'); $('#gif-toggle').textContent = reduced ? 'Play loop preview (motion)' : 'Play loop preview';
    const src = safe(downloads[mode]); $('#media-unavailable').hidden = Boolean(src); video.hidden = mode === 'gif' || !src; $('#gif-preview').hidden = mode !== 'gif' || !src;
    $('#film-player').classList.toggle('is-vertical',mode === 'vertical');
    video.poster = safe(`assets/film-${mode === 'vertical' ? 'vertical' : 'horizontal'}.png`);
    document.querySelectorAll('.media-switch').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.media === mode)));
    if (src && mode !== 'gif') { video.src = src; video.preload = 'metadata'; video.load(); }
    $('#media-note').textContent = mode === 'gif' ? 'The loop loads only when you choose to play it. You can stop it at any time.' : 'Press play for batting, bowling, keeping and a proper tea break.';
    const download = $('#film-download'); download.hidden = !src; if (src) { download.href = src; download.download = src.split('/').pop().split('?')[0]; download.textContent = mode === 'gif' ? 'Download the loop · GIF ↓' : `Download the ${mode === 'vertical' ? 'vertical' : 'widescreen'} film · MP4 ↓`; }
  }

  function setupMedia() {
    for (const button of document.querySelectorAll('.media-switch')) { button.hidden = !downloads[button.dataset.media]; button.addEventListener('click',() => setMedia(button.dataset.media)); }
    $('#gif-toggle').addEventListener('click',() => { state.gifPlaying = !state.gifPlaying; $('#gif-image').hidden = !state.gifPlaying; if (state.gifPlaying) $('#gif-image').src = safe(downloads.gif); else $('#gif-image').removeAttribute('src'); $('#gif-toggle').textContent = state.gifPlaying ? 'Stop loop preview' : reduced ? 'Play loop preview (motion)' : 'Play loop preview'; });
    $('#film-video').addEventListener('error',() => { $('#media-note').textContent = 'The film could not be loaded. Try the download link or choose another format.'; });
    const mode = downloads.horizontal ? 'horizontal' : downloads.vertical ? 'vertical' : downloads.gif ? 'gif' : 'horizontal'; setMedia(mode);
    document.addEventListener('visibilitychange',() => { if (document.hidden) { $('#film-video').pause(); if (state.gifPlaying) { state.gifPlaying = false; $('#gif-image').hidden = true; $('#gif-image').removeAttribute('src'); $('#gif-toggle').textContent = 'Play loop preview'; } } });
  }

  function setupDownloads() {
    const items = [
      {key:'stickers',kicker:'Little teammates, big character',title:'The sticker collection',description:'Individual character images, ready to save and turn into stickers.',label:'Download ZIP ↓'},
      {key:'reactions',kicker:'Say it with safe paws',title:'The reaction collection',description:'Cricket-flavoured artwork for the moments between messages.',label:'Download ZIP ↓'},
      {key:'gif',kicker:'A little tour of the kennel',title:'The pavilion loop',description:'A compact illustrated preview to keep or share.',label:'Download GIF ↓'}
    ];
    const grid = $('#download-grid'); grid.replaceChildren();
    for (const item of items) { if (!downloads[item.key]) continue; const card = make('a','download-card'); card.href = safe(downloads[item.key]); card.download = String(downloads[item.key]).split('/').pop(); add(card,make('span','download-kicker',item.kicker),make('h3','',item.title),make('p','',item.description),make('span','',item.label)); grid.append(card); }
    if (!grid.children.length) grid.append(make('p','empty','The first downloadable collection is on its way.'));
  }

  const nativeRows=[
    {title:'At ease',row:0,count:6,times:[280,110,110,140,140,320]},
    {title:'Take a single →',row:1,count:8,times:Array(8).fill(120)},
    {title:'Take a single ←',row:2,count:8,times:Array(8).fill(120)},
    {title:'Acknowledge',row:3,count:4,times:[140,140,140,280]},
    {title:'A little leap',row:4,count:5,times:[140,140,140,140,280]},
    {title:'Regroup',row:5,count:8,times:[140,140,140,140,140,140,140,240]},
    {title:'Await the decision',row:6,count:6,times:[150,150,150,150,150,260]},
    {title:'Work at the crease',row:7,count:6,times:[120,120,120,120,120,220]},
    {title:'Review',row:8,count:6,times:[150,150,150,150,150,280]}
  ];
  let nativeImage=null,nativeFrame=0,nativeTimer=null,nativePlaying=false,nativeLoad=0,nativeDemoTimer=null,nativeDemoPlaying=false;
  const demoSteps=[{row:0,label:'At ease',duration:2000},{row:7,label:'Working on a task',duration:3000},{row:6,label:'Needs your input',duration:3000},{row:8,label:'Reviewing the work',duration:3000},{row:4,label:'Ready to celebrate',duration:2000},{row:5,label:'Regroup after a setback',duration:2000}];
  const nativeRow=()=>nativeRows[Number($('#native-action').value)||0];
  function pauseNative(){clearTimeout(nativeTimer);clearTimeout(nativeDemoTimer);if(nativeDemoPlaying)$('#native-demo-status').textContent='Demo paused. Choose any animation to explore.';nativePlaying=false;nativeDemoPlaying=false;$('#native-play').textContent='Play animation';$('#native-play').setAttribute('aria-pressed','false');$('#native-demo').textContent='Play pet demo';$('#native-demo').setAttribute('aria-pressed','false');}
  function demoStep(index){
    if(!nativeDemoPlaying||!nativeImage)return;
    clearTimeout(nativeTimer);
    if(index>=demoSteps.length){pauseNative();$('#native-demo-status').textContent='Demo complete. Choose any animation to explore.';return;}
    const step=demoSteps[index];$('#native-action').value=String(step.row);nativeFrame=0;nativePlaying=true;
    $('#native-demo-status').textContent=`${index+1} of ${demoSteps.length} · ${step.label}`;
    $('#native-play').textContent='Pause animation';$('#native-play').setAttribute('aria-pressed','true');tickNative();
    nativeDemoTimer=setTimeout(()=>demoStep(index+1),step.duration);
  }
  function drawNative(){if(!nativeImage)return;const row=nativeRow(),ctx=$('#native-canvas').getContext('2d');ctx.clearRect(0,0,192,208);ctx.drawImage(nativeImage,nativeFrame*192,row.row*208,192,208,0,0,192,208);$('#native-frame').textContent=`${nativeFrame+1} / ${row.count}`;}
  function tickNative(){drawNative();if(nativePlaying)nativeTimer=setTimeout(()=>{nativeFrame=(nativeFrame+1)%nativeRow().count;tickNative();},nativeRow().times[nativeFrame]);}
  function loadNative(){
    pauseNative(); const token=++nativeLoad,pet=pets.find(p=>p.id===$('#native-pet').value);if(!pet?.native)return;
    nativeImage=null;nativeFrame=0;$('#native-canvas').hidden=true;$('#native-message').hidden=false;$('#native-message').textContent='Bringing your teammate onto the field…';$('#native-play').disabled=true;$('#native-step').disabled=true;$('#native-demo').disabled=true;$('#native-demo-status').textContent='Try the pet’s activity animations in this browser preview.';
    const link=$('#native-download');link.href=safe(pet.native.download);link.download=pet.native.download.split('/').pop();link.textContent=`Download ${name(pet)} ↓`;
    $('#native-size').textContent=`Free · ${(pet.native.bytes/1024/1024).toFixed(1)} MB ZIP · ChatGPT desktop + Codex CLI`;
    const img=new Image();img.onload=()=>{if(token!==nativeLoad)return;if(img.naturalWidth!==1536||img.naturalHeight!==2288){$('#native-message').textContent='This preview could not be opened.';return;}nativeImage=img;$('#native-canvas').hidden=false;$('#native-canvas').setAttribute('aria-label',`${name(pet)} animated pet preview`);$('#native-message').hidden=true;$('#native-play').disabled=false;$('#native-step').disabled=false;$('#native-demo').disabled=false;drawNative();};
    img.onerror=()=>{if(token===nativeLoad)$('#native-message').textContent='Preview could not load. Please try another pet or reload.';};img.src=safe(pet.native.src);
  }
  function setupNative(){
    const available=pets.filter(p=>p.native);$('#native-count').textContent=available.length;
    for(const pet of available){const opt=make('option','',`${name(pet)} · ${pet.country}`);opt.value=pet.id;$('#native-pet').append(opt);}
    nativeRows.forEach((row,index)=>{const opt=make('option','',row.title);opt.value=index;$('#native-action').append(opt);});
    $('#native-pet').addEventListener('change',loadNative);
    $('#native-action').addEventListener('change',()=>{pauseNative();nativeFrame=0;drawNative();});
    $('#native-play').addEventListener('click',()=>{if(nativePlaying){pauseNative();return;}if(!nativeImage)return;nativePlaying=true;$('#native-play').textContent='Pause animation';$('#native-play').setAttribute('aria-pressed','true');tickNative();});
    $('#native-step').addEventListener('click',()=>{pauseNative();nativeFrame=(nativeFrame+1)%nativeRow().count;drawNative();});
    $('#native-demo').addEventListener('click',()=>{if(nativeDemoPlaying){pauseNative();$('#native-demo-status').textContent='Demo paused. Choose any animation to explore.';return;}if(!nativeImage)return;pauseNative();nativeDemoPlaying=true;$('#native-demo').textContent='Pause pet demo';$('#native-demo').setAttribute('aria-pressed','true');demoStep(0);});
    document.querySelectorAll('.preview-backgrounds button').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.preview-backgrounds button').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));$('#native-stage').dataset.background=button.dataset.background;}));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseNative();});
    if(available.length)loadNative();else{$('#native-message').textContent='The first reviewed animated pets will appear here.';$('#native-download').hidden=true;}
  }
  function setupShareGifs(){
    const entries=data.share_gifs||[]; if(!entries.length){$('#share-gifs').hidden=true;return;}
    $('#share-gif-pack').href=safe(downloads.share_gifs);
    for(const entry of entries){const card=make('article','share-gif-card'),video=make('video');video.src=safe(entry.mp4);video.controls=true;video.playsInline=true;video.loop=true;video.preload='none';if(entry.poster)video.poster=safe(entry.poster);video.setAttribute('aria-label',entry.title+' character animation');add(card,video,make('h3','',entry.title),make('p','',`${entry.duration||4} seconds · character animation`));const links=make('div','share-links');for(const [label,key] of [['Download GIF ↓','gif'],['WhatsApp MP4 ↓','mp4']]){const a=make('a','',label);a.href=safe(entry[key]);a.download=entry[key].split('/').pop();links.append(a);}add(card,links);$('#share-gif-grid').append(card);}
  }

  document.querySelectorAll('[data-collection]').forEach(button=>button.addEventListener('click',()=>{state.collection=button.dataset.collection;document.querySelectorAll('[data-collection]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));renderTeam();}));
  // Explicit review URL only; no visitor assignment, cookies or analytics.
  if(new URLSearchParams(location.search).get('variant')==='story'){$('#hero-cta').href='#team';$('#hero-cta').textContent='Find your good dog ↓';$('.hero-description').textContent='Meet a kennel of original cricket dogs, each with a look, a game and a story of their own.';}

  $('#pet-search').addEventListener('input',event => { state.query = event.target.value.trim(); renderTeam(); });
  $('.dialog-close').addEventListener('click',() => $('#character-dialog').close());
  $('#character-dialog').addEventListener('click',event => { const dialog = $('#character-dialog'); if (event.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); });
  if (data.updated_at) { const date = new Date(data.updated_at); if (!Number.isNaN(date.getTime())) $('#edition-date').textContent = `Collection edition · ${date.toLocaleDateString('en',{month:'long',year:'numeric'})}`; }
  renderHero(); renderFilters(); renderTeam(); setupFormats(); setupMedia(); setupDownloads(); setupNative(); setupShareGifs();
})();
