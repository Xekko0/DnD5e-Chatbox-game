from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


DEFAULT_ABILITY_SCORES = {
    "STR": 10,
    "DEX": 10,
    "CON": 10,
    "INT": 10,
    "WIS": 10,
    "CHA": 10,
}


@dataclass
class ChatMessage:
    role: str
    content: str


@dataclass
class CharacterState:
    name: str = "Xekko"
    race: str = "Human"
    class_name: str = "Fighter"
    background: str = "Adventurer"
    level: int = 1
    hp: int = 10
    max_hp: int = 10
    temp_hp: int = 0
    ac: int = 10
    speed: int = 30
    inspiration: bool = False
    ability_scores: dict[str, int] = field(default_factory=lambda: DEFAULT_ABILITY_SCORES.copy())
    inventory: list[str] = field(default_factory=lambda: ["Explorer's Pack", "Simple Weapon"])

    @property
    def ability_modifiers(self) -> dict[str, int]:
        return {ability: (score - 10) // 2 for ability, score in self.ability_scores.items()}

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["ability_modifiers"] = self.ability_modifiers
        return data


@dataclass
class GameState:
    character: CharacterState = field(default_factory=CharacterState)
    messages: list[ChatMessage] = field(default_factory=list)
    dice_history: list[str] = field(default_factory=list)
    last_intent: str = "idle"
    version: int = 1

    def to_dict(self) -> dict[str, Any]:
        return {
            "character": self.character.to_dict(),
            "messages": [asdict(message) for message in self.messages],
            "dice_history": list(self.dice_history),
            "last_intent": self.last_intent,
            "version": self.version,
        }