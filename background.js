// 최초 활성화 신호를 보내야 하는 대상 탭들을 관리하는 저장소
const pendingTabs = new Set();

// 1. 탭의 주소가 바뀌거나 페이지가 새로고침(웹서핑 시작)될 때 감지
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 페이지 로딩이 시작(`status === "loading"`)되는 순간이 진짜 최초 생성/로드 시점입니다.
  if (changeInfo.status === "loading" && tab.url && tab.url.includes("youtube.com/watch")) {
    // 이 탭은 새로 로드된 유튜브 탭이므로, 사용자가 '최초 활성화'할 때까지 대기 리스트에 넣습니다.
    pendingTabs.add(tabId);
    console.log(`[Background] 탭 ${tabId} 새로 로드됨 -> 최초 활성화 대기 리스트 추가`);
  }
});

// 2. 사용자가 탭을 클릭해서 전환(활성화)했을 때
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    // [핵심 해결책] 이 탭이 대기 리스트(새로 열렸거나 새로고침된 탭)에 있는지 확인
    if (pendingTabs.has(activeInfo.tabId)) {
      
      // 최초 활성화가 확인되었으므로 대기 리스트에서 즉시 제거 (일회성)
      // 이제 다른 탭에 갔다 돌아와도 이 조건문을 통과할 수 없습니다.
      pendingTabs.delete(activeInfo.tabId);
      console.log(`[Background] 탭 ${activeInfo.tabId} 최초 활성화 확인! 신호 송신 후 리스트에서 제거`);
      
      // 해당 탭의 content.js로 일시정지 및 썸네일 명령 송신
      chrome.tabs.sendMessage(activeInfo.tabId, { action: "CHECK_AND_PAUSE" })
        .catch(() => { /* content.js 로딩 전이면 무시 */ });
    }
  } catch (error) {
    console.error(error);
  }
});

// 3. 탭이 닫히면 안전하게 메모리 해제
chrome.tabs.onRemoved.addListener((tabId) => {
  pendingTabs.delete(tabId);
});