'use client';

import { useState, useRef, useEffect } from 'react';

interface Agent {
  id: string;
  slug: string;
  name: string;
  mission: string;
  systemPrompt: string | null;
  playbooks: string[];
  outputs: string[];
  lane: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokensIn?: number;
  tokensOut?: number;
  costCents?: number;
}

interface TaskPacket {
  client_or_prospect: {
    name: string;
    industry: string;
    location: string;
    website: string;
    goal: string;
  };
  lane: 'lane1' | 'lane2' | 'lane3' | 'unknown';
  constraints: {
    budget: string;
    tools: string;
    compliance: string;
  };
  artifacts: {
    notes: string;
    links: string;
  };
}

const initialTaskPacket: TaskPacket = {
  client_or_prospect: {
    name: '',
    industry: '',
    location: '',
    website: '',
    goal: '',
  },
  lane: 'unknown',
  constraints: {
    budget: '',
    tools: '',
    compliance: '',
  },
  artifacts: {
    notes: '',
    links: '',
  },
};

interface PlaygroundChatProps {
  agent: Agent;
}

export function PlaygroundChat({ agent }: PlaygroundChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [taskPacket, setTaskPacket] = useState<TaskPacket>(initialTaskPacket);
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function updateClientField(field: keyof TaskPacket['client_or_prospect'], value: string) {
    setTaskPacket(prev => ({
      ...prev,
      client_or_prospect: { ...prev.client_or_prospect, [field]: value },
    }));
  }

  function updateConstraintsField(field: keyof TaskPacket['constraints'], value: string) {
    setTaskPacket(prev => ({
      ...prev,
      constraints: { ...prev.constraints, [field]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/agents/${agent.slug}/playground`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          taskPacket: hasTaskPacketData() ? taskPacket : undefined,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to get response');
      }

      const data = await res.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        tokensIn: data.tokensIn,
        tokensOut: data.tokensOut,
        costCents: data.costCents,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setTotalCost(prev => prev + (data.costCents || 0));
      setTotalTokens(prev => prev + (data.tokensIn || 0) + (data.tokensOut || 0));
    } catch (err) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function hasTaskPacketData(): boolean {
    return !!(
      taskPacket.client_or_prospect.name ||
      taskPacket.client_or_prospect.industry ||
      taskPacket.client_or_prospect.goal ||
      taskPacket.constraints.budget ||
      taskPacket.artifacts.notes
    );
  }

  function clearConversation() {
    setMessages([]);
    setTotalCost(0);
    setTotalTokens(0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="flex flex-1 min-h-0">
      {/* Context Panel */}
      <div className={`border-r bg-card transition-all ${showContext ? 'w-80' : 'w-0'} overflow-hidden`}>
        <div className="w-80 h-full overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Task Context</h3>
            <button
              onClick={() => setTaskPacket(initialTaskPacket)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>

          {/* Client Info */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Client/Prospect</label>
            <input
              type="text"
              value={taskPacket.client_or_prospect.name}
              onChange={(e) => updateClientField('name', e.target.value)}
              placeholder="Name"
              className="w-full px-2 py-1.5 rounded border bg-background text-sm"
            />
            <input
              type="text"
              value={taskPacket.client_or_prospect.industry}
              onChange={(e) => updateClientField('industry', e.target.value)}
              placeholder="Industry"
              className="w-full px-2 py-1.5 rounded border bg-background text-sm"
            />
            <input
              type="text"
              value={taskPacket.client_or_prospect.location}
              onChange={(e) => updateClientField('location', e.target.value)}
              placeholder="Location"
              className="w-full px-2 py-1.5 rounded border bg-background text-sm"
            />
            <textarea
              value={taskPacket.client_or_prospect.goal}
              onChange={(e) => updateClientField('goal', e.target.value)}
              placeholder="Goal"
              rows={2}
              className="w-full px-2 py-1.5 rounded border bg-background text-sm resize-none"
            />
          </div>

          {/* Lane */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Lane</label>
            <select
              value={taskPacket.lane}
              onChange={(e) => setTaskPacket(prev => ({ ...prev, lane: e.target.value as TaskPacket['lane'] }))}
              className="w-full px-2 py-1.5 rounded border bg-background text-sm"
            >
              <option value="unknown">Unknown</option>
              <option value="lane1">Lane 1 (Quick wins)</option>
              <option value="lane2">Lane 2 (Mid-tier)</option>
              <option value="lane3">Lane 3 (Enterprise)</option>
            </select>
          </div>

          {/* Constraints */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Constraints</label>
            <input
              type="text"
              value={taskPacket.constraints.budget}
              onChange={(e) => updateConstraintsField('budget', e.target.value)}
              placeholder="Budget"
              className="w-full px-2 py-1.5 rounded border bg-background text-sm"
            />
            <input
              type="text"
              value={taskPacket.constraints.tools}
              onChange={(e) => updateConstraintsField('tools', e.target.value)}
              placeholder="Preferred tools"
              className="w-full px-2 py-1.5 rounded border bg-background text-sm"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <textarea
              value={taskPacket.artifacts.notes}
              onChange={(e) => setTaskPacket(prev => ({
                ...prev,
                artifacts: { ...prev.artifacts, notes: e.target.value },
              }))}
              placeholder="Additional context..."
              rows={3}
              className="w-full px-2 py-1.5 rounded border bg-background text-sm resize-none"
            />
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold mb-2">Test {agent.name}</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  {agent.mission}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {agent.outputs.slice(0, 3).map((output, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-muted">
                      {output}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-6">
                  Type a message below or use suggested prompts
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  {message.role === 'assistant' && message.tokensIn !== undefined && (
                    <div className="mt-2 pt-2 border-t border-border/50 text-xs opacity-70">
                      {message.tokensIn + (message.tokensOut || 0)} tokens
                      {message.costCents ? ` · $${(message.costCents / 100).toFixed(4)}` : ''}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.1s]" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts (show only when no messages) */}
        {messages.length === 0 && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {[
                `What outputs can you help me create?`,
                `Walk me through your process`,
                `What information do you need to get started?`,
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full border hover:bg-muted transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setShowContext(!showContext)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                showContext ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
              }`}
            >
              {showContext ? 'Hide Context' : 'Add Context'}
              {hasTaskPacketData() && !showContext && (
                <span className="ml-1 w-2 h-2 rounded-full bg-green-500 inline-block" />
              )}
            </button>
            <button
              onClick={clearConversation}
              disabled={messages.length === 0}
              className="text-xs px-3 py-1 rounded-full border hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Clear Chat
            </button>
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {totalTokens.toLocaleString()} tokens · ${(totalCost / 100).toFixed(4)}
            </span>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${agent.name}...`}
              rows={1}
              className="flex-1 px-4 py-2 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
