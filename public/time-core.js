/* Pure time models; no network or storage. */
((root)=>{
  const formatters=new Map();
  const parts=(zone,ms)=>{if(!formatters.has(zone))formatters.set(zone,new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}));return Object.fromEntries(formatters.get(zone).formatToParts(new Date(ms)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));};
  const wall=(p)=>Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second||0);
  function wallCandidates(value,zone){if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw Error('날짜와 시간을 입력하세요.');const [year,month,day,hour,minute]=value.split(/[-T:]/).map(Number);if(year<100||year>9999||month<1||month>12||day<1||day>31||hour>23||minute>59)throw Error('유효한 날짜와 시간을 입력하세요.');const naive=Date.UTC(year,month-1,day,hour,minute);const check=new Date(naive);if(check.getUTCDate()!==day||check.getUTCMonth()!==month-1)throw Error('존재하지 않는 날짜입니다.');const offsets=new Set();for(let h=-48;h<=48;h+=6){const t=naive+h*3600000;offsets.add(wall(parts(zone,t))-t);}return [...offsets].map(o=>naive-o).filter(t=>{const p=parts(zone,t);return [p.year,p.month,p.day,p.hour,p.minute].join(',')===[year,month,day,hour,minute].join(',');}).sort((a,b)=>a-b);}
  const remaining=(state,now)=>Math.max(0,Math.min(state.durationMs,state.running?state.endAt-now:state.remainingMs));
  const elapsed=(state,now)=>Math.max(0,state.durationMs-remaining(state,now));
  function validState(s){return !!s&&['work','break','long'].includes(s.phase)&&Number.isFinite(s.durationMs)&&s.durationMs>=60000&&s.durationMs<=10800000&&Number.isFinite(s.remainingMs)&&s.remainingMs>=0&&s.remainingMs<=s.durationMs&&Number.isInteger(s.round)&&s.round>=1&&typeof s.running==='boolean'&&(!s.running||Number.isFinite(s.endAt));}
  root.KymiTime={parts,wallCandidates,remaining,elapsed,validState};
})(globalThis);
