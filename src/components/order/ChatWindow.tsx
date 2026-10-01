'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { ChatMessage } from '@/types/marketplace';
import { Send, ShieldAlert, Lock, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChatWindowProps {
  orderId: string;
}

export function ChatWindow({ orderId }: ChatWindowProps) {
  const { messages, sendMessage, currentUser, activeRole } = useMarketplace();
  const [inputText, setInputText] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const orderMessages = messages[orderId] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [orderMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');
    const result = await sendMessage(orderId, text);
    if (result.warning) {
      setWarning(result.warning);
    } else {
      setWarning(null);
    }
  };

  return (
    <div className="bg-white border border-[#E5E5DE] rounded-lg flex flex-col h-[520px] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Chat Header */}
      <div className="px-5 py-3.5 border-b border-[#E5E5DE] bg-[#FBFBFA] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#047857]" />
          <span className="editorial-label text-[#121214]">Order Workspace Chat</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-[#71717A]">
          <Lock className="w-3 h-3 text-[#FF5416]" />
          <span>Platform Protected Thread</span>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-[#FAF9F6] border-b border-[#E5E5DE] px-4 py-2 flex items-center gap-2 text-[10px] font-mono text-[#52525B]">
        <span>
          Keep collaboration details and payments within Market My App so your order, delivery and transaction records remain protected and traceable.
        </span>
      </div>

      {/* Warning Notice if Flagged */}
      {warning && (
        <div className="bg-[#FFF2EC] border-b border-[#FFD2C1] px-4 py-2.5 text-xs text-[#C2410C] flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#FF5416]" />
          <div className="flex-1">
            <span>{warning}</span>
          </div>
          <button
            onClick={() => setWarning(null)}
            className="text-[10px] font-mono uppercase underline hover:text-[#9A3412]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAF9F5]">
        {orderMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[#71717A] p-6">
            <Lock className="w-6 h-6 text-[#A1A1AA] mb-2" />
            <p className="font-semibold text-[#121214]">Secure Collaboration Thread</p>
            <p className="max-w-xs mt-1">
              Communicate content feedback, logistics, and revision requests here. All agreements are recorded for platform protection and transaction records.
            </p>
          </div>
        ) : (
          orderMessages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id;
            const timeFormatted = new Date(msg.created_at).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[10px] font-mono font-semibold text-[#71717A] uppercase">
                    {msg.sender_name || (msg.sender_role === 'creator' ? 'Creator' : 'Brand')}
                  </span>
                  <span className="text-[9px] font-mono text-[#A1A1AA]">{timeFormatted}</span>
                </div>

                <div
                  className={`max-w-[80%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-[#18181B] text-white rounded-br-none shadow-sm'
                      : 'bg-white text-[#121214] border border-[#E5E5DE] rounded-bl-none shadow-sm'
                  } ${
                    msg.moderation_status === 'flagged'
                      ? 'border-[#FF5416] bg-[#FFF8F5]'
                      : ''
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.body}</p>
                  {msg.moderation_status === 'flagged' && (
                    <div className="mt-1 text-[9px] font-mono text-[#FF5416] flex items-center gap-1">
                      <ShieldAlert className="w-2.5 h-2.5" />
                      <span>Contact info flagged</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-[#E5E5DE] bg-white flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message as ${currentUser?.display_name || activeRole}...`}
          className="flex-1 text-xs py-2 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416] transition-colors"
        />
        <Button type="submit" size="sm" variant="primary" disabled={!inputText.trim()}>
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </form>
    </div>
  );
}
