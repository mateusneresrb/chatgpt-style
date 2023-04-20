const setChatStyle = async (newStyle) => {
  const themes = await getThemes();
  const theme = themes.find(theme => theme.filename.includes(newStyle.cssFile));

  const themeStyles = newStyle.cssFile !== 'none' ? theme.data.styles : '{}';
  chrome.storage.sync.set({
    chatStyle: {
      enabled: newStyle.enabled,
      cssFile: newStyle.cssFile,
      styles: themeStyles
  }});
}

function getChatStyle() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get("chatStyle", ({ chatStyle }) => {
      if (chatStyle) {
        resolve(chatStyle);
        return;
      }

      const chatStyleData = { enabled: true, cssFile: "business.css" };

      setChatStyle(chatStyleData);
      resolve(chatStyleData);
    });
  });
}

async function loadThemeBoxes() {
  const ul = document.getElementById('themes');
  if (ul) ul.innerHTML = '';

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
    themeImg.alt = theme.data.name;
    themeImg.classList.add('theme-img');
    themeImg.loading = 'lazy';

    themeImg.addEventListener('click', (e) => {
      const url = e.target.src;
      const themeName = e.target.alt;

      openPopup(url, themeName);
    });

    const button = document.createElement('button');
    button.classList.add('theme-button');

    button.addEventListener('click', (e) => {
      if (e.target.textContent === 'Remove this theme!') {
        setChatStyle({
          enabled: false,
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
function openPopup(url, title) {
  let img = new Image();
  img.src = url;
  img.onload = function () {
    const width = 650;
    const height = 300;

    const popupWidth = width + 50;
    const popupHeight = height + 50;

    const left = parseInt((screen.width / 2) - (popupWidth / 2));
    const top = parseInt((screen.height / 2) - (popupHeight / 2));

    chrome.windows.create({
      url: chrome.runtime.getURL("src/popup.html"),
      type: "popup",
      width: popupWidth,
      height: popupHeight,
      left: left,
      top: top
    }, (window) => {
      setTimeout(() => chrome.runtime.sendMessage({ url: url, title: title, tabId: window.tabs[0].id }), 300);
    });
  };
}

//Load themes
async function readCssFile(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => response.text())
      .then(text => {
        const header = {};
        let styles = '';

        const headerEndIndex = text.indexOf('*/') - 1;
        const headerText = text.substring(2, headerEndIndex).trim();

        headerText.split('\n').forEach(line => {
          const colonIndex = line.indexOf(':');
          const key = line.substring(0, colonIndex).trim().toLowerCase();
          const value = line.substring(colonIndex + 1).trim();
          header[key] = value;
        });

        styles = text.substring(headerEndIndex + 5).trim();

        resolve({
          header,
          styles
        });
      })
      .catch(error => reject(new Error(`Failed to read CSS file: ${error}`)));
  });
}

async function getThemes() {
  const owner = 'mateusneresrb';
  const repo = 'chatgpt-style';
  const path = 'themes';

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const cssFiles = await data.reduce(async (acc, file) => {
      const result = await acc;

      if (file.type === 'file' && file.name.endsWith('.css')) {
        const fileUrl = file.download_url;
        const fileName = file.name;

        try {
          const cssFile = await readCssFile(fileUrl);
          const data = {
            ...cssFile.header,
            styles: cssFile.styles
          };

          result.push({ filename: fileName, data });
        } catch (error) {
          console.error(`Error loading CSS file ${fileName}: ${error}`);
        }
      }

      return result;
    }, []);
    return cssFiles;
  } catch (error) {
    console.error(`Error loading CSS files: ${error}`);
    return [];
  }
}
