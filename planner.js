/* Local plans, screenshot-sourced finds, and portable calendar downloads. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pad = value => String(value).padStart(2, '0');
  const isoDate = date => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  const asDate = value => new Date(`${value}T12:00:00`);
  const today = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const validDate = value => typeof value === 'string' && /^(?:19\d{2}|[2-9]\d{3})-\d{2}-\d{2}$/.test(value) && value < '9999-01-01' && !Number.isNaN(asDate(value).getTime()) && isoDate(asDate(value)) === value;
  const dayLabel = value => asDate(value).toLocaleDateString('en-US', {weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const news = [
    {"id": "sebastians-rockwell", "kind": "A restaurant to try", "name": "Sebastian's", "venue": "Rockwell, Makati", "location": "Sebastian's, Unit 101, Edades Tower and Garden Villas, Rockwell, Makati", "stamp": "ROCKWELL", "mark": "S", "description": "Crab omelette, wagyu steak frites, and Mango Jubilee from the saved post, with a separate breakfast menu.", "menu": [{"name": "Twice baked souffle", "price": 550}, {"name": "Wagyu Steak Frite", "price": 2900}, {"name": "Crab Omelette", "price": 1700}, {"name": "Barramundi", "price": 1200}, {"name": "Pastel de Lengua", "price": 980}, {"name": "Mango Jubilee", "price": 650}, {"name": "Banana, Nutella and Almond Crepe", "price": 520}, {"name": "Banana Split", "price": 650}], "note": "Prices are from the saved post. It lists 06:30–22:00; a September 15 feature lists 07:00–22:00 Sunday–Thursday and 07:00–00:00 Friday–Saturday. Confirm current hours and menu prices.", "source": "remyeats_ · supplied post; location and alternate hours: Lifestyle Asia, September 15, 2026. Added September 30.", "links": [{"label": "Venue Instagram", "url": "https://www.instagram.com/sebastiansbyantonios/"}, {"label": "Location and hours source", "url": "https://lifestyleasia-onemega.com/dining/sebastians-restaurant-rockwell-makati-antonios-group/"}], "planTitle": "A date at Sebastian's, Rockwell", "planNote": "Try Crab Omelette (PHP 1,700.00), Twice baked souffle (PHP 550.00), and Mango Jubilee (PHP 650.00). Saved-post prices; confirm current menu and hours."},
    {"id": "deuces-salmon-maki", "kind": "A dish to try", "name": "Salmon Maki", "venue": "Deuces Coffee", "location": "Deuces Coffee · branch to confirm", "stamp": "DEUCES", "mark": "02", "description": "Salmon Maki: PHP 410.00 for 8 pieces in the saved post. The creator recommends pairing it with the Sea Salt Spanish coffee and describes the maki as not spicy, with a good salmon-to-rice ratio.", "note": "Confirm the branch, current price, and dish availability. The post recalls Perea; that original branch closed in March 2026. The screenshot does not identify where this serving was ordered.", "source": "allainahmayne · supplied post; original Perea closure: GMA News, March 4, 2026. Added September 30.", "links": [{"label": "Branch menus", "url": "https://linktr.ee/deucescoffee"}, {"label": "Original Perea closure source", "url": "https://www.gmanetwork.com/news/lifestyle/food/978727/homegrown-caf-deuces-to-permanently-close-makati-branch/story/"}], "planTitle": "Salmon Maki at Deuces Coffee", "planNote": "Try Salmon Maki (saved post: PHP 410.00 / 8 pieces) with Sea Salt Spanish coffee. Confirm branch, price, and availability. The original Perea branch closed in March 2026."},
    {id:'wine-fair',kind:'An event to visit',name:'Wine Fair',venue:'Shangri-La Plaza',location:'Grand Atrium, Shangri-La Plaza',stamp:'OCT',mark:'7–11',description:'A wine fair at the Grand Atrium, saved for a possible date together.',note:'October 7–11. The year and opening hours are not shown in the saved post; confirm them before visiting.',source:'Shangri-La Plaza · saved promotional post',planTitle:'Wine Fair at Shangri-La Plaza',planNote:'Saved post: October 7–11. Confirm the event year and opening hours.'},
    {id:'half-saints-risotto',kind:'A dish to try',name:'Soft Shell Crab Risotto',venue:'Half Saints',location:'Half Saints · branch to confirm',stamp:'HALF',mark:'saints',description:'Soft shell crab with crab and taba ng talangka risotto, folded with edamame.',note:'The saved post does not identify a branch, price, or availability dates. Confirm the branch when planning.',source:'Half Saints · saved menu post',planTitle:'Soft Shell Crab Risotto at Half Saints',planNote:'Try the Soft Shell Crab Risotto. Confirm the branch, price, and availability.'}
  ];
  function validatePlans(value) {
    if (!Array.isArray(value) || value.length > 1000) throw new Error('This backup does not contain a valid calendar.');
    const ids = new Set();
    return value.map(item => {
      if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(item.id) || ids.has(item.id)) throw new Error('This backup contains an invalid or duplicate date.');
      ids.add(item.id);
      if (!validDate(item.date) || typeof item.time !== 'string' || (item.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)) || ![60,90,120,180,240].includes(item.duration)) throw new Error('A calendar date or time in this backup is invalid.');
      for (const [key,max] of [['title',120],['location',240],['notes',1000],['reference',100]]) {
        if (typeof item[key] !== 'string' || item[key].length > max || (key === 'title' && !item[key].trim())) throw new Error('A calendar entry in this backup is invalid.');
      }
      if (item.reference && !/^(place|news):[a-z0-9-]+$/.test(item.reference)) throw new Error('A calendar reference in this backup is invalid.');
      return {id:item.id,date:item.date,time:item.time,duration:item.duration,title:item.title,location:item.location,notes:item.notes,reference:item.reference};
    });
  }
  let api, places, selected = today(), month = selected.slice(0,7), returnFocus, editingId = '';
  const plans = () => api.getSaved().plans;
  const sorted = () => [...plans()].sort((a,b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  function reference(value) {
    if (value.startsWith('news:')) {
      const item = news.find(n => n.id === value.slice(5));
      return item ? {title:item.planTitle,location:item.location,notes:item.planNote,note:item.note} : null;
    }
    const p = places.find(p => value === `place:${p.id}`);
    return p ? {title:`A date at ${p.name}`,location:[p.name,p.branch,p.city].filter(Boolean).join(' · '),notes:'',note:p.hours.needsConfirmation?'Confirm current hours with the venue before visiting.':''} : null;
  }
  function renderNews() {
    $('#news-grid').innerHTML = news.map(item => {
      const dates = sorted().filter(p => p.reference === `news:${item.id}`);
      return `<article class="news-item" data-news="${item.id}"><div class="news-stamp ${item.id==='wine-fair'?'':'saints-stamp'}" aria-hidden="true"><span>${item.stamp}</span><strong>${item.mark}</strong></div><div class="news-copy"><p class="eyebrow">${item.kind}</p><h3>${item.name}</h3><p class="news-venue">${item.venue}</p><p class="news-description">${item.description}</p>${item.menu?`<details class="news-menu"><summary>Dishes and prices (${item.menu.length})</summary><ul>${item.menu.map(dish=>`<li><span>${esc(dish.name)}</span><span>PHP ${dish.price.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span></li>`).join('')}</ul></details>`:''}<p class="news-note">${item.note}</p><p class="news-source">${item.source}</p>${item.links?`<p class="news-links">${item.links.map(link=>`<a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}</a>`).join('')}</p>`:''}<button class="text-link" type="button" data-plan-reference="news:${item.id}">Set a date ${api.icon('arrow')}</button>${dates.length?`<a class="news-scheduled" href="#calendar" data-nav="calendar">${dates.length===1?'Planned for '+esc(dayLabel(dates[0].date)):dates.length+' dates planned'} ${api.icon('check')}</a>`:''}</div></article>`;
    }).join('');
  }
  function planCard(p, compact = false) {
    return `<article class="plan-card" data-plan-card="${esc(p.id)}"><div class="plan-card-copy"><p class="eyebrow">${compact?'':esc(asDate(p.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}))+' · '}${p.time?esc(p.time)+' · '+p.duration+' min':'All day'}</p><h3>${esc(p.title)}</h3>${p.location?`<p>${esc(p.location)}</p>`:''}${p.notes?`<p class="plan-card-note">${esc(p.notes)}</p>`:''}</div><div class="plan-card-actions"><button class="quiet-button" type="button" data-edit-plan="${esc(p.id)}" aria-label="Edit ${esc(p.title)}">Edit</button><button class="quiet-button" type="button" data-download-plan="${esc(p.id)}" aria-label="Download ${esc(p.title)} to calendar">Calendar file ${api.icon('download')}</button></div></article>`;
  }
  function renderCalendar() {
    const first = asDate(`${month}-01`), year = first.getFullYear(), m = first.getMonth();
    const lastDay = new Date(year,m+1,0).getDate(), offset = first.getDay();
    $('#calendar-month').textContent = first.toLocaleDateString('en-US',{month:'long',year:'numeric'});
    $('#calendar-jump').value = month;
    $('#previous-month').disabled = month === '1900-01';
    $('#next-month').disabled = month === '9998-12';
    const counts = new Map();
    plans().forEach(p => counts.set(p.date,(counts.get(p.date)||0)+1));
    let cells = '<span class="calendar-blank" aria-hidden="true"></span>'.repeat(offset);
    for (let day=1; day<=lastDay; day++) {
      const value = `${month}-${pad(day)}`, n = counts.get(value)||0;
      cells += `<button class="calendar-day${value===today()?' is-today':''}" type="button" data-calendar-day="${value}" aria-pressed="${value===selected}"${value===today()?' aria-current="date"':''} aria-label="${esc(dayLabel(value))}${n?', '+n+' planned '+(n===1?'date':'dates'):''}"><span>${day}</span>${n?`<span class="day-indicator" aria-hidden="true">${n}</span>`:''}</button>`;
    }
    $('#calendar-days').innerHTML = cells;
    $('#selected-day-title').textContent = asDate(selected).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
    const dayPlans = sorted().filter(p => p.date === selected);
    $('#day-plans').innerHTML = dayPlans.length ? dayPlans.map(p=>planCard(p,true)).join('') : '<p class="day-empty">A little room for something lovely.<br>No plans for this day yet.</p>';
    $('#all-plans').innerHTML = plans().length ? sorted().map(p=>planCard(p)).join('') : '<p class="agenda-empty">Your plans will appear here. Choose a find from What\'s new, a place from the collection, or make a plan of your own.</p>';
    $('#plan-count').textContent = `${plans().length} ${plans().length===1?'date':'dates'} saved`;
    $('#export-calendar').disabled = !plans().length;
  }
  function refresh() { if (api) { renderNews(); renderCalendar(); } }
  function applyReference() {
    const item = reference($('#plan-reference').value);
    $('#plan-source-note').hidden = !item?.note;
    $('#plan-source-note').textContent = item?.note || '';
    if (item) {
      $('#plan-name').value = item.title;
      $('#plan-location').value = item.location;
      $('#plan-notes').value = item.notes;
    }
  }
  function open(options = {}) {
    returnFocus = options.trigger || document.activeElement;
    const current = options.id ? plans().find(p => p.id === options.id) : null;
    if (options.id && !current) { api.notify('That date was removed in another tab.'); return; }
    editingId = current?.id || '';
    $('#plan-form').reset();
    $('#plan-error').hidden = true;
    $('#plan-title').textContent = current ? 'Edit our date' : 'Set a date';
    $('#plan-reference').value = current?.reference || options.reference || '';
    if ($('#plan-reference').selectedIndex < 0) $('#plan-reference').value = '';
    applyReference();
    $('#plan-id').value = editingId;
    $('#plan-date').value = current?.date || options.date || '';
    $('#delete-plan').hidden = !current;
    if (current) {
      $('#plan-name').value=current.title; $('#plan-location').value=current.location;
      $('#plan-time').value=current.time; $('#plan-duration').value=current.duration;
      $('#plan-notes').value=current.notes;
    }
    $('#plan-duration-label').hidden = !$('#plan-time').value;
    api.showDialog($('#plan-dialog'));
    (current || options.reference ? $('#plan-date') : $('#plan-reference')).focus();
  }
  function finish(message) {
    api.persist(); refresh(); api.closeDialog($('#plan-dialog'));
    if (returnFocus?.isConnected && !returnFocus.closest('[hidden]')) returnFocus.focus({preventScroll:true});
    else if ($('#place-dialog').open) $('#place-heading').focus({preventScroll:true});
    else {
      const replacement=document.querySelector(`[data-plan-reference="${CSS.escape($('#plan-reference').value)}"]`);
      (replacement?.getClientRects().length ? replacement : !$('#calendar-view').hidden ? $('#calendar-title') : $('#main')).focus({preventScroll:true});
    }
    api.notify(message);
  }
  // Fold at 75 UTF-8 octets; continuation lines include their leading space.
  function fold(line) {
    let output='', part='', size=0;
    for (const character of line) {
      const bytes=new TextEncoder().encode(character).length;
      if (size+bytes>75) {output+=part+'\r\n';part=' ';size=1;}
      part+=character;size+=bytes;
    }
    return output+part;
  }
  const icsText = text => String(text).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  const utcStamp = date => date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  function calendarFile(items) {
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Pows Table//Date Planner//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Pow\'s Table'];
    items.forEach(p => {
      lines.push('BEGIN:VEVENT',`UID:${p.id}@pows-table.local`,`DTSTAMP:${utcStamp(new Date())}`);
      if (p.time) {
        const start=new Date(`${p.date}T${p.time}:00+08:00`);
        lines.push(`DTSTART:${utcStamp(start)}`,`DTEND:${utcStamp(new Date(start.getTime()+p.duration*60000))}`);
      } else {
        const end=asDate(p.date);end.setDate(end.getDate()+1);
        lines.push(`DTSTART;VALUE=DATE:${p.date.replaceAll('-','')}`,`DTEND;VALUE=DATE:${isoDate(end).replaceAll('-','')}`);
      }
      lines.push(`SUMMARY:${icsText(p.title)}`,`LOCATION:${icsText(p.location)}`,`DESCRIPTION:${icsText(p.notes)}`,'STATUS:TENTATIVE','END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.map(fold).join('\r\n')+'\r\n';
  }
  function download(items) {
    if (!items.length) return;
    const objectURL=URL.createObjectURL(new Blob([calendarFile(items)],{type:'text/calendar;charset=utf-8'}));
    const anchor=document.createElement('a');anchor.href=objectURL;anchor.download=`pows-table-${items.length===1?items[0].date:'calendar'}.ics`;
    document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(objectURL),1000);
    api.notify('Calendar file ready. Open the download in your calendar app.');
  }
  function init(context) {
    api=context;places=window.POWS_TABLE.places;
    $('#plan-reference').innerHTML='<option value="">A plan of our own</option><optgroup label="What\'s new">'+news.map(n=>`<option value="news:${n.id}">${n.name} · ${n.venue}</option>`).join('')+'</optgroup><optgroup label="The collection">'+places.map(p=>`<option value="place:${esc(p.id)}">${esc(p.name)} · ${esc(p.city)}</option>`).join('')+'</optgroup>';
    $('#plan-reference').addEventListener('change',applyReference);
    $('#plan-time').addEventListener('input',()=>{$('#plan-duration-label').hidden=!$('#plan-time').value;});
    $('#plan-form').addEventListener('submit',event=>{
      event.preventDefault();
      try {
        if (editingId && !plans().some(p=>p.id===editingId)) throw new Error('This date was removed in another tab. Close this window and create a new plan.');
        const item={id:editingId || (crypto.randomUUID?.() || `date-${Date.now()}-${Math.random().toString(16).slice(2)}`),reference:$('#plan-reference').value,title:$('#plan-name').value.trim(),location:$('#plan-location').value.trim(),date:$('#plan-date').value,time:$('#plan-time').value,duration:Number($('#plan-duration').value),notes:$('#plan-notes').value.trim()};
        const next=plans().filter(p=>p.id!==item.id).concat(item);
        api.getSaved().plans=validatePlans(next);
        selected=item.date;month=selected.slice(0,7);
        finish('Date saved to our calendar.');
      } catch(error) {$('#plan-error').textContent=error.message;$('#plan-error').hidden=false;}
    });
    $('#delete-plan').addEventListener('click',()=>{
      api.getSaved().plans=plans().filter(p=>p.id!==editingId);
      finish('Date removed from our calendar.');
    });
    function shiftMonth(delta) {
      const d=asDate(`${month}-01`);d.setMonth(d.getMonth()+delta);
      const next=isoDate(d);
      if (!validDate(next)) return;
      month=next.slice(0,7);selected=next;renderCalendar();
    }
    $('#previous-month').addEventListener('click',()=>shiftMonth(-1));
    $('#next-month').addEventListener('click',()=>shiftMonth(1));
    $('#calendar-today').addEventListener('click',()=>{selected=today();month=selected.slice(0,7);renderCalendar();});
    $('#calendar-jump').addEventListener('change',()=>{
      const next=$('#calendar-jump').value+'-01';
      if(validDate(next)){selected=next;month=next.slice(0,7);renderCalendar();}
    });
    $('#add-plan').addEventListener('click',event=>open({date:selected,trigger:event.currentTarget}));
    $('#add-day-plan').addEventListener('click',event=>open({date:selected,trigger:event.currentTarget}));
    $('#export-calendar').addEventListener('click',()=>download(sorted()));
    document.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button)return;
      if(button.hasAttribute('data-plan-reference'))open({reference:button.dataset.planReference,trigger:button});
      else if(button.hasAttribute('data-edit-plan'))open({id:button.dataset.editPlan,trigger:button});
      else if(button.hasAttribute('data-download-plan'))download(plans().filter(p=>p.id===button.dataset.downloadPlan));
      else if(button.hasAttribute('data-calendar-day')){
        selected=button.dataset.calendarDay;renderCalendar();
        document.querySelector(`[data-calendar-day="${selected}"]`).focus({preventScroll:true});
      }
    });
    refresh();
  }
  window.PowsPlanner={init,refresh,validatePlans,open};
})();
