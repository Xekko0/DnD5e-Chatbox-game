from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from .models import ChatMessage, CharacterState, GameState

logger = logging.getLogger(__name__)

_REQUIRED_TOP_KEYS = {"character", "messages", "version"}
_REQUIRED_CHARACTER_KEYS = {"name", "race", "class_name", "level", "hp", "max_hp", "ac"}
_SUPPORTED_VERSIONS = {1}


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

    @staticmethod
    def _validate_payload(payload: Any, source: Path) -> None:
        """Raise ValueError with a clear message if the save file has an unexpected schema."""
        if not isinstance(payload, dict):
            raise ValueError(f"Save file '{source}' is not a JSON object.")

        missing_top = _REQUIRED_TOP_KEYS - payload.keys()
        if missing_top:
            raise ValueError(f"Save file '{source}' missing keys: {missing_top}.")

        version = payload.get("version", 1)
        if version not in _SUPPORTED_VERSIONS:
            raise ValueError(
                f"Save file version {version!r} is not supported. "
                f"Supported: {_SUPPORTED_VERSIONS}."
            )

        char = payload.get("character", {})
        if not isinstance(char, dict):
            raise ValueError(f"Save file '{source}': 'character' field must be an object.")

        missing_char = _REQUIRED_CHARACTER_KEYS - char.keys()
        if missing_char:
            raise ValueError(f"Save file '{source}' character missing keys: {missing_char}.")

        if not isinstance(char.get("level", 1), int) or not (1 <= char["level"] <= 20):
            raise ValueError(f"Save file '{source}': character level must be 1–20.")

        if not isinstance(payload.get("messages", []), list):
            raise ValueError(f"Save file '{source}': 'messages' must be a list.")

    def load_from_file(self, session_state: Any, file_path: str | Path) -> GameState:
        source = Path(file_path)
        if not source.exists():
            raise FileNotFoundError(f"Save file not found: '{source}'.")

        try:
            payload = json.loads(source.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise ValueError(f"Save file '{source}' is not valid JSON: {exc}") from exc

        self._validate_payload(payload, source)

        character_payload = payload["character"]
        character = CharacterState(
            name=character_payload.get("name", "Xekko"),
            race=character_payload.get("race", "Human"),
            class_name=character_payload.get("class_name", "Fighter"),
            background=character_payload.get("background", "Adventurer"),
            level=int(character_payload.get("level", 1)),
            hp=int(character_payload.get("hp", 10)),
            max_hp=int(character_payload.get("max_hp", 10)),
            temp_hp=int(character_payload.get("temp_hp", 0)),
            ac=int(character_payload.get("ac", 10)),
            speed=int(character_payload.get("speed", 30)),
            inspiration=bool(character_payload.get("inspiration", False)),
            ability_scores=character_payload.get("ability_scores", {}),
            inventory=character_payload.get("inventory", []),
        )

        raw_messages = payload.get("messages", [])
        messages: list[ChatMessage] = []
        for i, msg in enumerate(raw_messages):
            if not isinstance(msg, dict) or "role" not in msg or "content" not in msg:
                logger.warning("Skipping malformed message at index %d in '%s'.", i, source)
                continue
            messages.append(ChatMessage(role=str(msg["role"]), content=str(msg["content"])))

        game_state = GameState(
            character=character,
            messages=messages,
            dice_history=list(payload.get("dice_history", [])),
            last_intent=str(payload.get("last_intent", "idle")),
            version=int(payload.get("version", 1)),
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