'use client';

import { useState } from 'react';
import { testOllamaConnection } from '@xekko/core/client';
import { useGameStore } from '@/store/useGameStore';

/** Cài đặt — mở từ header, không duplicate layout */
export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [ollamaStatus, setOllamaStatus] = useState<'unknown' | 'ok' | 'fail'>('unknown');
  const [model, setModel] = useState('llama3.1:8b');
  const resetAdventure = useGameStore((s) => s.resetAdventure);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#151922] p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white">Cài đặt</h2>
        <p className="mt-1 text-sm text-zinc-500">Ollama local · DAC_TA_V1</p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase text-zinc-500">Model Ollama</span>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-500/50"
            />
          </label>
          <p className="text-xs text-zinc-600">
            URL: <code className="text-amber-400/90">http://localhost:11434</code>
          </p>
          <button
            type="button"
            className="w-full rounded-xl bg-amber-600 py-2.5 text-sm font-bold text-zinc-950"
            onClick={async () => {
              const ok = await testOllamaConnection();
              setOllamaStatus(ok ? 'ok' : 'fail');
            }}
          >
            Kiểm tra Ollama
          </button>
          {ollamaStatus === 'ok' && <p className="text-sm text-emerald-400">Kết nối OK</p>}
          {ollamaStatus === 'fail' && (
            <p className="text-sm text-red-400">Không kết nối được. Chạy `ollama serve` trước.</p>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => {
              if (confirm('Xóa phiêu lưu hiện tại?')) {
                resetAdventure();
                onClose();
              }
            }}
            className="flex-1 rounded-xl border border-red-900/50 py-2 text-sm text-red-400 hover:bg-red-950/30"
          >
            Xóa save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-zinc-800 py-2 text-sm font-bold text-zinc-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
