import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { TrackingService } from './tracking.service';

@Controller('track')
export class TrackingController {
  constructor(private trackingService: TrackingService) {}

  @Get(':companySlug/:orderNumber')
  async track(
    @Param('companySlug') companySlug: string,
    @Param('orderNumber') orderNumber: string,
    @Res() res: Response,
  ) {
    try {
      const data = await this.trackingService.trackOrder(companySlug, orderNumber);
      res.setHeader('Content-Type', 'text/html');
      res.send(this.renderPage(data));
    } catch {
      res.status(404).setHeader('Content-Type', 'text/html');
      res.send(this.renderNotFound());
    }
  }

  private renderPage(data: any): string {
    const tripSteps = ['ASSIGNED', 'IN_TRANSIT', 'DELIVERED'];
    const currentIndex = data.trip ? tripSteps.indexOf(data.trip.status) : -1;

    const stepHtml = tripSteps
      .map((step, i) => {
        const done = data.trip && i <= currentIndex;
        const label = { ASSIGNED: 'Dispatched', IN_TRANSIT: 'In Transit', DELIVERED: 'Delivered' }[step];
        return `
          <div class="step ${done ? 'done' : ''}">
            <div class="dot"></div>
            <div class="label">${label}</div>
          </div>`;
      })
      .join('<div class="connector"></div>');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Track ${data.orderNumber}</title>
  <style>
    body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; background: #f5f6fa; margin: 0; padding: 24px; color: #1a1a1a; }
    .card { max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 28px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    h1 { font-size: 18px; color: #555; margin: 0 0 4px; }
    h2 { font-size: 24px; margin: 0 0 20px; }
    .route { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 14px; color: #555; }
    .route div { flex: 1; }
    .route .dest { text-align: right; }
    .timeline { display: flex; align-items: center; margin: 32px 0; }
    .step { display: flex; flex-direction: column; align-items: center; flex: 1; }
    .dot { width: 16px; height: 16px; border-radius: 50%; background: #ddd; margin-bottom: 6px; }
    .step.done .dot { background: #2e7d32; }
    .label { font-size: 12px; color: #777; text-align: center; }
    .step.done .label { color: #2e7d32; font-weight: 600; }
    .connector { flex: 0.5; height: 2px; background: #ddd; margin-bottom: 22px; }
    .detail { font-size: 13px; color: #666; margin-top: 4px; }
    .detail strong { color: #333; }
    .footer { margin-top: 24px; font-size: 12px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${data.companyName}</h1>
    <h2>Order ${data.orderNumber}</h2>
    <div class="route">
      <div><strong>Pickup</strong><br>${data.pickupLocation}</div>
      <div class="dest"><strong>Destination</strong><br>${data.destinationLocation}</div>
    </div>
    ${
      data.trip
        ? `<div class="timeline">${stepHtml}</div>`
        : `<p class="detail">Awaiting dispatch — order status: <strong>${data.status}</strong></p>`
    }
    ${data.trip?.vehiclePlate ? `<p class="detail"><strong>Vehicle:</strong> ${data.trip.vehiclePlate}</p>` : ''}
    ${data.trip?.driverName ? `<p class="detail"><strong>Driver:</strong> ${data.trip.driverName}</p>` : ''}
    ${data.trip?.signedAt ? `<p class="detail"><strong>Delivered to:</strong> ${data.trip.signedByName ?? '—'} on ${new Date(data.trip.signedAt).toLocaleString()}</p>` : ''}
    <div class="footer">Tracking powered by Fleet Ops</div>
  </div>
</body>
</html>`;
  }

  private renderNotFound(): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Not found</title>
<style>body{font-family:sans-serif;text-align:center;padding:60px;color:#555;}</style>
</head>
<body><h2>Tracking link not found</h2><p>Please check the link and try again.</p></body>
</html>`;
  }
}
