export function Header() {
  return (
    <header className="bg-eu-blue text-white shadow-lg">
      {/* DEMO Banner */}
      <div className="bg-orange-500 py-2">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-bold text-sm uppercase tracking-wide">
            Demo Only — This is NOT an official visa application
          </span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      </div>

      {/* Top bar with EU branding */}
      <div className="bg-eu-blue-dark py-2">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* EU Flag */}
            <div className="w-10 h-7 bg-eu-blue border border-eu-yellow rounded-sm flex items-center justify-center">
              <svg viewBox="0 0 810 540" className="w-full h-full">
                <rect fill="#003399" width="810" height="540"/>
                <g fill="#FFCC00" transform="translate(405,270)">
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
                    <polygon
                      key={angle}
                      points="0,-85 5,-25 25,-25 10,-5 15,20 0,5 -15,20 -10,-5 -25,-25 -5,-25"
                      transform={`rotate(${angle}) translate(0,-65) scale(0.18)`}
                    />
                  ))}
                </g>
              </svg>
            </div>
            <div>
              <p className="text-xs opacity-80">AI ASSISTANT DEMO</p>
              <p className="text-sm font-semibold">Visa Form Assistant</p>
            </div>
          </div>
          <div className="text-xs opacity-70">
            Powered by Chucky AI
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                SCHENGEN VISA FORM DEMO
              </h1>
              <p className="text-eu-yellow text-sm mt-1">
                AI-Assisted Form Filling — For Demonstration Purposes Only
              </p>
            </div>
            <div className="text-right">
              <div className="official-stamp bg-white/10">
                DEMO
                <br />
                MODE
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions bar */}
      <div className="bg-eu-yellow text-eu-blue-dark py-3">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="font-semibold">Try the AI:</span>
            <span>Click the chat button to get AI assistance. Use fake data only — do not enter real personal information.</span>
          </div>
        </div>
      </div>
    </header>
  )
}
