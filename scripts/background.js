const loadSaved = async () => {
  const value = chrome.storage.local.get(["countryCode"], function (result) {
    console.log(`Country code saved value is : ${result.myValue}. (background.js)`);
  });
  console.log(value);
  if (!value) {
    chrome.storage.local.set({ countryCode: 'DZ' }, function () {
      console.log("Country code was defaulted to DZ. (background.js)");
    });
  }
}


const updateCountryCode = (code, tabId) => {
  // Update the country code
  chrome.storage.local.set({ countryCode: code },
    function () { console.log("Country code was updated and saved. (background.js)"); }
  );
  // Notify the content script
  chrome.tabs.reload(tabId);
}

const handleMessages = (message, sender, sendResponse) => {
  if (message.title == "enable-action") {
    chrome.action.enable(sender.tab.id);
    console.log(`enabled at tab ${sender.tab.id}`)
  }
  else if (message.title == "update-country") {
    updateCountryCode(message.code, message.tabId);
    const response = { content: `Country code update success.` };
    sendResponse(response);
  }
}

async function runApp() {
  chrome.action.disable();
  await loadSaved();
  // Listen for messages
  chrome.runtime.onMessage.addListener(handleMessages);
}

runApp();
