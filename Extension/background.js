const setBadge = (text, color) => {
  chrome.action.setBadgeText({ "text": text });
  chrome.action.setBadgeBackgroundColor({ color: color });
};

chrome.runtime.onMessage.addListener((request) => {
  if (request.name === "setBadge") {
    setBadge(request.text, request.color);
  }
});
