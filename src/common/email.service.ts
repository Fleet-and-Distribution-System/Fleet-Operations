import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend = new Resend(process.env.RESEND_API_KEY);
  private logger = new Logger(EmailService.name);

  async sendDispatchNotification(params: {
    toEmail: string;
    companyName: string;
    companySlug: string;
    orderNumber: string;
    pickupLocation: string;
    destinationLocation: string;
  }) {
    const trackingUrl = `https://fleet-and-distribution-system-production.up.railway.app/track/${params.companySlug}/${params.orderNumber}`;
    try {
      await this.resend.emails.send({
        from: 'Fleet Ops <onboarding@resend.dev>',
        to: params.toEmail,
        subject: `Your order ${params.orderNumber} has been dispatched — ${params.companyName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>${params.companyName}</h2>
            <p>Your order <strong>${params.orderNumber}</strong> has been dispatched and is on its way.</p>
            <p><strong>Route:</strong> ${params.pickupLocation} → ${params.destinationLocation}</p>
            <p>
              <a href="${trackingUrl}" style="display:inline-block;background:#3949ab;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">
                Track your delivery
              </a>
            </p>
            <p style="font-size:12px;color:#999;">Or copy this link: ${trackingUrl}</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`Failed to send dispatch email to ${params.toEmail}: ${err}`);
    }
  }

  async sendDeliveryConfirmation(params: {
    toEmail: string;
    companyName: string;
    companySlug: string;
    orderNumber: string;
    destinationLocation: string;
  }) {
    const trackingUrl = `https://fleet-and-distribution-system-production.up.railway.app/track/${params.companySlug}/${params.orderNumber}`;
    try {
      await this.resend.emails.send({
        from: 'Fleet Ops <onboarding@resend.dev>',
        to: params.toEmail,
        subject: `Delivered: order ${params.orderNumber} � ${params.companyName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>${params.companyName}</h2>
            <p>Your order <strong>${params.orderNumber}</strong> has been delivered to <strong>${params.destinationLocation}</strong>.</p>
            <p>
              <a href="${trackingUrl}" style="display:inline-block;background:#2e7d32;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">
                View delivery details
              </a>
            </p>
            <p style="font-size:12px;color:#999;">Or copy this link: ${trackingUrl}</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`Failed to send delivery confirmation to ${params.toEmail}: ${err}`);
    }
  }
}
