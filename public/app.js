/* Kymi Time runs entirely in the browser. No account, API, or database. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const page = document.body.dataset.page;
  const key = (name) => `kymi-time:${name}`;
  const read = (name, fallback) => { try { const value = localStorage.getItem(key(name)); return value === null ? fallback : JSON.parse(value); } catch { return fallback; } };
  const write = (name, value) => { try { localStorage.setItem(key(name), JSON.stringify(value)); } catch { /* storage may be unavailable */ } };
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
    const fields = { work: $('focus-work'), break: $('focus-break'), long: $('focus-long-break'), rounds: $('focus-rounds') };
    const defaults = { work: 25, break: 5, long: 15, rounds: 4 };
    const limits = { work: 180, break: 60, long: 120, rounds: 12 };
    let settings = { ...defaults, ...read('focusSettings', {}) };
    for (const name of Object.keys(fields)) settings[name] = clamp(settings[name], name === 'rounds' ? 2 : 1, limits[name], defaults[name]);
    Object.entries(fields).forEach(([name, input]) => { input.value = settings[name]; input.addEventListener('change', () => { settings[name] = clamp(input.value, name === 'rounds' ? 2 : 1, limits[name], defaults[name]); input.value = settings[name]; write('focusSettings', settings); state = fresh(); save(); render(); }); });
    const fresh = () => ({ phase: 'work', round: 1, durationMs: settings.work * 60000, remainingMs: settings.work * 60000, endAt: null, running: false });
    let state = read('focusState', null);
    if (!state || !['work', 'break', 'long'].includes(state.phase)) state = fresh();
    function save() { write('focusState', state); }
    function addSession() { const stats = read('focusStats', []); stats.push({ date: localDate(), minutes: settings.work }); write('focusStats', stats.slice(-1000)); renderStats(); }
    function renderStats() { const stats = read('focusStats', []); const today = localDate(); const start = weekStart(); const todayRows = stats.filter((row) => row.date === today); $('focus-today').textContent = `${todayRows.reduce((sum, row) => sum + row.minutes, 0)}분`; $('focus-week').textContent = `${stats.filter((row) => row.date >= start && row.date <= today).reduce((sum, row) => sum + row.minutes, 0)}분`; $('focus-sessions').textContent = `${todayRows.length}회`; }
    function advance(automatic) {
      if (state.phase === 'work') { addSession(); const long = state.round % settings.rounds === 0; state.phase = long ? 'long' : 'break'; state.durationMs = (long ? settings.long : settings.break) * 60000; if (automatic) notify('집중 완료', long ? '긴 휴식 시간입니다.' : '잠깐 쉬어 가세요.'); }
      else { state.phase = 'work'; state.round += 1; state.durationMs = settings.work * 60000; if (automatic) notify('휴식 완료', '다음 집중 시간을 시작하세요.'); }
      state.remainingMs = state.durationMs; state.running = false; state.endAt = null; save(); render();
    }
    function render() {
      const remaining = state.running ? Math.max(0, state.endAt - Date.now()) : state.remainingMs;
      $('focus-display').textContent = formatDuration(Math.ceil(remaining / 1000) * 1000);
      $('focus-phase').textContent = state.phase === 'work' ? '집중 시간' : state.phase === 'long' ? '긴 휴식' : '짧은 휴식';
      $('focus-round-label').textContent = `${((state.round - 1) % settings.rounds) + 1} / ${settings.rounds} 회차`;
      $('focus-progress').style.width = `${Math.min(100, Math.max(0, (1 - remaining / state.durationMs) * 100))}%`;
      $('focus-start').textContent = state.running ? '일시정지' : state.remainingMs < state.durationMs ? '계속하기' : state.phase === 'work' ? '집중 시작' : '휴식 시작';
      $('focus-hint').textContent = state.running ? (state.phase === 'work' ? '지금은 한 가지 일에만 집중해 보세요.' : '잠시 눈과 몸을 쉬어 주세요.') : '시작 버튼을 누르면 타이머가 진행됩니다.';
    }
    $('focus-start').addEventListener('click', () => { unlockSound(); if (state.running) { state.remainingMs = Math.max(0, state.endAt - Date.now()); state.running = false; state.endAt = null; } else { state.running = true; state.endAt = Date.now() + state.remainingMs; } save(); render(); });
    $('focus-skip').addEventListener('click', () => { if (state.phase === 'work') { state.phase = state.round % settings.rounds === 0 ? 'long' : 'break'; state.durationMs = (state.phase === 'long' ? settings.long : settings.break) * 60000; } else { state.phase = 'work'; state.round += 1; state.durationMs = settings.work * 60000; } state.remainingMs = state.durationMs; state.running = false; state.endAt = null; save(); render(); });
    $('focus-reset').addEventListener('click', () => { state = fresh(); save(); render(); });
    $('clear-focus-stats').addEventListener('click', () => { if (!confirm('이 브라우저에 저장된 집중 기록을 모두 지울까요?')) return; write('focusStats', []); renderStats(); toast('집중 기록을 지웠습니다.'); });
    if (state.running && state.endAt <= Date.now()) advance(false);
    renderStats(); render(); setInterval(() => { if (!state.running) return; if (state.endAt <= Date.now()) advance(true); else render(); }, 250);
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
    function renderMeeting() {
      const entered = $('meeting-at').value; if (!entered) { $('meeting-result').textContent = '회의 시작 시간을 입력해 주세요.'; return; }
      const [year, month, day, hour, minute] = entered.split(/[-T:]/).map(Number);
      const from = $('compare-from').value, to = $('compare-to').value;
      const naive = Date.UTC(year, month - 1, day, hour, minute);
      let instant = naive - offset(from, new Date(naive)) * 3600000;
      instant = naive - offset(from, new Date(instant)) * 3600000;
      const actual = parts(from, new Date(instant));
      if ([actual.year, actual.month, actual.day, actual.hour, actual.minute].join(',') !== [year, month, day, hour, minute].join(',')) { $('meeting-result').textContent = '선택한 시각은 서머타임 전환과 겹칠 수 있습니다. 다른 시간을 선택해 주세요.'; return; }
      const destination = new Intl.DateTimeFormat('ko-KR', { timeZone: to, dateStyle: 'full', timeStyle: 'short', hourCycle: 'h23' }).format(new Date(instant));
      const targetHour = parts(to, new Date(instant)).hour;
      const workHours = hour >= 9 && hour < 18 && targetHour >= 9 && targetHour < 18;
      $('meeting-result').textContent = `${name(from)} ${entered.replace('T', ' ')} → ${name(to)} ${destination}. ${workHours ? '두 도시 모두 09~18시 시간대입니다.' : '적어도 한 도시는 09~18시 시간대 밖입니다.'}`;
    }
    function render() {
      const now = new Date(); const list = $('city-list'); list.innerHTML = selected.map((zone) => { const date = new Intl.DateTimeFormat('ko-KR', { timeZone: zone, month: 'long', day: 'numeric', weekday: 'short' }).format(now); const time = new Intl.DateTimeFormat('ko-KR', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(now); return `<div class="city-card"><div class="city-top"><span>${name(zone)}</span><button class="icon-button" type="button" data-remove-city="${zone}" aria-label="${name(zone)} 삭제">×</button></div><strong>${time}</strong><small>${date}</small></div>`; }).join('');
      const from = $('compare-from').value, to = $('compare-to').value; const diff = offset(to, now) - offset(from, now); const abs = Math.abs(diff); const hours = Math.floor(abs), minutes = Math.round((abs - hours) * 60); const relation = diff === 0 ? '시차가 없습니다.' : `${name(to)} 시간은 ${name(from)}보다 ${hours ? `${hours}시간` : ''}${minutes ? ` ${minutes}분` : ''} ${diff > 0 ? '빠릅니다.' : '느립니다.'}`; $('compare-result').textContent = relation; renderMeeting();
    }
    $('add-city').addEventListener('click', () => { const zone = $('city-add').value; if (selected.includes(zone)) return toast('이미 표시 중인 도시입니다.'); selected.push(zone); write('cities', selected); render(); });
    $('city-list').addEventListener('click', (event) => { const button = event.target.closest('[data-remove-city]'); if (!button) return; selected = selected.filter((zone) => zone !== button.dataset.removeCity); write('cities', selected); render(); });
    $('compare-from').addEventListener('change', () => { $('meeting-at').value = currentCityInput($('compare-from').value); render(); }); $('compare-to').addEventListener('change', render); $('meeting-at').addEventListener('change', renderMeeting); $('meeting-at').value = currentCityInput($('compare-from').value); render(); setInterval(render, 1000);
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
    function render() { const remaining = state.running ? Math.max(0, state.endAt - Date.now()) : state.remainingMs; $('timer-display').textContent = formatDuration(Math.ceil(remaining / 1000) * 1000); $('timer-start').textContent = state.running ? '일시정지' : remaining < state.durationMs ? '계속하기' : '시작'; $('timer-hint').textContent = state.running ? '카운트다운이 진행 중입니다.' : '시간을 정하고 시작해 보세요.'; }
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
