from __future__ import annotations

import streamlit as st

from ..core.models import ChatMessage, GameState


def render_chat_history(messages: list[ChatMessage]) -> None:
    for message in messages:
        st.chat_message(message.role).write(message.content)


def render_chat_input(placeholder: str = "Hành động của bạn là...") -> str | None:
    return st.chat_input(placeholder)


def append_system_message(game_state: GameState, content: str) -> None:
    game_state.messages.append(ChatMessage(role="assistant", content=content))