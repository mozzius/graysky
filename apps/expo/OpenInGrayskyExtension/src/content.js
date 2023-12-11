let handledURL = "";
let isAutomatic = true;

function runCheck() {
  if (handledURL == window.location.href) {
    // Already handled, don't want to repeat.
    return;
  }

  handledURL = window.location.href;
  window.stop();

  // todo: handle manual mode
  // need to create a https://redirect.graysky.app/* microsite

  window.location.replace(`graysky:/${window.location.pathname}`);
}

browser.storage.local.get((item) => {
  var automaticObj = item.automaticObj;

  if (automaticObj == undefined) {
    isAutomatic = true;
  } else {
    isAutomatic = automaticObj.isAutomatic;
  }

  // Run both on extension being created (on page load) as well as when DOM nodes are inserted
  runCheck();
  document.addEventListener("DOMNodeInserted", function (event) {
    runCheck();
  });
});
