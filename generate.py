"""Generate the static, crawlable Kymi Time pages. No runtime server is needed."""

from html import escape
from pathlib import Path

ROOT = Path(__file__).parent / "public"
BASE = "https://clock.kyminfo.com"

PAGES = {
    "": {
        "name": "시계",
        "title": "온라인 시계 · 현재 시간 | 키미 타임",
        "description": "초 단위 현재 시간과 날짜를 큰 화면으로 확인하세요. 전체 화면, 12·24시간 표시, 밝고 어두운 테마를 지원하는 무료 온라인 시계입니다.",
        "eyebrow": "ONLINE CLOCK",
        "heading": "지금, 이 순간을 선명하게.",
        "intro": "현재 시간부터 집중 시간까지. 오늘 필요한 시간 도구를 한곳에서 사용하세요.",
        "tool": '''<section class="clock-stage" aria-label="현재 시간 시계">
  <div class="clock-orbit clock-orbit-one"></div><div class="clock-orbit clock-orbit-two"></div>
  <p class="stage-kicker"><span class="live-dot"></span> 내 기기의 현재 시간</p>
  <div id="main-clock" class="clock-digits" role="timer" aria-label="현재 시간">--:--:--</div>
  <p id="main-date" class="clock-date">날짜를 확인하는 중</p>
  <p id="main-zone" class="clock-zone"></p>
  <div class="clock-actions"><button id="format-toggle" class="button button-light" type="button">24시간 표시</button><button id="seconds-toggle" class="button button-light" type="button">초 숨기기</button><button id="fullscreen-toggle" class="button button-light" type="button">전체 화면</button></div>
</section>
<section class="section"><div class="section-heading"><div><p class="eyebrow">YOUR TIME TOOLKIT</p><h2>오늘 필요한 시간 도구</h2></div><p>시작은 간단하게, 필요한 기능은 충분하게.</p></div><div class="tool-grid">
<a class="tool-card featured" href="/focus/"><span class="card-number">01 / FOCUS</span><h3>집중 타이머</h3><p>일과 휴식을 반복하고 오늘의 집중 시간을 확인하세요.</p><span class="card-link">집중 시작하기 <span aria-hidden="true">↗</span></span></a>
<a class="tool-card" href="/world-time/"><span class="card-number">02 / WORLD</span><h3>세계시간</h3><p>도시를 골라 현재 시간과 시차를 한눈에 비교하세요.</p><span class="card-link">세계시간 보기 <span aria-hidden="true">↗</span></span></a>
<a class="tool-card" href="/alarm/"><span class="card-number">03 / ALARM</span><h3>온라인 알람</h3><p>원하는 시간을 정하고 화면·소리·알림으로 확인하세요.</p><span class="card-link">알람 설정하기 <span aria-hidden="true">↗</span></span></a>
<a class="tool-card" href="/timer/"><span class="card-number">04 / TIMER</span><h3>온라인 타이머</h3><p>1분부터 원하는 시간까지 정확히 카운트다운하세요.</p><span class="card-link">타이머 시작하기 <span aria-hidden="true">↗</span></span></a>
<a class="tool-card" href="/stopwatch/"><span class="card-number">05 / STOPWATCH</span><h3>스톱워치</h3><p>랩 기록과 함께 걸린 시간을 측정하세요.</p><span class="card-link">시간 측정하기 <span aria-hidden="true">↗</span></span></a>
</div></section>''',
        "guide": '''<h2>이 시계는 어떻게 시간을 표시하나요?</h2><p>기기의 시간과 시간대 설정을 사용합니다. 시간이 실제와 다르다면 컴퓨터나 휴대전화의 날짜·시간 설정을 확인해 주세요. 세계시간 페이지는 선택한 도시의 시간대를 기준으로 표시합니다.</p><h3>전체 화면 시계가 필요한 순간</h3><p>책상 위 보조 시계, 발표 연습, 운동 시간 확인처럼 멀리서도 시간을 읽고 싶을 때 전체 화면 버튼을 누르세요. Esc 키로 돌아올 수 있습니다.</p>''',
    },
    "focus": {
        "name": "집중 타이머",
        "title": "집중 타이머 · 뽀모도로 타이머 | 키미 타임",
        "description": "25분 집중·5분 휴식부터 원하는 시간까지 설정하는 무료 뽀모도로 타이머. 오늘과 이번 주 집중 시간을 브라우저에만 기록합니다.",
        "eyebrow": "FOCUS TIMER",
        "heading": "집중할 시간, 쉬어갈 시간.",
        "intro": "일과 휴식을 번갈아 이어가며, 오늘 쌓은 집중 시간을 확인하세요.",
        "tool": '''<section class="workspace focus-workspace" aria-label="집중 타이머"><div class="workspace-head"><span class="status-pill" id="focus-phase">집중 준비</span><span id="focus-round-label" class="muted">1 / 4 회차</span></div><div id="focus-display" class="timer-digits" role="timer" aria-live="off">25:00</div><div class="progress-track"><div id="focus-progress" class="progress-fill"></div></div><p id="focus-hint" class="workspace-hint">집중 시간을 설정하고 시작해 보세요.</p><div class="button-row"><button id="focus-start" class="button button-primary" type="button">집중 시작</button><button id="focus-skip" class="button button-secondary" type="button">다음 단계</button><button id="focus-reset" class="button button-ghost" type="button">초기화</button></div><div class="settings-grid"><label>집중 시간 <span>분</span><input id="focus-work" type="number" min="1" max="180" value="25" inputmode="numeric"></label><label>짧은 휴식 <span>분</span><input id="focus-break" type="number" min="1" max="60" value="5" inputmode="numeric"></label><label>긴 휴식 <span>분</span><input id="focus-long-break" type="number" min="1" max="120" value="15" inputmode="numeric"></label><label>긴 휴식 주기 <span>회</span><input id="focus-rounds" type="number" min="2" max="12" value="4" inputmode="numeric"></label></div><p class="field-note">시간 설정을 바꾸면 현재 회차는 초기화됩니다. 알림 소리는 시작 버튼을 누른 뒤 사용할 수 있습니다.</p></section><section class="stats-grid" aria-label="집중 기록"><div class="stat-card"><span>오늘 집중</span><strong id="focus-today">0분</strong></div><div class="stat-card"><span>이번 주 집중</span><strong id="focus-week">0분</strong></div><div class="stat-card"><span>오늘 완료한 회차</span><strong id="focus-sessions">0회</strong></div></section><div class="utility-row"><button id="clear-focus-stats" class="text-button" type="button">이 브라우저의 집중 기록 지우기</button></div>''',
        "guide": '''<h2>집중 타이머 사용법</h2><p>기본 설정은 25분 집중과 5분 휴식입니다. 정해진 횟수의 집중을 마치면 긴 휴식으로 넘어갑니다. 공부나 업무 흐름에 맞춰 각 시간을 바꿀 수 있습니다. 시작 후 일시정지하거나 다음 단계로 건너뛸 수 있습니다.</p><h3>집중 기록은 어디에 저장되나요?</h3><p>완료한 집중 회차만 이 브라우저의 저장 공간에 기록합니다. 오늘과 이번 주 합계는 기기의 날짜를 기준으로 계산합니다. 회원가입이나 서버 저장은 없으며, 브라우저 데이터를 지우면 기록도 사라집니다.</p><h3>화면을 닫아도 알림이 울리나요?</h3><p>아니요. 웹사이트가 완전히 닫히거나 기기가 꺼져 있으면 소리나 브라우저 알림을 보낼 수 없습니다. 다시 열었을 때는 저장된 종료 시각을 기준으로 남은 시간을 계산합니다.</p>''',
    },
    "world-time": {
        "name": "세계시간",
        "title": "세계시간 · 도시 시차 비교 | 키미 타임",
        "description": "서울·도쿄·뉴욕·런던 등 주요 도시의 현재 시간을 보고 도시 간 시차를 비교하세요. 각 도시의 표준 시간대와 서머타임을 반영합니다.",
        "eyebrow": "WORLD TIME",
        "heading": "멀리 있는 도시도, 지금은 함께.",
        "intro": "도시를 추가하고 현재 시각과 시차를 확인하세요. 해외 회의 시간을 정할 때도 유용합니다.",
        "tool": '''<section class="workspace"><div class="section-heading compact"><div><p class="eyebrow">MY CITIES</p><h2>선택한 도시</h2></div></div><div class="inline-form"><label class="sr-only" for="city-add">추가할 도시</label><select id="city-add"></select><button class="button button-primary" id="add-city" type="button">도시 추가</button></div><div id="city-list" class="city-grid" aria-live="polite"></div></section><section class="workspace compare-workspace"><div class="section-heading compact"><div><p class="eyebrow">TIME DIFFERENCE</p><h2>도시 시차 비교</h2></div></div><div class="compare-fields"><label>기준 도시<select id="compare-from"></select></label><span aria-hidden="true" class="compare-arrow">↔</span><label>비교 도시<select id="compare-to"></select></label></div><p id="compare-result" class="compare-result" aria-live="polite"></p><p class="field-note">도시의 실제 시간대 규칙을 사용하므로 계절에 따른 서머타임 변화가 반영됩니다. 회의 전에는 참석자의 현지 날짜도 확인하세요.</p></section>''',
        "guide": '''<h2>세계시간은 어떻게 계산하나요?</h2><p>브라우저에 포함된 IANA 시간대 데이터를 사용하여 각 도시의 현재 시각을 표시합니다. 일부 국가는 계절에 따라 서머타임이 적용되므로 시차가 바뀔 수 있습니다. 기기의 운영체제와 브라우저가 오래되었다면 시간대 데이터도 오래되었을 수 있습니다.</p><h3>시차 비교 활용하기</h3><p>서울과 뉴욕처럼 멀리 떨어진 두 도시를 고르면 현재 시각과 몇 시간 차이가 나는지 표시됩니다. 상대 도시의 날짜가 전날 또는 다음 날일 수도 있으니 시간과 날짜를 함께 살펴보세요.</p>''',
    },
    "alarm": {
        "name": "알람",
        "title": "온라인 알람 시계 · 브라우저 알림 | 키미 타임",
        "description": "원하는 시간에 울리는 무료 온라인 알람. 여러 알람을 만들고 화면·소리·브라우저 알림으로 시간을 확인하세요. 브라우저가 열려 있어야 작동합니다.",
        "eyebrow": "ONLINE ALARM",
        "heading": "필요한 순간을 놓치지 않도록.",
        "intro": "중요한 시작 시간과 쉬는 시간을 알람으로 설정해 보세요.",
        "tool": '''<section class="workspace"><div class="section-heading compact"><div><p class="eyebrow">NEW ALARM</p><h2>알람 만들기</h2></div></div><form id="alarm-form" class="alarm-form"><label>울릴 시간<input id="alarm-time" type="time" required></label><label>알람 이름<input id="alarm-label" type="text" maxlength="40" placeholder="예: 회의 시작"></label><button class="button button-primary" type="submit">알람 추가</button></form><div class="utility-row"><button class="text-button" id="alarm-test" type="button">알림 소리 테스트</button><button class="text-button" id="request-notification" type="button">브라우저 알림 허용하기</button></div><p id="notification-status" class="field-note">브라우저 알림은 사용자가 허용한 경우에만 표시됩니다.</p></section><section class="workspace"><div class="section-heading compact"><div><p class="eyebrow">SAVED ALARMS</p><h2>설정한 알람</h2></div></div><div id="alarm-list" class="alarm-list" aria-live="polite"></div></section>''',
        "guide": '''<h2>온라인 알람은 언제 울리나요?</h2><p>설정한 현지 시간의 시와 분이 되었을 때 울립니다. 같은 알람은 하루에 한 번 울리도록 처리합니다. 브라우저를 완전히 닫거나 기기를 끄면 웹사이트가 알람을 울릴 수 없습니다.</p><h3>소리와 알림이 나오지 않는다면</h3><p>기기 볼륨과 탭의 음소거 상태를 확인하세요. 브라우저 알림은 허용 버튼을 누른 뒤 권한을 승인해야 합니다. 일부 브라우저와 운영체제는 절전 상태 또는 백그라운드 탭에서 알림을 늦출 수 있습니다. 중요한 약속은 기기의 기본 알람도 함께 사용하세요.</p>''',
    },
    "timer": {
        "name": "타이머",
        "title": "온라인 타이머 · 1분 5분 10분 타이머 | 키미 타임",
        "description": "1분·5분·10분 등 자주 쓰는 시간을 바로 시작하거나 시·분·초를 직접 설정하세요. 큰 화면과 소리·브라우저 알림을 지원합니다.",
        "eyebrow": "COUNTDOWN TIMER",
        "heading": "정해둔 시간에만 집중하세요.",
        "intro": "짧은 휴식, 요리, 발표 연습까지 원하는 시간을 간편하게 재세요.",
        "tool": '''<section class="workspace"><div class="preset-row" aria-label="타이머 빠른 설정"><button data-preset="60" type="button">1분</button><button data-preset="180" type="button">3분</button><button data-preset="300" type="button">5분</button><button data-preset="600" type="button">10분</button><button data-preset="900" type="button">15분</button><button data-preset="1800" type="button">30분</button><button data-preset="3600" type="button">1시간</button></div><div id="timer-display" class="timer-digits" role="timer" aria-live="off">05:00</div><p id="timer-hint" class="workspace-hint">시간을 정하고 시작해 보세요.</p><div class="button-row"><button id="timer-start" class="button button-primary" type="button">시작</button><button id="timer-reset" class="button button-ghost" type="button">초기화</button></div><div class="settings-grid timer-inputs"><label>시간<input id="timer-hours" type="number" min="0" max="99" value="0" inputmode="numeric"></label><label>분<input id="timer-minutes" type="number" min="0" max="59" value="5" inputmode="numeric"></label><label>초<input id="timer-seconds" type="number" min="0" max="59" value="0" inputmode="numeric"></label></div><p class="field-note">시간을 수정하면 현재 타이머는 초기화됩니다. 브라우저가 닫혀 있으면 종료 알림은 울리지 않습니다.</p></section>''',
        "guide": '''<h2>타이머 사용법</h2><p>자주 쓰는 시간 버튼을 누르거나 시·분·초를 직접 입력한 뒤 시작하세요. 진행 중에는 잠시 멈추고 다시 시작할 수 있습니다. 타이머는 기기의 시각을 기준으로 남은 시간을 계산하므로 백그라운드 탭의 화면 갱신이 늦어져도 돌아오면 남은 시간을 다시 맞춥니다.</p><h3>온라인 타이머와 집중 타이머의 차이</h3><p>일반 타이머는 한 번의 카운트다운에 적합합니다. 집중 시간과 휴식 단계를 차례로 관리하려면 집중 타이머를 이용하세요. 각 단계가 끝나면 화면이 다음 단계로 바뀌며, 새 단계의 시작 버튼을 눌러 진행할 수 있습니다.</p>''',
    },
    "stopwatch": {
        "name": "스톱워치",
        "title": "온라인 스톱워치 · 랩 타임 기록 | 키미 타임",
        "description": "시작·일시정지·랩 기록을 지원하는 무료 온라인 스톱워치. 측정 기록은 이 브라우저에만 저장되며 회원가입이 필요 없습니다.",
        "eyebrow": "STOPWATCH",
        "heading": "시작부터 끝까지, 흐름을 기록해요.",
        "intro": "공부, 운동, 발표 연습에 걸린 시간을 랩 기록과 함께 확인하세요.",
        "tool": '''<section class="workspace"><p class="stage-kicker">ELAPSED TIME</p><div id="stopwatch-display" class="timer-digits" role="timer" aria-live="off">00:00.00</div><div class="button-row"><button id="stopwatch-start" class="button button-primary" type="button">시작</button><button id="stopwatch-lap" class="button button-secondary" type="button" disabled>랩 기록</button><button id="stopwatch-reset" class="button button-ghost" type="button">초기화</button></div></section><section class="workspace"><div class="section-heading compact"><div><p class="eyebrow">LAP TIMES</p><h2>랩 기록</h2></div><span id="lap-count" class="muted">0개</span></div><div id="lap-list" class="lap-list" aria-live="polite"><p class="empty-state">아직 기록한 랩이 없습니다.</p></div></section>''',
        "guide": '''<h2>스톱워치 사용법</h2><p>시작 버튼을 누르면 경과 시간이 표시됩니다. 랩 기록을 누르면 전체 경과 시간과 이전 랩 이후 걸린 시간이 함께 저장됩니다. 잠시 멈추었다가 같은 시점에서 이어갈 수 있습니다.</p><h3>기록 보관</h3><p>스톱워치 상태와 랩은 이 브라우저에만 저장됩니다. 다른 기기에서는 보이지 않으며 브라우저 데이터를 지우면 사라집니다. 운동 경기나 공식 측정에는 전용 계측 장비를 사용하세요.</p>''',
    },
    "about": {
        "name": "사이트 소개",
        "title": "키미 타임 소개 | 무료 온라인 시계와 시간 도구",
        "description": "키미 타임은 현재 시간, 세계시간, 알람, 타이머, 스톱워치, 집중 타이머를 제공하는 무료 시간 도구 사이트입니다.",
        "eyebrow": "ABOUT KYMI TIME",
        "heading": "시간을 확인하고, 더 잘 쓰도록.",
        "intro": "키미 타임은 일상에서 반복해 사용하는 시간 도구를 단순하고 읽기 쉽게 모았습니다.",
        "tool": '''<section class="content-panel"><h2>우리가 만드는 도구</h2><p>현재 시계는 지금 시간을 크게 보여주고, 세계시간은 다른 도시와 시차를 비교합니다. 알람과 타이머는 필요한 순간을 알려주며, 스톱워치는 경과 시간을 기록합니다. 집중 타이머는 공부와 업무의 집중·휴식 리듬을 돕습니다.</p><h2>계정 없는 사용</h2><p>회원가입이나 자체 데이터베이스는 사용하지 않습니다. 개인 설정과 일부 기록은 사용 중인 브라우저에만 저장됩니다. 브라우저 데이터를 지우면 함께 삭제되고 다른 기기로 자동 전송되지 않습니다.</p><h2>시간 표시의 한계</h2><p>표시하는 현재 시간은 사용자 기기의 시계에 의존합니다. 기기 설정이 틀리면 화면의 시간도 틀릴 수 있습니다. 브라우저를 완전히 닫거나 컴퓨터가 꺼지면 웹 알람은 작동하지 않습니다. 중요한 일정에는 기기의 기본 알람을 함께 사용하세요.</p><h2>문의</h2><p>오류나 개선 의견은 <a href="https://github.com/gym720-dot/kyminfo-clock/issues" rel="noopener noreferrer">GitHub 이슈</a>에 남길 수 있습니다.</p></section>''',
        "guide": "",
    },
    "privacy": {
        "name": "개인정보 안내",
        "title": "개인정보 안내 | 키미 타임",
        "description": "키미 타임의 브라우저 저장 정보와 알림 권한 사용에 관한 안내입니다. 현재 광고 및 자체 방문 추적 코드는 사용하지 않습니다.",
        "eyebrow": "PRIVACY",
        "heading": "이용 정보는 브라우저 안에.",
        "intro": "현재 버전의 키미 타임이 정보를 다루는 방법을 설명합니다.",
        "tool": '''<section class="content-panel"><h2>서버에 보내지 않는 정보</h2><p>회원가입, 자체 계정, 자체 데이터베이스를 운영하지 않습니다. 집중 기록, 알람 설정, 선택한 도시, 테마, 스톱워치 기록은 사용자 브라우저의 로컬 저장 공간에 보관합니다. 이 기록은 운영자 서버로 전송하지 않습니다.</p><h2>브라우저 알림</h2><p>알림 허용 버튼을 사용자가 직접 누른 경우에만 브라우저의 알림 권한을 요청합니다. 허용 또는 거부는 브라우저 설정에서 바꿀 수 있습니다. 알림 내용은 설정한 타이머나 알람의 종료 사실을 알려주는 데 사용됩니다.</p><h2>호스팅과 기본 접속 정보</h2><p>사이트는 Cloudflare Pages에 배포할 예정입니다. 웹사이트 제공 과정에서 호스팅 사업자가 IP 주소와 요청 정보 등 기본 접속 정보를 처리할 수 있습니다. 실제 배포 설정이 확정되면 이 안내를 다시 확인하겠습니다.</p><h2>광고와 분석</h2><p>현재 버전에는 애드센스 광고 코드와 자체 방문 분석 코드가 없습니다. 향후 광고나 분석을 도입할 때에는 사용 서비스, 쿠키 및 선택 방법을 이 페이지에 먼저 반영하겠습니다.</p><h2>기록 삭제</h2><p>집중 기록은 해당 화면의 삭제 버튼으로 지울 수 있습니다. 다른 설정과 기록은 브라우저의 사이트 데이터 삭제 기능으로 제거할 수 있습니다. 브라우저마다 메뉴 이름은 다를 수 있습니다.</p><p class="field-note">최종 확인: 2026-10-08 · 실제 배포 전에 운영 내용과 일치하는지 다시 확인합니다.</p></section>''',
        "guide": "",
    },
}

