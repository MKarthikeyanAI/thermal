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
      nodeIntegration: true, 
      contextIsolation: false   
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
    console.log('Received print request:', data);

    const devices = escpos.USB.findPrinter();
    if (!devices || devices.length === 0) {
      console.error('No USB printer devices detected.');
      throw new Error('No USB printer found. Ensure the printer is connected.');
    }

    console.log(`Found ${devices.length} printer(s). Using the first one.`);
    const device = new escpos.USB(devices[0]);
    const printer = new escpos.Printer(device);

    device.open((error) => {
      if (error) {
        console.error('Failed to open device:', error);
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
        .text('--- RECEIPT ---')
        .feed()
        .style('normal')
        .tableCustom(
          [
            { text: "Qty", align: "LEFT", width: 0.1 },
            { text: "Item", align: "LEFT", width: 0.65 },
            { text: "Price", align: "RIGHT", width: 0.25 }
          ]
        );

      data.items.forEach(item => {
        printer.tableCustom(
          [
            { text: item.quantity.toString(), align: "LEFT", width: 0.1 },
            { text: item.name, align: "LEFT", width: 0.65 },
            { text: item.price.toFixed(2), align: "RIGHT", width: 0.25 }
          ]
        );
      });

      printer
        .drawLine()
        .tableCustom(
          [
            { text: '', align: "LEFT", width: 0.1 },
            { text: "Subtotal", align: "LEFT", width: 0.65 },
            { text: data.total.toFixed(2), align: "RIGHT", width: 0.25 }
          ]
        )
        .tableCustom(
          [
            { text: '', align: "LEFT", width: 0.1 },
            { text: "Tax", align: "LEFT", width: 0.65 },
            { text: data.tax.toFixed(2), align: "RIGHT", width: 0.25 }
          ]
        )
        .tableCustom(
          [
            { text: '', align: "LEFT", width: 0.1 },
            { text: "TOTAL", align: "LEFT", width: 0.65 },
            { text: data.grandTotal.toFixed(2), align: "RIGHT", width: 0.25 }
          ]
        )
        .feed(2)
        .cut()
        .close();
    });

    return 'Print job sent successfully';
  } catch (error) {
    console.error('Print error:', error);
    throw error;
  }
});
