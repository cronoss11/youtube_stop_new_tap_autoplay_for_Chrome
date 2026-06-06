console.log("[Extension] 유튜브 감시 및 CSS content 마스킹 스크립트 로드 완료");

function getYouTubeVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "CHECK_AND_PAUSE") {
    console.log("[Extension] 탭 최초 활성화 감지. CSS 영상 교체 마스킹을 시작합니다.");
    
    let attempts = 0;
    const videoId = getYouTubeVideoId();
    
    const checkInterval = setInterval(() => {
      const video = document.querySelector('video');
      
      if (video && videoId) {
        // 1. 유튜브 엔진이 재생을 시도할 때마다 계속 일시정지
        if (!video.paused && !video.ended) {
          video.pause();
        }
        
        // 2. [핵심 변경] 비디오를 투명하게 하거나 크기를 줄이는 대신, 
        // 비디오 화면 자체를 썸네일 이미지로 강제로 '대체(Replace)'합니다.
        // 이 방식을 쓰면 뒤쪽의 흰색 레이어가 드러날 기회조차 주어지지 않습니다.
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        video.style.setProperty('content', `url(${thumbnailUrl})`, 'important');
        video.style.setProperty('object-fit', 'cover', 'important'); // 썸네일 비율 유지
        
        // 3. 재생이 감지되면(사용자가 재생을 누르면) 썸네일 마스크를 제거하고 영상을 정상 노출합니다.
        const restoreVideo = () => {
          video.style.removeProperty('content');
          video.style.removeProperty('object-fit');
          console.log("[Extension] 영상 재생 감지 -> CSS 마스크 제거 및 영상 복구 완료");
        };
        
        // 유튜브 순정 재생 버튼 클릭, 화면 클릭, 스페이스바 등 모든 재생 신호에 반응
        video.addEventListener('play', restoreVideo, { once: true });
      }
      
      attempts++;
      // 1.5초 동안 초기 로딩 타이밍을 붙잡아둔 뒤 종료
      if (attempts > 50) {
        clearInterval(checkInterval);
      }
    }, 30);
  }
});