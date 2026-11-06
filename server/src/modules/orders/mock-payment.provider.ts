import {
  PaymentProvider,
  CreateCheckoutInput,
  CheckoutSession,
} from "./payment-provider.js";

export class MockPaymentProvider implements PaymentProvider {
  async createCheckoutSession(
    input: CreateCheckoutInput
  ): Promise<CheckoutSession> {
    const sessionId = `mock_session_${input.orderId}_${Date.now()}`;

    return {
      id: sessionId,
      url: `${input.successUrl}?session_id=${sessionId}`,
    };
  }
}