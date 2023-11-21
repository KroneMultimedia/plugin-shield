
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url?.startsWith("chrome://")) return undefined;
    if (changeInfo.status === 'complete' && tab.url) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        });
    }
});

chrome.tabs.onCreated.addListener((tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    });
});

var bodys = {};



chrome.webRequest.onBeforeRequest.addListener(
    async function(details)
    {
      if(details.method !== "POST") {
        return;
      }
      bodys[details.requestId] = details.requestBody;
    },
    {urls: ["https://wp.krone.at/*"]},
    ['requestBody', 'extraHeaders']
);

chrome.webRequest.onBeforeSendHeaders.addListener(
    async function(details)
    {
      if(details.method !== "POST") {
        return;
      }
      details.requestBody = bodys[details.requestId];
      delete bodys[details.requestId];
      storeRecord(details, "req");
    },
    {urls: ["https://wp.krone.at/*"]},
    ['requestHeaders']
);


async function storeRecord(details, out) {

      if(details.method !== "POST") {
        return;
      }

      var records = await chrome.storage.local.get();
      if(!records) {
        records = {post_data:[]}
      }
      if(!records.post_data) {
        records.post_data = [];
      }
      var ts = new Date();
      var obj = {
        body:  details.requestBody,
        headers: details.requestHeaders,
        url: details.url,
        method: details.method,
        ts: Math.floor(ts.getTime()/1000),
      }
      records.post_data.unshift(obj);


      records.post_data = records.post_data.splice(-100);


      var saved = chrome.storage.local.set({
        post_data: records.post_data
      });




      console.log("store:", obj);


}
