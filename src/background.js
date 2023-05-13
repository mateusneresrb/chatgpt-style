//Load page
window.addEventListener('load', async () => {
  const chatStyle = await new Promise(resolve => {
    chrome.storage.sync.get("chatStyle", result => {
      resolve(result.chatStyle);
    });
  });

  if (chatStyle) {
    const styleRemote = await loadRemote(chatStyle.cssFile);
    chatStyle.styles = styleRemote.data.styles;

    changeStyle(chatStyle);
  }
});

//Change style
const changeStyle = (newStyle) => {
  if (newStyle.cssFile === "none" || !newStyle.enabled) {
    removeChatStyleTag();
    return;
  }

  removeChatStyleTag();
  const style = document.createElement('style');
  style.id = "chatgpt-style";
  style.textContent = newStyle.styles;

  document.getElementsByTagName("head")[0].appendChild(style);
}

function removeChatStyleTag() {
  const chatGPTStyle = document.getElementById('chatgpt-style');
  if (chatGPTStyle) {
    chatGPTStyle.remove();
  }
}

function storageListener() {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (const [key, { newValue }] of Object.entries(changes)) {
      if (key === "chatStyle") {
        changeStyle(newValue);
      }
    }
  });
}
storageListener();

const owner = 'mateusneresrb';
const repo = 'chatgpt-style';

//Load remote theme
async function loadRemote(themeName) {
  const path = 'themes';

  const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}/${themeName}`;
  const classes = await getCustomClasses();

  try {
    const response = await fetch(url);
    const cssText = await response.text();

    const header = {};
    let styles = '';

    const headerEndIndex = cssText.indexOf('*/') - 2;
    const headerText = cssText.substring(2, headerEndIndex).trim();

    headerText.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();
      header[key] = value;
    });

    styles = cssText.substring(headerEndIndex + 5).trim();
    for (const cssClass of classes) {
      const newSelector = cssClass.selector;
      const oldSelector = `.${cssClass.name}`;
  
      styles = styles.replace(oldSelector, newSelector);
    }

    const data = {
      ...header,
      styles: styles
    };

    return { filename: themeName, data };
  } catch (error) {
    console.error(`Error loading CSS file ${themeName}: ${error}`);
    return [];
  }
}

async function getCustomClasses() {
  const path = 'custom-classes.json';
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    return data.classes;
  } catch (error) {
    console.error(`Error loading custom classes: ${error}`);
  }
}