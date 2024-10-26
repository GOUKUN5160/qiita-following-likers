const setBadge = (text) => {
    chrome.action.setBadgeText({ "text": text });
};
