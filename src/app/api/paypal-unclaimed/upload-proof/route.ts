import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderPaypalStatus } from '@/lib/supabase/orders';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendPaypalUnclaimedProofEmail } from '@/lib/email/sender';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const orderId = String(formData.get('orderId') || '').trim();
    const payerEmail = String(formData.get('payerEmail') || '').trim();
    const payeeEmail = String(formData.get('payeeEmail') || '').trim();
    const amount = String(formData.get('amount') || '').trim();
    const currency = String(formData.get('currency') || 'USD').trim();

    if (!file) {
      return NextResponse.json({ error: 'No proof file provided.' }, { status: 400 });
    }

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order reference.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Proof file exceeds 10MB.' }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const allowedFlows = ['paypal-unclaimed', 'paypal-direct'];
    if (!allowedFlows.includes(order.checkout_flow)) {
      console.error('❌ [PayPal Unclaimed Proof] Invalid checkout_flow:', order.checkout_flow, 'for order:', orderId);
      return NextResponse.json({ error: `This order does not support PayPal proof upload. Flow: ${order.checkout_flow}` }, { status: 400 });
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExtension = extension.replace(/[^a-z0-9]/gi, '') || 'jpg';
    const filePath = `payment-proofs/${orderId}/${Date.now()}-proof.${safeExtension}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ [PayPal Unclaimed Proof] Storage upload failed:', {
        message: uploadError.message,
        name: (uploadError as any).name,
        statusCode: (uploadError as any).statusCode,
        error: JSON.stringify(uploadError),
      });
      return NextResponse.json({ error: `Failed to store proof image: ${uploadError.message}` }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('product-images').getPublicUrl(uploadData.path);

    const existingFullOrderData =
      typeof order.full_order_data === 'string'
        ? JSON.parse(order.full_order_data)
        : (order.full_order_data || {});

    const fullOrderData = {
      ...existingFullOrderData,
      paypalUnclaimedProof: {
        uploadedAt: new Date().toISOString(),
        proofUrl: publicUrl,
        payerEmail,
        payeeEmail,
        amount,
        currency,
      },
    };

    const updated = await updateOrderPaypalStatus(orderId, {
      full_order_data: fullOrderData,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Failed to attach proof to order.' }, { status: 500 });
    }

    const emailResult = await sendPaypalUnclaimedProofEmail(order, {
      proofUrl: publicUrl,
      payeeEmail,
      payerEmail,
      amount,
      currency,
    });

    if (!emailResult.success) {
      console.error('❌ [PayPal Unclaimed Proof] Email notify failed:', emailResult.error);
    }

    return NextResponse.json({
      success: true,
      proofUrl: publicUrl,
    });
  } catch (error) {
    console.error('❌ [PayPal Unclaimed Proof] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to upload PayPal proof.' }, { status: 500 });
  }
}
