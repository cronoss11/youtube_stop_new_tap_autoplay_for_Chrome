let isExplicitPlayTriggered = false;

const setupStrictYoutubeBlocker = () => {
  const video = document.querySelector('video');
  const playButton = document.querySelector('.ytp-play-button');

  if (video && !video.dataset.perfectHooked) {
    video.dataset.perfectHooked = "true";

    // 1. 유튜브 내부의 play() 호출을 원천 차단하고 0초에 묶어둠
    const originalPlay = video.play;
    video.play = function() {
      // 사용자가 직접 '재생 버튼'을 누르거나, 스페이스바/K키를 누른 경우만 실행 허용
      if (isExplicitPlayTriggered || (window.event && (window.event.type === 'click' || window.event.key === ' ' || window.event.key === 'k'))) {
        isExplicitPlayTriggered = false; // 플래그 리셋
        return originalPlay.apply(this, arguments);
      } else {
        // 탭 전환 등 유튜브의 자체 자동 재생 시도는 무조건 일시정지하고 0초로 강제 고정
        video.pause();
        video.currentTime = 0;
        return Promise.resolve(); // 스크립트 에러 방지
      }
    };

    // 2. 탭이 전환되면서 유튜브가 버퍼를 밀어내며 썸네일을 넘어가는 현상 방지
    const lockToThumbnail = (e) => {
      if (!isExplicitPlayTriggered) {
        video.pause();
        // 이미 영상이 앞으로 넘어가 버렸다면 강제로 0초(첫 썸네일)로 되돌림
        if (video.currentTime > 0) {
          video.currentTime = 0;
        }
      }
    };

    // 영상이 켜지거나, 버퍼가 차오르거나, 시간이 움직이려고 할 때 0초로 멱살 잡기
    ['play', 'playing', 'timeupdate', 'progress', 'canplay'].forEach(eventType => {
      video.addEventListener(eventType, lockToThumbnail, true);
    });

    // 최초 로드 시점에 이미 흘러가고 있다면 즉시 컷
    if (!video.paused) {
      video.pause();
      video.currentTime = 0;
    }
  }

  // 3. 하단 컨트롤 바의 '진짜 재생 버튼' 클릭 감지
  if (playButton && !playButton.dataset.hooked) {
    playButton.dataset.hooked = "true";
    playButton.addEventListener('click', () => {
      isExplicitPlayTriggered = true;
    }, true);
  }

  // 4. 영상 화면 중앙 클릭을 통한 재생 감시
  const playerContainer = document.querySelector('.html5-video-player');
  if (playerContainer && !playerContainer.dataset.clickHooked) {
    playerContainer.dataset.clickHooked = "true";
    playerContainer.addEventListener('click', (e) => {
      // 하단 자막이나 설정 바를 누른 게 아니라 순수 영상 화면을 눌렀을 때만 재생 허용
      if (!e.target.closest('.ytp-chrome-bottom')) {
        isExplicitPlayTriggered = true;
      }
    }, true);
  }
};

// 유튜브 내부 페이지 이동(SPA) 및 동적 로딩 상시 감시
const globalObserver = new MutationObserver(() => {
  if (window.location.href.includes('watch')) {
    setupStrictYoutubeBlocker();
  }
});

globalObserver.observe(document.documentElement, {
  childList: true,
  subtree: true
});

// 진입 즉시 실행
if (window.location.href.includes('watch')) {
  setupStrictYoutubeBlocker();
}