'use client';

/**
 * ChatMessage — render message với inline <cmd:...> tags
 * V6 §7.1: Mỗi <cmd:*> tag render thành inline icon đẹp
 */

import React from 'react';

// ─── Tag parsers ──────────────────────────────────────────────────────────────

interface CmdTag {
  type: string;
  attrs: Record<string, string>;
  innerText?: string;
}

/** Parse tất cả <cmd:...> tags từ text */
function parseCommandTags(text: string): Array<{ kind: 'text' | 'cmd'; value: string | CmdTag }> {
  const parts: Array<{ kind: 'text' | 'cmd'; value: string | CmdTag }> = [];

  // Match self-closing và pair tags
  const regex = /<cmd:(\w+)([^>]*)\/?>(?:([\s\S]*?)<\/cmd:\1>)?/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text trước tag
    if (match.index > lastIndex) {
      parts.push({ kind: 'text', value: text.slice(lastIndex, match.index) });
    }

    // Parse attrs
    const type = match[1];
    const attrsStr = match[2];
    const inner = match[3];
    const attrs: Record<string, string> = {};
    const attrRegex = /(\w+)=['"]([^'"]*)['"]/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }

    parts.push({ kind: 'cmd', value: { type, attrs, innerText: inner } });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ kind: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

// ─── Inline tag renderers ─────────────────────────────────────────────────────

function RolledTag({ attrs }: { attrs: Record<string, string> }) {
  const action = attrs.action ?? 'roll';
  const result = attrs.result ?? attrs.total ?? '?';
  const vs = attrs.vs ?? attrs.dc;
  const hit = vs ? parseInt(result) >= parseInt(vs) : null;

  const actionLabels: Record<string, string> = {
    attack: 'Tấn công',
    save: 'Saving Throw',
    check: 'Kiểm tra',
    initiative: 'Initiative',
    move: 'Di chuyển',
  };

  const label = actionLabels[action] ?? action;
  const isNat20 = result === '20';
  const isNat1 = result === '1';

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-700/40 bg-amber-950/40 px-2 py-0.5 text-xs font-mono text-amber-300 mx-0.5">
      🎲 {label}: <strong>{result}</strong>
      {vs && <span className="text-zinc-400"> vs {vs}</span>}
      {hit !== null && (
        <span className={hit ? 'text-green-400' : 'text-red-400'}>
          {isNat20 ? ' 💥CRIT' : isNat1 ? ' 💀FUMBLE' : hit ? ' ✓HIT' : ' ✗MISS'}
        </span>
      )}
    </span>
  );
}

function HpChangeTag({ attrs }: { attrs: Record<string, string> }) {
  const target = attrs.target ?? 'entity';
  const delta = parseInt(attrs.delta ?? '0');
  const isHeal = delta > 0;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold mx-0.5 ${
        isHeal
          ? 'border-green-700/40 bg-green-950/40 text-green-400'
          : 'border-red-700/40 bg-red-950/40 text-red-400'
      }`}
    >
      {isHeal ? '💚' : '💔'} {target}: {isHeal ? '+' : ''}{delta} HP
    </span>
  );
}

function EntityDiedTag({ attrs }: { attrs: Record<string, string> }) {
  const target = attrs.target ?? 'entity';
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700/40 bg-zinc-900/60 px-2 py-0.5 text-xs font-bold text-zinc-400 mx-0.5">
      ☠ {target} đã chết
    </span>
  );
}

function ItemAppearedTag({ attrs }: { attrs: Record<string, string> }) {
  const name = attrs.name ?? attrs.template ?? 'Item';
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-yellow-700/40 bg-yellow-950/30 px-2 py-0.5 text-xs font-bold text-yellow-400 mx-0.5">
      📦 {name} xuất hiện
    </span>
  );
}

function QuestEventTag({ attrs }: { attrs: Record<string, string> }) {
  const type = attrs.type ?? 'update';
  const quest = attrs.quest ?? 'Quest';
  const icons: Record<string, string> = { completed: '🏆', failed: '💀', started: '📜', updated: '📌' };
  const labels: Record<string, string> = { completed: 'hoàn thành', failed: 'thất bại', started: 'bắt đầu', updated: 'cập nhật' };
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-blue-700/40 bg-blue-950/30 px-2 py-0.5 text-xs font-bold text-blue-400 mx-0.5">
      {icons[type] ?? '📌'} Quest {labels[type] ?? type}: {quest}
    </span>
  );
}

/** Render suggest block thành quick buttons (trả về null — handled riêng bên ngoài) */
function SuggestTag({ innerText, onSuggest }: { innerText: string; onSuggest?: (s: string) => void }) {
  const suggestions = innerText
    .split('\n')
    .map((s) => s.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean);

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {suggestions.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSuggest?.(s)}
          className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-300 hover:border-amber-500/50 hover:bg-zinc-700 hover:text-amber-300 transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ─── Main renderer ────────────────────────────────────────────────────────────

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant' | 'system';
  /** Gọi khi player click quick action button */
  onSuggest?: (text: string) => void;
}

export function renderMessageContent(
  content: string,
  onSuggest?: (text: string) => void
): React.ReactNode {
  const parts = parseCommandTags(content);
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.kind === 'text') {
      // Render plain text với line breaks
      const lines = (part.value as string).split('\n');
      lines.forEach((line, li) => {
        if (li > 0) nodes.push(<br key={`br-${i}-${li}`} />);
        if (line) nodes.push(<React.Fragment key={`t-${i}-${li}`}>{line}</React.Fragment>);
      });
    } else {
      const cmd = part.value as CmdTag;
      const key = `cmd-${i}`;
      switch (cmd.type) {
        case 'rolled':
          nodes.push(<RolledTag key={key} attrs={cmd.attrs} />);
          break;
        case 'hp_change':
          nodes.push(<HpChangeTag key={key} attrs={cmd.attrs} />);
          break;
        case 'entity_died':
          nodes.push(<EntityDiedTag key={key} attrs={cmd.attrs} />);
          break;
        case 'item_appeared':
          nodes.push(<ItemAppearedTag key={key} attrs={cmd.attrs} />);
          break;
        case 'quest_event':
          nodes.push(<QuestEventTag key={key} attrs={cmd.attrs} />);
          break;
        case 'suggest':
          nodes.push(
            <SuggestTag key={key} innerText={cmd.innerText ?? ''} onSuggest={onSuggest} />
          );
          break;
        default:
          // Unknown tag — render as nothing
          break;
      }
    }
  }

  return <>{nodes}</>;
}
