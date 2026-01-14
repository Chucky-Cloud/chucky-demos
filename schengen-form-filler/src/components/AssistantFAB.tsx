interface Props {
  onClick: () => void
}

export function AssistantFAB({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="assistant-fab group"
      title="Open AI Assistant"
    >
      {/* Animated rings */}
      <div className="absolute inset-0 rounded-full bg-eu-blue animate-ping opacity-20" />
      <div className="absolute inset-0 rounded-full bg-eu-blue animate-pulse opacity-30" />

      {/* Icon */}
      <div className="relative z-10">
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </div>

      {/* Tooltip */}
      <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Need help? Ask AI Assistant
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 border-4 border-transparent border-l-gray-900" />
      </div>
    </button>
  )
}
