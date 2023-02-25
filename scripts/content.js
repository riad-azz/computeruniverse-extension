// -------- DEV VARS --------
const DEBUG = true;
const wait = (amount = 0) => new Promise(resolve => setTimeout(resolve, amount));

// -------- Constant vars --------
const firstItemSelector = '.c-pl__main--rows > .ais-Hits > .ais-Hits-list > .ais-Hits-item';
const itemSelector = '.ais-Hits-item';
const popupSelector = '.c-popOver__content';
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

async function getShippingPrice(id) {
  const url = `https://webapi.computeruniverse.net/api/products/${id}/shippingcached?shippingCountryIsoCode=DZ&showTax=true`

}

// Change button text to actual shipping price
const showShippingPrice = async (container) => {
  const linkElements = container.querySelectorAll(Link)
  const linkElement = item.querySelector(linkSelector);
  await linkElement.click();
  const popupElement = document.querySelector(popupSelector);
  linkElement.textContent = popupElement.textContent;
  console.log(linkElement.textContent);
}


// Start the content script
async function runApp() {
  const container = await waitForProductsList(firstItemSelector);
  showShippingPrice(container);
}


// Execute after the document is loaded
window.onload = function () {
  runApp();
};