(() => {
  'use strict';
  const data = window.CRICKET_PUBLIC || {};
  const pets = Array.isArray(data.pets) ? data.pets : [];
  const downloads = data.downloads || {};
  const $ = selector => document.querySelector(selector);
  const make = (tag,className,text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined && text !== null) node.textContent = text; return node; };
  const add = (node,...children) => { children.flat().filter(Boolean).forEach(child => node.append(child)); return node; };
  const safe = value => { const url = String(value || '').trim(); return /^(?:javascript|data|vbscript|file):/i.test(url) ? '' : url; };
  const external = (label,url) => { const a = make('a','',label); a.href = safe(url); a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; };
  const normalize = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const roleNames = {batter:'Batter',bowler:'Bowler',keeper:'Wicketkeeper',allrounder:'All-rounder'};
  const name = pet => pet.name || pet.display_name || pet.id;
  const profileKey = profile => profile.id || `${profile.dog_id}-${profile.format}`;
  const globalProfiles = Array.isArray(data.format_profiles) ? data.format_profiles : (data.format_profiles?.profiles || []);
  const profiles = [...new Map([...globalProfiles,...pets.flatMap(pet => (pet.format_profiles || []).map(profile => ({...profile,dog_id:profile.dog_id || pet.id,dog_name:profile.dog_name || name(pet)})))].map(profile => [profileKey(profile),profile])).values()];
  const state = {country:'All teammates',query:'',selected:null,media:'horizontal',gifPlaying:false};
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
    const results = pets.filter(pet => (state.country === 'All teammates' || pet.country === state.country) && normalize([name(pet),pet.breed,pet.player,pet.signature,pet.country,pet.role,...(pet.tags || [])].join(' ')).includes(normalize(state.query)));
    const grid = $('#team-grid'); grid.replaceChildren(); $('#result-count').textContent = `${results.length} ${results.length === 1 ? 'teammate' : 'teammates'}`;
    if (!results.length) { grid.append(make('p','empty',pets.length ? 'No teammates match that search. Try a different name, breed or nation.' : 'The first illustrated teammates will appear here as the collection arrives.')); return; }
    for (const pet of results) {
      const card = make('button','pet-card'); card.type = 'button'; card.setAttribute('aria-label',`Meet ${name(pet)}, ${pet.breed}`);
      const picture = make('div','pet-image'); const img = make('img'); img.src = safe(pet.portrait); img.alt = `${name(pet)}, ${pet.breed}`; img.width = 640; img.height = 640; img.loading = 'lazy';
      add(picture,img,make('span','pet-number',`CK / ${String(pets.indexOf(pet) + 1).padStart(2,'0')}`),make('span','pet-arrow','↗'));
      add(card,picture,make('h3','',name(pet)),make('span','pet-breed',`${pet.breed} · ${pet.country}`),make('span','pet-role',roleNames[pet.role] || pet.role || 'Cricket companion'));
      card.addEventListener('click',() => openCharacter(pet)); grid.append(card);
    }
  }

  function openCharacter(pet) {
    state.selected = pet.id;
    $('#character-name').textContent = name(pet); $('#character-country').textContent = `${pet.country} · ${roleNames[pet.role] || pet.role || 'Cricketer'}`;
    $('#character-breed').textContent = `${pet.breed}${pet.player ? ` · Cricket inspiration: ${pet.player}` : ''}`;
    $('#character-signature').textContent = pet.signature || '';
    $('#character-tags').replaceChildren(...(pet.tags || []).map(tag => make('span','',tag)));
    const fact = $('#character-fact'); fact.replaceChildren(); fact.hidden = !pet.fact?.fact;
    if (pet.fact?.fact) add(fact,make('p','eyebrow','From the cricket almanack'),make('blockquote','',pet.fact.fact),pet.fact.source_url ? external(`${pet.fact.source_title || 'Read the source'} ↗`,pet.fact.source_url) : null);
    const actions = [{id:'portrait',title:'Character portrait',src:pet.portrait},...usableActions(pet)];
    const strip = $('#character-actions'); strip.replaceChildren();
    const show = action => { $('#character-image').src = safe(action.src); $('#character-image').alt = `${name(pet)} — ${action.title}`; $('#character-image-label').textContent = action.id === 'portrait' ? 'Character portrait · original illustration' : `${action.title.replace(/\s*·\s*illustration$/i,'')} · still artwork`; for (const button of strip.children) button.setAttribute('aria-pressed',String(button.dataset.action === action.id)); };
    for (const action of actions) { const button = make('button','character-action'); button.type = 'button'; button.dataset.action = action.id; button.setAttribute('aria-label',`View ${action.title}`); const img = make('img'); img.src = safe(action.src); img.alt = ''; img.loading = 'lazy'; add(button,img,make('span','',action.title.replace(/\s*·\s*illustration$/i,''))); button.addEventListener('click',() => show(action)); strip.append(button); }
    show(actions[0]); strip.hidden = actions.length < 2;
    const available = dogProfiles(pet); $('#character-format-link').hidden = !available.length;
    $('#character-format-link').onclick = () => { if (available[0]) { $('#format-select').value = profileKey(available[0]); renderFormat(); } $('#character-dialog').close(); };
    $('#character-download-link').onclick = () => $('#character-dialog').close();
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
    document.querySelectorAll('.media-switch').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.media === mode)));
    if (src && mode !== 'gif') { video.src = src; video.preload = 'metadata'; video.load(); }
    $('#media-note').textContent = mode === 'gif' ? 'The loop loads only when you choose to play it. You can stop it at any time.' : 'Press play when you’re ready. Character scenes are illustrated studies.';
    const download = $('#film-download'); download.hidden = !src; if (src) { download.href = src; download.download = src.split('/').pop(); download.textContent = mode === 'gif' ? 'Download the loop · GIF ↓' : `Download the ${mode === 'vertical' ? 'vertical' : 'widescreen'} film · MP4 ↓`; }
  }

  function setupMedia() {
    const poster = pets.find(pet => pet.id === 'brian') || pets[0]; if (poster?.portrait) $('#film-video').poster = safe(poster.portrait);
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

  $('#pet-search').addEventListener('input',event => { state.query = event.target.value.trim(); renderTeam(); });
  $('.dialog-close').addEventListener('click',() => $('#character-dialog').close());
  $('#character-dialog').addEventListener('click',event => { const dialog = $('#character-dialog'); if (event.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); });
  if (data.updated_at) { const date = new Date(data.updated_at); if (!Number.isNaN(date.getTime())) $('#edition-date').textContent = `Collection edition · ${date.toLocaleDateString('en',{month:'long',year:'numeric'})}`; }
  renderHero(); renderFilters(); renderTeam(); setupFormats(); setupMedia(); setupDownloads();
})();
