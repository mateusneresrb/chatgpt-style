//Open image popup
function openPopup(url) {
  let img = new Image();
  img.src = url;
  img.onload = function() {
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
    setTimeout(() => chrome.runtime.sendMessage({url: url, tabId: window.tabs[0].id}), 100);
  });
 };
}

const images = document.querySelectorAll('.theme-img');
for (var i = 0; i < images.length; i++) {
  images[i].addEventListener('click', function(e) {
    const url = e.target.src;
    openPopup(url);
  });
}