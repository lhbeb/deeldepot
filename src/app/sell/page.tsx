import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, Users, TrendingUp, Truck, MapPin, Handshake, Gift, Mail, Phone, CheckCircle2 } from 'lucide-react';

export default function SellPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Hero Section - Meet Shaylah */}
      <section className="bg-gradient-to-br from-[#090A28] to-[#1c2070] text-white py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-shrink-0">
              <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/shaylah.png"
                  alt="Shaylah - Your Selling Guide"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                Hi, I&apos;m Shaylah
              </h1>
              <p className="text-xl md:text-2xl mb-6 text-white/90 leading-relaxed">
                Let me show you how to turn your unused items into cash on DeelDepot. It&apos;s easier than you think, and I&apos;ll be with you every step of the way.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#090A28] font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-all duration-300 text-lg"
              >
                Start Selling Today
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Sell on DeelDepot - Storytelling */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-[#262626] mb-8 text-center">
              Why Sell on DeelDepot? Let Me Tell You...
            </h2>
            
            <div className="space-y-8">
              {/* Sell Faster */}
              <div className="bg-gradient-to-r from-[#e9ffb4]/20 to-transparent rounded-2xl p-8 border-l-4 border-[#090A28]">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#090A28] rounded-lg flex-shrink-0">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#262626] mb-3">You&apos;ll Sell Faster Than Ever</h3>
                    <p className="text-lg text-gray-700 leading-relaxed">
                      Here&apos;s the thing: no item gets left behind. Seriously. In just a few days, your items find their new home. Our vast network works around the clock to connect your items with the right buyers. It&apos;s like having a personal matchmaker for your stuff!
                    </p>
                  </div>
                </div>
              </div>

              {/* Big Traffic */}
              <div className="bg-gradient-to-r from-[#e9ffb4]/20 to-transparent rounded-2xl p-8 border-l-4 border-[#090A28]">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#090A28] rounded-lg flex-shrink-0">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#262626] mb-3">Thousands of Visitors Every Day</h3>
                    <p className="text-lg text-gray-700 leading-relaxed">
                      Our traffic is massive. Thousands of people visit DeelDepot every single day, looking for exactly what you have. That means more eyes on your items, more potential buyers, and faster sales. It&apos;s that simple.
                    </p>
                  </div>
                </div>
              </div>

              {/* Easy Shipping */}
              <div className="bg-gradient-to-r from-[#e9ffb4]/20 to-transparent rounded-2xl p-8 border-l-4 border-[#090A28]">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#090A28] rounded-lg flex-shrink-0">
                    <Truck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#262626] mb-3">We Take the Hassle Out of Shipping</h3>
                    <p className="text-lg text-gray-700 leading-relaxed">
                      Shipping stress? Not on my watch. We make shipping incredibly easy for you. But first, you&apos;ll need to ship your item to one of our warehouses. We have locations in various cities across the United States, so there&apos;s likely one near you.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Meet Sales Rep */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-[#262626] mb-12 text-center">
            Here&apos;s How It Works
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Step 1: Meet Sales Rep */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-[#090A28]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#090A28] text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  1
                </div>
                <div className="p-3 bg-[#090A28]/10 rounded-lg">
                  <Handshake className="h-6 w-6 text-[#090A28]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#262626] mb-4">Meet One of Our Sales Representatives</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you&apos;re ready to sell, meet one of our sales representatives in your region. You have two options:
              </p>
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#090A28] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    <strong>Hand your items directly</strong> to our sales rep for instant valuation and immediate processing.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#090A28] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    <strong>Ship them later</strong> to our warehouse. Your sales rep will provide the address and handle everything.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#090A28] font-medium">
                <MapPin className="h-5 w-5" />
                <span>Available in cities across the United States</span>
              </div>
            </div>

            {/* Step 2: Get Paid */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-[#090A28]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#090A28] text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  2
                </div>
                <div className="p-3 bg-[#090A28]/10 rounded-lg">
                  <Zap className="h-6 w-6 text-[#090A28]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#262626] mb-4">Get Paid After Successful Sale</h3>
              <p className="text-gray-700 leading-relaxed">
                Your sales representative will list your item, take your details, and wire the money directly to you after a successful sale. Fast, secure, and reliable. That&apos;s how we do business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Sell */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#262626] mb-6">
              What Can You Sell? Almost Anything!
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed">
              Whether you want to clear your wardrobe, sell that game console you don&apos;t need anymore, or get rid of kitchen appliances, we&apos;ve got you covered. Meet one of our sales representatives, and let&apos;s turn your unused items into cash.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-[#e9ffb4]/30 to-white rounded-xl p-6 text-center border-2 border-[#e9ffb4]">
              <div className="text-4xl mb-4">👕</div>
              <h3 className="text-xl font-bold text-[#262626] mb-2">Clear Your Wardrobe</h3>
              <p className="text-gray-600">Fashion items, accessories, shoes. We take it all</p>
            </div>
            <div className="bg-gradient-to-br from-[#e9ffb4]/30 to-white rounded-xl p-6 text-center border-2 border-[#e9ffb4]">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-bold text-[#262626] mb-2">Game Consoles</h3>
              <p className="text-gray-600">That console you don&apos;t use anymore? We&apos;ll find it a new home</p>
            </div>
            <div className="bg-gradient-to-br from-[#e9ffb4]/30 to-white rounded-xl p-6 text-center border-2 border-[#e9ffb4]">
              <div className="text-4xl mb-4">🍳</div>
              <h3 className="text-xl font-bold text-[#262626] mb-2">Kitchen Appliances</h3>
              <p className="text-gray-600">Appliances, gadgets, and more. All welcome</p>
            </div>
          </div>
        </div>
      </section>

      {/* Long-term Partnership Benefits */}
      <section className="py-16 bg-gradient-to-br from-[#090A28] to-[#1c2070] text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-full">
                <Gift className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Long-Term Partnership Means More Opportunities
            </h2>
            <p className="text-xl mb-8 leading-relaxed text-white/90">
              When you build a long-term partnership with us, amazing things happen. You get private access to our exclusive drops of brand new items from clearance departments. These are items you can grab at special prices and benefit from. Opportunities that aren&apos;t available to everyone.
            </p>
            <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-4">Exclusive Benefits for Partners</h3>
              <ul className="space-y-3 text-left max-w-2xl mx-auto">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-[#e9ffb4] flex-shrink-0 mt-0.5" />
                  <span className="text-lg">Private access to brand new clearance items</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-[#e9ffb4] flex-shrink-0 mt-0.5" />
                  <span className="text-lg">Special pricing on exclusive inventory</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-[#e9ffb4] flex-shrink-0 mt-0.5" />
                  <span className="text-lg">Priority support from our sales team</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-[#e9ffb4] flex-shrink-0 mt-0.5" />
                  <span className="text-lg">Faster payment processing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#262626] mb-6">
            Ready to Start Selling?
          </h2>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            Meet one of our sales representatives in your region and let&apos;s turn your unused items into cash. It&apos;s quick, easy, and profitable.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-10 py-4 bg-[#090A28] text-white font-semibold rounded-lg shadow-lg hover:bg-[#1c2070] transition-all duration-300 text-lg"
          >
            Contact Us to Get Started
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-[#262626] mb-6 text-center">Get in Touch</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#090A28]/10 rounded-lg">
                  <Mail className="h-6 w-6 text-[#090A28]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#262626] mb-1">Email</h3>
                  <a href="mailto:support@DeelDepot.com" className="text-[#090A28] hover:underline">
                    support@DeelDepot.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#090A28]/10 rounded-lg">
                  <Phone className="h-6 w-6 text-[#090A28]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#262626] mb-1">Phone</h3>
                  <a href="tel:+17176484487" className="text-[#090A28] hover:underline">
                    +1 717 648 4487
                  </a>
                </div>
              </div>
            </div>
            <p className="text-center text-gray-600 mt-6">
              Monday to Friday: 9:00 AM to 5:00 PM EST<br />
              Saturday: 10:00 AM to 3:00 PM EST
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
