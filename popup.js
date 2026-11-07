document.addEventListener('DOMContentLoaded', () => {
  // --- Constants ---
  const DEFAULT_BUY_COMMISSION = 1.12;
  const DEFAULT_SELL_COMMISSION = 2.24;

  // --- Cross-browser Storage Helper ---
  const storage = (typeof browser !== 'undefined' && browser.storage && browser.storage.local) ? browser.storage.local :
    (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) ? chrome.storage.local : null;

  // --- General DOM Elements ---
  const clearBtn = document.getElementById('clear-btn');
  const tabBuyBtn = document.getElementById('tab-buy');
  const tabSellBtn = document.getElementById('tab-sell');
  const panelBuy = document.getElementById('panel-buy');
  const panelSell = document.getElementById('panel-sell');

  let currentActiveTab = 'buy';

  // --- Tab 1 (Buy Calculator) Elements ---
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

  // --- Tab 2 (Sell Calculator) Elements ---
  const sellBuyPriceInput = document.getElementById('sell-buy-price');
  const sellQuantityInput = document.getElementById('sell-quantity');
  const sellProfitAmountInput = document.getElementById('sell-profit-amount');
  const sellCommissionRateInput = document.getElementById('sell-commission-rate');
  const resetSellCommissionBtn = document.getElementById('reset-sell-commission');
  const profitChips = document.querySelectorAll('.chip-btn');
  const sellResultCard = document.getElementById('sell-result-card');
  const sellEmptyState = document.getElementById('sell-empty-state');
  const targetSellPriceEl = document.getElementById('target-sell-price');
  const priceRiseNeededEl = document.getElementById('price-rise-needed');
  const sellNetProfitValEl = document.getElementById('sell-net-profit-val');
  const sellTotalBuyCostEl = document.getElementById('sell-total-buy-cost');
  const sellTotalRevenueEl = document.getElementById('sell-total-revenue');
  const sellTotalCommissionEl = document.getElementById('sell-total-commission');
  const sellBreakevenPriceEl = document.getElementById('sell-breakeven-price');

  // Currency formatter helper
  function formatCurrency(val) {
    if (isNaN(val)) return 'Rs 0.00';
    return 'Rs ' + val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // --- Tab Management ---
  function switchTab(tabId) {
    currentActiveTab = tabId;

    if (tabId === 'buy') {
      tabBuyBtn.classList.add('active');
      tabBuyBtn.setAttribute('aria-selected', 'true');
      panelBuy.classList.add('active');
      panelBuy.removeAttribute('hidden');

      tabSellBtn.classList.remove('active');
      tabSellBtn.setAttribute('aria-selected', 'false');
      panelSell.classList.remove('active');
      panelSell.setAttribute('hidden', 'true');
    } else {
      tabSellBtn.classList.add('active');
      tabSellBtn.setAttribute('aria-selected', 'true');
      panelSell.classList.add('active');
      panelSell.removeAttribute('hidden');

      tabBuyBtn.classList.remove('active');
      tabBuyBtn.setAttribute('aria-selected', 'false');
      panelBuy.classList.remove('active');
      panelBuy.setAttribute('hidden', 'true');

      // Smart pre-fill from Tab 1 if Tab 2 is empty
      if (!sellBuyPriceInput.value && sharePriceInput.value) {
        sellBuyPriceInput.value = sharePriceInput.value;
      }
      if (!sellQuantityInput.value && maxSharesEl.textContent && maxSharesEl.textContent !== '0') {
        sellQuantityInput.value = maxSharesEl.textContent.replace(/,/g, '');
      }
      if (!sellProfitAmountInput.value) {
        sellProfitAmountInput.value = '1000';
      }
      calculateSell();
      saveSellInputs();
    }

    if (storage) {
      storage.set({ activeTab: tabId });
    } else {
      localStorage.setItem('how_many_shares_active_tab', tabId);
    }
  }

  tabBuyBtn.addEventListener('click', () => switchTab('buy'));
  tabSellBtn.addEventListener('click', () => switchTab('sell'));

  // --- Tab 1 (Buy Calculator) Calculation ---
  function calculate() {
    const totalAmount = parseFloat(totalAmountInput.value);
    const sharePrice = parseFloat(sharePriceInput.value);
    const commissionPercent = parseFloat(commissionRateInput.value) || 0;

    if (isNaN(totalAmount) || totalAmount <= 0 || isNaN(sharePrice) || sharePrice <= 0) {
      resultCard.classList.remove('active');
      emptyState.style.display = 'flex';
      return;
    }

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

  // --- Tab 2 (Sell Calculator) Calculation ---
  function calculateSell() {
    const buyPrice = parseFloat(sellBuyPriceInput.value);
    const quantity = parseFloat(sellQuantityInput.value);
    const targetProfit = parseFloat(sellProfitAmountInput.value);
    const totalCommissionPercent = parseFloat(sellCommissionRateInput.value) || 0;

    // Sync active chip style
    profitChips.forEach(chip => {
      const chipProfit = parseFloat(chip.dataset.profit);
      if (!isNaN(targetProfit) && chipProfit === targetProfit) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    if (isNaN(buyPrice) || buyPrice <= 0 || isNaN(quantity) || quantity <= 0 || isNaN(targetProfit) || targetProfit < 0) {
      sellResultCard.classList.remove('active');
      sellEmptyState.style.display = 'flex';
      return;
    }

    // Buying and selling commissions split equally (e.g. 2.24% = 1.12% buy, 1.12% sell)
    const halfRate = (totalCommissionPercent / 2) / 100;
    const buyRate = halfRate;
    const sellRate = halfRate;

    // Purchase outlay
    const buyStockCost = quantity * buyPrice;
    const buyCommissionCost = buyStockCost * buyRate;
    const totalBuyCost = buyStockCost + buyCommissionCost;

    // Target Selling Price Math:
    // Net Proceeds needed = totalBuyCost + targetProfit
    // Net Proceeds = Total Revenue * (1 - sellRate) = (quantity * sellPrice) * (1 - sellRate)
    // sellPrice = (totalBuyCost + targetProfit) / (quantity * (1 - sellRate))
    const netProceedsNeeded = totalBuyCost + targetProfit;
    const sellPrice = netProceedsNeeded / (quantity * (1 - sellRate));

    const totalRevenue = quantity * sellPrice;
    const sellCommissionCost = totalRevenue * sellRate;
    const totalCommissions = buyCommissionCost + sellCommissionCost;

    const priceRise = sellPrice - buyPrice;
    const priceRisePercent = (priceRise / buyPrice) * 100;

    // Break-even price (selling price to achieve exactly 0 net profit after both fees)
    const breakevenPrice = (buyPrice * (1 + buyRate)) / (1 - sellRate);

    // Render results
    targetSellPriceEl.textContent = formatCurrency(sellPrice);
    const sign = priceRise >= 0 ? '+' : '';
    priceRiseNeededEl.textContent = `${sign}${formatCurrency(priceRise)} (${sign}${priceRisePercent.toFixed(2)}%)`;
    sellNetProfitValEl.textContent = formatCurrency(targetProfit);
    sellTotalBuyCostEl.textContent = formatCurrency(totalBuyCost);
    sellTotalRevenueEl.textContent = formatCurrency(totalRevenue);
    sellTotalCommissionEl.textContent = formatCurrency(totalCommissions);
    sellBreakevenPriceEl.textContent = formatCurrency(breakevenPrice);

    sellEmptyState.style.display = 'none';
    sellResultCard.classList.add('active');
  }

  // --- Profit Chip Selection ---
  profitChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const profit = chip.dataset.profit;
      sellProfitAmountInput.value = profit;
      saveSellInputs();
      calculateSell();
    });
  });

  // --- Save Functions ---
  function saveBuyInputs() {
    const data = {
      totalAmount: totalAmountInput.value,
      sharePrice: sharePriceInput.value,
      commissionRate: parseFloat(commissionRateInput.value) || DEFAULT_BUY_COMMISSION
    };

    if (storage) {
      storage.set(data);
    } else {
      localStorage.setItem('how_many_shares_total_amount', data.totalAmount);
      localStorage.setItem('how_many_shares_share_price', data.sharePrice);
      localStorage.setItem('how_many_shares_commission', data.commissionRate);
    }
  }

  function saveSellInputs() {
    const data = {
      sellBuyPrice: sellBuyPriceInput.value,
      sellQuantity: sellQuantityInput.value,
      sellProfitAmount: sellProfitAmountInput.value,
      sellCommissionRate: parseFloat(sellCommissionRateInput.value) || DEFAULT_SELL_COMMISSION
    };

    if (storage) {
      storage.set(data);
    } else {
      localStorage.setItem('how_many_shares_sell_buy_price', data.sellBuyPrice);
      localStorage.setItem('how_many_shares_sell_quantity', data.sellQuantity);
      localStorage.setItem('how_many_shares_sell_profit_amount', data.sellProfitAmount);
      localStorage.setItem('how_many_shares_sell_commission', data.sellCommissionRate);
    }
  }

  // --- Clear Function ---
  function clearActiveTab() {
    if (currentActiveTab === 'buy') {
      totalAmountInput.value = '';
      sharePriceInput.value = '';

      if (storage) {
        storage.remove(['totalAmount', 'sharePrice']);
      } else {
        localStorage.removeItem('how_many_shares_total_amount');
        localStorage.removeItem('how_many_shares_share_price');
      }

      calculate();
      totalAmountInput.focus();
    } else {
      sellBuyPriceInput.value = '';
      sellQuantityInput.value = '';
      sellProfitAmountInput.value = '';

      profitChips.forEach(chip => chip.classList.remove('active'));

      if (storage) {
        storage.remove(['sellBuyPrice', 'sellQuantity', 'sellProfitAmount']);
      } else {
        localStorage.removeItem('how_many_shares_sell_buy_price');
        localStorage.removeItem('how_many_shares_sell_quantity');
        localStorage.removeItem('how_many_shares_sell_profit_amount');
      }

      calculateSell();
      sellBuyPriceInput.focus();
    }
  }

  // --- Event Listeners for Tab 1 ---
  totalAmountInput.addEventListener('input', () => {
    saveBuyInputs();
    calculate();
  });

  sharePriceInput.addEventListener('input', () => {
    saveBuyInputs();
    calculate();
  });

  commissionRateInput.addEventListener('input', () => {
    saveBuyInputs();
    calculate();
  });

  resetCommissionBtn.addEventListener('click', () => {
    commissionRateInput.value = DEFAULT_BUY_COMMISSION;
    saveBuyInputs();
    calculate();
  });

  // --- Event Listeners for Tab 2 ---
  sellBuyPriceInput.addEventListener('input', () => {
    saveSellInputs();
    calculateSell();
  });

  sellQuantityInput.addEventListener('input', () => {
    saveSellInputs();
    calculateSell();
  });

  sellProfitAmountInput.addEventListener('input', () => {
    saveSellInputs();
    calculateSell();
  });

  sellCommissionRateInput.addEventListener('input', () => {
    saveSellInputs();
    calculateSell();
  });

  resetSellCommissionBtn.addEventListener('click', () => {
    sellCommissionRateInput.value = DEFAULT_SELL_COMMISSION;
    saveSellInputs();
    calculateSell();
  });

  // --- Clear Button Listener ---
  if (clearBtn) {
    clearBtn.addEventListener('click', clearActiveTab);
  }

  // --- Load Saved Data on Init ---
  function loadSavedData() {
    const keys = [
      'activeTab',
      'commissionRate', 'totalAmount', 'sharePrice',
      'sellBuyPrice', 'sellQuantity', 'sellProfitAmount', 'sellCommissionRate'
    ];

    if (storage) {
      storage.get(keys, (result) => {
        if (result) {
          // Tab 1
          if (result.commissionRate !== undefined && result.commissionRate !== null) {
            commissionRateInput.value = result.commissionRate;
          } else {
            commissionRateInput.value = DEFAULT_BUY_COMMISSION;
          }

          if (result.totalAmount !== undefined && result.totalAmount !== null) {
            totalAmountInput.value = result.totalAmount;
          }

          if (result.sharePrice !== undefined && result.sharePrice !== null) {
            sharePriceInput.value = result.sharePrice;
          }

          // Tab 2
          if (result.sellCommissionRate !== undefined && result.sellCommissionRate !== null) {
            sellCommissionRateInput.value = result.sellCommissionRate;
          } else {
            sellCommissionRateInput.value = DEFAULT_SELL_COMMISSION;
          }

          if (result.sellBuyPrice !== undefined && result.sellBuyPrice !== null) {
            sellBuyPriceInput.value = result.sellBuyPrice;
          }

          if (result.sellQuantity !== undefined && result.sellQuantity !== null) {
            sellQuantityInput.value = result.sellQuantity;
          }

          if (result.sellProfitAmount !== undefined && result.sellProfitAmount !== null) {
            sellProfitAmountInput.value = result.sellProfitAmount;
          } else {
            sellProfitAmountInput.value = '1000';
          }

          calculate();
          calculateSell();

          if (result.activeTab === 'sell') {
            switchTab('sell');
          } else {
            switchTab('buy');
          }
        }
      });
    } else {
      // LocalStorage fallback
      const savedComm = localStorage.getItem('how_many_shares_commission');
      commissionRateInput.value = savedComm !== null ? savedComm : DEFAULT_BUY_COMMISSION;

      const savedTotal = localStorage.getItem('how_many_shares_total_amount');
      if (savedTotal !== null) totalAmountInput.value = savedTotal;

      const savedPrice = localStorage.getItem('how_many_shares_share_price');
      if (savedPrice !== null) sharePriceInput.value = savedPrice;

      const savedSellComm = localStorage.getItem('how_many_shares_sell_commission');
      sellCommissionRateInput.value = savedSellComm !== null ? savedSellComm : DEFAULT_SELL_COMMISSION;

      const savedSellBuy = localStorage.getItem('how_many_shares_sell_buy_price');
      if (savedSellBuy !== null) sellBuyPriceInput.value = savedSellBuy;

      const savedSellQty = localStorage.getItem('how_many_shares_sell_quantity');
      if (savedSellQty !== null) sellQuantityInput.value = savedSellQty;

      const savedSellProfit = localStorage.getItem('how_many_shares_sell_profit_amount');
      sellProfitAmountInput.value = savedSellProfit !== null ? savedSellProfit : '1000';

      calculate();
      calculateSell();

      const savedTab = localStorage.getItem('how_many_shares_active_tab');
      if (savedTab === 'sell') {
        switchTab('sell');
      } else {
        switchTab('buy');
      }
    }
  }

  loadSavedData();
});
