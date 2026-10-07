# 키미 타임

`clock.kyminfo.com`에 배포할 정적 온라인 시계 사이트입니다.

## 기능

- 큰 현재 시계, 전체 화면, 12·24시간 및 초 표시, 밝고 어두운 테마
- 집중·휴식 타이머와 일간·주간 집중 기록
- 주요 도시 세계시간 및 도시 간 시차 비교
- 여러 온라인 알람, 일반 카운트다운 타이머, 랩 기록 스톱워치
- 화면·소리 알림. 브라우저 알림은 사용자가 직접 허용한 경우에만 사용

회원가입, 자체 서버, 데이터베이스, 외부 API는 없습니다. 설정과 기록은 이용자의 브라우저에만 저장합니다. 브라우저를 완전히 닫거나 기기를 끄면 웹 알람은 울릴 수 없습니다. 현재 시계는 이용자 기기의 날짜·시간 설정에 의존합니다.

## 파일과 배포

- `generate.py`: 정적 HTML, 사이트맵, robots.txt 생성. Python 표준 라이브러리만 사용합니다.
- `public/`: Cloudflare Pages에 배포할 파일. 생성된 HTML도 Git에 보관합니다.
- 콘텐츠를 수정했다면 `generate.py` 실행 후 변경된 `public/`을 함께 커밋합니다.
- Cloudflare Pages: 프로덕션 브랜치 `main`, 빌드 명령 `exit 0`, 출력 디렉터리 `public`.
- 사용자 정의 도메인은 Pages에 `clock.kyminfo.com`을 등록한 후 가비아에 `clock` CNAME을 프로젝트의 `*.pages.dev` 주소로 연결합니다. 기존 `@`, `blog`, `calc` DNS는 변경하지 않습니다.

## 수익화 준비

사용자 목적은 애드센스 수익화입니다. 현재 광고 스크립트와 광고 요청은 없습니다. 광고 도입 전 `kyminfo.com`의 애드센스 사이트 상태와 적용 범위를 계정에서 확인하고, 개인정보 안내 및 필요한 쿠키·광고 고지를 실제 구성에 맞게 업데이트합니다. 광고가 시계 숫자, 시작·일시정지 버튼, 설정 컨트롤과 혼동되지 않도록 배치합니다. 사용 경험과 콘텐츠의 독자성이 우선입니다.

Google 공식 안내: 일반 하위 도메인은 부모 도메인의 사이트 항목 아래에서 관리되며, 광고 게재에는 사이트가 `Ready` 상태여야 합니다. 하위 도메인도 게시자 정책을 지켜야 합니다.

- https://support.google.com/adsense/answer/12170421
- https://support.google.com/adsense/answer/12131223
- https://support.google.com/adsense/answer/7299563
- https://support.google.com/adsense/answer/1346295

## 검색 노출 준비

모든 도구에는 고유 HTML 페이지, 제목, 설명, canonical, 사용법 및 내부 링크가 있습니다. `public/sitemap.xml`과 `public/robots.txt`가 생성됩니다. Search Console 및 네이버 등록은 실제 도메인 배포 후 진행합니다. 검색 노출이나 수익은 보장되지 않습니다.
