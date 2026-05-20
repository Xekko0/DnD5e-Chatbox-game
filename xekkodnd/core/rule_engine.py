from __future__ import annotations

import random
import re
from dataclasses import dataclass

from .models import GameState


ROLL_PATTERN = re.compile(r"roll\s*d(?P<sides>\d+)", re.IGNORECASE)


@dataclass
class RuleResult:
    accepted: bool
    message: str
    dice_roll: int | None = None
    intent: str = "chat"


class RuleEngine:
    def parse_intent(self, text: str) -> str:
        if ROLL_PATTERN.search(text):
            return "roll"
        if text.startswith("/"):
            return "meta"
        return "chat"

    def resolve_roll(self, text: str) -> RuleResult:
        match = ROLL_PATTERN.search(text)
        if not match:
            return RuleResult(accepted=False, message="Không tìm thấy lệnh roll hợp lệ.", intent="roll")

        sides = int(match.group("sides"))
        if sides < 2:
            return RuleResult(accepted=False, message="Mặt xúc xắc phải lớn hơn hoặc bằng d2.", intent="roll")

        value = random.randint(1, sides)
        return RuleResult(accepted=True, message=f"🎲 d{sides} = **{value}**", dice_roll=value, intent="roll")

    def validate_character_change(self, game_state: GameState) -> RuleResult:
        character = game_state.character
        if character.hp > character.max_hp:
            return RuleResult(accepted=False, message="HP không thể lớn hơn Max HP.", intent="validation")
        if character.level < 1:
            return RuleResult(accepted=False, message="Level phải tối thiểu là 1.", intent="validation")
        return RuleResult(accepted=True, message="State hợp lệ.", intent="validation")

    def build_dm_prompt(self) -> str:
        return (
            "Bạn là Dungeon Master chuyên nghiệp cho Dungeons & Dragons 5th Edition, chỉ chơi 1 người chơi.\n"
            "- Luôn giữ luật DnD 5e nghiêm ngặt (kiểm tra ability check, attack roll, saving throw...).\n"
            "- Mô tả cảnh sống động, kịch tính, giàu chi tiết giác quan.\n"
            "- Không spoil plot, không quyết định hành động thay người chơi.\n"
            "- Người chơi có thể roll dice bất kỳ lúc nào bằng cách nói 'roll d20' hoặc dùng nút Roll Dice.\n"
            "- Trả lời bằng tiếng Việt, giọng văn anh hùng, cổ tích, hài hước khi phù hợp.\n"
            "- Giữ độ dài câu trả lời vừa phải (3-8 câu)."
        )