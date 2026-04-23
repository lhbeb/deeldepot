"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, MapPin, Phone, Trash, ChevronDown, Mail, ChevronRight } from 'lucide-react';
import { getCartItem, clearCart } from '@/utils/cart';
import { preventScrollOnClick } from '@/utils/scrollUtils';
import type { CartItem } from '@/utils/cart';
import Image from 'next/image';
import type { Product } from '@/types/product';
import { debugLog, debugError } from '@/utils/debug';
import CheckoutNotifier from '@/components/CheckoutNotifier';
import KofiCheckout from '@/components/KofiCheckout';

import PaypalInvoiceConfirmation from '@/components/PaypalInvoiceConfirmation';
import PaypalDirectCheckout from '@/components/PaypalDirectCheckout';
import PaypalRedirectButton from '@/components/PaypalRedirectButton';


interface ShippingData {
  streetAddress: string;
  city: string;
  zipCode: string;
  state: string;
  email: string;
}

interface MobileCheckoutCTAProps {
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  label: string;
}

const MobileCheckoutCTA: React.FC<MobileCheckoutCTAProps> = ({
  onClick,
  disabled,
  isLoading,
  loadingLabel,
  label
}) => (
  <div className="lg:hidden sticky bottom-0 left-0 right-0 z-[100] bg-white border-t-2 border-gray-100 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))', paddingTop: '1rem' }}>
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={disabled}
      className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[#090A28] focus:ring-offset-2 text-lg sm:text-xl ${disabled
        ? 'bg-gray-400 cursor-not-allowed text-white'
        : 'bg-[#090A28] hover:bg-[#1c2070] text-white active:scale-[0.98]'
        }`}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-6 w-6 border-b-3 border-white mr-3"></div>
          <span className="text-white text-lg font-bold">{loadingLabel}</span>
        </>
      ) : (
        <span className="text-white text-lg sm:text-xl font-bold">{label}</span>
      )}
    </button>
  </div>
);

const CheckoutPage: React.FC = () => {
  const router = useRouter();
  const [cartItem, setCartItem] = useState<CartItem | null>(null);
  const [currentStep] = useState<'shipping' | 'payment'>('shipping');
  const [shippingData, setShippingData] = useState({
    streetAddress: '',
    city: '',
    zipCode: '',
    state: '',
    email: ''
  });
  const [stateSuggestions, setStateSuggestions] = useState<string[]>([]);
  const [showMobileOrderSummary, setShowMobileOrderSummary] = useState(false);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [stateSuggestionIndex, setStateSuggestionIndex] = useState(-1);
  const stateInputRef = useRef<HTMLInputElement>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectingProvider, setRedirectingProvider] = useState<'paypal' | 'external'>('external');
  const [showKofiCheckout, setShowKofiCheckout] = useState(false); // New state for Ko-fi iframe

  const [showPaypalConfirmation, setShowPaypalConfirmation] = useState(false);
  const [paypalConfirmationVariant, setPaypalConfirmationVariant] = useState<'invoice' | 'unclaimed'>('invoice');
  const [paypalConfirmationOrderId, setPaypalConfirmationOrderId] = useState<string | null>(null);
  const [showPaypalDirect, setShowPaypalDirect] = useState(false);
  const [paypalDirectOrderId, setPaypalDirectOrderId] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sellerName, setSellerName] = useState<string | null>(null);
  const [paypalDirectEmail, setPaypalDirectEmail] = useState(''); // Platform receiving email



  // Expanded country codes with country names (deduplicated)
  const countryCodes = [
    { code: '+1', country: 'United States' },
    { code: '+1', country: 'Canada' },
    { code: '+52', country: 'Mexico' },
    { code: '+55', country: 'Brazil' },
    { code: '+64', country: 'New Zealand' },
    { code: '+44', country: 'United Kingdom' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+39', country: 'Italy' },
    { code: '+34', country: 'Spain' },
    { code: '+31', country: 'Netherlands' },
    { code: '+46', country: 'Sweden' },
    { code: '+47', country: 'Norway' },
    { code: '+45', country: 'Denmark' },
    { code: '+358', country: 'Finland' },
    { code: '+41', country: 'Switzerland' },
    { code: '+43', country: 'Austria' },
    { code: '+32', country: 'Belgium' },
    { code: '+420', country: 'Czech Republic' },
    { code: '+353', country: 'Ireland' },
    { code: '+36', country: 'Hungary' },
    { code: '+48', country: 'Poland' },
    { code: '+351', country: 'Portugal' },
    { code: '+40', country: 'Romania' },
    { code: '+421', country: 'Slovakia' },
    { code: '+386', country: 'Slovenia' },
    { code: '+380', country: 'Ukraine' },
    { code: '+7', country: 'Russia' },
    { code: '+30', country: 'Greece' },
    { code: '+372', country: 'Estonia' },
    { code: '+298', country: 'Faroe Islands' },
    { code: '+350', country: 'Gibraltar' },
    { code: '+354', country: 'Iceland' },
    { code: '+371', country: 'Latvia' },
    { code: '+370', country: 'Lithuania' },
    { code: '+352', country: 'Luxembourg' },
    { code: '+356', country: 'Malta' },
    { code: '+381', country: 'Serbia' },
    { code: '+90', country: 'Turkey' },
    // ... add more as needed ...
  ];
  const selectedCountry = countryCodes[0];

  const usStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  const canadianProvinces = [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
    'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
    'Quebec', 'Saskatchewan', 'Yukon'
  ];

  const ukRegions = [
    'England', 'Scotland', 'Wales', 'Northern Ireland'
  ];

  const australianStates = [
    'New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia',
    'Tasmania', 'Australian Capital Territory', 'Northern Territory'
  ];

  const netherlandsProvinces = [
    'Drenthe', 'Flevoland', 'Friesland', 'Gelderland', 'Groningen', 'Limburg',
    'North Brabant', 'North Holland', 'Overijssel', 'South Holland', 'Utrecht', 'Zeeland'
  ];

  // Mapping state variables
  const regionData = {
    '+1': [...usStates, ...canadianProvinces], // Combined for brevity or use separate logic if you have separate country selectors
    '+44': ukRegions, // UK
    '+31': netherlandsProvinces, // Netherlands
    '+61': australianStates, // Australia
  };

  const allRegions = [...usStates, ...canadianProvinces, ...ukRegions, ...australianStates, ...netherlandsProvinces];

  useEffect(() => {
    debugLog('CheckoutPage: useEffect', 'Mounting checkout page', 'log');

    // Wrap cart access in ClientOnly logic
    if (typeof window !== 'undefined') {
      try {
        debugLog('CheckoutPage: useEffect', 'Getting cart item from localStorage', 'log');
        const item = getCartItem();

        if (!item) {
          debugLog('CheckoutPage: useEffect', 'No cart item found, redirecting to home', 'warn');
          router.push('/');
          return;
        }

        // Check if product is sold out
        if (item.product && item.product.inStock === false) {
          debugLog('CheckoutPage: useEffect', 'Product is sold out, redirecting to product page', 'warn');
          alert('This product is currently sold out and cannot be purchased.');
          clearCart();
          router.push(`/products/${item.product.slug}`);
          return;
        }

        debugLog('CheckoutPage: useEffect', { productId: item.product?.id, productTitle: item.product?.title }, 'log');
        setCartItem(item);
        debugLog('CheckoutPage: useEffect', 'Cart item set successfully', 'log');

        if (item.product && item.product.sellerId) {
          fetch(`/api/sellers/id/${item.product.sellerId}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data) {
                setSellerName(data.name || data.username || null);
              }
            })
            .catch(err => console.error('Error fetching seller name', err));
        }

        // Pre-fetch PayPal Direct Checkout settings so it's ready immediately when button is clicked
        if (item.product?.checkoutFlow === 'paypal-direct') {
          fetch(`/api/payment-settings/paypal-direct?t=${Date.now()}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data?.payeeEmail) setPaypalDirectEmail(data.payeeEmail);
            })
            .catch(err => console.error('Error fetching PayPal Direct email', err));
        }
      } catch (error) {
        debugError('CheckoutPage: useEffect - Error loading cart', error);
        router.push('/');
      }
    }
  }, [router]);

  useEffect(() => {
    if (isRedirecting) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [isRedirecting]);

  // Close dropdown on outside click
  // Removed country dropdown effect since phone number field was removed

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Validate zip code - only allow alphanumeric characters (for international support)
    if (name === 'zipCode') {
      // Remove any non-alphanumeric characters except spaces and hyphens
      const cleanedValue = value.replace(/[^a-zA-Z0-9\s-]/g, '');
      setShippingData(prev => ({ ...prev, [name]: cleanedValue }));
    } else if (name === 'email') {
      // Clear email error when user types
      setEmailError('');
      setShippingData(prev => ({ ...prev, [name]: value }));
    } else {
      setShippingData(prev => ({ ...prev, [name]: value }));
    }

    // Filter state suggestions based on input and selected country
    if (name === 'state') {
      if (value.trim() === '') {
        setStateSuggestions([]);
        setShowStateSuggestions(false);
        setStateSuggestionIndex(-1);
        return;
      }

      const regions = allRegions;
      const filtered = regions.filter(region =>
        region.toLowerCase().includes(value.toLowerCase())
      );
      setStateSuggestions(filtered.slice(0, 7));
      setShowStateSuggestions(true);
    }
  };

  const sendShippingEmail = async (shippingData: ShippingData, product: Product, retryCount: number = 0): Promise<string | null> => {
    const maxRetries = 1; // Server already retries 3 times, so only 1 client retry
    console.log(`📧 [sendShippingEmail] Starting (attempt ${retryCount + 1})`);
    debugLog('sendShippingEmail', `Calling API... (attempt ${retryCount + 1})`, 'log');

    let timeoutId: NodeJS.Timeout | null = null;

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const requestBody = {
        shippingData,
        product: {
          title: product.title,
          price: product.price,
          slug: product.slug,
          images: product.images,
          checkoutFlow: product.checkoutFlow
        },
      };

      console.log('📧 [sendShippingEmail] Request body:', JSON.stringify(requestBody, null, 2));
      console.log('📧 [sendShippingEmail] Making POST request to /api/send-shipping-email');

      const response = await fetch('/api/send-shipping-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      console.log('📧 [sendShippingEmail] Response received:', { status: response.status, ok: response.ok, statusText: response.statusText });

      if (timeoutId) clearTimeout(timeoutId);
      debugLog('sendShippingEmail', { status: response.status, ok: response.ok }, 'log');

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const errorText = await response.text();
          errorData = { error: errorText };
        }

        debugError('sendShippingEmail: API error', new Error(`Status: ${response.status}, Details: ${errorData.details || errorData.error}`));

        // Retry on network errors or 5xx errors
        if (retryCount < maxRetries && (response.status >= 500 || response.status === 0)) {
          console.log(`Retrying email send (attempt ${retryCount + 2})...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          return sendShippingEmail(shippingData, product, retryCount + 1);
        }

        throw new Error(errorData.details || errorData.error || 'Failed to send email');
      }

      const result = await response.json();

      if (result.success && result.orderId) {
        debugLog('sendShippingEmail', `Order saved (ID: ${result.orderId}). Email: ${result.messageId ? 'sent' : 'failed'} (${result.duration})`, 'log');
        if (result.error) {
          console.warn('Email failed but order saved:', result.note);
        }
        return result.orderId;
      }

      debugLog('sendShippingEmail', `Success: ${result.messageId} (${result.duration})`, 'log');
      return result.orderId || null;
    } catch (error: any) {
      if (timeoutId) clearTimeout(timeoutId);

      // Check if it's an abort (timeout)
      if (error.name === 'AbortError') {
        console.error('Email send timeout after 30 seconds');
        debugError('sendShippingEmail: Timeout', error);

        // Retry on timeout
        if (retryCount < maxRetries) {
          console.log(`Retrying email send after timeout (attempt ${retryCount + 2})...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return sendShippingEmail(shippingData, product, retryCount + 1);
        }
      } else {
        console.error('Error sending email:', error);
        debugError('sendShippingEmail: Error', error);
      }

      return null;
    }
  };

  const handleStateSelect = (state: string) => {
    setShippingData(prev => ({ ...prev, state }));
    setShowStateSuggestions(false);
    setStateSuggestions([]);
  };

  const isFormValid = Boolean(
    cartItem?.product &&
    cartItem.product.inStock !== false &&
    shippingData.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingData.email) &&
    shippingData.zipCode &&
    shippingData.zipCode.trim().length >= 3 &&
    shippingData.streetAddress &&
    shippingData.city &&
    shippingData.state
  );


  /**
   * Called by the PayPal Redirect button.
   * Runs validation AND saves the order intent to the DB before redirecting.
   */
  const handlePaypalBeforePayment = async (): Promise<{ ok: boolean; payeeEmail: string; amount: number; currency: string; description: string }> => {
    const fail = { ok: false, payeeEmail: '', amount: 0, currency: 'USD', description: '' };

    if (!cartItem?.product) return fail;
    const product = cartItem.product;
    if (product.inStock === false) {
      alert('Sorry, this item is no longer in stock.');
      return fail;
    }

    if (!isFormValid) {
      alert('Please complete all required shipping fields before continuing to payment.');
      return fail;
    }

    try {
      // Pre-compute amounts and emails before async operations
      const shippingCost = 0; // Free shipping standard
      const amount = parseFloat((product.price + shippingCost).toFixed(2));

      // Platform email = where buyer pays (your verified PayPal Business account)
      const platformEmail = paypalDirectEmail || '';
      const sellerEmail = product.payeeEmail || '';

      // Guard: If no platform email is configured, fail clearly
      if (!sellerEmail && !platformEmail) {
        alert('Payment is not configured for this product. Please contact support.');
        return fail;
      }

      // The recipient for payment: platform account if configured, otherwise the product payee email
      const paymentTarget = platformEmail || sellerEmail;

      // 1. Save the order / notify owner before they leave for PayPal
      console.log('🚀 [PayPal] Saving order intent... recipient:', paymentTarget);
      setIsSendingEmail(true);

      const orderId = await sendShippingEmail({ ...shippingData }, product, 0);
      setIsSendingEmail(false);

      if (!orderId) {
        throw new Error('Failed to save order intent');
      }

      console.log('💳 [PayPal] Buyer pays:', paymentTarget, '| Amount:', amount, product.currency || 'USD');

      // Clear the cart so the customer can't double-submit
      clearCart();

      return {
        ok: true,
        payeeEmail: paymentTarget,
        amount,
        currency: product.currency || 'USD',
        description: product.title
      };
    } catch (err) {
      debugError('CheckoutPage: handlePaypalBeforePayment', err);
      setIsSendingEmail(false);
      alert('Failed to initialize checkout. Please check your connection and try again.');
      return fail;
    }
  };

  const handleContinueToCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 [Checkout] Form submitted');

    // Get product from cartItem
    if (!cartItem || !cartItem.product) {
      console.error('❌ [Checkout] No cart item or product found!', { cartItem });
      alert('Product information is missing. Please go back and try again.');
      return;
    }

    const product = cartItem.product;
    console.log('📦 [Checkout] Product from cart:', { slug: product.slug, title: product.title, price: product.price });

    // Check if product is sold out
    if (product.inStock === false) {
      console.error('❌ [Checkout] Product is sold out');
      alert('This product is currently sold out and cannot be purchased.');
      clearCart();
      router.push(`/products/${product.slug}`);
      return;
    }

    // Validate email format
    if (!shippingData.email) {
      console.error('❌ [Checkout] Email is required');
      setEmailError('Email address is required');
      return;
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingData.email)) {
      console.error('❌ [Checkout] Invalid email format');
      setEmailError('Please enter a valid email address (e.g., example@email.com)');
      return;
    }

    // Validate zip code (must have at least 3 characters)
    if (!shippingData.zipCode || shippingData.zipCode.trim().length < 3) {
      console.error('❌ [Checkout] Invalid zip code');
      alert('Please enter a valid zip/postal code (at least 3 characters)');
      return;
    }

    // Check if all required fields are filled
    const requiredFields = ['streetAddress', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(field => !shippingData[field as keyof typeof shippingData]);

    if (missingFields.length > 0) {
      console.error('❌ [Checkout] Missing required fields:', missingFields);
      alert('Please fill in all required fields');
      return;
    }

    console.log('✅ [Checkout] Validation passed');
    console.log('📦 [Checkout] Product:', { slug: product.slug, title: product.title, price: product.price });
    console.log('👤 [Checkout] Shipping data:', { email: shippingData.email });

    setIsSendingEmail(true);

    try {
      // Send shipping information to email
      const shippingDataToSend = {
        ...shippingData
      };

      console.log('📧 [Checkout] Calling sendShippingEmail...');
      const orderId = await sendShippingEmail(shippingDataToSend, product);
      console.log('📧 [Checkout] sendShippingEmail returned orderId:', orderId);

      if (!orderId) {
        console.error('❌ [Checkout] Order save failed');
        alert('Failed to save order information. Please try again.');
        setIsSendingEmail(false);
        return;
      }

      console.log('✅ [Checkout] Order saved successfully');
      setIsSendingEmail(false);


      // Determine checkout flow based on product.checkoutFlow
      console.log('🔍 [Checkout] Product data:', {
        slug: product.slug,
        title: product.title,
        checkoutFlow: product.checkoutFlow,
        checkoutLink: product.checkoutLink
      });

      const checkoutFlow = product.checkoutFlow || 'buymeacoffee'; // Default to buymeacoffee
      console.log('🔍 [Checkout] Detected checkout flow:', checkoutFlow);

      if (checkoutFlow === 'kofi') {
        // Ko-fi: Show iframe instead of redirecting
        console.log('🎨 [Checkout] Ko-fi flow: Showing iframe');
        setShowKofiCheckout(true);
      } else if (checkoutFlow === 'stripe') {
        setIsRedirecting(true);
        console.log('💳 [Checkout] Stripe flow: Creating Checkout Session');
        try {
          const res = await fetch('/api/create-stripe-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, product, shippingData }),
          });
          const data = await res.json();
          if (data.url) {
            window.location.href = data.url;
          } else {
            console.error('❌ [Checkout] Missing URL in Stripe response:', data);
            alert('Failed to initialize payment. Please try again.');
            setIsRedirecting(false);
          }
        } catch (e) {
          console.error('❌ [Checkout] Failed connecting to Stripe:', e);
          alert('Could not connect to payment provider.');
          setIsRedirecting(false);
        }
      } else if (checkoutFlow === 'paypal-invoice' || checkoutFlow === 'paypal-unclaimed') {
        // PayPal Invoice / Unclaimed: Show the same on-site confirmation flow for now
        console.log('📧 [Checkout] PayPal Invoice/Unclaimed flow: Showing confirmation screen');
        setPaypalConfirmationVariant(checkoutFlow === 'paypal-unclaimed' ? 'unclaimed' : 'invoice');
        setPaypalConfirmationOrderId(orderId);
        setShowPaypalConfirmation(true);
      } else if (checkoutFlow === 'paypal-direct') {
        // PayPal Direct Checkout: open redirect modal
        console.log('💳 [Checkout] PayPal Direct flow: Opening PayPal redirect modal');
        setPaypalDirectOrderId(orderId);
        setShowPaypalDirect(true);
      } else {
        // BuyMeACoffee or External: Redirect to external link
        console.log('🔄 [Checkout] External flow: Redirecting to', product.checkoutLink);
        setIsRedirecting(true);
        window.scrollTo({ top: 0 });
        setTimeout(() => {
          console.log('🔄 [Checkout] Redirecting to checkout link:', product.checkoutLink);
          window.location.href = product.checkoutLink;
        }, 4000); // 4 seconds
      }

    } catch (error) {
      console.error('❌ [Checkout] Error during checkout:', error);
      if (error instanceof Error) {
        console.error('❌ [Checkout] Error message:', error.message);
        console.error('❌ [Checkout] Error stack:', error.stack);
      }
      alert('An error occurred during checkout. Please try again.');
      setIsSendingEmail(false);
    }
  };

  const handleClearCart = () => {
    preventScrollOnClick(() => {
      if (typeof window !== 'undefined') {
        clearCart();
        window.scrollTo({ top: 0 });
      }
      router.push('/');
    }, true);
  };

  if (!cartItem) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#262626] mb-4">Your Cart Is Empty</h1>
            <Link href="/" className="text-[#090A28] hover:text-[#1c2070]">
              Continue Shopping
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Ko-fi checkout flow - show iframe
  if (showKofiCheckout) {
    const { product } = cartItem;
    return (
      <KofiCheckout
        checkoutLink={product.checkoutLink}
        shippingData={shippingData}
        onClose={() => {
          setShowKofiCheckout(false);
          clearCart();
          router.push('/');
        }}
      />
    );
  }

  // PayPal Invoice flow - show on-site confirmation
  if (showPaypalConfirmation) {
    const { product } = cartItem;
    return (
      <PaypalInvoiceConfirmation
        product={{
          title: product.title,
          price: product.price,
          currency: product.currency,
          images: product.images,
        }}
        shippingData={shippingData}
        sellerName={sellerName}
        orderId={paypalConfirmationOrderId}
        variant={paypalConfirmationVariant}
        onClose={() => {
          setShowPaypalConfirmation(false);
          setPaypalConfirmationOrderId(null);
          clearCart();
          router.push('/');
        }}
      />
    );
  }




  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-[#e0e7ff] via-[#f8fafc] to-[#f0fdfa] px-2 pt-4 min-h-0 sm:pt-16 sm:pb-16">
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-10 border border-gray-100 flex flex-col items-center max-w-md w-full mx-auto transition-all duration-500">
          {/* Blue Verification Icon at Top */}
          <div className="flex flex-col items-center mb-4">
            <span className="inline-flex items-center justify-center bg-blue-100 rounded-full p-2 mb-2">
              <Check className="h-7 w-7 text-[#090A28]" />
            </span>
          </div>
          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#262626] tracking-tight mb-2 text-center">Address Confirmed</h2>
          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-700 mb-4 text-center">Your Order Will Be Shipped To The Address Below:</p>
          {/* Address Card */}
          <div className="w-full max-w-xs bg-blue-50 border border-blue-100 rounded-2xl shadow p-5 mb-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-5 w-5 text-[#090A28]" />
              <span className="font-semibold text-[#090A28] text-base">Confirmed Delivery Address</span>
            </div>
            <div className="text-gray-800 text-base whitespace-pre-line leading-relaxed">
              {shippingData.streetAddress && <div>{shippingData.streetAddress}</div>}
              {shippingData.city && <div>{shippingData.city}</div>}
              {shippingData.state || shippingData.zipCode ? (
                <div>{shippingData.state}{shippingData.state && shippingData.zipCode ? ', ' : ''}{shippingData.zipCode}</div>
              ) : null}
            </div>
            {shippingData.email && (
              <div className="flex items-center gap-2 mt-2">
                <Mail className="h-5 w-5 text-[#090A28]" />
                <span className="text-[#090A28] text-base">{shippingData.email}</span>
              </div>
            )}
          </div>
          {/* SSL Notice */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
            <span className="inline-flex items-center justify-center bg-gray-100 rounded-full p-1">
              <svg className="h-4 w-4 text-[#090A28]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="12" x="3" y="8" rx="2" /><path d="M7 8V6a5 5 0 0 1 10 0v2" /></svg>
            </span>
            <span>Your information is secured with SSL.</span>
          </div>
          {/* Loading Spinner and Message */}
          <div className="flex flex-col items-center gap-2 mt-2 mb-6">
            <div className="w-10 h-10 border-4 border-[#090A28]/30 border-t-[#090A28] rounded-full animate-spin mb-2"></div>
                      <span className="text-base text-gray-700 font-medium">
              {redirectingProvider === 'paypal'
                ? 'Connecting to PayPal…'
                : 'Finalizing Your Checkout. This Won\'t Take Long…'
              }
            </span>
          </div>
          {/* Trust Icon Row: Only Secure Checkout */}
        </div>
      </div>
    );
  }

  // PayPal Direct redirect flow
  if (showPaypalDirect) {
    const { product } = cartItem;
    return (
      <PaypalDirectCheckout
        product={{
          title: product.title,
          price: product.price,
          currency: product.currency,
          payeeEmail: product.payeeEmail || '',
        }}
        shippingData={shippingData}
        preloadedEmail={paypalDirectEmail || null}
        orderId={paypalDirectOrderId || undefined}
        onClose={() => {
          setShowPaypalDirect(false);
          setPaypalDirectOrderId(null);
          clearCart();
          router.push('/');
        }}
      />
    );
  }

  const { product } = cartItem;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-32 lg:pb-4">
      <CheckoutNotifier />
      <main className="flex-grow py-4">
        <div className="container mx-auto px-4">
          <Link href={`/products/${product.slug}`} className="inline-flex items-center text-[#090A28] hover:text-[#1c2070] mb-4 text-sm">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Back To Product</span>
            <span className="sm:hidden">Back</span>
          </Link>

          {currentStep === 'shipping' ? (
            <div>
              {/* Mobile: Collapsible Order Summary Header */}
              <div className="lg:hidden mb-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <button
                    onClick={() => setShowMobileOrderSummary(!showMobileOrderSummary)}
                    className="w-full p-4 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-2xl"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <div className="w-full h-full bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden">
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            width={56}
                            height={56}
                            className="w-14 h-14 object-cover rounded-lg transition-transform duration-200 hover:scale-105"
                          />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-white text-xs font-bold">1</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#262626] text-base line-clamp-1 mb-1">{product.title}</h3>
                        <p className="text-[#090A28] font-bold text-xl mb-1">${product.price.toFixed(2)}</p>
                        {sellerName && (
                          <p className="text-sm text-gray-600 mb-1 truncate">
                            Sold by: <span className="font-medium text-[#262626]">{sellerName}</span>
                          </p>
                        )}
                        <p className="text-gray-400 text-xs leading-tight">Tap To View/Hide Summary</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      <ChevronDown
                        className={`h-6 w-6 text-gray-600 transition-transform duration-200 ${showMobileOrderSummary ? 'rotate-180' : ''
                          }`}
                      />
                    </div>
                  </button>

                  {showMobileOrderSummary && (
                    <div className="px-4 pb-4 border-t border-gray-100 mt-4 pt-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Quantity</span>
                          <span className="font-medium">{cartItem.quantity}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">${product.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Shipping</span>
                          <span className="font-medium text-[#090A28]">Free</span>
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-base font-semibold text-[#262626]">Total</span>
                            <span className="text-lg font-bold text-[#090A28]">${product.price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop: Centered Container with Left Form and Right Summary */}
              <div className="hidden lg:block">
                <div className="max-w-7xl mx-auto">
                  <div className="flex gap-4 lg:gap-8 items-start">
                    {/* Left: Shipping Form */}
                    <div className="flex-1">
                      <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 border border-gray-100 flex justify-center">
                        <div className="w-full max-w-[750px]">
                          <h2 className="text-xl lg:text-2xl font-bold text-[#262626] mb-6 lg:mb-8 text-left">Delivery Address</h2>

                          <form onSubmit={handleContinueToCheckout} className="space-y-6">
                          {/* Street Address */}
                          <div>
                            <label htmlFor="streetAddress" className="block text-sm font-semibold text-gray-700 mb-3">
                              Street Address *
                            </label>
                            <input
                              type="text"
                              id="streetAddress"
                              name="streetAddress"
                              value={shippingData.streetAddress}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] transition-all duration-300"
                              placeholder="Enter your street address"
                              autoComplete="street-address"
                            />
                          </div>

                          {/* City, State, and Zip Code Row */}
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-3">
                                City *
                              </label>
                              <input
                                type="text"
                                id="city"
                                name="city"
                                value={shippingData.city}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] transition-all duration-300"
                                placeholder="Enter your city"
                                autoComplete="address-level2"
                              />
                            </div>
                            <div className="relative">
                              <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-3">
                                State/Province *
                              </label>
                              <input
                                ref={stateInputRef}
                                type="text"
                                id="state"
                                name="state"
                                value={shippingData.state}
                                onChange={handleInputChange}
                                onKeyDown={(e) => {
                                  if (showStateSuggestions) {
                                    if (e.key === 'ArrowDown') {
                                      e.preventDefault();
                                      setStateSuggestionIndex((prev) =>
                                        prev < stateSuggestions.length - 1 ? prev + 1 : 0
                                      );
                                    } else if (e.key === 'ArrowUp') {
                                      e.preventDefault();
                                      setStateSuggestionIndex((prev) =>
                                        prev > 0 ? prev - 1 : stateSuggestions.length - 1
                                      );
                                    } else if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (stateSuggestionIndex >= 0 && stateSuggestionIndex < stateSuggestions.length) {
                                        handleStateSelect(stateSuggestions[stateSuggestionIndex]);
                                      }
                                    } else if (e.key === 'Escape') {
                                      setShowStateSuggestions(false);
                                      setStateSuggestionIndex(-1);
                                    }
                                  }
                                }}
                                required
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] transition-all duration-300"
                                placeholder="Enter state/province"
                                autoComplete="address-level1"
                              />
                              {showStateSuggestions && stateSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                  {stateSuggestions.map((suggestion, index) => (
                                    <button
                                      key={suggestion}
                                      type="button"
                                      role="option"
                                      aria-selected={stateSuggestionIndex === index}
                                      tabIndex={stateSuggestionIndex === index ? 0 : -1}
                                      className={`w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-200 ${stateSuggestionIndex === index ? 'bg-blue-50 text-[#090A28]' : 'text-[#262626]'
                                        }`}
                                      onClick={() => handleStateSelect(suggestion)}
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <label htmlFor="zipCode" className="block text-sm font-semibold text-gray-700 mb-3">
                                Zip Code *
                              </label>
                              <input
                                type="text"
                                id="zipCode"
                                name="zipCode"
                                value={shippingData.zipCode}
                                onChange={handleInputChange}
                                required
                                minLength={3}
                                maxLength={10}
                                pattern="[a-zA-Z0-9\s-]+"
                                title="Zip/postal code must be 3-10 characters (letters, numbers, spaces, and hyphens only)"
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] transition-all duration-300"
                                placeholder="Enter your zip code"
                                autoComplete="postal-code"
                              />
                            </div>
                          </div>

                          {/* Email Address */}
                          <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                              <Mail className="inline h-4 w-4 mr-1" />
                              Email Address *
                            </label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={shippingData.email}
                              onChange={handleInputChange}
                              required
                              pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                              title="Please enter a valid email address (e.g., example@email.com)"
                              className={`w-full px-4 py-4 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${emailError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-[#090A28] focus:border-[#090A28]'}`}
                              placeholder="Enter your email address"
                              autoComplete="email"
                            />
                          </div>

                          {/* Continue to Payment Button - Desktop */}
                          <div className="hidden lg:block mt-8">
                            {product.checkoutFlow === 'paypal-direct' ? (
                              <PaypalRedirectButton
                                onBeforePayment={handlePaypalBeforePayment}
                                disabled={isSendingEmail || !isFormValid}
                              />
                            ) : (
                              <button
                                type="submit"
                                onClick={() => console.log('🔘 [Checkout] Submit button clicked (desktop)')}
                                disabled={isSendingEmail || isRedirecting}
                                className={`w-full font-bold py-5 px-8 rounded-xl transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-white focus:outline-none focus:ring-4 focus:ring-[#090A28] focus:ring-offset-2 text-xl ${isSendingEmail || isRedirecting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#090A28] hover:bg-[#1c2070]'}`}
                              >
                                {isSendingEmail ? (<><div className="animate-spin rounded-full h-6 w-6 border-b-3 border-white mr-3" /><span className="text-xl font-bold">Confirming Address...</span></>) :
                                 isRedirecting ? (<><div className="animate-spin rounded-full h-6 w-6 border-b-3 border-white mr-3" /><span className="text-xl font-bold">Redirecting...</span></>) :
                                 (<span className="text-xl font-bold">Continue to Payment</span>)}
                              </button>
                            )}
                          </div>
                        </form>

                        {/* Secure Checkout Info - Desktop Only - Centered in Form */}
                        <div className="hidden lg:block mt-8">
                          <div className="flex flex-col items-center justify-center space-y-4 text-center w-full">
                            <div className="text-sm text-gray-600">
                              <span className="font-medium text-[#090A28]">Secure Checkout</span> - SSL Encrypted
                            </div>
                            <p className="text-xs text-gray-500 max-w-sm">
                              Shop with confidence - Your payment information is protected by industry-leading encryption
                            </p>
                            <div className="flex items-center justify-center">
                              <Image
                                src="/secure-checkout.png"
                                alt="Secure Checkout"
                                width={192}
                                height={192}
                                className="h-12 w-auto"
                                quality={100}
                                priority
                                style={{ imageRendering: 'crisp-edges' }}
                              />
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 mt-2">
                              <Link href="/terms" className="hover:text-[#090A28] hover:underline transition-colors">
                                Terms of Service
                              </Link>
                              <span className="text-gray-300">•</span>
                              <Link href="/return-policy" className="hover:text-[#090A28] hover:underline transition-colors">
                                Refund and Return Policy
                              </Link>
                              <span className="text-gray-300">•</span>
                              <Link href="/shipping-policy" className="hover:text-[#090A28] hover:underline transition-colors">
                                Shipping Policy
                              </Link>
                            </div>
                          </div>
                          </div>
                        </div>

                        {/* Continue to Payment Button - Mobile (Sticky) - REMOVED, use the one inside mobile form */}
                      </div>
                    </div>

                    {/* Right: Order Summary */}
                    <div className="w-96 flex-shrink-0">
                      <div className="self-start">
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                          <h2 className="text-xl font-bold text-[#262626] mb-4">Order Summary</h2>
                          <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <Image
                              src={product.images[0]}
                              alt={product.title}
                              width={64}
                              height={64}
                              className="w-16 h-16 object-cover rounded-lg shadow-sm mb-2 sm:mb-0"
                            />
                            <div className="flex-grow flex flex-col justify-between">
                              <h3 className="font-semibold text-[#262626] line-clamp-2 text-base mb-1">{product.title}</h3>
                              {sellerName && (
                                <p className="text-sm text-gray-600 mb-1 truncate">
                                  Sold by: <span className="font-medium text-[#262626]">{sellerName}</span>
                                </p>
                              )}
                              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                <span className="bg-white px-2 py-0.5 rounded-full inline-block">{product.condition}</span>
                                <span>Qty: {cartItem.quantity}</span>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="font-bold text-lg text-[#090A28]">${product.price.toFixed(2)}</span>
                                <button
                                  onClick={handleClearCart}
                                  className="p-2 rounded-full hover:bg-blue-50 text-[#090A28] transition-colors"
                                  aria-label="Clear Cart"
                                >
                                  <Trash className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 space-y-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Subtotal</span>
                              <span className="font-medium">${product.price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Shipping</span>
                              <span className="font-medium text-[#090A28]">Free</span>
                            </div>
                            <div className="border-t border-gray-200 pt-4">
                              <div className="flex justify-between">
                                <span className="text-base font-semibold text-[#262626]">Total</span>
                                <span className="text-lg font-bold text-[#090A28]">${product.price.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile: Shipping Form */}
              <div className="lg:hidden">
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <h2 className="text-xl font-bold text-[#262626] mb-6">Delivery Address</h2>

                  <form onSubmit={handleContinueToCheckout} className="space-y-6">
                    {/* Street Address */}
                    <div>
                      <label htmlFor="streetAddress" className="block text-sm font-semibold text-gray-700 mb-3">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        id="streetAddress"
                        name="streetAddress"
                        value={shippingData.streetAddress}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] transition-all duration-300"
                        placeholder="Enter your street address"
                        autoComplete="street-address"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-3">
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={shippingData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] transition-all duration-300"
                        placeholder="Enter your city"
                        autoComplete="address-level2"
                      />
                    </div>

                    {/* State/Province */}
                    <div className="relative">
                      <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-3">
                        State/Province *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="state"
                          name="state"
                          value={shippingData.state}
                          onChange={handleInputChange}
                          onFocus={() => setShowStateSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowStateSuggestions(false), 200)}
                          onKeyDown={(e) => {
                            if (showStateSuggestions) {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setStateSuggestionIndex((prev) =>
                                  prev < stateSuggestions.length - 1 ? prev + 1 : 0
                                );
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setStateSuggestionIndex((prev) =>
                                  prev > 0 ? prev - 1 : stateSuggestions.length - 1
                                );
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (stateSuggestionIndex >= 0 && stateSuggestionIndex < stateSuggestions.length) {
                                  handleStateSelect(stateSuggestions[stateSuggestionIndex]);
                                }
                              } else if (e.key === 'Escape') {
                                setShowStateSuggestions(false);
                                setStateSuggestionIndex(-1);
                              }
                            }
                          }}
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] transition-all duration-300"
                          placeholder="Enter your state or province"
                          autoComplete="address-level1"
                        />
                        {showStateSuggestions && stateSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {stateSuggestions.map((suggestion, index) => (
                              <div
                                key={suggestion}
                                className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${index === stateSuggestionIndex ? 'bg-blue-50' : ''
                                  }`}
                                onMouseDown={() => handleStateSelect(suggestion)}
                              >
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-semibold text-gray-700 mb-3">
                        Zip Code *
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={shippingData.zipCode}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] transition-all duration-300"
                        placeholder="10001"
                        autoComplete="postal-code"
                      />
                    </div>

                    {/* Email Field */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={shippingData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] transition-colors duration-200"
                        placeholder="Enter your email address"
                        autoComplete="email"
                      />
                      {emailError && (
                        <p className="mt-2 text-sm text-red-600">{emailError}</p>
                      )}
                    </div>

                    {/* CTA Button - Desktop */}
                    <div className="hidden lg:block mt-8">
                      {product.checkoutFlow === 'paypal-direct' ? (
                        <PaypalRedirectButton
                          onBeforePayment={handlePaypalBeforePayment}
                          disabled={isSendingEmail || !isFormValid}
                        />
                      ) : (
                        <button
                          type="submit"
                          onClick={() => console.log('🔘 [Checkout] Submit button clicked (mobile-form desktop)')}
                          disabled={isSendingEmail || isRedirecting}
                          className={`w-full font-bold py-5 px-8 rounded-xl transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[#090A28] focus:ring-offset-2 text-xl ${isSendingEmail || isRedirecting ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-[#090A28] hover:bg-[#1c2070] text-white'}`}
                        >
                          {isSendingEmail ? (<><div className="animate-spin rounded-full h-6 w-6 border-b-3 border-white mr-3" /><span className="text-white text-xl font-bold">Confirming Address...</span></>) :
                           isRedirecting ? (<><div className="animate-spin rounded-full h-6 w-6 border-b-3 border-white mr-3" /><span className="text-white text-xl font-bold">Redirecting...</span></>) :
                           (<span className="text-white text-xl font-bold">Continue to Payment</span>)}
                        </button>
                      )}
                    </div>

                    {/* CTA Button - Mobile Sticky (hidden for paypal-direct flow, PayPal button is in-form) */}
                    {product.checkoutFlow !== 'paypal-direct' && (
                      <MobileCheckoutCTA
                        disabled={isSendingEmail || isRedirecting}
                        isLoading={isSendingEmail || isRedirecting}
                        loadingLabel={isSendingEmail ? "Confirming Address..." : "Redirecting..."}
                        label="Continue to Payment"
                      />
                    )}

                    {/* Mobile inline PayPal button (PayPal Direct Checkout flow) */}
                    {product.checkoutFlow === 'paypal-direct' && (
                      <div className="lg:hidden mt-6 mb-4">
                        <PaypalRedirectButton
                          onBeforePayment={handlePaypalBeforePayment}
                          disabled={isSendingEmail || !isFormValid}
                        />
                      </div>
                    )}

                    {/* Secure Checkout Info - Mobile */}
                    <div className="lg:hidden mt-4 mb-4 flex flex-col items-center justify-center space-y-2 text-center w-full">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-[#090A28]">Secure Checkout</span> - SSL Encrypted
                      </div>
                      <p className="text-xs text-gray-500 max-w-sm">
                        Shop with confidence - Your payment information is protected by industry-leading encryption
                      </p>
                      <div className="flex items-center justify-center">
                        <Image
                          src="/secure-checkout.png"
                          alt="Secure Checkout"
                          width={192}
                          height={192}
                          className="h-12 w-auto"
                          quality={100}
                          priority
                          style={{ imageRendering: 'crisp-edges' }}
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500 mt-2 px-4">
                        <Link href="/terms" className="hover:text-[#090A28] hover:underline transition-colors">
                          Terms of Service
                        </Link>
                        <span className="text-gray-300">•</span>
                        <Link href="/return-policy" className="hover:text-[#090A28] hover:underline transition-colors">
                          Refund and Return Policy
                        </Link>
                        <span className="text-gray-300">•</span>
                        <Link href="/shipping-policy" className="hover:text-[#090A28] hover:underline transition-colors">
                          Shipping Policy
                        </Link>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* Payment Step - Full Height Layout */
            <div className="max-w-6xl mx-auto">
              {/* Compact Shipping Summary */}
              <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#090A28] rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#262626]">Shipping to:</h3>
                    <p className="text-gray-600 text-sm">
                      {shippingData.streetAddress}, {shippingData.city}, {shippingData.state} {shippingData.zipCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Section with Redirect */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                {isRedirecting ? (
                  <div className="p-12 text-center">
                    <div className="flex flex-col items-center space-y-6">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#090A28]"></div>
                      <div>
                        <h3 className="text-xl font-semibold text-[#262626] mb-2">Your Address Has Been Confirmed</h3>
                        <p className="text-gray-600">Redirecting You To Our Secure Payment Processor...</p>
                      </div>
                      <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-100 max-w-md">
                        <h4 className="font-semibold text-green-900 mb-3">✓ Address Confirmed</h4>
                        <div className="text-sm text-green-800 space-y-1">
                          <p>{shippingData.streetAddress}</p>
                          <p>{shippingData.city}, {shippingData.state} {shippingData.zipCode}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="flex flex-col items-center space-y-6">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-[#262626] mb-2">Delivery Address Confirmed</h3>
                        <p className="text-gray-600">Your Shipping Information Has Been Captured Successfully.</p>
                      </div>
                      <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100 max-w-md">
                        <h4 className="font-semibold text-[#262626] mb-3">Shipping to:</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{shippingData.streetAddress}</p>
                          <p>{shippingData.city}, {shippingData.state} {shippingData.zipCode}</p>
                        </div>
                      </div>
                      {/* Sticky button on mobile */}
                      <MobileCheckoutCTA
                        onClick={() => {
                          setIsRedirecting(true);
                          window.scrollTo({ top: 0 });
                          setTimeout(() => {
                            window.location.href = product.checkoutLink;
                          }, 1000);
                        }}
                        disabled={isRedirecting}
                        isLoading={isRedirecting}
                        loadingLabel="Processing..."
                        label="Continue to Payment"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
