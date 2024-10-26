const RADIO_INDEX = {
  none: 0,
  open: 1,
  closed: 2
};

const showFolloweeCounts = async (lastUpdate) => {
  const followee = await getFollowee();
  const followeeCounts = followee.length;
  const lastUpdateFollowee = lastUpdate || new Date((await chrome.storage.local.get("lastUpdateFollowee")).lastUpdateFollowee).toLocaleString();
  document.getElementById("followeeCounts").innerText = i18n("followee", followeeCounts.toString());
  document.getElementById("followeeLastUpdatedTime").innerText = i18n("lastUpdate", lastUpdateFollowee);
};

const clearAll = async () => {
  chrome.storage.sync.clear();
  chrome.storage.local.clear();
  window.close();
};

const localizeHtmlPage = () => {
  const objects = document.getElementsByTagName("html");
  let obj, valStrH, valNewH;
  for (let i = 0; i < objects.length; i++) {
    obj = objects[i];
    valStrH = obj.innerHTML.toString();
    valNewH = valStrH.replace(/__MSG_(\w+)__/g, (match, v1) => {
      return v1 ? chrome.i18n.getMessage(v1) : "";
    });
    if (valNewH != valStrH) {
      obj.innerHTML = valNewH;
    }
  }
};

window.addEventListener("load", () => {
  localizeHtmlPage();
  const userId = document.getElementById("userId");
  const updateInterval = document.getElementById("updateInterval");
  const header = document.getElementById("header");
  const footer = document.getElementById("footer");
  const defaultDate = document.getElementById("defaultDate");
  const apiToken = document.getElementById("apiToken");
  getSetting().then((settings) => {
    showFolloweeCounts(new Date(settings.lastUpdateFollowee).toLocaleString());
    userId.value = settings.userId;
    updateInterval.value = settings.updateFolloweeIntervalHour;
    header.header.value = settings.header;
    footer.footer.value = settings.footer;
    defaultDate.defaultDate.value = settings.defaultDate;
    apiToken.value = settings.apiToken;
  });
  userId.addEventListener("blur", () => {
    chrome.storage.sync.set({ userId: userId.value });
  });
  updateInterval.addEventListener("blur", () => {
    updateInterval.value = updateInterval.value.replace(/[^0-9]/g, "");
    if (updateInterval.value === "") {
      updateInterval.value = 1;
    }
    chrome.storage.sync.set({ updateFolloweeIntervalHour: parseInt(updateInterval.value) || 1 });
  });
  header.addEventListener("change", () => {
    chrome.storage.sync.set({ header: header.header.value });
  });
  footer.addEventListener("change", () => {
    chrome.storage.sync.set({ footer: footer.footer.value });
  });
  defaultDate.addEventListener("change", () => {
    chrome.storage.sync.set({ defaultDate: defaultDate.defaultDate.value });
  });
  apiToken.addEventListener("blur", () => {
    chrome.storage.sync.set({ apiToken: apiToken.value });
  });
  document.getElementById("updateFollowee").addEventListener("click", async () => {
    const settings = await getSetting();
    await updateFollowees(settings.userId);
    showFolloweeCounts();
  });
  document.getElementById("clearAllDate").addEventListener("click", clearAll);
});