NAV = [("/", "시계"), ("/focus/", "집중 타이머"), ("/world-time/", "세계시간"), ("/alarm/", "알람"), ("/timer/", "타이머"), ("/stopwatch/", "스톱워치")]


def render(slug, data):
    url = f"{BASE}/{slug + '/' if slug else ''}"
    nav = "".join(f'<a href="{href}" {"aria-current=\"page\"" if href == "/" + (slug + "/" if slug else "") else ""}>{escape(label)}</a>' for href, label in NAV)
    guide = f'<section class="guide-panel" aria-label="사용 안내">{data["guide"]}</section>' if data["guide"] else ""
    return f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#f4f7f9"><title>{escape(data['title'])}</title><meta name="description" content="{escape(data['description'])}"><link rel="canonical" href="{url}"><meta property="og:type" content="website"><meta property="og:locale" content="ko_KR"><meta property="og:title" content="{escape(data['title'])}"><meta property="og:description" content="{escape(data['description'])}"><meta property="og:url" content="{url}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css"><script src="/app.js" defer></script></head>
<body data-page="{slug or 'clock'}"><a class="skip-link" href="#main">본문으로 바로가기</a><header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="키미 타임 홈"><span class="brand-mark" aria-hidden="true">K<span class="brand-pulse"></span></span><span>키미<span class="brand-light">타임</span></span></a><nav class="main-nav" aria-label="주요 메뉴">{nav}</nav><button class="theme-toggle" id="theme-toggle" type="button" aria-label="어두운 테마로 전환">◐ <span>테마</span></button></div></header><main id="main" class="page-shell"><div class="hero-copy"><p class="eyebrow">{escape(data['eyebrow'])} <span class="eyebrow-line"></span> FREE ONLINE TOOLS</p><h1>{escape(data['heading'])}</h1><p>{escape(data['intro'])}</p></div>{data['tool']}{guide}<div class="related-tools"><p class="eyebrow">KEEP YOUR FLOW</p><h2>다른 시간 도구 살펴보기</h2><div class="related-links">{''.join(f'<a href="{href}">{escape(label)} <span aria-hidden="true">↗</span></a>' for href, label in NAV if href != '/' + (slug + '/' if slug else ''))}</div></div></main><footer class="site-footer"><div class="footer-inner"><div><a class="brand footer-brand" href="/"><span class="brand-mark" aria-hidden="true">K</span><span>키미타임</span></a><p>시간을 확인하고, 더 잘 쓰도록.</p></div><nav aria-label="하단 메뉴"><a href="/about/">사이트 소개</a><a href="/privacy/">개인정보 안내</a></nav><p class="copyright">© 2026 Kymi Time</p></div></footer><!-- AD FUTURE: AdSense 코드와 광고 영역은 kyminfo.com 준비 상태 및 해당 페이지 정책 확인 후 사용자 경험을 해치지 않는 위치에 추가합니다. --><div id="toast" class="toast" role="status" aria-live="polite" hidden></div></body></html>
'''


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    for slug, data in PAGES.items():
        target = ROOT / slug / "index.html" if slug else ROOT / "index.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(render(slug, data), encoding="utf-8")
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{BASE}/{slug + "/" if slug else ""}</loc></url>\n' for slug in PAGES) + '</urlset>\n'
    (ROOT / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n", encoding="utf-8")


if __name__ == "__main__":
    main()
