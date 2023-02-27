// -------- Handle local storage --------
const loadSaved = async () => {
  chrome.storage.local.get(["countryCode", "countryName"], function (result) {
    console.log(`Country code saved value is : ${result.countryCode}. (background.js)`);
    if (!result.countryCode) {
      chrome.storage.local.set({ countryCode: 'DZ', countryName: 'Algeria' }, function () {
        console.log("Country code was defaulted to DZ. (background.js)");
      });
    }
  });
}

// -------- Handle page change --------
const handleUrlChanges = (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const newUrl = changeInfo.url;
    if (newUrl.includes('computeruniverse.net')) {
      console.log('correct tab');
      chrome.tabs.reload(tabId);
    }
    console.log("New URL: " + newUrl);
  }
}

// -------- Notify other scripts --------
const updateCountryCode = (code, name, tabId) => {
  // Update the country code
  chrome.storage.local.set({ countryCode: code, countryName: name },
    function () { console.log("Country code was updated and saved. (background.js)"); }
  );
  // Notify the content script
  chrome.tabs.reload(tabId);
}

// -------- Handle messages --------
const handleMessages = (message, sender, sendResponse) => {
  if (message.title == "enable-action") {
    chrome.action.enable(sender.tab.id);
  }
  else if (message.title == "update-country") {
    updateCountryCode(message.code, message.name, message.tabId);
  }
}

async function runApp() {
  chrome.action.disable();
  await loadSaved();
  // Listen for messages
  chrome.runtime.onMessage.addListener(handleMessages);
  // Listen for url changes
  chrome.tabs.onUpdated.addListener(handleUrlChanges)
}


runApp();
