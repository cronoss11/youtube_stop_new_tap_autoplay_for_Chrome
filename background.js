// 최초 활성화 여부를 기록할 탭 ID 저장소
const initializedTabs = new Set();

// 사용자가 탭을 클릭하여 전환(활성화)했을 때 호출되는 부분
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    
    // 활성화된 탭이 유튜브 영상 페이지(/watch)인지 확인
    if (tab.url && tab.url.includes("youtube.com/watch")) {
      
      // 이 탭이 '최초'로 열려서 활성화된 경우에만 실행
      if (!initializedTabs.has(activeInfo.tabId)) {
        initializedTabs.add(activeInfo.tabId); // 최초 실행 마킹
        
        // 해당 탭의 content.js로 일시정지 검사 명령(CHECK_AND_PAUSE) 송신
        chrome.tabs.sendMessage(activeInfo.tabId, { action: "CHECK_AND_PAUSE" })
          .catch(() => { /* content.js가 아직 로딩 전이면 무시 */ });
      }
    }
  } catch (error) {
    console.error(error);
  }
});

// 탭이 닫히면 메모리 해제
chrome.tabs.onRemoved.addListener((tabId) => {
  initializedTabs.delete(tabId);
});