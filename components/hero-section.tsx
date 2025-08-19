"use client";
import { useRouter } from "next/navigation";
import React from "react";

const AnimatedWord = () => {
  return (
    <span className="relative inline-block overflow-hidden" style={{ height: '1em', lineHeight: 'inherit', verticalAlign: 'baseline', transform: 'translateY(0em)' }}>
      <span 
        style={{
          animation: 'wordScroll 4s ease-in-out infinite',
          display: 'block'
        }}
      >
        <span style={{ display: 'block', height: '1em', lineHeight: 'inherit' }}>SMARTEST</span>
        <span style={{ display: 'block', height: '1em', lineHeight: 'inherit' }} className="text-[#ab0000]">FASTEST</span>
      </span>
      <style jsx>{`
        @keyframes wordScroll {
          0% { transform: translateY(0); }
          20% { transform: translateY(0); }
          30% { transform: translateY(-1em); }
          70% { transform: translateY(-1em); }
          80% { transform: translateY(0); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </span>
  );
};

const HeroSection = () => {
    const router = useRouter();
    return (
        <>
            <div className="relative w-full h-screen overflow-hidden font-dm-serif">
                <div className="w-full flex flex-col items-center h-screen md:justify-center mt-50 md:mt-5 px-4 sm:px-6 lg:px-8">
                    <div
                        className="text-center text-3xl sm:text-5xl lg:text-7xl xl:text-8xl leading-tight font-extralight dark:text-white tracking-wide " 
                    >
                        THE <AnimatedWord /> RAG APP<br /> YOU'VE EVER USED
                    </div>
                    <div className="text-center text-lg sm:text-xl font-light dark:text-white mt-6 sm:mt-8 lg:mt-10 max-w-3xl">
                            Seamlessly ingest and search your documents
                    </div>
                    <div className="mt-6 sm:mt-8 lg:mt-10">
                        <button onClick={() => router.push('/dashboard')} className="font-berkshire mt-3 text-lg sm:text-xl lg:text-2xl font-semibold px-4 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-4 rounded-full w-auto bg-transparent border border-white text-white transition-shadow duration-300 hover:cursor-pointer">
                            Try Out Now
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HeroSection;
