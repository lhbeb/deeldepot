import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderPaypalStatus } from '@/lib/supabase/orders';
import { sendPaypalPaymentSuccessEmail } from '@/lib/email/sender';
import { getPaypalDirectConfig } from '@/lib/supabase/payment-settings';

export const dynamic = 'force-dynamic';

const PAYPAL_VERIFY_URL =
  process.env.PAYPAL_ENV === 'sandbox'
    ? 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr'
    : 'https://ipnpb.paypal.com/cgi-bin/webscr';

function parseFullOrderData(raw: unknown): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === 'object') return raw as Record<string, any>;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, any>;
    } catch {
      return {};
    }
  }
  return {};
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    if (!rawBody) {
      return new NextResponse('Missing IPN payload', { status: 400 });
    }

    const verificationPayload = `cmd=_notify-validate&${rawBody}`;
    const verifyResponse = await fetch(PAYPAL_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'DeelDepot-IPN-Verification',
      },
      body: verificationPayload,
    });

    const verificationText = (await verifyResponse.text()).trim();

    if (!verifyResponse.ok || verificationText !== 'VERIFIED') {
      console.error('❌ [PayPal IPN] Verification failed:', {
        status: verifyResponse.status,
        body: verificationText,
      });
      return new NextResponse('Invalid IPN', { status: 400 });
    }

    const ipn = Object.fromEntries(new URLSearchParams(rawBody).entries());
    const orderId = ipn.custom || ipn.invoice || '';
    const paymentStatus = ipn.payment_status || '';

    if (!orderId) {
      console.warn('⚠️ [PayPal IPN] Missing custom/invoice order ID');
      return new NextResponse('OK', { status: 200 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      console.error('❌ [PayPal IPN] Order not found:', orderId);
      return new NextResponse('OK', { status: 200 });
    }

    const paypalConfig = await getPaypalDirectConfig();
    const configuredPayeeEmail = paypalConfig.payeeEmail?.trim().toLowerCase();
    const receiverEmail = (ipn.receiver_email || ipn.business || '').trim().toLowerCase();

    if (configuredPayeeEmail && receiverEmail && configuredPayeeEmail !== receiverEmail) {
      console.error('❌ [PayPal IPN] Receiver email mismatch:', {
        configuredPayeeEmail,
        receiverEmail,
        orderId,
      });
      return new NextResponse('Receiver mismatch', { status: 400 });
    }

    if (paymentStatus !== 'Completed') {
      console.log(`ℹ️ [PayPal IPN] Ignoring non-completed payment status "${paymentStatus}" for order ${orderId}`);
      return new NextResponse('OK', { status: 200 });
    }

    const existingFullOrderData = parseFullOrderData(order.full_order_data);
    if (existingFullOrderData.paypalPaymentNotificationSentAt) {
      console.log(`ℹ️ [PayPal IPN] Order ${orderId} already has a PayPal payment notification marker, skipping duplicate email.`);
      return new NextResponse('OK', { status: 200 });
    }

    const statusUpdated = await updateOrderPaypalStatus(orderId, { status: 'paid' });
    if (!statusUpdated) {
      console.error('❌ [PayPal IPN] Failed to update order status:', orderId);
      return new NextResponse('Failed to update order', { status: 500 });
    }

    const emailResult = await sendPaypalPaymentSuccessEmail(order, {
      txnId: ipn.txn_id,
      paymentStatus,
      mcGross: ipn.mc_gross,
      mcCurrency: ipn.mc_currency,
      payerEmail: ipn.payer_email,
      receiverEmail: ipn.receiver_email || ipn.business,
      raw: ipn,
    });

    if (!emailResult.success) {
      console.error('❌ [PayPal IPN] Failed to send success email:', emailResult.error);
      return new NextResponse('Payment recorded but email failed', { status: 500 });
    }

    await updateOrderPaypalStatus(orderId, {
      status: 'paid',
      full_order_data: {
        ...existingFullOrderData,
        paypalIpn: {
          txnId: ipn.txn_id || null,
          paymentStatus,
          mcGross: ipn.mc_gross || null,
          mcCurrency: ipn.mc_currency || null,
          payerEmail: ipn.payer_email || null,
          receiverEmail: ipn.receiver_email || ipn.business || null,
          verifiedAt: new Date().toISOString(),
        },
        paypalPaymentNotificationSentAt: new Date().toISOString(),
      },
    });

    console.log(`✅ [PayPal IPN] Payment confirmed and email sent for order ${orderId}`);
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('❌ [PayPal IPN] Unexpected error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
