// -------- DEV VARS --------
const DEBUG = true;
// -------- APP VARS --------
let selectedCountry;

// -------- Constant vars --------
const firstItemSelector = '.c-pl__main--rows > .ais-Hits > .ais-Hits-list > .ais-Hits-item';
const itemSelector = '.ais-Hits-item';
const linkSelector = '.showShippingInfo';

// -------- Utils --------
async function waitForProductsList(selector) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(function () {
      const element = document.querySelector(selector)

      if (element) {
        const productsList = element.parentElement;
        if (DEBUG) {
          // FOR DEBUG ONLY
          console.log(`Found products list element`)
          console.log(productsList);
        }
        clearInterval(interval);
        resolve(productsList);
      }
    }, 50);
  });
}

const enableAction = () => {
  const message = {
    title: 'enable-action',
  }
  chrome.runtime.sendMessage(message, function (response) {
    if (!response) return;
    console.log(`${response.content}. (popup.js)`);
  });
}

const getSelectedCountry = async () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['countryCode'], function (result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result['countryCode']);
      }
    });
  });
}

async function getShippingPrice(id, countryCode = "DZ") {
  const shippingPriceUrl = `https://webapi.computeruniverse.net/api/products/${id}/shippingcached?shippingCountryIsoCode=${countryCode}&showTax=true`;
  const response = await fetch(shippingPriceUrl);
  const data = await response.json();
  return data.Value;
}

// Change button text to actual shipping price
const showShippingPrice = async (itemsContainer) => {
  const itemList = itemsContainer.querySelectorAll(itemSelector);
  for await (let item of itemList) {
    const itemLink = item.querySelector('a[role="button"]').href;
    const itemId = itemLink.split('/').at(-1);
    const shippingPrice = await getShippingPrice(itemId);
    if (!shippingPrice) {
      console.log(item);
      console.log('This item has no shipping cost available');
    } else {
      console.log(shippingPrice);
    }
  }
}


// Start the content script
async function runApp() {
  enableAction();
  // Get selected country code
  selectedCountry = await getSelectedCountry();
  console.log(selectedCountry);
  // Get the items container element
  // const itemsContainer = await waitForProductsList(firstItemSelector);
  // showShippingPrice(itemsContainer);
}


// Execute after the document is loaded
window.onload = function () {
  runApp();
};