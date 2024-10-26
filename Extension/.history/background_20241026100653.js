const setBadge = (text="", color="red") => {
  chrome.action.setBadgeText({ "text": text });
  chrome.action.setBadgeBackgroundColor({ color: color });
};

chrome.runtime.onMessage.addListener((request) => {
  if (request.name === "setBadge") {
    setBadge(request.text, request.color);
  }
});
