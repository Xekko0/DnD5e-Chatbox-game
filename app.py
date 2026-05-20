from __future__ import annotations

import random
from pathlib import Path

import streamlit as st

try:
    import ollama
except ImportError:  # pragma: no cover - local fallback for environments without Ollama.
    ollama = None

from xekkodnd.core.models import ChatMessage
from xekkodnd.core.rule_engine import RuleEngine
from xekkodnd.core.state_manager import StateManager
from xekkodnd.ui.character_sheet import render_character_sheet
from xekkodnd.ui.chat import render_chat_history, render_chat_input


CHARACTER_WIDGET_FIELDS = {
    "character_name": "name",
    "character_race": "race",
    "character_class_name": "class_name",
    "character_level": "level",
    "character_hp": "hp",
    "character_max_hp": "max_hp",
    "character_temp_hp": "temp_hp",
    "character_ac": "ac",
    "character_speed": "speed",
    "character_inspiration": "inspiration",
}


def hydrate_character_widgets(character) -> None:
    for widget_key, field_name in CHARACTER_WIDGET_FIELDS.items():
        st.session_state[widget_key] = getattr(character, field_name)


def sync_character_from_widgets(game_state) -> None:
    state_updates = {
        "name": st.session_state.get("character_name", game_state.character.name),
        "race": st.session_state.get("character_race", game_state.character.race),
        "class_name": st.session_state.get("character_class_name", game_state.character.class_name),
        "level": st.session_state.get("character_level", game_state.character.level),
        "hp": st.session_state.get("character_hp", game_state.character.hp),
        "max_hp": st.session_state.get("character_max_hp", game_state.character.max_hp),
        "temp_hp": st.session_state.get("character_temp_hp", game_state.character.temp_hp),
        "ac": st.session_state.get("character_ac", game_state.character.ac),
        "speed": st.session_state.get("character_speed", game_state.character.speed),
        "inspiration": st.session_state.get("character_inspiration", game_state.character.inspiration),
    }

    for ability in ["STR", "DEX", "CON", "INT", "WIS", "CHA"]:
        state_updates.setdefault("ability_scores", {})[ability] = st.session_state.get(
            f"character_ability_{ability}",
            game_state.character.ability_scores.get(ability, 10),
        )

    game_state.character.name = state_updates["name"]
    game_state.character.race = state_updates["race"]
    game_state.character.class_name = state_updates["class_name"]
    game_state.character.level = state_updates["level"]
    game_state.character.hp = state_updates["hp"]
    game_state.character.max_hp = state_updates["max_hp"]
    game_state.character.temp_hp = state_updates["temp_hp"]
    game_state.character.ac = state_updates["ac"]
    game_state.character.speed = state_updates["speed"]
    game_state.character.inspiration = state_updates["inspiration"]
    game_state.character.ability_scores.update(state_updates["ability_scores"])


st.set_page_config(page_title="XekkoDND MVP", layout="wide")
st.title("XekkoDND - MVP")
st.caption("Local-first solo D&D 5e scaffold with Waterfall roadmap and MVP core loop.")

state_manager = StateManager()
rule_engine = RuleEngine()
game_state = state_manager.bootstrap(st.session_state)
hydrate_character_widgets(game_state.character)

with st.sidebar:
    st.subheader("State Manager")
    save_path = st.text_input("Save file", value="xekkodnd-save.json")
    if st.button("Save state"):
        saved_file = state_manager.save_to_file(game_state, save_path)
        st.success(f"Saved to {saved_file}")

    uploaded_file = st.file_uploader("Load state", type=["json"])
    if uploaded_file is not None:
        temp_path = Path(".xekkodnd-upload.json")
        try:
            temp_path.write_bytes(uploaded_file.getbuffer())
            game_state = state_manager.load_from_file(st.session_state, temp_path)
            hydrate_character_widgets(game_state.character)
            st.success("State loaded")
            st.rerun()
        finally:
            if temp_path.exists():
                temp_path.unlink()

    st.divider()
    with st.expander("State Snapshot", expanded=True):
        st.caption("Live game state for debugging and MVP verification.")
        st.json(game_state.to_dict())

left_col, right_col = st.columns([1.2, 1])

with left_col:
    st.subheader("Chat")
    render_chat_history(game_state.messages)

    dice_columns = st.columns(4)
    for label, sides, column in zip(
        ["Roll d20", "Roll d6", "Roll d8", "Roll d12"],
        [20, 6, 8, 12],
        dice_columns,
    ):
        with column:
            if st.button(f"🎲 {label}"):
                value = random.randint(1, sides)
                state_manager.append_dice_roll(game_state, f"d{sides}={value}")
                state_manager.append_message(game_state, "assistant", f"🎲 {label}: **{value}**")
                st.rerun()

    prompt = render_chat_input()
    if prompt:
        state_manager.append_message(game_state, "user", prompt)
        intent = rule_engine.parse_intent(prompt)
        game_state.last_intent = intent

        if intent == "roll":
            result = rule_engine.resolve_roll(prompt)
            state_manager.append_message(game_state, "assistant", result.message)
            if result.dice_roll is not None:
                state_manager.append_dice_roll(game_state, f"prompt:{result.dice_roll}")
        else:
            validation = rule_engine.validate_character_change(game_state)
            if not validation.accepted:
                state_manager.append_message(game_state, "assistant", validation.message)
            else:
                system_prompt = rule_engine.build_dm_prompt()
                fallback_reply = (
                    "Hệ thống MVP đã nhận lệnh của ngươi. "
                    "Chúng ta sẽ mở rộng narrative sau khi state và rule loop ổn định."
                )
                if ollama is None:
                    answer = fallback_reply
                else:
                    try:
                        response = ollama.chat(
                            model="llama3.1:8b",
                            messages=[
                                {"role": "system", "content": system_prompt},
                                *[
                                    {"role": message.role, "content": message.content}
                                    for message in game_state.messages
                                ],
                            ],
                        )
                        answer = response["message"]["content"]
                    except Exception:
                        answer = fallback_reply
                state_manager.append_message(game_state, "assistant", answer)

        st.rerun()

with right_col:
    render_character_sheet(game_state.character)
    sync_character_from_widgets(game_state)