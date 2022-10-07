const startBtn = document.getElementById('start-btn');
const exportDataBtn = document.getElementById('export-data-btn');
let activeTab = {};

const sendMessageToContentPage = (action) => {
  let actionType = 'START';
  let sender = 'event_listener';

  if (action != 'Start') {
    actionType = startBtn.innerHTML.toUpperCase();
  } else {
    sender = 'background_js';
  }

  chrome.tabs.sendMessage(activeTab.id, { type: actionType }, (response) => {
    pageMonitored(activeTab, sender);
  });
};

const pageMonitored = (activeTab, sender) => {
  const storageKey = `${activeTab.domain}_${activeTab.id}`;

  chrome.storage.local.get(storageKey).then((response) => {
    if (typeof response[storageKey] !== 'undefined' && sender != 'popup_js') {
      if (response[storageKey]) {
        if (sender != 'background_js') {
          chrome.storage.local.set({ [storageKey]: false });
          startBtn.innerHTML = 'Start';
        }
      } else {
        chrome.storage.local.set({ [storageKey]: true });
        startBtn.innerHTML = 'End';
      }
    } else if (typeof response[storageKey] !== 'undefined') {
      if (response[storageKey]) {
        startBtn.innerHTML = 'End';
      }
    } else {
      chrome.storage.local.set({ [storageKey]: false });
    }
  });
};

const jsonToCsv = (data) => {
  const header = Object.keys(data[0]);
  const headerString = header.join(',');
  const replacer = (key, value) => value ?? '';
  const rowItems = data.map((row) =>
    header.map((fieldName) => JSON.stringify(row[fieldName], replacer)).join(',')
  );

  const csv = [headerString, ...rowItems].join('\r\n');
  return csv;
};

const exportData = (e) => {
  let data;
  const url = new URL(activeTab.url);
  const storageKey = url.hostname + '_' + activeTab.id + '_data';
  chrome.storage.local.get(storageKey, (response) => {
    console.log(response);
    if (JSON.stringify(response) === '{}') {
      alert('no data for export');
      return;
    } else {
      data = jsonToCsv(response[storageKey]);
      console.log(data);

      window.URL = window.webkitURL || window.URL;
      const contentType = 'text/csv;charset=utf-8;';
      const csvFile = new Blob([data], { type: contentType });
      const a = e.target;

      if (!a.download) {
        a.download = 'pageData';
        a.href = window.URL.createObjectURL(csvFile);
        a.dataset.downloadurl = [contentType, a.download, a.href].join(':');
        a.click();
      }
    }
  });
};

startBtn.addEventListener('click', sendMessageToContentPage);
exportDataBtn.addEventListener('click', exportData);

chrome.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener((query) => {
    if (query.type == 'CONTINUE_PAGE_MONITORING') {
      sendMessageToContentPage('Start');
      console.log('Hi');
      port.postMessage({ status: 'STARTED' });
    }
  });
});

document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const url = new URL(tab.url);

  activeTab = {
    id: tab.id,
    url: tab.url,
    domain: url.hostname,
    path: url.pathname,
  };

  pageMonitored(activeTab, 'popup_js');
});
