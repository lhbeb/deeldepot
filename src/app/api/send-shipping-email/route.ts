import { NextRequest, NextResponse } from 'next/server';
import { saveOrder, getOrderById } from '@/lib/supabase/orders';
import { resolveBaseUrl } from '@/lib/url';

// This endpoint saves the order and attempts to send email with a 5-second timeout
// If email fails or times out, the order is still saved and email will retry automatically

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let orderId: string | null = null;
  
  try {
    const body = await request.json();
    console.log('📦 [API] Received request body:', JSON.stringify(body, null, 2));
    
    const { shippingData, product, sellerPayeeEmail } = body;

    // Validate required data
    if (!shippingData || !product) {
      console.error('❌ [API] Missing required data:', { hasShippingData: !!shippingData, hasProduct: !!product });
      return NextResponse.json(
        { error: 'Missing required data: shippingData or product' },
        { status: 400 }
      );
    }

    // Validate shipping data fields
    if (!shippingData.email || !shippingData.streetAddress || !shippingData.city || !shippingData.state || !shippingData.zipCode) {
      console.error('❌ [API] Missing required shipping fields:', {
        email: !!shippingData.email,
        streetAddress: !!shippingData.streetAddress,
        city: !!shippingData.city,
        state: !!shippingData.state,
        zipCode: !!shippingData.zipCode,
      });
      return NextResponse.json(
        { error: 'Missing required shipping data fields' },
        { status: 400 }
      );
    }

    // Validate product fields
    if (!product.slug || !product.title || product.price === undefined) {
      console.error('❌ [API] Missing required product fields:', {
        slug: !!product.slug,
        title: !!product.title,
        price: product.price !== undefined,
      });
      return NextResponse.json(
        { error: 'Missing required product fields' },
        { status: 400 }
      );
    }

    const originHeader = request.headers.get('origin');
    const refererHeader = request.headers.get('referer');
    const siteUrl = resolveBaseUrl([
      body?.siteUrl,
      shippingData?.siteUrl,
      originHeader,
      refererHeader,
    ]);

    // STEP 1: Save order to database FIRST (so we never lose the order)
    console.log('📦 [API] Starting order save process...');
    console.log('📦 [API] Product:', { slug: product.slug, title: product.title, price: product.price });
    console.log('📦 [API] Customer:', { email: shippingData.email });
    
    const orderResult = await saveOrder({
      productSlug: product.slug,
      productTitle: product.title,
      productPrice: product.price,
      customerName: shippingData.email, // Use email as name since fullName was removed
      customerEmail: shippingData.email,
      customerPhone: undefined, // Phone number was removed from form
      shippingAddress: shippingData.streetAddress,
      shippingCity: shippingData.city,
      shippingState: shippingData.state,
      shippingZip: shippingData.zipCode,
      checkoutFlow: product.checkoutFlow || product.checkout_flow,
      status: (product.checkoutFlow || product.checkout_flow) === 'stripe' ? 'pending_payment' : 'completed',
      paymentProvider: product.checkoutFlow || product.checkout_flow,
      fullOrderData: { shippingData, product, siteUrl },
      sellerPayeeEmail: sellerPayeeEmail || undefined,
    });

    console.log('📦 [API] Order save result:', { success: orderResult.success, orderId: orderResult.id, error: orderResult.error });

    if (!orderResult.success) {
      console.error('❌ [API] Failed to save order to database:', orderResult.error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to save order', 
          details: orderResult.error,
          note: 'Check server logs for detailed error information'
        },
        { status: 500 }
      );
    }

    if (!orderResult.id) {
      console.error('❌ [API] Order save returned success but no ID');
      return NextResponse.json(
        { 
          success: false,
          error: 'Order save returned no ID',
          details: 'Database insert succeeded but no ID was returned'
        },
        { status: 500 }
      );
    }

    orderId = orderResult.id;
    console.log('✅ [API] Order saved to database with ID:', orderId);

    // STEP 2: Try to send email with timeout (5 seconds max)
    // This ensures most emails are sent immediately without blocking checkout too long
    console.log('📧 [API] Attempting to send email (5 second timeout)...');
    
    try {
      // Race between email send and timeout
      const emailResult = await Promise.race([
        (async () => {
          const order = await getOrderById(orderId);
          if (!order) {
            console.error('❌ [API] Order not found for email sending');
            return { success: false, error: 'Order not found' };
          }
          
          const { sendOrderEmail } = await import('@/lib/email/sender');
          return await sendOrderEmail(order);
        })(),
        new Promise<{ success: boolean; error?: string }>((resolve) => 
          setTimeout(() => {
            console.log('⏱️ [API] Email send timed out after 5 seconds');
            resolve({ success: false, error: 'Timeout' });
          }, 5000)
        )
      ]);

      const duration = Date.now() - startTime;

      if (emailResult.success) {
        console.log('✅ [API] Email sent successfully');
        return NextResponse.json({ 
          success: true,
          orderId: orderId,
          emailSent: true,
          duration: `${duration}ms`,
          note: 'Order saved and email sent successfully.'
        });
      } else {
        console.log('⚠️ [API] Email failed, but order is saved. Will retry automatically.');
        return NextResponse.json({ 
          success: true,
          orderId: orderId,
          emailSent: false,
          duration: `${duration}ms`,
          note: 'Order saved. Email will be retried automatically.',
          emailError: emailResult.error
        });
      }
    } catch (emailError) {
      const duration = Date.now() - startTime;
      console.error('❌ [API] Error sending email:', emailError);
      
      // Order is saved, just email failed
      return NextResponse.json({ 
        success: true,
        orderId: orderId,
        emailSent: false,
        duration: `${duration}ms`,
        note: 'Order saved. Email will be retried automatically.'
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error as Error;
    const errorMessage = err.message || 'Unknown error';
    
    console.error(`❌ Error in checkout API after ${duration}ms:`, errorMessage);
    
    // If order was saved, still return success (email will retry later)
    if (orderId) {
      console.log(`Order ${orderId} saved. Email will be retried automatically.`);
      return NextResponse.json(
        { 
          success: true,
          orderId: orderId,
          duration: `${duration}ms`,
          note: 'Order saved. Email will be retried automatically.'
        },
        { status: 200 }
      );
    }
    
    // Order save failed - return error
    return NextResponse.json(
      { 
        error: 'Failed to process order',
        details: errorMessage,
        duration: `${duration}ms`
      },
      { status: 500 }
    );
  }
} 