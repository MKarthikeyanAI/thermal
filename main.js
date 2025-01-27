const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const escpos = require('escpos');
escpos.USB = require('escpos-usb');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, 
      contextIsolation: true   
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('print', async (event, data) => {
  try {
    const devices = escpos.USB.findPrinter();

    if (devices && devices.length > 0) {
      // Use the first available device
      const device = new escpos.USB(devices[0].deviceDescriptor.idVendor, devices[0].deviceDescriptor.idProduct); 
      const printer = new escpos.Printer(device);

      device.open(function (error) {
        if (error) {
          console.error('Device open error:', error);
          throw new Error('Failed to open printer device.');
        }

        printer
          .font('a')
          .align('ct')
          .style('bu')
          .size(1, 1)
          .text('My Store')
          .text('123 Main St, Anytown')
          .text('Tel: 555-123-4567')
          .feed()
          .style('normal')
          .tableCustom(
            [
              { text: "Qty", align: "LEFT", width: 0.1 },
              { text: "Item", align: "LEFT", width: 0.65 },
              { text: "Price", align: "RIGHT", width: 0.25 }
            ],
            { encoding: 'cp857', size: [1, 1] } // Optional
          );

        data.items.forEach(item => {
          printer.tableCustom(
            [
              { text: item.quantity.toString(), align: "LEFT", width: 0.1 },
              { text: item.name, align: "LEFT", width: 0.65 },
              { text: item.price.toFixed(2), align: "RIGHT", width: 0.25 }
            ],
            { encoding: 'cp857', size: [1, 1] } // Optional
          );
        });

        printer
          .drawLine()
          .tableCustom(
            [
              { text: '', align: "LEFT", width: 0.1 },
              { text: "Subtotal", align: "LEFT", width: 0.65 },
              { text: data.total.toFixed(2), align: "RIGHT", width: 0.25 }
            ],
            { encoding: 'cp857', size: [1, 1] } // Optional
          )
          .tableCustom(
            [
              { text: '', align: "LEFT", width: 0.1 },
              { text: "Tax", align: "LEFT", width: 0.65 },
              { text: data.tax.toFixed(2), align: "RIGHT", width: 0.25 }
            ],
            { encoding: 'cp857', size: [1, 1] } // Optional
          )
          .tableCustom(
            [
              { text: '', align: "LEFT", width: 0.1 },
              { text: "TOTAL", align: "LEFT", width: 0.65 },
              { text: data.grandTotal.toFixed(2), align: "RIGHT", width: 0.25 }
            ],
            { encoding: 'cp857', size: [1, 1] } // Optional
          )
          .feed(2)
          .cut()
          .close();
      });

      return 'Print job sent successfully';
    } else {
      throw new Error('No USB printer found.');
    }
  } catch (error) {
    console.error('Print error:', error);
    throw error; // Re-throw to allow renderer to handle
  }
});