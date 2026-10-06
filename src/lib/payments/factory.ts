import type { IPaymentGateway } from './gateway';
import type { Currency, PaymentGatewayName } from './types';
import { StripeAdapter } from './adapters/stripe';
import { MercadoPagoAdapter } from './adapters/mercado-pago';

export interface PaymentContext { country?: string; currency: Currency; preferredGateway?: PaymentGatewayName; }

export class PaymentFactory {
  static create(context:PaymentContext):IPaymentGateway {
    const selected=context.preferredGateway ?? ((context.country==='BR'||context.currency==='BRL')?'mercado_pago':'stripe');
    if(selected==='mercado_pago'){
      const token=process.env.MERCADO_PAGO_ACCESS_TOKEN,secret=process.env.MERCADO_PAGO_WEBHOOK_SECRET;
      if(!token||!secret)throw new Error('Mercado Pago is not configured');
      return new MercadoPagoAdapter(token,secret,process.env.PAYMENTS_RETURN_URL||'http://localhost:3000/billing');
    }
    const key=process.env.STRIPE_SECRET_KEY,secret=process.env.STRIPE_WEBHOOK_SECRET;
    if(!key||!secret)throw new Error('Stripe is not configured');
    return new StripeAdapter(key,secret);
  }
  static fromWebhook(request:Request):IPaymentGateway {
    if(request.headers.has('stripe-signature')) return this.create({currency:'USD',preferredGateway:'stripe'});
    if(request.headers.has('x-signature')&&request.headers.has('x-request-id')) return this.create({currency:'BRL',preferredGateway:'mercado_pago'});
    throw new Error('Unsupported payment gateway webhook');
  }
}
