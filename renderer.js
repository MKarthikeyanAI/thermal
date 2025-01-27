const { ipcRenderer } = require('electron');
const axios = require('axios');

document.addEventListener('DOMContentLoaded', () => {
  const groupsContainer = document.getElementById('groups');
  const categoriesContainer = document.getElementById('categories');
  const itemsContainer = document.getElementById('itemsContainer');
  const cartContainer = document.getElementById('cart');
  const totalAmount = document.getElementById('totalAmount');
  const searchInput = document.getElementById('searchBar');
  const printBtn = document.getElementById('printBtn'); // Add this

  let cart = [];
  let menuData = [];

  // Fetch menu data
  axios.get('http://127.0.0.1:5000/menu') // Replace with your backend URL
    .then(response => {
      menuData = response.data;

      console.log("Menu Data of the",menuData);

      const allButton = document.createElement('button');
      allButton.classList.add('group-button');
      allButton.textContent = 'All';
      allButton.addEventListener('click', () => loadItems());

      groupsContainer.appendChild(allButton);

      // Populate groups
      menuData.forEach((group, index) => {
        const groupButton = document.createElement('button');
        groupButton.classList.add('group-button');
        groupButton.textContent = group.group;
        groupButton.addEventListener('click', () => loadCategories(index));
        console.log("group clicking");
        groupsContainer.appendChild(groupButton);
      });

      // Load the first group's categories by default
      loadItems();


    })
    .catch(error => console.error('Error fetching menu:', error));

  // Load categories for a selected group
  function loadCategories(groupIndex) {
    console.log("group clicking mk", groupIndex);
    categoriesContainer.innerHTML = '';
    itemsContainer.innerHTML = '';

    const header = document.createElement('h3');
    header.textContent = 'Categories';
    header.classList.add('categoriess-header'); // Add the CSS class
    categoriesContainer.appendChild(header);

    const categories = menuData[groupIndex].categories;
    categories.forEach((category, index) => {
      const categoryButton = document.createElement('button');
      categoryButton.classList.add('category-button');
      categoryButton.textContent = category.name;
      categoryButton.addEventListener('click', () => loadItems(groupIndex, index));
      categoriesContainer.appendChild(categoryButton);
    });

    loadItems(0, 0);
  }

  // Remove item from cart
  function removeItemFromCart(itemId) {
    // Find the item and remove it from the cart array
    const index = cart.findIndex(i => i.id === itemId);
    if (index !== -1) {
      cart.splice(index, 1);
    }
    updateCart();
  }


  // Load items for a selected group/category or all items
  function loadItems(groupIndex = null, categoryIndex = null) {

    itemsContainer.innerHTML = '';
    console.log("groupindex and category index: ", groupIndex, categoryIndex);

    // Create and add a search bar
    // const searchBar = document.createElement('input');
    // searchBar.type = 'text';
    // searchBar.id = 'searchBar';
    // searchBar.placeholder = 'Search for items...';
    // searchBar.style.marginBottom = '10px';
    // searchBar.style.padding = '5px';
    // searchBar.style.boxSizing = 'border-box';
    // itemsContainer.appendChild(searchBar);


    // Display all items by default if no group/category is selected
    let items = [];
    if (groupIndex === null && categoryIndex === null) {
      // Load all items across all groups
      menuData.forEach((group) => {
        group.categories.forEach((category) => {
          items = items.concat(category.items);
        });
      });
    } else {
      // Load items from a specific group/category
      const category = menuData[groupIndex].categories[categoryIndex];
      items = category.items;
    }

    // Function to render items
    function renderItems(filteredItems) {
      const itemListContainer = document.createElement('div');
      itemListContainer.id = 'itemListContainer';
      filteredItems.forEach((item) => {
        const itemButton = document.createElement('button');
        itemButton.classList.add('item-button');
        itemButton.textContent = `${item.name} - $${item.price.toFixed(2)}`;
        itemButton.addEventListener('click', () => addItemToCart(item));
        itemListContainer.appendChild(itemButton);
      });

      // Append the item list container to the items container
      itemsContainer.appendChild(itemListContainer);
    }

    // Initial render of all items
    renderItems(items);

    // Add search functionality
    searchInput.addEventListener('input', (e) => {
      const searchQuery = e.target.value.toLowerCase();
      const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery)
      );

      // Clear existing items and re-render based on the search
      const existingItemList = document.getElementById('itemListContainer');
      if (existingItemList) {
        itemsContainer.removeChild(existingItemList);
      }
      renderItems(filteredItems);
    });


  }

  // Add item to cart
  function addItemToCart(item) {
    const cartItem = cart.find(i => i.id === item.id);
    if (cartItem) {
      cartItem.qty++;
    } else {
      cart.push({ ...item, qty: 1 });
    }
    updateCart();
  }

  // Update item quantity
  function updateItemQuantity(itemId, change) {
    const cartItem = cart.find(i => i.id === itemId);
    if (cartItem) {
      // Adjust the quantity
      cartItem.qty += change;

      // If quantity is 0 or less, remove the item from the cart
      if (cartItem.qty <= 0) {
        const index = cart.indexOf(cartItem);
        cart.splice(index, 1);
      }
    }
    updateCart();
  }

  function displayItems(items) {
    items.forEach(item => {
      const itemButton = document.createElement('button');
      itemButton.textContent = `${item.name} - $${item.price.toFixed(2)}`;
      itemButton.addEventListener('click', () => addItemToCart(item));
      itemsContainer.appendChild(itemButton);
    });
  }

  function updateCart() {
    cartContainer.innerHTML = '';
    let total = 0;
    cart.forEach((item) => {
      const row = document.createElement('tr');

      const nameCell = document.createElement('td');
      nameCell.textContent = item.name;
      row.appendChild(nameCell);

      const qtyCell = document.createElement('td');
      qtyCell.textContent = item.qty;
      row.appendChild(qtyCell);

      const priceCell = document.createElement('td');
      priceCell.textContent = `$${item.price.toFixed(2)}`;
      row.appendChild(priceCell);

      const amountCell = document.createElement('td');
      amountCell.textContent = `$${(item.qty * item.price).toFixed(2)}`;
      row.appendChild(amountCell);

      const actionsCell = document.createElement('td');
      const incrementButton = document.createElement('button');
      incrementButton.textContent = '+';
      incrementButton.classList.add('cart-item-button');
      incrementButton.addEventListener('click', () => updateItemQuantity(item.id, 1));
      actionsCell.appendChild(incrementButton);

      const decrementButton = document.createElement('button');
      decrementButton.textContent = '-';
      decrementButton.classList.add('cart-item-button');
      decrementButton.addEventListener('click', () => updateItemQuantity(item.id, -1));
      actionsCell.appendChild(decrementButton);

      const removeButton = document.createElement('button');
      removeButton.textContent = 'Remove';
      removeButton.classList.add('cart-item-button');
      removeButton.addEventListener('click', () => removeItemFromCart(item.id));
      actionsCell.appendChild(removeButton);

      row.appendChild(actionsCell);
      cartContainer.appendChild(row);

      total += item.qty * item.price;
    });


    totalAmount.textContent = `Total: $${total.toFixed(2)}`;

  }


  // Print functionality
printBtn.addEventListener('click', async () => {


  const billData = {
    items: cart.map((item) => ({
      name: item.name,
      quantity: item.qty,
      price: item.price,
    })),
    total: cart.reduce((sum, item) => sum + item.qty * item.price, 0),
    tax: 0, // Add your tax calculation logic here
    grandTotal: 0, // Add your grand total calculation logic here
  };
  billData.grandTotal = billData.total + billData.tax;

  try {
    // Use the secure exposed API
    console.log(billData);
    const result = await window.electronAPI.sendPrintCommand(billData);
    console.log(result); // Log the result of the print job
    alert('Bill sent to printer!');

    // Optionally clear the cart after printing
    cart = [];
    updateCart();
  } catch (error) {
    console.error('Print error:', error);
    alert('Error printing bill: ' + error.message);
  }
});
});