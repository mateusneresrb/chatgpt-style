
import getThemes from "./themes.js";

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
    if (key === "chatStyle") {
      changeStyle(newValue);
    }
  }
});

const setChatStyle = (newStyle) => {
  chrome.storage.sync.set({
    chatStyle: {
      enabled: newStyle.enabled,
      cssFile: newStyle.cssFile
    }
  });
}

function getChatStyle() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get("chatStyle", ({ chatStyle} ) => {
      if (chatStyle) {
        resolve(chatStyle);
      }
      reject(new Error(`Failed to read chatStyle`));
    });
  });
}

let styleLink = null;
const changeStyle = (newStyle) => {
  if (newStyle.cssFile === "none" || !newStyle.enabled) {
    try {
      document.getElementsByTagName("head")[0].removeChild(styleLink);
    } catch (er) {
      console.log(er)
    }
    styleLink = null;
    return;
  }

  styleLink = document.createElement("link");
  styleLink.href = chrome.runtime.getURL("../themes/" + newStyle.cssFile);
  styleLink.type = "text/css";
  styleLink.rel = "stylesheet";

  document.getElementsByTagName("head")[0].appendChild(styleLink);
}

async function loadThemeBoxes() {
  const ul = document.getElementById('themes');
  ul.innerHTML = '';

  const themes = await getThemes();
  const chatStyleData = await getChatStyle();

  themes.forEach(theme => {

    const li = document.createElement('li');
    li.dataset.filename = theme.filename;
    li.classList.add('theme-box');

    const div = document.createElement('div');
    div.classList.add('theme-box-header');

    const span = document.createElement('span');
    span.classList.add('theme-title');
    span.textContent = theme.data.name;

    const img = document.createElement('img');
    img.classList.add('theme-title-icon');
    img.src = './assets/info-icon.svg';
    img.alt = 'Icon tooltip';
    img.title = `
Name: ${theme.data.name} 
Description: ${theme.data.description}
Collaborator: ${theme.data.collaborator}
Credits: ${theme.data.credits}
        `;
    img.dataset.html = 'true';

    div.appendChild(span);
    div.appendChild(img);

    const themeImg = document.createElement('img');
    themeImg.src = theme.data.illustration;
    themeImg.title = 'Click to view!';
    themeImg.alt = 'Theme image';
    themeImg.classList.add('theme-img');
    themeImg.loading = 'lazy';

    themeImg.addEventListener('click', (e) => {
      const url = e.target.src;
      openPopup(url);
    });

    const button = document.createElement('button');
    button.classList.add('theme-button');

    button.addEventListener('click', (e) => {
      if (e.target.textContent === 'Remove this theme!') {
        setChatStyle({
          enabled: true,
          cssFile: 'none'
        });

        loadThemeBoxes();
        return;
      }

      const buttonLi = e.target.closest('li');
      setChatStyle({
        enabled: true,
        cssFile: buttonLi.dataset.filename
      });

      loadThemeBoxes();
    });

    const buttonTitle = document.createElement('span');
    buttonTitle.classList.add('theme-button-title');
    buttonTitle.textContent = 'Apply this theme!';

    if (theme.filename === chatStyleData.cssFile) {
      li.style.border = "#fff 0.1px solid"
      buttonTitle.textContent = 'Remove this theme!';
    }

    button.appendChild(buttonTitle);

    li.appendChild(div);
    li.appendChild(themeImg);
    li.appendChild(button);

    ul.appendChild(li);
  });
}

loadThemeBoxes();

//Open image popup
function openPopup(url) {
  let img = new Image();
  img.src = url;
  img.onload = function () {
    const width = this.width;
    const height = this.height;

    const popupWidth = width + 50;
    const popupHeight = height + 50;

    const left = (screen.width / 2) - (popupWidth / 2);
    const top = (screen.height / 2) - (popupHeight / 2);

    chrome.windows.create({
      url: chrome.runtime.getURL("src/popup.html"),
      type: "popup",
      width: popupWidth,
      height: popupHeight,
      left: left,
      top: top
    }, (window) => {
      setTimeout(() => chrome.runtime.sendMessage({ url: url, tabId: window.tabs[0].id }), 100);
    });
  };
}