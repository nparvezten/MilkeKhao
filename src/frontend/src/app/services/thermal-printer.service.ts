import { Injectable, signal } from '@angular/core';
import { Order, DeliveryMode } from '../models/order.model';

// Standard POS Thermal Printer BLE Service & Characteristic UUIDs
const BLE_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS BLE Service
  'e7810a06-736b-4dc3-a15e-3809009773ea', // Sunmi & Portable POS BLE Service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455'  // ISSC Transmit Service
];

const BLE_WRITE_CHARACTERISTICS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  '49535343-8841-43f4-a8d4-ecbe34729bb3'
];

@Injectable({
  providedIn: 'root'
})
export class ThermalPrinterService {
  // Device connection state signals
  readonly isBluetoothConnected = signal<boolean>(false);
  readonly isUsbConnected = signal<boolean>(false);
  readonly connectedDeviceName = signal<string | null>(null);
  readonly autoPrintEnabled = signal<boolean>(false);
  readonly isPrinting = signal<boolean>(false);
  readonly lastError = signal<string | null>(null);

  private bluetoothDevice: any = null;
  private bluetoothCharacteristic: any = null;
  private usbDevice: any = null;
  private usbEndpointNumber: number = 1;

  constructor() {}

  /**
   * Connect to a Bluetooth ESC/POS Thermal Printer via Web Bluetooth API.
   */
  async connectBluetooth(): Promise<boolean> {
    this.lastError.set(null);
    if (!('bluetooth' in navigator)) {
      this.lastError.set('Web Bluetooth is not supported in this browser. Use Chrome/Edge over HTTPS.');
      return false;
    }

    try {
      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BLE_PRINTER_SERVICES
      });

      if (!device) return false;

      this.bluetoothDevice = device;
      const server = await device.gatt.connect();

