import { ThemeToggle } from './ThemeToggle'

export function AuthLayout({
  title,
  subtitle,
  steps,
  activeStep = 0,
  children,
}: {
  title: string
  subtitle: string
  steps: string[]
  activeStep?: number
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#0d0d0d]">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-[44%] flex-col items-center justify-center p-14 relative overflow-hidden"
        style={{
          background: 'linear-gradient(150deg, #6B1A2A 0%, #4A0F1C 45%, #1a0509 100%)',
        }}
      >
        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 60% 40%, rgba(212,132,154,0.15) 0%, transparent 65%)',
          }}
        />

        <div className="relative z-10 w-full max-w-xs flex flex-col items-center">
          {/* Logo */}
          <img src="/logo.svg" alt="Ecclesia Hub" className="h-9 w-auto mb-12 brightness-0 invert" />

          <div className="text-center mb-10">
            <h1 className="text-[1.75rem] font-bold text-white leading-snug">{title}</h1>
            <p className="text-white/50 text-sm mt-2 leading-relaxed">{subtitle}</p>
          </div>

          {/* Steps */}
          <div className="space-y-2.5 w-full">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                  i === activeStep
                    ? 'bg-white/15 text-white'
                    : i < activeStep
                    ? 'bg-white/8 text-white/60'
                    : 'bg-white/5 text-white/35'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === activeStep
                      ? 'bg-white text-[#4A0F1C]'
                      : i < activeStep
                      ? 'bg-white/30 text-white'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {i < activeStep ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#111111]">
        {/* Top bar */}
        <div className="flex justify-end px-8 pt-6">
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center px-8 pb-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  )
}
