import { useState } from 'react'
import { Header } from './components/Header'
import { SchengenForm } from './components/SchengenForm'
import { ChatPanel } from './components/ChatPanel'
import { AssistantFAB } from './components/AssistantFAB'
import { FormProvider } from './context/FormContext'
import { ChuckyProvider } from './context/ChuckyContext'

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <FormProvider>
      <ChuckyProvider>
        <div className="min-h-screen bg-gray-100">
          <Header />

          <main className={`transition-all duration-300 ${isChatOpen ? 'mr-96' : ''}`}>
            <div className="max-w-4xl mx-auto py-8 px-4">
              <SchengenForm />
            </div>
          </main>

          {/* Chat Panel */}
          {isChatOpen && (
            <ChatPanel onClose={() => setIsChatOpen(false)} />
          )}

          {/* Floating Action Button */}
          {!isChatOpen && (
            <AssistantFAB onClick={() => setIsChatOpen(true)} />
          )}
        </div>
      </ChuckyProvider>
    </FormProvider>
  )
}

export default App
