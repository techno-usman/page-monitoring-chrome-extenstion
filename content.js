(() => {
  console.log('TEST');
  let activeTab = {};

  const saveDataInStorage = (data) => {
    const url = new URL(activeTab.url);

    const storageKey = url.hostname + '_' + activeTab.id + '_data';
    chrome.storage.local.get(storageKey, (response) => {
      if (JSON.stringify(response) === '{}') {
        chrome.storage.local.set({ [storageKey]: data }, (result) => {
          //console.log(result)
        });
      } else {
        const storeData = [...response[storageKey], ...data];
        chrome.storage.local.set({ [storageKey]: storeData });
      }
    });
  };

  const findParent = (el, target) => {
    return el.closest(target);
  };

  const findComponent = (e) => {
    const components = ['button', 'a', 'input', 'svg'];
    const el = e.target;
    let foundEl = [];

    components.forEach((component) => {
      const result = findParent(el, component);
      if (result) {
        foundEl.push({
          tagName: result.tagName,
          eventType: e.type,
          timestamp: Date.now(),
          value: el.value || '',
          page: activeTab.url,
        });
      }
    });

    if (!foundEl.length) {
      foundEl.push({
        tagName: el.tagName,
        eventType: e.type,
        timestamp: Date.now(),
        value: el.value || '',
        page: activeTab.url,
      });
    }

    saveDataInStorage(foundEl);
  };

  const typeEventHandler = (e) => {
    let data = [];
    data.push({
      tagName: e.target.tagName,
      eventType: e.type,
      timestamp: Date.now(),
      value: e.target.value || '',
      page: activeTab.url,
    });
    saveDataInStorage(data);
  };

  const clickElementEventHandler = function clickHandler(e) {
    console.log(e.target);
    findComponent(e);
  };

  const start = () => {
    document.body.addEventListener('click', clickElementEventHandler);
    document.body.addEventListener('change', typeEventHandler);
  };

  const stop = () => {
    const el = document.body;
    clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
  };

  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.type == 'START') {
      start();
    }

    if (request.type == 'END') {
      stop();
    }

    sendResponse({});
  });

  const port = chrome.runtime.connect({ name: 'connect' });

  port.postMessage({ type: 'TAB_INFORMATION' });

  port.onMessage.addListener((response) => {
    if (response.type === 'TAB_INFO') {
      activeTab = response.tab;
    }

    if (response.type === 'MONITERING_INFO') {
      if (response.startMonitering) {
        start();
      }
    }
  });
})();
