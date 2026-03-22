import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create nodemailer transporter
const createTransporter = (): nodemailer.Transporter => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error('Missing email environment variables. Please set EMAIL_USER and EMAIL_PASS');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    secure: false,
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    console.log('💳 [Stripe Payment Notification] Received request:', JSON.stringify(body, null, 2));

    const { paymentIntent, product, shippingData } = body;

    // Validate required data
    if (!paymentIntent || !product || !shippingData) {
      console.error('❌ [Stripe Payment Notification] Missing required data');
      return NextResponse.json(
        { error: 'Missing required data: paymentIntent, product, or shippingData' },
        { status: 400 }
      );
    }

    // Admin email address
    const adminEmail = process.env.ADMIN_EMAIL || 'contacthappydeel@gmail.com';
    const fromEmail = process.env.EMAIL_USER || 'contacthappydeel@gmail.com';

    // Create email content
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stripe Payment Successful</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                ✅ Stripe Payment Successful!
              </h1>
              <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 16px;">
                A customer has completed payment via Stripe
              </p>
            </td>
          </tr>

          <!-- Payment Details -->
          <tr>
            <td style="padding: 30px;">
              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                <h2 style="margin: 0 0 15px 0; color: #065f46; font-size: 18px;">
                  💳 Payment Information
                </h2>
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; width: 40%;">Payment ID:</td>
                    <td style="color: #111827; font-size: 14px; font-weight: 600;">${paymentIntent.id}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Amount:</td>
                    <td style="color: #059669; font-size: 16px; font-weight: bold;">$${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Status:</td>
                    <td>
                      <span style="background-color: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                        ${paymentIntent.status}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Payment Method:</td>
                    <td style="color: #111827; font-size: 14px; font-weight: 600;">Stripe</td>
                  </tr>
                </table>
              </div>

              <!-- Product Details -->
              <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                <h2 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">
                  📦 Product Details
                </h2>
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; width: 40%;">Product:</td>
                    <td style="color: #111827; font-size: 14px; font-weight: 600;">${product.title}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Price:</td>
                    <td style="color: #111827; font-size: 14px; font-weight: 600;">$${product.price.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Listed By:</td>
                    <td style="color: #111827; font-size: 14px; font-weight: 600;">${product.listedBy || product.listed_by || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Checkout Flow:</td>
                    <td style="color: #111827; font-size: 14px; font-weight: 600;">Stripe</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Product Slug:</td>
                    <td style="color: #111827; font-size: 14px;">${product.slug}</td>
                  </tr>
                </table>
              </div>

              <!-- Customer & Shipping Details -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                <h2 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px;">
                  📍 Shipping Information
                </h2>
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; width: 40%;">Customer Email:</td>
                    <td style="color: #111827; font-size: 14px; font-weight: 600;">
                      <a href="mailto:${shippingData.email}" style="color: #2563eb; text-decoration: none;">
                        ${shippingData.email}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; vertical-align: top;">Shipping Address:</td>
                    <td style="color: #111827; font-size: 14px; line-height: 1.6;">
                      ${shippingData.streetAddress}<br>
                      ${shippingData.city}, ${shippingData.state} ${shippingData.zipCode}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Action Required -->
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 4px;">
                <h2 style="margin: 0 0 10px 0; color: #991b1b; font-size: 16px;">
                  ⚠️ Action Required
                </h2>
                <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Please process this order and prepare it for shipping. The customer is expecting delivery within 5-8 business days.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
                This is an automated notification from DeelDepot
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                Payment processed at ${new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'full',
      timeStyle: 'long'
    })}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email to admin using nodemailer
    console.log('📧 [Stripe Payment Notification] Sending email to admin:', adminEmail);

    const transporter = createTransporter();
    const mailOptions = {
      from: fromEmail,
      to: adminEmail,
      subject: `💳 Stripe Payment Successful - ${product.title} - $${product.price.toFixed(2)}`,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    const duration = Date.now() - startTime;

    console.log('✅ [Stripe Payment Notification] Email sent successfully:', info.messageId);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      duration: `${duration}ms`,
      note: 'Admin notification sent successfully'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error as Error;
    const errorMessage = err.message || 'Unknown error';

    console.error(`❌ [Stripe Payment Notification] Error after ${duration}ms:`, errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send admin notification',
        details: errorMessage,
        duration: `${duration}ms`
      },
      { status: 500 }
    );
  }
}
