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

        port.postMessage({ tab: activeTab });
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

    chrome.storage.local.clear(() => {
      var error = chrome.runtime.lastError;
      if (error) {
        console.error(error);
      }
    });

    /*
    const url = new URL(tab.url);
    const storageKey = url.hostname + '_' + tabId;

    chrome.storage.local.get(storageKey).then((response) => {
      if (typeof response[storageKey] !== 'undefined') {
        if (response[storageKey]) {
          console.log('test......');

          const port = chrome.runtime.connect({ name: 'connect' });
          port.postMessage({ type: 'CONTINUE_PAGE_MONITORING' });
        }
      }
    });

    */
  }
});
