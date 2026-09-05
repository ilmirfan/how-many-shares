document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const totalAmountInput = document.getElementById('total-amount');
  const sharePriceInput = document.getElementById('share-price');
  const commissionRateInput = document.getElementById('commission-rate');
  const resetCommissionBtn = document.getElementById('reset-commission');

  const resultCard = document.getElementById('result-card');
  const emptyState = document.getElementById('empty-state');

  const maxSharesEl = document.getElementById('max-shares');
  const effectivePriceEl = document.getElementById('effective-price');
  const totalCostEl = document.getElementById('total-cost');
  const stockCostEl = document.getElementById('stock-cost');
  const commissionCostEl = document.getElementById('commission-cost');
  const remainingCashEl = document.getElementById('remaining-cash');
  const exactSharesEl = document.getElementById('exact-shares');

  const DEFAULT_COMMISSION = 1.12;

  // Cross-browser storage helper (Firefox WebExtension supports `browser.storage` and `chrome.storage`)
  const storage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage.local :
    (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage.local : null;

  // Load saved commission rate
  function loadSavedCommission() {
    if (storage) {
      storage.get(['commissionRate'], (result) => {
        if (result && result.commissionRate !== undefined && result.commissionRate !== null) {
          commissionRateInput.value = result.commissionRate;
        } else {
          commissionRateInput.value = DEFAULT_COMMISSION;
        }
        calculate();
      });
    } else {
      const saved = localStorage.getItem('how_many_shares_commission');
      if (saved !== null) {
        commissionRateInput.value = saved;
      } else {
        commissionRateInput.value = DEFAULT_COMMISSION;
      }
      calculate();
    }
  }

  // Save commission rate
  function saveCommission(val) {
    const numVal = parseFloat(val);
    if (isNaN(numVal)) return;

    if (storage) {
      storage.set({ commissionRate: numVal });
    } else {
      localStorage.setItem('how_many_shares_commission', numVal);
    }
  }

  // Currency formatter helper
  function formatCurrency(val) {
    if (isNaN(val)) return 'Rs 0.00';
    return 'Rs ' + val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Main calculation function
  function calculate() {
    const totalAmount = parseFloat(totalAmountInput.value);
    const sharePrice = parseFloat(sharePriceInput.value);
    const commissionPercent = parseFloat(commissionRateInput.value) || 0;

    // Validate inputs
    if (isNaN(totalAmount) || totalAmount <= 0 || isNaN(sharePrice) || sharePrice <= 0) {
      resultCard.classList.remove('active');
      emptyState.style.display = 'block';
      return;
    }

    // Calculation Math
    // Effective price per share = Share Price * (1 + Commission / 100)
    const commissionRate = commissionPercent / 100;
    const effectivePricePerShare = sharePrice * (1 + commissionRate);

    // Exact fractional shares & maximum whole shares
    const exactShares = totalAmount / effectivePricePerShare;
    const maxWholeShares = Math.floor(exactShares);

    // Financial breakdown
    const stockCost = maxWholeShares * sharePrice;
    const commissionCost = stockCost * commissionRate;
    const totalCost = stockCost + commissionCost;
    const remainingCash = totalAmount - totalCost;

    // Render results
    maxSharesEl.textContent = maxWholeShares.toLocaleString('en-IN');
    effectivePriceEl.textContent = formatCurrency(effectivePricePerShare);
    totalCostEl.textContent = formatCurrency(totalCost);
    stockCostEl.textContent = formatCurrency(stockCost);
    commissionCostEl.textContent = formatCurrency(commissionCost);
    remainingCashEl.textContent = formatCurrency(remainingCash);
    exactSharesEl.textContent = exactShares.toFixed(2);

    emptyState.style.display = 'none';
    resultCard.classList.add('active');
  }

  // Event Listeners for real-time recalculation
  totalAmountInput.addEventListener('input', calculate);
  sharePriceInput.addEventListener('input', calculate);

  commissionRateInput.addEventListener('input', () => {
    saveCommission(commissionRateInput.value);
    calculate();
  });

  resetCommissionBtn.addEventListener('click', () => {
    commissionRateInput.value = DEFAULT_COMMISSION;
    saveCommission(DEFAULT_COMMISSION);
    calculate();
  });

  // Initial load
  loadSavedCommission();
});