      // Search for known thermal printer service
      let targetCharacteristic = null;
      for (const serviceUuid of BLE_PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          for (const charUuid of BLE_WRITE_CHARACTERISTICS) {
            try {
              const char = await service.getCharacteristic(charUuid);
              if (char) {
                targetCharacteristic = char;
                break;
              }
            } catch {
              continue;
            }
          }
          if (targetCharacteristic) break;
        } catch {
          continue;
        }
      }

      this.bluetoothCharacteristic = targetCharacteristic;
      this.connectedDeviceName.set(device.name || 'Bluetooth Thermal Printer');
      this.isBluetoothConnected.set(true);

      device.addEventListener('gattserverdisconnected', () => {
        this.isBluetoothConnected.set(false);
        this.connectedDeviceName.set(null);
        this.bluetoothCharacteristic = null;
      });

      return true;
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        this.lastError.set(`Bluetooth connection error: ${err.message}`);
      }
      return false;
    }
  }

  /**
   * Disconnect from Bluetooth Printer.
   */
  disconnectBluetooth(): void {
    if (this.bluetoothDevice && this.bluetoothDevice.gatt.connected) {
      this.bluetoothDevice.gatt.disconnect();
    }
    this.isBluetoothConnected.set(false);
    this.connectedDeviceName.set(null);
    this.bluetoothCharacteristic = null;
  }

  /**
   * Connect to a USB Thermal Printer via WebUSB API (Class 7 = Printer).
   */
  async connectUsb(): Promise<boolean> {
    this.lastError.set(null);
    if (!('usb' in navigator)) {
      this.lastError.set('WebUSB is not supported in this browser. Use Chrome/Edge over HTTPS.');
      return false;
    }

    try {
      const nav = navigator as any;
      const device = await nav.usb.requestDevice({
        filters: [{ classCode: 7 }] // USB Printer Class
      });

      if (!device) return false;

      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      this.usbDevice = device;
      this.connectedDeviceName.set(device.productName || 'USB Thermal Printer');
      this.isUsbConnected.set(true);
      return true;
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        this.lastError.set(`USB connection error: ${err.message}`);
      }
      return false;
    }
  }

  /**
   * Disconnect from USB Printer.
   */
  async disconnectUsb(): Promise<void> {
    if (this.usbDevice) {
      try {
        await this.usbDevice.close();
      } catch {}
    }
    this.usbDevice = null;
    this.isUsbConnected.set(false);
    this.connectedDeviceName.set(null);
  }

  /**
   * Toggle auto-printing of incoming orders.
   */
  toggleAutoPrint(): void {
    this.autoPrintEnabled.update(val => !val);
  }

  /**
   * Sends raw ESC/POS commands directly to physical hardware if connected,
   * or falls back to browser print dialog.
   */
  async printDirectly(order: Order, tenantName: string): Promise<boolean> {
    const rawBytes = this.generateEscPosBuffer(order, tenantName);

    // Direct Web Bluetooth transmission
    if (this.isBluetoothConnected() && this.bluetoothCharacteristic) {
      try {
        this.isPrinting.set(true);
        // Split into 100-byte chunks to fit BLE MTU limits
        const chunkSize = 100;
        for (let i = 0; i < rawBytes.length; i += chunkSize) {
          const chunk = rawBytes.slice(i, i + chunkSize);
          await this.bluetoothCharacteristic.writeValue(chunk);
        }
        return true;
      } catch (err: any) {
        this.lastError.set(`BLE print error: ${err.message}`);
      } finally {
        this.isPrinting.set(false);
      }
    }

    // Direct WebUSB transmission
    if (this.isUsbConnected() && this.usbDevice) {
      try {
        this.isPrinting.set(true);
        await this.usbDevice.transferOut(this.usbEndpointNumber, rawBytes);
        return true;
      } catch (err: any) {
        this.lastError.set(`USB print error: ${err.message}`);
      } finally {
        this.isPrinting.set(false);
      }
    }

    // Fallback: Browser print dialog popup
    this.printKotSlip(order, tenantName);
    return true;
  }

  /**
   * Generates a printable Kitchen Order Ticket (KOT) slip and triggers print.
   */
  printKotSlip(order: Order, tenantName: string): void {
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) {
      alert('Please allow popups to print Kitchen Order Tickets (KOT)');
      return;
    }

    const formattedTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const modeLabel = order.deliveryMode === DeliveryMode.Pickup ? '🛍️ PICKUP ORDER' : '🛵 DELIVERY ORDER';

    const itemsHtml = order.items.map(item => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 15px; font-weight: bold;">
        <span>${item.quantity}x ${item.menuItemName}</span>
        <span>₹${(item.unitPrice * item.quantity).toFixed(2)}</span>
      </div>
    `).join('');

    const slipHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>KOT #${order.id}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 72mm;
            margin: 0 auto;
            padding: 10px 4px;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .double-divider { border-top: 2px solid #000; margin: 8px 0; }
          .kot-title { font-size: 18px; font-weight: 900; letter-spacing: 1px; }
          .order-no { font-size: 24px; font-weight: 900; margin: 4px 0; }
          .info-row { display: flex; justify-content: space-between; font-size: 12px; }
          .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 6px; }
          .footer { font-size: 11px; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="kot-title">*** KITCHEN ORDER TICKET ***</div>
          <div style="font-size: 13px; font-weight: bold; margin-top: 2px;">${tenantName}</div>
          <div class="order-no">#${order.id}</div>
          <div class="bold" style="font-size: 14px;">${modeLabel}</div>
        </div>

        <div class="divider"></div>
        <div class="info-row">
          <span>Date: ${formattedDate}</span>
          <span>Time: ${formattedTime}</span>
        </div>
        ${order.deliveryAddress ? `
          <div class="info-row" style="margin-top: 4px;">
            <span>Addr: ${order.deliveryAddress.street}, ${order.deliveryAddress.city}</span>
          </div>
        ` : ''}

        <div class="double-divider"></div>
        <div style="font-weight: bold; font-size: 13px; margin-bottom: 6px;">ITEMS ORDERED:</div>
        ${itemsHtml}

        <div class="double-divider"></div>
        <div class="total-row">
          <span>TOTAL ESTIMATE</span>
          <span>₹${order.totalAmount.toFixed(2)}</span>
        </div>

        <div class="divider"></div>
        <div class="center footer">
          <div>Powered by MilkeKhao Kitchen OS</div>
          <div>-- CUT HERE --</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 750);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(slipHtml);
    printWindow.document.close();
  }

  /**
   * Generates ESC/POS standard binary byte commands for direct Bluetooth/USB thermal printer output.
   */
  generateEscPosBuffer(order: Order, tenantName: string): Uint8Array {
    const encoder = new TextEncoder();
    const chunks: number[] = [];

    // ESC @ (Initialize printer)
    chunks.push(0x1B, 0x40);

    // Center Align (ESC a 1)
    chunks.push(0x1B, 0x61, 0x01);

    // Double Height & Width (GS ! 0x11)
    chunks.push(0x1D, 0x21, 0x11);
    chunks.push(...Array.from(encoder.encode(`KOT #${order.id}\n`)));

    // Normal Text (GS ! 0x00)
    chunks.push(0x1D, 0x21, 0x00);
    chunks.push(...Array.from(encoder.encode(`${tenantName}\n--------------------------------\n`)));

    // Left Align (ESC a 0)
    chunks.push(0x1B, 0x61, 0x00);
    for (const item of order.items) {
      chunks.push(...Array.from(encoder.encode(`${item.quantity}x ${item.menuItemName} - Rs.${item.unitPrice * item.quantity}\n`)));
    }

    chunks.push(...Array.from(encoder.encode(`--------------------------------\n`)));
    chunks.push(...Array.from(encoder.encode(`TOTAL: Rs.${order.totalAmount.toFixed(2)}\n\n`)));

    // Full Paper Cut (GS V 0x41 0x00)
    chunks.push(0x1D, 0x56, 0x41, 0x00);

    return new Uint8Array(chunks);
  }
}
