/* Pow's Table: a dependency-free, device-local date catalog. */
(() => {
  'use strict';
  const data = window.POWS_TABLE;
  if (!data || !Array.isArray(data.places)) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const url = value => /^(https:\/\/|tel:\+?[\d ]+$|mailto:[^\s<>]+$)/i.test(value || '') ? escape(value) : '#';
  const external = 'target="_blank" rel="noopener noreferrer"';
  const money = value => 'PHP ' + new Intl.NumberFormat('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
  const icons = {
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>', back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    bookmark: '<path d="M6 4h12v17l-6-4-6 4V4Z"/>', check: '<path d="m5 12 4 4L19 6"/>',
    plate: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 5h1m6 0h1"/>',
    sliders: '<path d="M4 6h8m5 0h3M4 12h3m5 0h8M4 18h8m5 0h3"/><circle cx="14.5" cy="6" r="2.5"/><circle cx="9.5" cy="12" r="2.5"/><circle cx="14.5" cy="18" r="2.5"/>',
    spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
    external: '<path d="M14 4h6v6m0-6-9 9M10 4H4v16h16v-6"/>',
    pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    phone: '<path d="m6 3 4 5-3 3a15 15 0 0 0 6 6l3-3 5 4-2 3C10 21 3 14 3 5l3-2Z"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 6 9 7 9-7"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6"/>',
    download: '<path d="M12 3v13m-5-5 5 5 5-5M4 16v5h16v-5"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name] || icons.external}</svg>`;
  $$('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  const curated = ['omote','azuki-toyo','mono-beef-bar','seva','717-deli','mabuhay','201-bistro','wahunomi','kauri','raion','manman-sai-gon','hikiniku-megamall','xiu','half-saints','goo-cookies','go-to-matcha','mad-cajun','wrun'];
  const rank = id => curated.includes(id) ? curated.indexOf(id) : curated.length;
  const places = [...data.places].sort((a,b) => rank(a.id) - rank(b.id));
  const byId = new Map(places.map(p => [p.id,p]));
  const sources = new Map(data.sources.map(s => [s.id,s]));
  const searchText = new Map(places.map(p => [p.id,normalize([p.name,p.branch,p.city,...p.cuisines,...p.occasions,...p.menuChoices.map(m=>m.name)].join(' '))]));
  const storageKey = 'powstable.preferences.v1';
  let saved = {schemaVersion:2,want:[],been:[],plans:[]};
  let storageBlocked = false, savedReadFailed = false;
  let route = 'collection', listTab = 'want', activePlace = null, returnFocus = null;
  let pendingRestore = null, restoreKeepsPlans = false, lastPick = null, toastTimer;
  const filters = {search:'',occasion:'',location:'',cuisine:'',budget:'',sort:'curated'};
  const placeDialog = $('#place-dialog');
  const pickerDialog = $('#picker-dialog');
  const restoreDialog = $('#restore-dialog');

  function validatedSaved(value) {
    if (!value || ![1,2].includes(value.schemaVersion)) throw new Error('This backup version is not supported.');
    const result = {schemaVersion:2,want:[],been:[],plans:value.schemaVersion===2?window.PowsPlanner.validatePlans(value.plans):[]};
    for (const key of ['want','been']) {
      const items = value[key];
      if (!Array.isArray(items) || items.length > 1000 || items.some(id => typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(id))) throw new Error('This file does not contain a valid saved list.');
      if (new Set(items).size !== items.length) throw new Error('This backup contains duplicate places.');
      result[key] = [...items];
    }
    if (result.want.some(id => result.been.includes(id))) throw new Error('A place cannot be in both lists in a backup.');
    const updates = value.appliedUpdates ?? [];
    if (!Array.isArray(updates) || updates.length > 1000 || updates.some(id => typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(id))) throw new Error('This file contains invalid saved updates.');
    result.appliedUpdates = [...new Set(updates)];
    return result;
  }

  function storageNotice(message) {
    $('#storage-notice').textContent = message;
    $('#storage-notice').hidden = false;
  }
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try { saved = validatedSaved(JSON.parse(raw)); }
      catch { savedReadFailed = true; storageNotice('The saved list on this device could not be read. Restore a backup, or start a new list.'); }
    }
  } catch {
    storageBlocked = true;
    storageNotice('This browser cannot keep your choices after you leave. Export a backup before closing this page.');
  }

  function persist() {
    saved.updatedAt = new Date().toISOString();
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); }
    catch {
      storageBlocked = true;
      storageNotice('Your choices work for this visit, but this browser could not save them. Export a backup before leaving.');
    }
  }
  // Apply owner-confirmed visits once, preserving other lists and calendar dates.
  // Retain the marker in backups so a later manual removal remains removed.
  if (!savedReadFailed) {
    const applied = new Set(saved.appliedUpdates || []);
    let changed = false;
    for (const update of data.savedListUpdates || []) {
      if (applied.has(update.id)) continue;
      const ids = update.been.filter(id => byId.has(id));
      saved.want = saved.want.filter(id => !ids.includes(id));
      saved.been = [...new Set([...saved.been, ...ids])];
      applied.add(update.id);
      changed = true;
    }
    saved.appliedUpdates = [...applied];
    if (changed) persist();
  }
  function notify(message) {
    const toast = $('#toast');
    clearTimeout(toastTimer);
    const openDialogs = $$('dialog[open]');
    (openDialogs.at(-1) || document.body).append(toast);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 4200);
  }
  function syncDialogState() {
    document.body.classList.toggle('dialog-open', !!$('dialog[open]'));
    if (!$('#toast').closest('dialog[open]')) document.body.append($('#toast'));
  }
  function showDialog(dialog) {
    if (!dialog.open) dialog.showModal();
    syncDialogState();
    dialog.scrollTop = 0;
  }
  function closeDialog(dialog) {
    if (dialog.open) dialog.close();
    syncDialogState();
  }
  $$('dialog').forEach(dialog => {
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const targets = $$('a[href],button:not([disabled]),select:not([disabled]),input:not([disabled]),textarea:not([disabled]),summary,[tabindex="0"]', dialog).filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && (!el.closest('details:not([open])') || el.matches('summary')));
      if (!targets.length) return;
      const index = targets.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); targets.at(-1).focus(); }
      else if (!event.shiftKey && (index < 0 || index === targets.length - 1)) { event.preventDefault(); targets[0].focus(); }
    });
    dialog.addEventListener('close', () => {
      syncDialogState();
      if (dialog === restoreDialog) pendingRestore = null;
    });
  });

  function picture(p, mode='card') {
    if (!p.image.src) return `<div class="image-fallback">${icon('plate')}<span>No photo added</span></div>`;
    const sizes = mode === 'detail' ? '(max-width: 720px) calc(100vw - 48px), 460px' : mode === 'picker' ? '(max-width: 530px) 90vw, 480px' : '(max-width: 720px) calc(100vw - 48px), (max-width: 900px) 45vw, 30vw';
    return `<img src="${escape(p.image.small)}" srcset="${escape(p.image.small)} 600w, ${escape(p.image.src)} 1200w" sizes="${sizes}" width="600" height="414" alt="${escape(p.image.caption)}" loading="${mode === 'card' ? 'lazy' : 'eager'}" decoding="async" data-image-place="${escape(p.id)}">`;
  }
  function saveLabel(p, been=false) {
    const key = been ? 'been' : 'want';
    return `${saved[key].includes(p.id) ? 'Remove' : 'Add'} ${p.name} ${saved[key].includes(p.id) ? 'from' : 'to'} ${been ? 'Been here' : 'Want to go'}`;
  }
  function card(p) {
    return `<article class="place-card" data-card="${escape(p.id)}"><div class="card-photo" style="--focal:${escape(p.image.focal)}"><a class="photo-link" href="#place/${escape(p.id)}" data-place="${escape(p.id)}" aria-label="View ${escape(p.name)}">${picture(p)}</a><button type="button" class="save-button" data-save="${escape(p.id)}" aria-pressed="${saved.want.includes(p.id)}" aria-label="${escape(saveLabel(p))}">${icon('bookmark')}</button></div><div class="card-info"><p class="card-meta"><span>${escape(p.city || 'Visited place')}</span><span class="been-tag" ${saved.been.includes(p.id) ? '' : 'hidden'}>${icon('check')} Been here</span></p><h3><a href="#place/${escape(p.id)}" data-place="${escape(p.id)}">${escape(p.name)}</a></h3><p class="card-order">${escape(p.menuChoices[0]?.name || p.cuisines[0] || 'Visited together')}</p><p class="card-type">${escape([...p.cuisines.slice(0,2),p.branch].filter(Boolean).join(' · ') || 'Branch not added')}</p></div></article>`;
  }
  function filteredPlaces() {
    const terms = normalize(filters.search.trim()).split(/\s+/).filter(Boolean);
    const result = places.filter(p => {
      if (terms.some(t => !searchText.get(p.id).includes(t))) return false;
      if (filters.occasion && !p.occasions.includes(filters.occasion)) return false;
      if (filters.location && p.city !== filters.location) return false;
      if (filters.cuisine && !p.cuisines.includes(filters.cuisine)) return false;
      const prices = p.menuChoices.map(m=>m.pricePHP).filter(n=>typeof n === 'number' && Number.isFinite(n));
      if (filters.budget === 'unknown' && prices.length) return false;
      if (filters.budget === 'low' && !prices.some(n=>n<=500)) return false;
      if (filters.budget === 'mid' && !prices.some(n=>n>500 && n<=1000)) return false;
      if (filters.budget === 'high' && !prices.some(n=>n>1000)) return false;
      return true;
    });
    if (filters.sort === 'name') result.sort((a,b)=>a.name.localeCompare(b.name));
    if (filters.sort === 'area') result.sort((a,b)=>a.city.localeCompare(b.city)||a.name.localeCompare(b.name));
    return result;
  }
  function filterSummary() {
    const priceLabels = {low:'Menu items up to PHP500',mid:'Menu items PHP501-1,000',high:'Menu items over PHP1,000',unknown:'Prices to verify'};
    return Object.entries(filters).filter(([key,value]) => key !== 'sort' && value.trim()).map(([key,value])=>({key,label:key==='budget'?priceLabels[value]:key==='search'?`“${value}”`:value}));
  }
  function renderCollection() {
    const matches = filteredPlaces();
    $('#place-grid').innerHTML = matches.map(card).join('');
    $('#result-count').textContent = `${matches.length} ${matches.length===1?'place':'places'}${matches.length===places.length?' to explore':` of ${places.length}`}`;
    $('#no-results').hidden = matches.length > 0;
    $('#clear-search').hidden = !filters.search;
    $('#clear-filters').hidden = !filterSummary().length;
    $('#price-help').hidden = !filters.budget;
    $('#active-filters').innerHTML = filterSummary().map(({key,label})=>`<button class="filter-chip" type="button" data-remove-filter="${key}" aria-label="Remove filter ${escape(label)}">${escape(label)} ${icon('close')}</button>`).join('');
    $$('[data-occasion]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.occasion===filters.occasion)));
    $('#occasion-select').value = filters.occasion;
    const count = [filters.location,filters.cuisine,filters.budget].filter(Boolean).length;
    $('#filter-number').textContent = String(count);
    $('#filter-number').hidden = !count;
  }
  function resetFilters() {
    Object.assign(filters,{search:'',occasion:'',location:'',cuisine:'',budget:'',sort:'curated'});
    $('#search').value = '';
    for (const id of ['location','cuisine','budget']) $('#'+id+'-filter').value = '';
    $('#sort').value = 'curated';
    renderCollection();
  }
  for (const [id,values] of [['location',places.map(p=>p.city)],['cuisine',places.flatMap(p=>p.cuisines)]]) {
    $('#'+id+'-filter').insertAdjacentHTML('beforeend',[...new Set(values.filter(Boolean))].sort().map(value=>`<option value="${escape(value)}">${escape(value)}</option>`).join(''));
  }
  $('#search').addEventListener('input',e=>{filters.search=e.target.value;renderCollection();});
  for (const key of ['location','cuisine','budget']) $('#'+key+'-filter').addEventListener('change',e=>{filters[key]=e.target.value;renderCollection();});
  $('#sort').addEventListener('change',e=>{filters.sort=e.target.value;renderCollection();});
  $('#occasion-select').addEventListener('change',e=>{filters.occasion=e.target.value;renderCollection();});
  $('#clear-search').addEventListener('click',()=>{filters.search='';$('#search').value='';renderCollection();$('#search').focus();});
  $('#clear-filters').addEventListener('click',()=>{resetFilters();$('#search').focus();});
  $('#filters-toggle').addEventListener('click',()=>{
    const open=$('#filter-panel').classList.toggle('is-open');
    $('#filters-toggle').setAttribute('aria-expanded',String(open));
  });

  function renderList() {
    const list = saved[listTab].map(id=>byId.get(id)).filter(Boolean);
    $('#saved-grid').innerHTML = list.map(card).join('');
    $('#list-empty').hidden = list.length > 0;
    $('#list-empty h2').innerHTML = listTab==='want' ? 'Your next date<br>starts here.' : 'A place for<br>our memories.';
    $('#list-empty p').textContent = listTab==='want' ? 'Save a place from the collection and it will appear on this device.' : 'Open a place and mark Been here after your date.';
    $('#list-summary').textContent = `${list.length} places in ${listTab==='want'?'Want to go':'Been here'}`;
    $$('[data-list-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.listTab===listTab)));
    const unknown = [...saved.want,...saved.been].filter(id=>!byId.has(id)).length;
    $('#archived-saves').hidden = !unknown;
    $('#archived-saves').textContent = `${unknown} saved ${unknown===1?'place is':'places are'} from another collection version. They are kept in your backup.`;
  }
  function updateSavedUI() {
    const want=saved.want.filter(id=>byId.has(id)).length, been=saved.been.filter(id=>byId.has(id)).length;
    $('#want-count').textContent=want;$('#been-count').textContent=been;
    $$('.list-count').forEach(el=>{el.textContent=want+been;el.hidden=!(want+been);});
    $$('[data-save],[data-been]').forEach(button=>{
      const isBeen=button.hasAttribute('data-been');
      const p=byId.get(isBeen?button.dataset.been:button.dataset.save);
      if (!p) return;
      const selected=saved[isBeen?'been':'want'].includes(p.id);
      button.setAttribute('aria-pressed',String(selected));
      button.setAttribute('aria-label',saveLabel(p,isBeen));
      if (button.classList.contains('detail-save')) button.innerHTML=icon(isBeen?'check':'bookmark')+(isBeen?'Been here':selected?'On our list':'Want to go');
    });
    $$('[data-card]').forEach(el=>{const badge=$('.been-tag',el);if(badge)badge.hidden=!saved.been.includes(el.dataset.card);});
  }
  function toggleSaved(id, key) {
    const p=byId.get(id);if(!p)return;
    const selected=saved[key].includes(id);
    const other=key==='want'?'been':'want';
    saved[key]=selected?saved[key].filter(x=>x!==id):[...saved[key],id];
    if(!selected)saved[other]=saved[other].filter(x=>x!==id);
    persist();updateSavedUI();
    const fromList=$('#saved-grid').contains(document.activeElement);
    renderList();
    if(fromList)$('#list-title').focus({preventScroll:true});
    notify(selected?`${p.name} removed from ${key==='want'?'Want to go':'Been here'}.`:`${p.name} ${key==='want'?'saved for a future date':'marked Been here'}.${storageBlocked?' Export a backup to keep it.':''}`);
  }

  function sourceLinks(p) {
    const ids=[...new Set([...p.sourceIds,...p.menuChoices.flatMap(m=>m.sourceIds)])];
    const seen=new Set();
    return ids.filter(id=>sources.has(id)).map(id=>sources.get(id)).filter(s=>{if(seen.has(s.url))return false;seen.add(s.url);return true;}).map(s=>`<li><a href="${url(s.url)}" ${external}>${escape(s.title)}</a></li>`).join('');
  }
  function link(href,label,name='external',classes='button outline') {
    return `<a class="${classes}" href="${url(href)}" ${href.startsWith('https:')?external:''}>${icon(name)}${escape(label)}</a>`;
  }
  function renderDetail(p) {
    const phone=p.contacts.find(c=>c.kind==='phone');
    const hours=p.hours.displayRows?.length ? `<dl class="hours-list">${p.hours.displayRows.map(([day,time])=>`<dt>${escape(day)}</dt><dd>${escape(time)}</dd>`).join('')}</dl>` : `<p>${escape(p.hours.text)}</p>`;
    const contacts=p.contacts.filter(c=>c.url!==p.instagramUrl);
    if(p.instagramUrl)contacts.push({kind:'instagram',value:'@'+p.instagramUrl.split('/').filter(Boolean).at(-1),url:p.instagramUrl,scope:'Official Instagram',note:''});
    const contactMarkup=contacts.length?contacts.map(c=>`<a class="detail-contact" href="${url(c.url)}" ${c.url.startsWith('https:')?external:''}>${icon(c.kind)}<span>${escape(c.kind==='website'?'Official website':c.value)}<small>${escape([c.scope!=='venue'?c.scope:'',c.note].filter(Boolean).join(' · '))}</small></span></a>`).join(''):'<p class="muted">A direct contact is still to verify. Use the linked source for the latest details.</p>';
    if (p.visitRecord) {
      $('#place-content').innerHTML=`<div class="detail-layout"><div class="detail-media"><div class="detail-photo">${picture(p,'detail')}</div></div><div class="detail-copy"><div class="detail-title"><h2 id="place-heading" tabindex="-1">${escape(p.name)}</h2><p class="detail-intro">${escape(p.visitNote)}</p></div><div class="detail-actions"></div><div class="detail-sections"><section class="detail-section"><h3>Our visit</h3><p>Branch: not added</p><p>Visit date: not added</p></section><div class="detail-save-actions"><button type="button" class="button outline detail-save" data-save="${escape(p.id)}" aria-pressed="false">${icon('bookmark')}Want to go</button><button type="button" class="button outline detail-save" data-been="${escape(p.id)}" aria-pressed="false">${icon('check')}Been here</button></div><p class="detail-date">Added to our visited places on October 5, 2026.</p></div></div></div>`;
    } else {
    $('#place-content').innerHTML=`<div class="detail-layout"><div class="detail-media"><div class="detail-photo" style="--focal:${escape(p.image.focal)}">${picture(p,'detail')}</div><p class="photo-credit">${escape(p.image.caption)}. Photo: <a href="${url(p.image.sourcePage)}" ${external}>${escape(p.image.credit)}</a></p></div><div class="detail-copy"><div class="detail-title"><h2 id="place-heading" tabindex="-1">${escape(p.name)}</h2><p class="eyebrow">${escape(p.city)} · ${escape(p.cuisines.slice(0,2).join(' · '))}</p><p class="detail-intro">${escape(p.dateIdea)}</p></div><div class="detail-actions">${link(p.mapUrl,'Directions','pin','button brass')}${phone?link(phone.url,'Call','phone'):p.instagramUrl?link(p.instagramUrl,'Instagram','instagram'):''}${p.bookingUrl?link(p.bookingUrl,p.id==='wrun'?'Check listing':'Reservations'):''}</div>${p.hours.needsConfirmation?`<div class="verify-note"><strong>${p.id==='wrun'?'Confirm before visiting':'Hours to verify'}</strong><p>${escape(p.id==='wrun'?'Current operating status is unclear. Check with the venue before making plans.':'The full current schedule is not confirmed. Check the latest source before your date.')}</p></div>`:''}<div class="detail-sections"><section class="detail-section"><h3>The address</h3><p>${escape(p.address.text)}</p></section><section class="detail-section"><h3>Opening hours</h3>${hours}${p.hours.note?`<p class="muted">${escape(p.hours.note)}</p>`:''}<p class="muted">Philippine time · Check holiday changes.</p></section><section class="detail-section"><h3>What to order</h3><ul class="menu-choices">${p.menuChoices.map(m=>`<li><div class="menu-item-heading"><span>${escape(m.name)}</span>${typeof m.pricePHP==='number'?`<span class="menu-price">${money(m.pricePHP)}</span>`:''}</div><small>${escape(m.basis.replace('Saved screenshot','Saved by Pow'))}${m.note?` · ${escape(m.note)}`:''}</small></li>`).join('')}</ul><p class="muted">${escape(p.priceGuide)}</p>${p.menuUrl?link(p.menuUrl,p.menuUrl===p.instagramUrl?'Latest from the venue':'View menu or listing','external','text-link'):''}</section><section class="detail-section"><h3>Keep in touch</h3>${contactMarkup}</section>${p.publicNotes?.length?`<section class="detail-section"><h3>Before our date</h3>${p.publicNotes.map(n=>`<p>${escape(n)}</p>`).join('')}</section>`:''}<div class="detail-save-actions"><button type="button" class="button outline detail-save" data-save="${escape(p.id)}" aria-pressed="false">${icon('bookmark')}Want to go</button><button type="button" class="button outline detail-save" data-been="${escape(p.id)}" aria-pressed="false">${icon('check')}Been here</button></div><details class="detail-sources"><summary>Sources and details</summary><p class="muted">Venue details and menu examples from the sources below. Menus, prices, and hours may change.</p><ul>${sourceLinks(p)}</ul></details><p class="detail-date">Details checked ${escape(new Date((p.checkedAt || data.checkedAt)+'T12:00:00+08:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Manila'}))}</p></div></div></div>`;
    }
    if (p.recordedAt && !p.visitRecord) $('.detail-sections').insertAdjacentHTML('afterbegin',`<section class="detail-section"><h3>Our visit</h3><p>${escape(p.visitNote)}</p></section>`);
    $('.detail-actions').insertAdjacentHTML('beforeend',`<button type="button" class="button outline" data-plan-reference="place:${escape(p.id)}">${icon('calendar')}Set a date</button>`);
    $('#back-label').textContent=route==='our-list'?'Our list':route==='calendar'?'Calendar':'Collection';
    updateSavedUI();
  }

  function setMain(next, focus=false) {
    route=next;
    $('#collection-view').hidden=!['collection','whats-new'].includes(next);$('#list-view').hidden=next!=='our-list';$('#calendar-view').hidden=next!=='calendar';
    $$('[data-nav]').forEach(el=>{const current=el.dataset.nav===next;el.classList.toggle('is-current',current);if(current)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
    document.title=routeTitle();
    if(next==='our-list')renderList();
    if(next==='calendar')window.PowsPlanner.refresh();
    if(focus){window.scrollTo({top:0,behavior:'instant'});$(next==='our-list'?'#list-title':next==='calendar'?'#calendar-title':next==='whats-new'?'#news-title':'#main').focus({preventScroll:true});}
    if(next==='whats-new')$('#whats-new').scrollIntoView({behavior:'instant'});
  }
  function routeTitle() { return ({'our-list':'Our list','whats-new':"What's new",calendar:'Our calendar'})[route] ? `${({'our-list':'Our list','whats-new':"What's new",calendar:'Our calendar'})[route]} · Pow's Table` : "Pow's Table · A table for two"; }
  function openPlace(id, push=true, trigger=null) {
    const p=byId.get(id);
    if(!p){notify('That place is not in this collection.');history.replaceState(null,'','#collection');setMain('collection');return;}
    returnFocus=trigger || document.activeElement;
    if(push)history.pushState({powPlace:true,from:route},'',`#place/${id}`);
    activePlace=id;renderDetail(p);showDialog(placeDialog);
    document.title=`${p.name} · Pow's Table`;
    $('#place-heading').focus({preventScroll:true});
  }
  function finishPlaceClose() {
    if(!activePlace && !placeDialog.open)return;
    activePlace=null;closeDialog(placeDialog);
    document.title=routeTitle();
    if(returnFocus?.isConnected && !returnFocus.closest('[hidden]'))returnFocus.focus({preventScroll:true});
    else $(route==='our-list'?'#list-title':route==='calendar'?'#calendar-title':route==='whats-new'?'#news-title':'#collection-title').focus({preventScroll:true});
  }
  function requestPlaceClose() {
    if(history.state?.powPlace && location.hash.startsWith('#place/'))history.back();
    else {history.replaceState(null,'',`#${route}`);finishPlaceClose();}
  }
  function navigate(next) {
    closeDialog(pickerDialog);finishPlaceClose();
    if(location.hash!==`#${next}`)history.pushState(null,'',`#${next}`);
    setMain(next,true);$('#top-nav').classList.remove('is-open');$('#menu-toggle').setAttribute('aria-expanded','false');
  }
  function readRoute() {
    const hash=location.hash;
    if(hash.startsWith('#place/')){
      const id=hash.slice(7);
      if(activePlace!==id)openPlace(id,false);
    }else{
      finishPlaceClose();
      const next=['#our-list','#calendar','#whats-new'].includes(hash)?hash.slice(1):'collection';
      setMain(next,route!==next);
    }
  }
  window.addEventListener('popstate',readRoute);
  window.addEventListener('hashchange',readRoute);
  $('#close-place').addEventListener('click',requestPlaceClose);$('#close-place-icon').addEventListener('click',requestPlaceClose);
  placeDialog.addEventListener('cancel',e=>{e.preventDefault();requestPlaceClose();});
  $('#menu-toggle').addEventListener('click',()=>{const open=$('#top-nav').classList.toggle('is-open');$('#menu-toggle').setAttribute('aria-expanded',String(open));});
  $('#explore').addEventListener('click',e=>{e.preventDefault();$('#collection-start').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('#collection-title').focus({preventScroll:true});});

  function pickDate() {
    const pool=$('#picker-pool').value;
    const matches=filteredPlaces().filter(p=>pool==='all'||saved.want.includes(p.id));
    const applied=filterSummary();
    $('#picker-scope').textContent=`${matches.length} ${matches.length===1?'place':'places'}${applied.length?' matching '+applied.map(f=>f.label).join(' · '):' in this selection'}.`;
    $('#pick-again').disabled=matches.length<=1;
    const result=$('#picker-result');result.className='picker-result';
    if(!matches.length){lastPick=null;result.innerHTML='<div class="empty-state"><h3>A little more choice?</h3><p>No places match this selection. Choose All places, or clear the collection filters.</p><button type="button" class="text-link" id="picker-reset">Clear collection filters</button></div>';return;}
    const choices=matches.length>1?matches.filter(p=>p.id!==lastPick):matches;
    const p=choices[Math.floor(Math.random()*choices.length)];lastPick=p.id;
    result.innerHTML=`<div class="picker-photo" style="--focal:${escape(p.image.focal)}">${picture(p,'picker')}</div><p class="eyebrow">${escape(p.city)} · ${escape(p.cuisines[0])}</p><h3 class="picker-name">${escape(p.name)}</h3><p>${escape(p.dateIdea)}</p>${p.hours.needsConfirmation?'<p class="picker-caution">Check hours and availability before visiting.</p>':''}<a class="text-link" href="#place/${escape(p.id)}" data-place="${escape(p.id)}">Take a closer look ${icon('arrow')}</a>`;
  }
  function showPicker() {
    $('#picker-pool').value=filteredPlaces().some(p=>saved.want.includes(p.id))?'want':'all';
    lastPick=null;pickDate();showDialog(pickerDialog);
  }
  $('#picker-pool').addEventListener('change',()=>{lastPick=null;pickDate();});
  $('#pick-again').addEventListener('click',pickDate);

  $('#export-backup').addEventListener('click',()=>{
    const backup={format:'pows-table',schemaVersion:2,exportedAt:new Date().toISOString(),saved:{want:[...saved.want],been:[...saved.been],plans:[...saved.plans],appliedUpdates:[...(saved.appliedUpdates || [])]}};
    const blob=new Blob([JSON.stringify(backup,null,2)+'\n'],{type:'application/json'});
    const objectURL=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=objectURL;a.download=`pows-table-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(objectURL),1000);
    notify('Backup prepared. Keep the downloaded JSON file.');
  });
  $('#restore-backup').addEventListener('click',()=>$('#backup-file').click());
  $('#backup-file').addEventListener('change',async e=>{
    const file=e.target.files?.[0];e.target.value='';pendingRestore=null;restoreKeepsPlans=false;
    if(!file)return;
    try {
      if(file.size>1048576)throw new Error('This file is too large. Choose a Pow\'s Table JSON backup under 1 MB.');
      const parsed=JSON.parse(await file.text());
      if(parsed.format!=='pows-table'||![1,2].includes(parsed.schemaVersion))throw new Error('Choose a supported Pow\'s Table backup file.');
      pendingRestore=validatedSaved({...parsed.saved,schemaVersion:parsed.schemaVersion});
      restoreKeepsPlans=parsed.schemaVersion===1;
      if(restoreKeepsPlans)pendingRestore.plans=[...saved.plans];
      const unknown=[...pendingRestore.want,...pendingRestore.been].filter(id=>!byId.has(id)).length;
      $('#restore-preview').innerHTML=`<div class="restore-counts"><div><strong>${pendingRestore.want.length}</strong><span>Want to go</span></div><div><strong>${pendingRestore.been.length}</strong><span>Been here</span></div></div>${unknown?`<p class="restore-extra">${unknown} saved ${unknown===1?'place is':'places are'} from another collection version. These will be preserved in future backups.</p>`:''}`;
      $('#restore-preview').insertAdjacentHTML('beforeend',`<p class="restore-calendar">${pendingRestore.plans.length} calendar ${pendingRestore.plans.length===1?'date':'dates'}. ${parsed.schemaVersion===1?'This older backup replaces only your lists. Your calendar will be kept.':'Your lists and calendar will be replaced by this backup.'}</p>`);
      showDialog(restoreDialog);
    } catch(error) {
      pendingRestore=null;
      notify(error instanceof SyntaxError?'That file is not valid JSON. Your list has not changed.':error.message+' Your list has not changed.');
    }
  });
  $('#confirm-restore').addEventListener('click',()=>{
    if(!pendingRestore)return;
    if(restoreKeepsPlans)pendingRestore.plans=[...saved.plans];
    pendingRestore.appliedUpdates=[...new Set([...(saved.appliedUpdates || []),...(pendingRestore.appliedUpdates || []),...(data.savedListUpdates || []).map(update=>update.id)])];
    saved=pendingRestore;persist();updateSavedUI();renderList();window.PowsPlanner.refresh();closeDialog(restoreDialog);
    notify(`Your list has been restored.${storageBlocked?' Export a backup before leaving.':''}`);
  });
  $('#show-credits').addEventListener('click',()=>{
    $('#credits-list').innerHTML=places.filter(p=>p.image.src).map(p=>`<section class="credit-entry"><h3>${escape(p.name)}</h3><p>${escape(p.image.caption)}</p><p>Photo: <a href="${url(p.image.sourcePage)}" ${external}>${escape(p.image.credit)}</a></p><div class="credit-links">${p.instagramUrl?`<a href="${url(p.instagramUrl)}" ${external}>Official Instagram</a>`:''}<a href="#place/${escape(p.id)}" data-place="${escape(p.id)}">Place details and sources</a></div></section>`).join('')+'<section class="credit-entry"><h3>Type and design</h3><p>Cormorant Garamond by Christian Thalmann, licensed under the SIL Open Font License. Local photographs are credited to their original sources.</p></section>';
    showDialog($('#credits-dialog'));
  });

  document.addEventListener('click',e=>{
    const button=e.target.closest('a,button');if(!button)return;
    if(button.matches('a')&&(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0))return;
    if(button.hasAttribute('data-place')){
      e.preventDefault();
      const inDialog=button.closest('dialog');
      if(inDialog && inDialog!==placeDialog)closeDialog(inDialog);
      openPlace(button.dataset.place,true,inDialog?document.querySelector('[data-pick]'):button);
    }else if(button.hasAttribute('data-nav')){e.preventDefault();navigate(button.dataset.nav);}
    else if(button.hasAttribute('data-save'))toggleSaved(button.dataset.save,'want');
    else if(button.hasAttribute('data-been'))toggleSaved(button.dataset.been,'been');
    else if(button.hasAttribute('data-list-tab')){listTab=button.dataset.listTab;renderList();}
    else if(button.hasAttribute('data-occasion')){filters.occasion=button.dataset.occasion;renderCollection();}
    else if(button.hasAttribute('data-remove-filter')){
      const key=button.dataset.removeFilter;filters[key]='';
      if(key==='search')$('#search').value='';else if(['location','cuisine','budget'].includes(key))$('#'+key+'-filter').value='';
      renderCollection();$('#search').focus({preventScroll:true});
    }else if(button.hasAttribute('data-reset')){resetFilters();$('#search').focus({preventScroll:true});}
    else if(button.hasAttribute('data-pick'))showPicker();
    else if(button.hasAttribute('data-close'))closeDialog(document.getElementById(button.dataset.close));
    else if(button.id==='picker-reset'){resetFilters();pickDate();}
  });
  document.addEventListener('error',e=>{
    if(!(e.target instanceof HTMLImageElement))return;
    const img=e.target, fallback=document.createElement('div');
    fallback.className='image-fallback';fallback.innerHTML=icon('plate')+'<span>Photo unavailable</span>';
    img.replaceWith(fallback);
  },true);
  window.addEventListener('storage',e=>{
    if(e.key!==storageKey)return;
    try {saved=e.newValue?validatedSaved(JSON.parse(e.newValue)):{schemaVersion:2,want:[],been:[],plans:[]};updateSavedUI();renderList();window.PowsPlanner.refresh();}
    catch { /* An invalid write in another tab never replaces the current list. */ }
  });
  window.PowsPlanner.init({getSaved:()=>saved,persist,notify,showDialog,closeDialog,icon});
  renderCollection();renderList();updateSavedUI();readRoute();
})();
