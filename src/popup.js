//Set image url in popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log(request, sender, sendResponse)
  if (request.url && request.title) {
    document.title = "Viewing theme:" + request.title;

    var popupImg = document.getElementById("popup-img");
    popupImg.src = request.url;
  }
});