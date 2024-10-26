const setBadge = (text) => {
  chrome.action.setBadgeText({ "text": text });
};

chrome.runtime.onMessage.addListener((request) => {
  if (request.name === "setBadge") {
    setBadge(request.text);
  }
});
