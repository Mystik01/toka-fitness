import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronDown } from 'lucide-react'

// Placeholder images - in a real app these would be the generated assets
// We will assume these paths exist after generation
const HERO_IMAGE = "/Users/logan/.gemini/antigravity/brain/e4333515-b779-46ec-9329-e6e7eb5e95bc/hero_background_running.png"
const MOCKUP_IMAGE = "/Users/logan/.gemini/antigravity/brain/e4333515-b779-46ec-9329-e6e7eb5e95bc/app_mockup_calendar.png"

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white font-sans selection:bg-red-600 selection:text-white">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 bg-black/40 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <span className="text-2xl font-bold tracking-wider uppercase text-white">
                Toka Fitness
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors uppercase tracking-wide">
                Pricing
              </Link>
              <Link href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors uppercase tracking-wide">
                About
              </Link>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors uppercase tracking-wide"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
         <Image 
            src={HERO_IMAGE} 
            alt="Fitness Background" 
            fill
            className="object-cover grayscale"
            priority
          />
          <div className="absolute inset-0 bg-black/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-8 leading-[0.9] uppercase drop-shadow-xl">
              Your Fitness<br />
              Journey<br />
              <span className="text-white">Starts Here</span>
            </h1>
            
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 transition-all rounded-sm shadow-2xl hover:scale-105 transform duration-200"
            >
              Join Today
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8 text-white/50" />
        </div>
      </section>

      {/* Why Toka Fitness Section - Red Cards */}
      <section className="py-24 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-wider text-white mb-4">
              Why Toka Fitness?
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Track Progress",
                desc: "Monitor your gains with precision analytics."
              },
              {
                title: "Smart Scheduling",
                desc: "Plan your week with our dynamic calendar."
              },
              {
                title: "Join Community",
                desc: "Connect with athletes globally."
              }
            ].map((feature, index) => (
              <div key={index} className="group relative">
                {/* Red Card Background */}
                <div className="absolute inset-0 bg-red-800 rounded-[2.5rem] transform rotate-3 group-hover:rotate-6 transition-transform duration-300 -z-10 shadow-2xl" />
                <div className="absolute inset-0 bg-red-900/50 rounded-[2.5rem] transform -rotate-3 group-hover:-rotate-6 transition-transform duration-300 -z-20 blur-sm" />
                
                {/* Phone Content Container */}
                <div className="relative bg-black border-[8px] border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[9/16] flex flex-col">
                    {/* Mock Status Bar */}
                    <div className="h-6 bg-zinc-900 w-full flex justify-between items-center px-4">
                        <div className="text-[10px] text-zinc-500 font-mono">9:41</div>
                        <div className="flex gap-1">
                             <div className="w-3 h-3 rounded-full bg-zinc-700" />
                        </div>
                    </div>
                    
                    {/* App Content Area */}
                    <div className="flex-1 relative bg-zinc-900 p-4">
                         <div className="absolute inset-0 opacity-80">
                             <Image 
                                src={MOCKUP_IMAGE} 
                                alt="App Mockup" 
                                fill
                                className="object-cover"
                             />
                         </div>
                         <div className="relative z-10 flex flex-col h-full justify-end pb-8">
                            <h3 className="text-xl font-bold uppercase text-white mb-2 drop-shadow-md">{feature.title}</h3>
                            <p className="text-xs text-gray-300 drop-shadow-md">{feature.desc}</p>
                         </div>
                         
                         {/* Gradient overlay for text readability */}
                         <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
                    </div>

                    {/* Home Bar */}
                    <div className="h-6 bg-black w-full flex justify-center items-end pb-2">
                        <div className="w-32 h-1 bg-zinc-700 rounded-full" />
                    </div>
                </div>

                <div className="mt-8 text-center">
                   <p className="text-gray-400 text-sm uppercase tracking-widest group-hover:text-red-500 transition-colors">Join a new community</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
            <span className="text-xl font-bold uppercase tracking-widest text-zinc-500">Toka Fitness</span>
            <div className="text-zinc-600 text-sm mt-4 md:mt-0">
              &copy; {new Date().getFullYear()} Toka Fitness. Made by Logan.
            </div>
        </div>
      </footer>
    </div>
  )
}

