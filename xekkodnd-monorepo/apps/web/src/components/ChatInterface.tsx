/**
 * @deprecated Dùng AdventureMode trong GameLayout (đã nối CampaignPresenter + Ollama).
 * Giữ file để tham khảo; không import trong app.
 */
'use client';

import { useState } from 'react';
import { Send, Mic } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    { role: 'dm', text: 'Bạn đứng trước cửa hang động tối tăm. Không khí ẩm ướt và tiếng vọng xa xa vang lên. Bạn muốn làm gì?' },
  ]);
  const [input, setInput] = useState('');
  const { addMessage } = useGameStore();

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'player', text: input }]);
    // Gọi Presenter sau này
    addMessage(input);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-zinc-950">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'player' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-3xl px-5 py-3 ${
              msg.role === 'player' 
                ? 'bg-amber-600 text-white' 
                : 'bg-zinc-800 text-zinc-100'
            }`}>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900">
        <div className="flex gap-3">
          <button className="px-4 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-3xl">
            <Mic className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Nhập hành động của bạn..."
            className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-amber-400 rounded-3xl px-6 py-4 outline-none"
          />
          <button
            onClick={sendMessage}
            className="px-8 bg-amber-500 hover:bg-amber-600 rounded-3xl font-semibold"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
