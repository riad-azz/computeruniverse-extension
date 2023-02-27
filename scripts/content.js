// -------- DEV VARS --------
const DEBUG = false;
// -------- APP VARS --------
let selectedCountryCode;
let selectedCountryName;
// -------- Constant vars --------
const firstItemSelector = '.c-pl__main--rows > .ais-Hits > .ais-Hits-list > .ais-Hits-item';
const itemSelector = '.ais-Hits-item';
const linkSelector = '.showShippingInfo';

// -------- Utils --------
const waitForProductsList = async (selector) => {
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

const waitForLinkElement = async (parent) => {
  return new Promise((resolve, reject) => {
    const interval = setInterval(function () {
      const element = parent.querySelector(linkSelector)

      if (element) {
        clearInterval(interval);
        resolve(element);
      }
    }, 50);
  });
}

const enableAction = () => {
  const message = {
    title: 'enable-action',
  }
  chrome.runtime.sendMessage(message);
}

const getSelectedCountryCode = async () => {
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

const getSelectedCountryName = async () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['countryName'], function (result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result['countryName']);
      }
    });
  });
}


const getShippingPrice = async (id, countryCode) => {
  const shippingPriceUrl = `https://webapi.computeruniverse.net/api/products/${id}/shippingcached?shippingCountryIsoCode=${countryCode}&showTax=true`;
  const response = await fetch(shippingPriceUrl);
  const data = await response.json();
  return data.Value;
}

const showItemShippingPrice = async (element, price) => {
  const linkElement = await waitForLinkElement(element);
  const btnElement = linkElement.parentElement;
  const containerElement = btnElement.parentElement;
  // remove old elements
  linkElement.remove();
  btnElement.remove();
  // add a new element to hold the shipping price
  let message;
  if (price) {
    message = `Shipping cost to ${selectedCountryName} is ${price}€`;
  } else {
    message = `There is no shipping to ${selectedCountryName}`;
  }
  const priceElement = document.createElement('option');
  priceElement.textContent = message;
  containerElement.appendChild(priceElement);
}

const handleItemsList = async (itemsContainer) => {
  // Get all items
  const itemList = itemsContainer.querySelectorAll(itemSelector);
  for await (item of itemList) {
    const itemLink = item.querySelector('a[role="button"]').href;
    const itemId = itemLink.split('/').at(-1);
    const shippingPrice = await getShippingPrice(itemId, selectedCountryCode);
    showItemShippingPrice(item, shippingPrice)
  }
}

const handleItemListPage = async () => {
  // Get the items container element
  const itemsContainer = await waitForProductsList(firstItemSelector);
  // Handle showing the shipping price for each item
  handleItemsList(itemsContainer);
}

const handleItemPage = async (pageUrl) => {
  const itemId = pageUrl.split('/').at(-1);
  const shippingPrice = await getShippingPrice(itemId, selectedCountryCode);
  await showItemShippingPrice(document, shippingPrice);
}

// Start the content script
async function runApp() {
  // Enable the popup button for the current page
  enableAction();
  // Get selected country code and name
  selectedCountryCode = await getSelectedCountryCode();
  selectedCountryName = await getSelectedCountryName();
  // Check if a item page or a item list page
  const currentUrl = window.location.href;
  const pageType = currentUrl.split('/').at(-2);
  if (pageType === 'p') {
    handleItemPage(currentUrl);
  } else if (pageType === 'c') {
    handleItemListPage();
  }

}


// Execute after the document is loaded
window.onload = function () {
  runApp();
};