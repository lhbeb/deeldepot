"use client";

import React, { useState } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setIsSuccess(true);
      setEmail('');

      // Reset success state after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-[#06092a] py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-3">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Join the DeelDepot Insider List
          </h2>

          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            Get first access to premium open-box and like-new deals before they sell out. Zero spam, just real savings on top-quality finds.
          </p>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 rounded-lg border-0 text-[#262626] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[#06092a] transition-all duration-200"
                  disabled={isSubmitting || isSuccess}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isSuccess}
                className="bg-[#F5970C] text-[#06092a] hover:bg-[#F5970C]/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 min-w-[140px] shadow-lg shadow-[#F5970C]/20"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#06092a]"></div>
                    Subscribing...
                  </>
                ) : isSuccess ? (
                  <>
                    <Check className="h-5 w-5" />
                    Subscribed!
                  </>
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="flex justify-center mt-3">
                <p className="text-red-300 font-semibold bg-white/10 px-4 py-1.5 rounded-md text-sm shadow-sm backdrop-blur-sm border border-red-300/20">
                  {error}
                </p>
              </div>
            )}

            {isSuccess && (
              <div className="flex justify-center mt-3">
                <p className="text-green-300 font-semibold bg-white/10 px-4 py-1.5 rounded-md text-sm shadow-sm backdrop-blur-sm border border-green-300/20">
                  Thanks for subscribing! Check your email for confirmation.
                </p>
              </div>
            )}
          </form>

          <p className="text-white/60 text-sm mt-6 opacity-80">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection; 