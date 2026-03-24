"use client";

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  const typingTextRef = useRef<HTMLSpanElement>(null);
  const placeholder = '\u00a0';

  // TYPING ANIMATION - PRESERVED EXACTLY
  useEffect(() => {
    const element = typingTextRef.current;
    if (!element) return;

    const words = ['Cameras', 'Fashion', 'Tech', 'Sport Gear'];
    let isAnimating = true;
    let currentIndex = 0;

    const sleep = (duration: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, duration));

    const typeWord = async (word: string) => {
      element.textContent = '';
      const letters = word.split('');
      for (const letter of letters) {
        if (!isAnimating) return;
        element.textContent = `${element.textContent}${letter}`;
        await sleep(90);
      }
    };

    const deleteWord = async () => {
      while (isAnimating && (element.textContent?.length ?? 0) > 0) {
        element.textContent = element.textContent?.slice(0, -1) ?? '';
        await sleep(40);
      }
      element.textContent = placeholder;
    };

    const animateLoop = async () => {
      element.textContent = placeholder;

      while (isAnimating) {
        const word = words[currentIndex];

        await typeWord(word);
        if (!isAnimating) break;

        await sleep(2000);
        if (!isAnimating) break;

        await deleteWord();
        if (!isAnimating) break;

        await sleep(350);
        if (!isAnimating) break;

        currentIndex = (currentIndex + 1) % words.length;
      }
    };

    animateLoop();

    return () => {
      isAnimating = false;
    };
  }, []);

  return (
    <div className="relative min-h-[420px] md:min-h-[385px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/bg.png"
          alt="Electronics workspace background"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="container mx-auto px-4 py-8 md:py-10 relative z-10">
        <div className="flex flex-col md:flex-row items-center min-h-[320px] md:min-h-[315px]">

          {/* Blue Card Overlay - Left Side */}
          <div className="w-full max-w-[340px] md:max-w-[420px] lg:max-w-[450px] bg-[#090A28] rounded-xl shadow-xl p-5 md:p-6 lg:p-8 md:ml-4 lg:ml-12">
            {/* Heading with typing animation - PRESERVED */}
            <h1 className="text-2xl md:text-3xl lg:text-[32px] font-bold text-white leading-tight">
              <span
                ref={typingTextRef}
                className="block text-white h-[1.2em] mb-1"
              >
                {placeholder}
              </span>
              <span className="block leading-tight">
                The Marketplace for Great Finds
              </span>
            </h1>

            {/* Description - PRESERVED content */}
            <p className="mt-3 text-sm md:text-base text-white/90 leading-relaxed">
              Authentic Burberry, Stone Island, And More, Top Tech, Bikes, And Cameras, All Checked And Ready
            </p>

            {/* Shop Now Button - PRESERVED href */}
            <a
              href="#products"
              className="mt-5 inline-flex items-center justify-center px-6 py-2.5 bg-[#F5970C] text-[#090A28] text-sm font-medium rounded-lg shadow-md hover:bg-[#F5970C]/90 transition-all duration-300"
            >
              Shop Now
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Hero;
