window.addEventListener('load', async () => {
  const chatStyle = await new Promise(resolve => {
    chrome.storage.sync.get("chatStyle", result => {
      resolve(result.chatStyle);
    });
  });
  
  if (chatStyle) {
    changeStyle(chatStyle);
    console.log('apliquei o estilo: ' + chatStyle);
  }
});

const changeStyle = (newStyle) => {
  let styleLink = null;

  if (newStyle.cssFile === "none" || !newStyle.enabled) {
    console.log('preciso remover o estilo')
    removeChatStyleTag();
    return;
  }

  removeChatStyleTag();
  styleLink = document.createElement("link");
  styleLink.id = "chatgpt-style";
  styleLink.href = chrome.runtime.getURL("../themes/" + newStyle.cssFile);
  styleLink.type = "text/css";
  styleLink.rel = "stylesheet";

  document.getElementsByTagName("head")[0].appendChild(styleLink);
}

function removeChatStyleTag() {
  const chatGPTStyle = document.getElementById('chatgpt-style');
  if (chatGPTStyle) {
    chatGPTStyle.remove();
  }
}

function storageListener(){
  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key === "chatStyle") {
        changeStyle(newValue);
      }
    }
  });
}
storageListener();
