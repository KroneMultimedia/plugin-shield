
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
