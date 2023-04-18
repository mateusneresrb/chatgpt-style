//Set image url in popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log(request, sender, sendResponse)
  if (request.url) {
    var popupImg = document.getElementById("popup-img");
    popupImg.src = request.url;
  }
});