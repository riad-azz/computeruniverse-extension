// -------- DEV VARS --------
const DEBUG = false;
// -------- APP VARS --------
let selectedCountryCode;
let selectedCountryName;
let currentUrl = document.location.href;
// -------- Constant vars --------
const firstItemSelector = '.c-pl__main--rows > .ais-Hits > .ais-Hits-list > .ais-Hits-item';
const itemSelector = '.ais-Hits-item';
const linkSelector = '.showShippingInfo';
const priceParentContainerSelector = ".price-box__current-price";
const priceContainerSelector = ".price";
const priceSelector = "span";

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
    }, 100);
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

const getTotalPrice = async (element, shippingPrice) => {
  const parentContainer = element.querySelector(priceParentContainerSelector);
  const priceContainer = parentContainer.querySelector(priceContainerSelector);
  const priceElement = priceContainer.querySelector(priceSelector);
  const priceText = priceElement.innerText.replace(".", "").replace(",", ".");
  const price = parseFloat(priceText);
  let totalPrice = price + shippingPrice;
  totalPrice = totalPrice.toFixed(2);
  return totalPrice;
}

const showItemShippingPrice = async (element, shippingPrice) => {
  const linkElement = await waitForLinkElement(element);
  const btnElement = linkElement.parentElement;
  const containerElement = btnElement.parentElement;
  // remove old elements
  linkElement.remove();
  btnElement.remove();
  // add a new element to hold the shipping price
  let message;
  let totalPrice;
  if (shippingPrice) {
    message = `Shipping cost to ${selectedCountryName} ${shippingPrice} €`;
    totalPrice = await getTotalPrice(element, shippingPrice);
  } else {
    message = `There is no shipping to ${selectedCountryName}`;
  }
  const shippingPriceElement = document.createElement('div');
  const totalPriceElement = document.createElement('div');
  shippingPriceElement.textContent = message;
  containerElement.appendChild(shippingPriceElement);
  if (!totalPrice) return;
  containerElement.parentElement.style.display = "block";
  totalPriceElement.textContent = `Total price ${totalPrice} €`;
  containerElement.appendChild(totalPriceElement);
}

const itemListPageObserver = () => {
  // Create an observer instance
  const observer = new MutationObserver((mutationsList, observer) => {
    const linksExist = document.querySelector(linkSelector);
    if (linksExist) {
      console.log("fuck off mate");
      handleItemListPage();
      return;
    }
  });

  // Start observing the target node for configured mutations
  observer.observe(document.body, { childList: true, subtree: true });
}

const showListShippingPrice = async (itemsContainer) => {
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
  showListShippingPrice(itemsContainer);
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
  } else {
    // Show the shipping prices whenver elements are mutated
    itemListPageObserver();
  }

}

// Execute after the document is loaded
window.onload = function () {
  runApp();
};