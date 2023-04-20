window.addEventListener('load', async () => {
  const chatStyle = await new Promise(resolve => {
    chrome.storage.sync.get("chatStyle", result => {
      resolve(result.chatStyle);
    });
  });

  if (chatStyle) {
    changeStyle(chatStyle);
  }
});

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
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key === "chatStyle") {
        changeStyle(newValue);
      }
    }
  });
}
storageListener();
