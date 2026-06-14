console.log("[Extension] 유튜브 감시 및 썸네일 데이터 캐싱 스크립트 로드 완료");

function getYouTubeVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

// [메모리 캐시 저장소] 이미지 객체 자체를 기억해두는 공간
let cachedImage = null;
let cachedVideoId = "";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "CHECK_AND_PAUSE") {
    console.log("[Extension] 탭 최초 활성화 감지. 비디오 태그 탐색을 시작합니다.");
    
    const videoId = getYouTubeVideoId();
    if (!videoId) return;

    let initAttempts = 0;
    
    const findVideoInterval = setInterval(() => {
      const video = document.querySelector('video');
      
      if (video) {
        clearInterval(findVideoInterval);
        console.log("[Extension] 비디오 태그 포착 완료! 썸네일 메모리 캐싱 및 제어를 시작합니다.");
        
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

        // [1] 최초 1회 실행: 썸네일 이미지를 브라우저 메모리에 강제로 캐싱합니다.
        if (cachedVideoId !== videoId) {
          cachedImage = new Image();
          cachedImage.src = thumbnailUrl; // 이 순간 딱 한 번 네트워크 통신이 발생하여 브라우저에 이미지 데이터가 박힙니다.
          cachedVideoId = videoId;
          console.log("[Extension] [네트워크 통신] 썸네일 이미지를 가져와 메모리에 캐싱했습니다.");
        }
        
        let isLoopEnded = false;
        // 사용자가 직접 재생 버튼을 누르면 마스크를 완벽히 제거하는 리스너
        const restoreVideo = () => {
            video.style.removeProperty('content');
            video.style.removeProperty('object-fit');
            cachedImage = null;
            cachedVideoId = "";
            console.log("[Extension] 영상 재생 감지 -> CSS 마스크 영구 제거 및 루프 완전 종료");
        };

        // [2] 30ms 주기적 실행: 유튜브 엔진을 정지시키고 캐시된 썸네일을 강제로 무한 유지
        let watchAttempts = 0;
        const checkInterval = setInterval(() => {
          
          // 유튜브 엔진이 자동재생을 시도할 때마다 칼같이 일시정지
          if (!video.paused && !video.ended) {
            video.pause();
            console.log("[Extension] 유튜브 자동 재생 시도 억제 중...");
          }
          
          // 유튜브 엔진이 썸네일을 지우고 동영상 첫 장면을 보여주려고 발악해도, 
          // 30ms 간격으로 메모리에 캐싱된 이미지 주소를 계속 다시 바릅니다.
          // (이미 캐시된 주소이므로 매번 새로 다운로드하지 않고 메모리에서 꺼내와 그리기만 하므로 안전합니다)
          video.style.setProperty('content', `url(${thumbnailUrl})`, 'important');
          video.style.setProperty('object-fit', 'cover', 'important');
          
          watchAttempts++;
          // 1.5초(50회) 동안 지켜본 뒤 유튜브 엔진이 완전히 포기하면 루프 종료
          if (watchAttempts > 50) {
            console.log("[Extension] 초기 안정기 진입으로 감시 루프 종료 (썸네일은 화면에 캐시된 채 유지됨)");
            video.addEventListener('play', restoreVideo, { once: true });
            clearInterval(checkInterval);
            isLoopEnded = true;
          }
        }, 30);

      } else {
        initAttempts++;
        if (initAttempts > 130) {
          clearInterval(findVideoInterval);
        }
      }
    }, 30);
  }
});