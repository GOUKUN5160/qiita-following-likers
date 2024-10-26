const i18n = (key, arg) => {
  return chrome.i18n.getMessage(key, arg ? String(arg) : undefined);
};

const setBadge = (text="", color=[255, 0, 0]) => {
  chrome.browserAction.setBadgeText({ "text": text });
  chrome.browserAction.setBadgeBackgroundColor({ color: color });
};

const extractArticleId = (url) => {
  const match = url.match(/\/items\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

const getAccessToken = async () => {
  const token = (await chrome.storage.sync.get("apiToken")).apiToken;
  return token;
};

const fetchApi = async (url) => {
  const accessToken = await getAccessToken();
  let options = {};
  if (accessToken) {
    options = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }
  const response = await fetch(url, options);
  return response;
};

const initSetting = async () => {
  console.log(i18n("consoleInitSettingMessage"));
  const settings = {
    userId: "",
    header: "open",
    footer: "none",
    defaultDate: "simple",
    updateFolloweeIntervalHour: 1,
    apiToken: ""
  };
  await chrome.storage.sync.set(settings);
  const lastUpdateFollowee = new Date(0).toISOString();
  await chrome.storage.local.set({lastUpdateFollowee: lastUpdateFollowee});
  settings.lastUpdateFollowee = lastUpdateFollowee;
  return settings;
};

const getSetting = async () => {
  const userId = (await chrome.storage.sync.get("userId")).userId;
  const header = (await chrome.storage.sync.get("header")).header;
  const footer = (await chrome.storage.sync.get("footer")).footer;
  const defaultDate = (await chrome.storage.sync.get("defaultDate")).defaultDate;
  const updateFolloweeIntervalHour = (await chrome.storage.sync.get("updateFolloweeIntervalHour")).updateFolloweeIntervalHour;
  const lastUpdateFollowee = (await chrome.storage.local.get("lastUpdateFollowee")).lastUpdateFollowee;
  const apiToken = (await chrome.storage.sync.get("apiToken")).apiToken;
  let settings = {
    userId: userId,
    header: header,
    footer: footer,
    defaultDate: defaultDate,
    updateFolloweeIntervalHour: updateFolloweeIntervalHour,
    lastUpdateFollowee: lastUpdateFollowee,
    apiToken: apiToken
  };
  if (!(userId != undefined && header && footer && defaultDate && updateFolloweeIntervalHour && apiToken != undefined)) {
    settings = await initSetting();
  }
  if (!lastUpdateFollowee) {
    settings.lastUpdateFollowee = new Date(0).toISOString();
    await chrome.storage.local.set({ lastUpdateFollowee: settings.lastUpdateFollowee });
  }
  return settings;
};

const updateFollowees = async (user) => {
  if (!user) return [];
  const response = await fetchApi(`https://qiita.com/api/v2/users/${user}/followees`);
  if (response.status != 200) return [];
  const followeesId = (await response.json()).map(followee => followee.id);
  await chrome.storage.local.set({ followees: followeesId });
  const now = new Date();
  await chrome.storage.local.set({ lastUpdateFollowee: now.toISOString() });
  return followeesId;
};

const getFollowee = async (user) => {
  const lastTime = (await chrome.storage.local.get("lastUpdateFollowee")).lastUpdateFollowee;
  const interval = (await chrome.storage.sync.get("updateFolloweeIntervalHour")).updateFolloweeIntervalHour;
  const now = new Date();
  const last = new Date(lastTime);
  if ((now - last) > (interval * 60 * 60 * 1000)) {
    return updateFollowees(user);
  }
  let followees = (await chrome.storage.local.get("followees")).followees;
  if (!followees) {
    followees = await updateFollowees(user);
  }
  return followees;
};

const simplifyDateTime = (date) => {
  const now = new Date();
  const diff = now - date;
  const second = 1000;
  const minute = second * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;
  if (diff < minute) {
    return i18n("simplifyDateSec", Math.floor(diff / second));
  } else if (diff < hour) {
    return i18n("simplifyDateMin", Math.floor(diff / minute));
  } else if (diff < day) {
    return i18n("simplifyDateHour", Math.floor(diff / hour));
  } else if (diff < week) {
    return i18n("simplifyDateDay", Math.floor(diff / day));
  } else if (diff < month) {
    return i18n("simplifyDateWeek", Math.floor(diff / week));
  } else if (diff < year) {
    return i18n("simplifyDateMonth", Math.floor(diff / month));
  } else {
    return i18n("simplifyDateYear", Math.floor(diff / year));
  }
};

const getUserElement = (userId, userImageUrl, simpleDate, detailDate, simpleFirst = true) => {
  return `
    <div class="style-17gh4w8" style="justify-content: space-between;">
      <a href="/${userId}" class="style-mavs84">
        <div class="style-kcbbwa">
          <img height="24" loading="lazy"
            src="${userImageUrl}"
            width="24" class="style-1wqqt93">
        </div>@<!-- -->${userId}
      </a>
      <span style="color: var(--color-mediumEmphasis); cursor: pointer;" onclick="this.innerText=((this.innerText == '${detailDate}') ? '${simpleDate}' : '${detailDate}');">${simpleFirst ? simpleDate : detailDate}</span>
    </div>
  `;
};

const getFollowers = async (user) => {
  if (!user) return [];
  const response = await fetchApi(`https://qiita.com/api/v2/users/${user}/followers`);
  if (response.status != 200) return [];
  const data = await response.json();
  return data;
};

const getLikers = async (articleId) => {
  if (!articleId) return [];
  let likers = [];
  for (let i = 1; i <= 100; i++) {
    const response = await fetchApi(`https://qiita.com/api/v2/items/${articleId}/likes?page=${i}&per_page=${100}`);
    if (response.status != 200) return [];
    const data = await response.json();
    if (data.length === 0) break;
    likers = likers.concat(data);
  }
  return likers;
};

const createDisplayElement = (likerElementsString, likerCount, isOpen) => {
  const followingLikers = document.createElement("div");
  followingLikers.classList.add("following-likers");
  followingLikers.innerHTML = `
    <div class="style-17eeyc6" style="margin-bottom: 20px;">
        <div class="it-MdContent style-ejcyme">
            <div class="mdContent-inner">
                <div class="note info">
                    <span class="fa fa-fw fa-thumbs-up"></span>
                    <div>
                        <details ${isOpen ? "open" : ""}>
                            <summary>${i18n("summeryTitle", likerCount)}</summary>
                            ${likerElementsString}
                        </details>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `;
  return followingLikers;
};

const insertElement = async (likers) => {
  const settings = await getSetting();
  const followees = await getFollowee(settings.userId);
  let likerElementsString = "";
  let likerCount = 0;
  likers.forEach(liker => {
    if (!followees.includes(liker.user.id)) return;
    likerCount++;
    const date = new Date(liker.created_at);
    const simpleDate = simplifyDateTime(date);
    const detailDate = date.toLocaleString();
    likerElementsString += getUserElement(liker.user.id, liker.user.profile_image_url, simpleDate, detailDate, settings.defaultDate === "simple");
  });

  if (settings.header != "none" && likerCount > 0) {
    const headerFollowingLikers = createDisplayElement(likerElementsString, likerCount, settings.header === "open");
    const article = document.querySelector("article.style-itrjxe");
    article.insertBefore(headerFollowingLikers, article.firstChild);
  }
  if (settings.footer != "none" && likerCount > 0) {
    const footerFollowingLikers = createDisplayElement(likerElementsString, likerCount, settings.footer === "open");
    const articleFooter = document.querySelector("div.p-items_main > div");
    articleFooter.insertBefore(footerFollowingLikers, articleFooter.firstChild);
  }
};

const init = async () => {
  const articleId = extractArticleId(window.location.href);
  if (!articleId) {
    console.log(i18n("consoleNotArticleMessage"));
    return;
  }
  const likers = await getLikers(articleId);
  if (likers.length === 0) return;
  insertElement(likers);
};

window.addEventListener("load", () => {
  console.log(i18n("consoleLoadedMessage"));
  init();
});
