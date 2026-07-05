import { useEffect, useRef, useState } from 'react'
import { Eraser, MessageSquare, Send, Sparkles } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { PageHeader } from '../components/ui'

const SUGGESTIONS = [
  'How much did I spend this month?',
  'What did I spend on groceries last month?',
  'Top merchants this year',
  'What was my biggest expense?',
  'Compare dining vs groceries this year',
  'How are my budgets doing?',
]

export default function Chat() {
  const { store, sendChatMessage, clearChat } = useData()
  const { chatHistory } = store
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory.length])

  const send = (text: string) => {
    const t = text.trim()
    if (!t) return
    sendChatMessage(t)
    setInput('')
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="Chat"
        subtitle="Ask questions about your spending — answered locally, no cloud involved"
        actions={
          chatHistory.length > 0 ? (
            <button className="btn btn-outline h-9 px-4" onClick={clearChat}>
              <Eraser className="mr-2 h-4 w-4" /> Clear
            </button>
          ) : undefined
        }
      />

      {/* Messages */}
      <div className="card flex-1 overflow-y-auto p-5">
        {chatHistory.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">Ask about your money</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Questions are answered instantly from your local data.
            </p>
            <div className="mt-5 flex max-w-lg flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((m) => (
              <div key={m.id} className={`flex animate-fade-up ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-soft ${
                    m.role === 'user'
                      ? 'bg-brand rounded-br-md text-white'
                      : 'glass rounded-bl-md text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.table && (
                    <div className="mt-3 overflow-x-auto rounded-md border bg-card">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                            {m.table.columns.map((c) => (
                              <th key={c} className="px-3 py-2 font-medium">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {m.table.rows.map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => (
                                <td key={j} className="px-3 py-1.5 tabular-nums text-foreground">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <input
          className="input flex-1"
          placeholder='Try "what did I spend on dining last month?"'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
        />
        <button className="btn btn-primary h-10 px-4" disabled={!input.trim()} onClick={() => send(input)}>
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
