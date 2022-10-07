chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((query) => {
    if (query.type === 'TAB_INFORMATION') {
      let gettingActiveTab = chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      let activeTab;

      gettingActiveTab.then((tabs) => {
        console.log(tabs);
        activeTab = tabs[0];

        port.postMessage({ type: 'TAB_INFO', tab: activeTab });

        const url = new URL(activeTab.url);
        const storageKey = url.hostname + '_' + activeTab.id;

        chrome.storage.local.get(storageKey).then((response) => {
          console.log('THERE');
          if (typeof response[storageKey] !== 'undefined') {
            console.log('HERETHERE');
            if (response[storageKey]) {
              port.postMessage({ type: 'MONITERING_INFO', startMonitering: true });
            }
          }
        });
      });
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
    console.log(tabId);

    chrome.scripting.executeScript(
      {
        target: {
          tabId: tabId,
        },
        files: ['content.js'],
      },
      () => {
        console.log('Injected');
      }
    );
    /*
    chrome.storage.local.clear(() => {
      var error = chrome.runtime.lastError;
      if (error) {
        console.error(error);
      }
    });
    */
  }
});
