export type CheckoutSession = {
  id: string;
  url: string;
};

export type CreateCheckoutInput = {
  orderId: number;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
};

export interface PaymentProvider {
  createCheckoutSession(
    input: CreateCheckoutInput
  ): Promise<CheckoutSession>;
}