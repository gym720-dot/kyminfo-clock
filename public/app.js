/* Kymi Time runs entirely in the browser. No account, API, or database. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const page = document.body.dataset.page;
  const key = (name) => `kymi-time:${name}`;
  const read = (name, fallback) => { try { const value = localStorage.getItem(key(name)); return value === null ? fallback : JSON.parse(value); } catch { return fallback; } };
  const write = (name, value) => { try { localStorage.setItem(key(name), JSON.stringify(value)); } catch { toast('브라우저 저장 공간에 접근하지 못했습니다. 현재 화면은 유지되지만 새로고침하면 복원되지 않을 수 있습니다.'); } };
  const clamp = (value, min, max, fallback) => { const n = Number(value); return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : fallback; };
  const pad = (n) => String(n).padStart(2, '0');
  let toastTimer;
  function toast(message) { const el = $('toast'); if (!el) return; el.textContent = message; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 4200); }
  function formatDuration(ms, centis = false) { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600); const m = Math.floor(s % 3600 / 60); const sec = s % 60; return `${h ? `${pad(h)}:` : ''}${pad(m)}:${pad(sec)}${centis ? `.${pad(Math.floor(ms % 1000 / 10))}` : ''}`; }
  function localDate(date = new Date()) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; }
  function weekStart(date = new Date()) { const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return localDate(d); }

  function setupTheme() {
    const saved = read('theme', null);
    const initial = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = initial;
    const button = $('theme-toggle');
    const render = () => { const dark = document.documentElement.dataset.theme === 'dark'; button.setAttribute('aria-label', dark ? '밝은 테마로 전환' : '어두운 테마로 전환'); button.innerHTML = `${dark ? '☀' : '◐'} <span>${dark ? '밝게' : '테마'}</span>`; };
    render();
    button.addEventListener('click', () => { const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; write('theme', next); render(); });
  }

  let audioContext;
  function unlockSound() { try { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); audioContext.resume?.(); } catch { /* sound is optional */ } }
  function playSound() {
    try {
      unlockSound(); if (!audioContext) return;
      [0, .19, .38].forEach((delay) => { const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); oscillator.type = 'sine'; oscillator.frequency.value = 760; gain.gain.setValueAtTime(.001, audioContext.currentTime + delay); gain.gain.exponentialRampToValueAtTime(.14, audioContext.currentTime + delay + .025); gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + delay + .15); oscillator.connect(gain).connect(audioContext.destination); oscillator.start(audioContext.currentTime + delay); oscillator.stop(audioContext.currentTime + delay + .16); });
    } catch { /* muted or unsupported */ }
  }
  function notify(title, body) { toast(`${title} · ${body}`); playSound(); if ('Notification' in window && Notification.permission === 'granted') { try { new Notification(title, { body, icon: '/favicon.svg' }); } catch { /* notification unavailable */ } } }
  function setupNotificationButton() { const button = $('request-notification'); if (!button) return; const status = $('notification-status'); const render = () => { status.textContent = !('Notification' in window) ? '이 브라우저는 알림을 지원하지 않습니다. 화면과 소리 알림을 이용하세요.' : Notification.permission === 'granted' ? '브라우저 알림이 허용되었습니다.' : Notification.permission === 'denied' ? '알림이 차단되어 있습니다. 사용하려면 브라우저의 사이트 권한을 변경하세요.' : '브라우저 알림은 사용자가 허용한 경우에만 표시됩니다.'; }; button.addEventListener('click', async () => { if (!('Notification' in window)) return render(); try { await Notification.requestPermission(); } catch { /* denied */ } render(); }); render(); }

  function setupClock() {
    const display = $('main-clock'); let use24 = read('clock24', true); let seconds = read('clockSeconds', true);
    const render = () => {
      const now = new Date(); display.textContent = new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', ...(seconds ? { second: '2-digit' } : {}), hour12: !use24 }).format(now).replace(/^(오전|오후)\s*/, '$1 ');
      $('main-date').textContent = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' }).format(now);
      $('main-zone').textContent = `기기 시간대 · ${Intl.DateTimeFormat().resolvedOptions().timeZone || '현지 시간'}`;
      $('format-toggle').textContent = use24 ? '12시간 표시' : '24시간 표시'; $('seconds-toggle').textContent = seconds ? '초 숨기기' : '초 표시';
    };
    $('format-toggle').addEventListener('click', () => { use24 = !use24; write('clock24', use24); render(); });
    $('seconds-toggle').addEventListener('click', () => { seconds = !seconds; write('clockSeconds', seconds); render(); });
    $('fullscreen-toggle').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.body.requestFullscreen(); } catch { toast('이 브라우저에서는 전체 화면을 사용할 수 없습니다.'); } });
    document.addEventListener('fullscreenchange', () => { $('fullscreen-toggle').textContent = document.fullscreenElement ? '전체 화면 종료' : '전체 화면'; });
    render(); setInterval(render, 250);
  }

  function setupFocus() {
    const fields={work:$('focus-work'),break:$('focus-break'),long:$('focus-long-break'),rounds:$('focus-rounds')},defaults={work:25,break:5,long:15,rounds:4},limits={work:180,break:60,long:120,rounds:12};
    const model=globalThis.KymiTime,tab=crypto.randomUUID();
    let settings={...defaults,...read('focusSettings',{})};for(const n of Object.keys(fields))settings[n]=clamp(settings[n],n==='rounds'?2:1,limits[n],defaults[n]);
    const stage=document.querySelector('.focus-workspace');
    const extra=document.createElement('div');extra.className='focus-extras';extra.innerHTML='<div class="preset-row">'+[[25,5],[50,10],[90,20]].map(([a,b])=>`<button type="button" data-focus-preset="${a},${b}">${a}분 / ${b}분</button>`).join('')+'</div><div class="button-row"><button id="focus-fullscreen" class="button button-secondary">전체 화면</button><button id="focus-awake" class="button button-secondary" aria-pressed="false">화면 꺼짐 방지 (선택)</button></div><p id="focus-settings-note" class="field-note"></p><label><input id="focus-log" type="checkbox">이 브라우저에 타이머 경과 기록 저장 (선택)</label><p class="field-note">기록은 공부 여부가 아닌 타이머 경과 시간입니다. 실행 중 백그라운드·재방문 공백을 포함하며 일시정지는 제외합니다. 이전 버전 기록은 목표 시간으로 구분합니다. 최대 1,000건 · 서버 전송 없음.</p>';
    stage.append(extra);$('focus-log').checked=read('focusLogEnabled',false)===true;
    const fresh=()=>({id:crypto.randomUUID(),phase:'work',round:1,durationMs:settings.work*60000,remainingMs:settings.work*60000,endAt:null,running:false,owner:tab,recordFrom:$('focus-log').checked?0:null});
    let state=read('focusState',null);if(!model.validState(state))state=fresh();state.id||=crypto.randomUUID();if(!('recordFrom' in state))state.recordFrom=null;
    const rows=()=>{const r=read('focusStats',[]);return Array.isArray(r)?r.filter(x=>x&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&Number.isFinite(x.minutes)&&x.minutes>=0).slice(-1000):[];};
    function save(){write('focusState',state);}
    function setSettings(){for(const [n,input] of Object.entries(fields)){settings[n]=clamp(input.value,n==='rounds'?2:1,limits[n],defaults[n]);input.value=settings[n];}write('focusSettings',settings);if(!state.running&&model.elapsed(state,Date.now())===0){state=fresh();save();}else $('focus-settings-note').textContent='설정은 다음 단계부터 적용됩니다. 현재 남은 시간은 유지합니다.';render();}
    Object.entries(fields).forEach(([n,input])=>{input.value=settings[n];input.addEventListener('change',setSettings);});
    extra.addEventListener('click',e=>{const b=e.target.closest('[data-focus-preset]');if(b){const [a,c]=b.dataset.focusPreset.split(',');fields.work.value=a;fields.break.value=c;setSettings();}});
    const tools=document.createElement('div');tools.className='focus-record-tools';tools.innerHTML='<label>기록 시작일<input id="focus-record-from" type="date"></label><label>종료일<input id="focus-record-to" type="date"></label><button id="focus-csv" class="button button-secondary">기록 CSV</button><button id="focus-delete-range" class="button button-secondary">기간 기록 삭제</button><button id="focus-restore-records" class="button button-secondary">최근 삭제 복원</button><div id="focus-daily"></div>';document.querySelector('.utility-row').append(tools);
    function filter(r){const a=$('focus-record-from').value,b=$('focus-record-to').value;if(a&&b&&a>b)throw Error('종료일을 시작일 이후로 선택하세요.');return r.filter(x=>(!a||x.date>=a)&&(!b||x.date<=b));}
    function renderStats(){const r=rows(),today=localDate(),start=weekStart(),todayRows=r.filter(x=>x.date===today),modern=r.filter(x=>x.kind==='elapsed');const sum=a=>Math.round(a.reduce((s,x)=>s+x.minutes,0)*10)/10;$('focus-today').textContent=`${sum(modern.filter(x=>x.date===today))}분`;$('focus-week').textContent=`${sum(modern.filter(x=>x.date>=start&&x.date<=today))}분`;$('focus-sessions').textContent=`${todayRows.filter(x=>x.completed).length}회`;const daily=$('focus-daily');daily.replaceChildren();try{const groups=new Map();for(const x of filter(r))groups.set(x.date,(groups.get(x.date)||0)+(x.kind==='elapsed'?x.minutes:0));for(const [date,mins] of [...groups].sort().reverse().slice(0,31)){const p=document.createElement('p');p.textContent=`${date} · 타이머 경과 ${Math.round(mins*10)/10}분`;daily.append(p);}const legacy=r.filter(x=>x.kind!=='elapsed');if(legacy.length){const p=document.createElement('p');p.textContent=`이전 버전 목표 시간 기록 ${legacy.length}건 · ${sum(legacy)}분 (경과 합계 제외)`;daily.append(p);}}catch(e){toast(e.message);}}
    function addSession(completed){if(state.phase!=='work'||state.owner!==tab||state.recordFrom===null||state.recordFrom===undefined)return;const ms=Math.max(0,model.elapsed(state,Date.now())-state.recordFrom);if(ms<1000)return;const r=rows();if(!r.some(x=>x.id===state.id)){r.push({id:state.id,date:localDate(),minutes:ms/60000,plannedMinutes:state.durationMs/60000,completed,kind:'elapsed'});write('focusStats',r.slice(-1000));}renderStats();}
    function advance(automatic){addSession(true);const round=state.round,phase=state.phase==='work'?(round%settings.rounds===0?'long':'break'):'work';state={...fresh(),round:state.phase==='work'?round:round+1,phase,durationMs:settings[phase]*60000,remainingMs:settings[phase]*60000};save();render();if(automatic)notify(phase==='work'?'휴식 완료':'집중 완료','다음 단계 시작 버튼을 눌러 주세요.');}
    function render(){const rem=model.remaining(state,Date.now()),foreign=state.running&&state.owner!==tab;$('focus-display').textContent=formatDuration(Math.ceil(rem/1000)*1000);$('focus-phase').textContent=state.phase==='work'?'집중 시간':state.phase==='long'?'긴 휴식':'짧은 휴식';$('focus-round-label').textContent=`${((state.round-1)%settings.rounds)+1} / ${settings.rounds} 회차`;$('focus-progress').style.width=`${Math.min(100,model.elapsed(state,Date.now())/state.durationMs*100)}%`;$('focus-start').textContent=foreign?'이 탭에서 이어하기':state.running?'일시정지':rem<state.durationMs?'계속하기':state.phase==='work'?'집중 시작':'휴식 시작';$('focus-hint').textContent=foreign?'다른 탭에서 실행 중입니다. 이 탭에서 이어하려면 버튼을 누르세요.':state.running?'타이머 진행 중 · Space로 일시정지':'시작 버튼 또는 Space · 전체 화면은 Esc로 복귀';}
    function take(){if(state.running&&state.owner!==tab){state.owner=tab;save();toast('이 탭으로 타이머 제어를 옮겼습니다.');}else state.owner=tab;}
    $('focus-start').addEventListener('click',()=>{unlockSound();const foreign=state.running&&state.owner!==tab;take();if(foreign){if(model.remaining(state,Date.now())===0)advance(false);else render();return;}if(state.running){state.remainingMs=model.remaining(state,Date.now());state.running=false;state.endAt=null;}else if(state.remainingMs===0){advance(false);return;}else{state.running=true;state.endAt=Date.now()+state.remainingMs;}save();render();});
    $('focus-skip').addEventListener('click',()=>{take();addSession(false);const round=state.round,phase=state.phase==='work'?(round%settings.rounds===0?'long':'break'):'work';state={...fresh(),phase,round:state.phase==='work'?round:round+1,durationMs:settings[phase]*60000,remainingMs:settings[phase]*60000};save();render();});
    $('focus-reset').addEventListener('click',()=>{take();addSession(false);state=fresh();save();render();});
    $('focus-log').addEventListener('change',()=>{take();write('focusLogEnabled',$('focus-log').checked);state.recordFrom=$('focus-log').checked?model.elapsed(state,Date.now()):null;save();});
    function removeRecords(all){try{const r=rows(),selected=all?r:filter(r);if(!all&&!$('focus-record-from').value&&!$('focus-record-to').value)return toast('기간을 지정하세요. 전체 삭제는 별도 버튼을 이용하세요.');if(!selected.length)return toast('삭제할 기록이 없습니다.');if(!confirm(`${selected.length}건을 삭제할까요? 최근 삭제는 30일간 이 브라우저에서 복원할 수 있습니다.`))return;write('focusStatsBackup',{at:Date.now(),rows:r});const set=new Set(selected);write('focusStats',r.filter(x=>!set.has(x)));renderStats();toast('기록을 삭제했습니다. 최근 삭제 복원으로 되돌릴 수 있습니다.');}catch(e){toast(e.message);}}
    $('clear-focus-stats').addEventListener('click',()=>removeRecords(true));$('focus-delete-range').addEventListener('click',()=>removeRecords(false));
    $('focus-restore-records').addEventListener('click',()=>{const b=read('focusStatsBackup',null);if(!b||!Array.isArray(b.rows)||Date.now()-b.at>30*86400000){write('focusStatsBackup',null);return toast('30일 안의 삭제 백업이 없습니다.');}if(!confirm('최근 삭제 전 기록을 복원할까요? 현재 기록과 합칩니다.'))return;const all=[...b.rows,...rows()],map=new Map();all.forEach(x=>map.set(x.id||JSON.stringify(x),x));write('focusStats',[...map.values()].slice(-1000));write('focusStatsBackup',null);renderStats();});
    $('focus-csv').addEventListener('click',()=>{try{const r=filter(rows()),text='\uFEFF날짜,종류,분,목표분,완료\r\n'+r.map(x=>[x.date,x.kind==='elapsed'?'타이머 경과':'이전 목표',x.minutes.toFixed(3),x.plannedMinutes??x.minutes,x.completed?'예':'아니오'].join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='키미-타이머-기록.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}catch(e){toast(e.message);}});
    for(const id of ['focus-record-from','focus-record-to'])$(id).addEventListener('change',renderStats);
    $('focus-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.requestFullscreen();}catch{toast('전체 화면을 지원하지 않는 브라우저입니다.');}});
    let wake=null,wakeWanted=false;async function releaseWake(){if(wake)await wake.release().catch(()=>{});wake=null;}$('focus-awake').addEventListener('click',async()=>{wakeWanted=!wakeWanted;if(wakeWanted){try{if(!navigator.wakeLock)throw Error();wake=await navigator.wakeLock.request('screen');wake.addEventListener('release',()=>{wake=null;$('focus-awake').setAttribute('aria-pressed','false');});$('focus-awake').setAttribute('aria-pressed','true');}catch{wakeWanted=false;toast('화면 꺼짐 방지를 사용할 수 없습니다.');}}else{await releaseWake();$('focus-awake').setAttribute('aria-pressed','false');}});
    document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)&&!e.target.isContentEditable){e.preventDefault();$('focus-start').click();}});
    window.addEventListener('storage',e=>{if(e.key===key('focusState')){const s=read('focusState',null);if(model.validState(s)){state=s;render();}}if(e.key===key('focusStats'))renderStats();if(e.key===key('focusSettings')){const s=read('focusSettings',settings);for(const n of Object.keys(fields)){settings[n]=clamp(s[n],n==='rounds'?2:1,limits[n],defaults[n]);fields[n].value=settings[n];}}});
    window.addEventListener('pagehide',()=>releaseWake());document.addEventListener('visibilitychange',()=>{if(document.hidden){releaseWake();wakeWanted=false;$('focus-awake').setAttribute('aria-pressed','false');}render();});
    const backup=read('focusStatsBackup',null);if(backup&&Date.now()-backup.at>30*86400000)write('focusStatsBackup',null);
    if(!state.owner)state.owner=tab;if(state.running&&state.owner===tab&&state.endAt<=Date.now())advance(false);renderStats();render();setInterval(()=>{if(!state.running)return;if(state.owner===tab&&state.endAt<=Date.now())advance(true);else render();},250);
  }


  const CITIES = [
    ['서울', 'Asia/Seoul'], ['도쿄', 'Asia/Tokyo'], ['베이징', 'Asia/Shanghai'], ['싱가포르', 'Asia/Singapore'], ['방콕', 'Asia/Bangkok'], ['뉴델리', 'Asia/Kolkata'], ['두바이', 'Asia/Dubai'], ['런던', 'Europe/London'], ['파리', 'Europe/Paris'], ['베를린', 'Europe/Berlin'], ['뉴욕', 'America/New_York'], ['시카고', 'America/Chicago'], ['로스앤젤레스', 'America/Los_Angeles'], ['토론토', 'America/Toronto'], ['상파울루', 'America/Sao_Paulo'], ['시드니', 'Australia/Sydney'], ['오클랜드', 'Pacific/Auckland']
  ];
  function setupWorldTime() {
    const name = (zone) => CITIES.find((city) => city[1] === zone)?.[0] || zone;
    const options = CITIES.map(([label, zone]) => `<option value="${zone}">${label}</option>`).join('');
    ['city-add', 'compare-from', 'compare-to'].forEach((id) => { $(id).innerHTML = options; }); $('compare-from').value = 'Asia/Seoul'; $('compare-to').value = 'America/New_York';
    let selected = read('cities', ['Asia/Seoul', 'America/New_York', 'Europe/London']); selected = selected.filter((zone) => CITIES.some((city) => city[1] === zone)); if (!selected.length) selected = ['Asia/Seoul'];
    function parts(zone, now) { const values = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(now).filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)])); return values; }
    function offset(zone, now) { const p = parts(zone, now); return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(now.getTime() / 1000) * 1000) / 3600000; }
    function currentCityInput(zone) { const p = parts(zone, new Date()); return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`; }
    let meetingKey='';
    function renderMeeting() {
      const nextKey=[$('meeting-at').value,$('compare-from').value,$('compare-to').value,selected.join(','),$('meeting-work-start').value,$('meeting-work-end').value].join('|');if(nextKey===meetingKey)return;meetingKey=nextKey;
      try {const entered=$('meeting-at').value,from=$('compare-from').value,to=$('compare-to').value,candidates=globalThis.KymiTime.wallCandidates(entered,from);
      if(candidates.length!==1){$('meeting-result').textContent=candidates.length?'이 시각은 서머타임 종료로 두 번 존재합니다. 중복되지 않는 시각을 선택하세요.':'서머타임 시작으로 존재하지 않는 시각입니다. 다른 시간을 선택하세요.';return;}
      const instant=candidates[0],a=clamp($('meeting-work-start').value,0,23,9),b=clamp($('meeting-work-end').value,1,24,18);if(a>=b){$('meeting-result').textContent='근무 종료 시간을 시작 이후로 입력하세요. 야간 근무는 현재 지원하지 않습니다.';return;}
      const zones=[...new Set([from,to,...selected])],lines=zones.map(zone=>{const p=parts(zone,new Date(instant)),value=p.hour+p.minute/60,weekday=new Intl.DateTimeFormat('en-US',{timeZone:zone,weekday:'short'}).format(new Date(instant));return name(zone)+' · '+new Intl.DateTimeFormat('ko-KR',{timeZone:zone,dateStyle:'full',timeStyle:'short',hourCycle:'h23'}).format(new Date(instant))+' · '+(value>=a&&value<b?'설정 시간 안':'설정 시간 밖')+(['Sat','Sun'].includes(weekday)?' · 주말':'');});
      $('meeting-result').textContent=lines.join('\n')+'\n공통 근무 시간 '+a+'~'+b+'시 기준. 공휴일과 개인 일정은 반영하지 않습니다.';
      }catch(e){$('meeting-result').textContent=e.message;}
    }
    function render() {
      const now = new Date(); const list = $('city-list'); list.innerHTML = selected.map((zone) => { const date = new Intl.DateTimeFormat('ko-KR', { timeZone: zone, month: 'long', day: 'numeric', weekday: 'short' }).format(now); const time = new Intl.DateTimeFormat('ko-KR', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(now); return `<div class="city-card"><div class="city-top"><span>${name(zone)}</span><button class="icon-button" type="button" data-remove-city="${zone}" aria-label="${name(zone)} 삭제">×</button></div><strong>${time}</strong><small>${date}</small></div>`; }).join('');
      const from = $('compare-from').value, to = $('compare-to').value; const diff = offset(to, now) - offset(from, now); const abs = Math.abs(diff); const hours = Math.floor(abs), minutes = Math.round((abs - hours) * 60); const relation = diff === 0 ? '시차가 없습니다.' : `${name(to)} 시간은 ${name(from)}보다 ${hours ? `${hours}시간` : ''}${minutes ? ` ${minutes}분` : ''} ${diff > 0 ? '빠릅니다.' : '느립니다.'}`; $('compare-result').textContent = relation; renderMeeting();
    }
    $('add-city').addEventListener('click', () => { const zone = $('city-add').value; if (selected.includes(zone)) return toast('이미 표시 중인 도시입니다.'); selected.push(zone); write('cities', selected); render(); });
    $('city-list').addEventListener('click', (event) => { const button = event.target.closest('[data-remove-city]'); if (!button) return; selected = selected.filter((zone) => zone !== button.dataset.removeCity); write('cities', selected); render(); });
    $('compare-from').addEventListener('change', () => { $('meeting-at').value = currentCityInput($('compare-from').value); render(); }); $('compare-to').addEventListener('change', render); $('meeting-at').addEventListener('change', renderMeeting); $('meeting-at').value = currentCityInput($('compare-from').value); for(const id of ['meeting-work-start','meeting-work-end'])$(id).addEventListener('change',renderMeeting); render(); setInterval(render, 1000);
  }

  function setupAlarm() {
    let alarms = read('alarms', []); if (!Array.isArray(alarms)) alarms = [];
    const save = () => write('alarms', alarms);
    function render() { const list = $('alarm-list'); list.innerHTML = alarms.length ? alarms.slice().sort((a, b) => a.time.localeCompare(b.time)).map((alarm) => `<div class="alarm-item"><div><time>${alarm.time}</time><span class="muted">${escapeText(alarm.label || '알람')}</span></div><div class="alarm-actions"><label><input type="checkbox" data-toggle-alarm="${alarm.id}" ${alarm.enabled ? 'checked' : ''}> 사용</label><button class="icon-button" type="button" data-delete-alarm="${alarm.id}" aria-label="${escapeText(alarm.label || alarm.time)} 삭제">×</button></div></div>`).join('') : '<p class="empty-state">설정한 알람이 없습니다. 원하는 시간을 추가해 보세요.</p>'; }
    $('alarm-form').addEventListener('submit', (event) => { event.preventDefault(); const time = $('alarm-time').value; if (!time) return; unlockSound(); alarms.push({ id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, time, label: $('alarm-label').value.trim().slice(0, 40), enabled: true, firedDate: '' }); save(); render(); $('alarm-label').value = ''; toast(`${time} 알람을 추가했습니다.`); });
    $('alarm-list').addEventListener('change', (event) => { const id = event.target.dataset.toggleAlarm; if (!id) return; const alarm = alarms.find((item) => item.id === id); if (alarm) { alarm.enabled = event.target.checked; save(); } });
    $('alarm-list').addEventListener('click', (event) => { const id = event.target.dataset.deleteAlarm; if (!id) return; alarms = alarms.filter((item) => item.id !== id); save(); render(); });
    $('alarm-test').addEventListener('click', () => { unlockSound(); notify('알람 테스트', '알림 소리와 화면을 확인하세요.'); }); setupNotificationButton(); render();
    function check() { const now = new Date(); const current = `${pad(now.getHours())}:${pad(now.getMinutes())}`, day = localDate(now); let changed = false; for (const alarm of alarms) { if (alarm.enabled && alarm.time === current && alarm.firedDate !== day) { alarm.firedDate = day; changed = true; notify('알람', alarm.label || `${alarm.time}입니다.`); } } if (changed) save(); }
    check(); setInterval(check, 1000); document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  }
  function escapeText(text) { return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }

  function setupTimer() {
    const inputs = [$('timer-hours'), $('timer-minutes'), $('timer-seconds')];
    let state = read('timerState', { durationMs: 300000, remainingMs: 300000, running: false, endAt: null });
    if (!state || !Number.isFinite(state.remainingMs) || !Number.isFinite(state.durationMs) || state.durationMs < 1000) state = { durationMs: 300000, remainingMs: 300000, running: false, endAt: null };
    const savedSeconds = Math.floor(state.durationMs / 1000);
    inputs[0].value = Math.floor(savedSeconds / 3600);
    inputs[1].value = Math.floor(savedSeconds % 3600 / 60);
    inputs[2].value = savedSeconds % 60;
    const save = () => write('timerState', state);
    function setDuration(seconds) { if (seconds < 1) return toast('1초 이상 설정해 주세요.'); const h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60), s = seconds % 60; inputs[0].value = h; inputs[1].value = m; inputs[2].value = s; state = { durationMs: seconds * 1000, remainingMs: seconds * 1000, running: false, endAt: null }; save(); render(); }
    function render() { const remaining = state.running ? Math.max(0, state.endAt - Date.now()) : state.remainingMs; $('timer-display').textContent = formatDuration(Math.ceil(remaining / 1000) * 1000); $('timer-start').textContent = state.running ? '일시정지' : remaining === 0 ? '다시 시작' : remaining < state.durationMs ? '계속하기' : '시작'; $('timer-hint').textContent = state.running ? '카운트다운이 진행 중입니다.' : remaining === 0 ? '설정한 시간이 지났습니다.' : '시간을 정하고 시작해 보세요.'; }
    document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => setDuration(Number(button.dataset.preset))));
    inputs.forEach((input) => input.addEventListener('change', () => { const seconds = clamp(inputs[0].value, 0, 99, 0) * 3600 + clamp(inputs[1].value, 0, 59, 0) * 60 + clamp(inputs[2].value, 0, 59, 0); setDuration(seconds); }));
    $('timer-start').addEventListener('click', () => { unlockSound(); if (state.running) { state.remainingMs = Math.max(0, state.endAt - Date.now()); state.endAt = null; state.running = false; } else { if (state.remainingMs <= 0) state.remainingMs = state.durationMs; state.endAt = Date.now() + state.remainingMs; state.running = true; } save(); render(); });
    $('timer-reset').addEventListener('click', () => { state.remainingMs = state.durationMs; state.running = false; state.endAt = null; save(); render(); });
    if (state.running && state.endAt <= Date.now()) { state.running = false; state.remainingMs = 0; state.endAt = null; save(); }
    render(); setInterval(() => { if (!state.running) return; if (state.endAt <= Date.now()) { state.running = false; state.remainingMs = 0; state.endAt = null; save(); render(); notify('타이머 종료', '설정한 시간이 지났습니다.'); } else render(); }, 250);
  }

  function setupStopwatch() {
    let state = read('stopwatchState', { elapsedMs: 0, running: false, startedAt: null, laps: [] });
    if (!state || !Array.isArray(state.laps)) state = { elapsedMs: 0, running: false, startedAt: null, laps: [] };
    const save = () => write('stopwatchState', state);
    const elapsed = () => state.elapsedMs + (state.running ? Date.now() - state.startedAt : 0);
    function render() { $('stopwatch-display').textContent = formatDuration(elapsed(), true); $('stopwatch-start').textContent = state.running ? '일시정지' : state.elapsedMs ? '계속하기' : '시작'; $('stopwatch-lap').disabled = !state.running; $('lap-count').textContent = `${state.laps.length}개`; $('lap-list').innerHTML = state.laps.length ? state.laps.slice().reverse().map((lap, index) => `<div class="lap-row"><span>랩 ${state.laps.length - index}</span><strong>${formatDuration(lap.split, true)} <span class="muted">/ 전체 ${formatDuration(lap.total, true)}</span></strong></div>`).join('') : '<p class="empty-state">아직 기록한 랩이 없습니다.</p>'; }
    $('stopwatch-start').addEventListener('click', () => { if (state.running) { state.elapsedMs = elapsed(); state.running = false; state.startedAt = null; } else { state.startedAt = Date.now(); state.running = true; } save(); render(); });
    $('stopwatch-lap').addEventListener('click', () => { const total = elapsed(), previous = state.laps.at(-1)?.total || 0; state.laps.push({ total, split: total - previous }); save(); render(); });
    $('stopwatch-reset').addEventListener('click', () => { state = { elapsedMs: 0, running: false, startedAt: null, laps: [] }; save(); render(); });
    render(); setInterval(() => { if (state.running) $('stopwatch-display').textContent = formatDuration(elapsed(), true); }, 70);
  }

  setupTheme();
  if (page === 'clock') setupClock();
  if (page === 'focus') setupFocus();
  if (page === 'world-time') setupWorldTime();
  if (page === 'alarm') setupAlarm();
  if (page === 'timer') setupTimer();
  if (page === 'stopwatch') setupStopwatch();
})();
