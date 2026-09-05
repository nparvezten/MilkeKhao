import { Injectable } from '@angular/core';
import { Order, DeliveryMode } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class ThermalPrinterService {

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
