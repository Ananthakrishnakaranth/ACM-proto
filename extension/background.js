chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'verilens-check',
    title: 'Check with VeriLens',
    contexts: ['image']
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== 'verilens-check' || !info.srcUrl) return;
  const url = chrome.runtime.getURL(`result.html?src=${encodeURIComponent(info.srcUrl)}`);
  chrome.windows.create({ url, type: 'popup', width: 520, height: 760 });
});
