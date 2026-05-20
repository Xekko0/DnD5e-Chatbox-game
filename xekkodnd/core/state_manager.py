from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .models import ChatMessage, CharacterState, GameState


class StateManager:
    def __init__(self, state_key: str = "xekkodnd_state") -> None:
        self.state_key = state_key

    def bootstrap(self, session_state: Any) -> GameState:
        if self.state_key not in session_state:
            session_state[self.state_key] = GameState(
                messages=[
                    ChatMessage(
                        role="assistant",
                        content=(
                            "Chào chiến binh! Ta là Dungeon Master. "
                            "Hãy chỉnh nhân vật hoặc bắt đầu cuộc phiêu lưu của ngươi."
                        ),
                    )
                ]
            )
        return session_state[self.state_key]

    def get_state(self, session_state: Any) -> GameState:
        return self.bootstrap(session_state)

    def save_to_file(self, game_state: GameState, file_path: str | Path) -> Path:
        target = Path(file_path)
        target.write_text(json.dumps(game_state.to_dict(), ensure_ascii=False, indent=2), encoding="utf-8")
        return target

    def load_from_file(self, session_state: Any, file_path: str | Path) -> GameState:
        source = Path(file_path)
        payload = json.loads(source.read_text(encoding="utf-8"))
        character_payload = payload.get("character", {})
        character = CharacterState(
            name=character_payload.get("name", "Xekko"),
            race=character_payload.get("race", "Human"),
            class_name=character_payload.get("class_name", "Fighter"),
            background=character_payload.get("background", "Adventurer"),
            level=character_payload.get("level", 1),
            hp=character_payload.get("hp", 10),
            max_hp=character_payload.get("max_hp", 10),
            temp_hp=character_payload.get("temp_hp", 0),
            ac=character_payload.get("ac", 10),
            speed=character_payload.get("speed", 30),
            inspiration=character_payload.get("inspiration", False),
            ability_scores=character_payload.get("ability_scores", {}),
            inventory=character_payload.get("inventory", []),
        )
        game_state = GameState(
            character=character,
            messages=[ChatMessage(**message) for message in payload.get("messages", [])],
            dice_history=payload.get("dice_history", []),
            last_intent=payload.get("last_intent", "idle"),
            version=payload.get("version", 1),
        )
        session_state[self.state_key] = game_state
        return game_state

    def update_character(self, game_state: GameState, **updates: Any) -> GameState:
        for field_name, value in updates.items():
            if hasattr(game_state.character, field_name):
                setattr(game_state.character, field_name, value)
        return game_state

    def append_message(self, game_state: GameState, role: str, content: str) -> GameState:
        game_state.messages.append(ChatMessage(role=role, content=content))
        return game_state

    def append_dice_roll(self, game_state: GameState, label: str) -> GameState:
        game_state.dice_history.append(label)
        return game_state