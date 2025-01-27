const printBtn = document.getElementById('printBtn');

printBtn.addEventListener('click', async () => {
  const billData = {
    items: [
      { name: 'Item 1', quantity: 2, price: 10.00 },
      { name: 'Item 2', quantity: 1, price: 5.50 },
      { name: 'Item 3', quantity: 3, price: 2.25 }
    ],
    total: 32.25,
    tax: 2.58,
    grandTotal: 34.83
  };

  try {
    await window.electronAPI.sendPrintCommand(billData);
    // You can add UI updates here if the print was successful
    alert('Bill sent to printer!');
  } catch (error) {
    // Handle errors and update UI
    console.error('Print error:', error);
    alert('Error printing bill: ' + error.message);
  }
});