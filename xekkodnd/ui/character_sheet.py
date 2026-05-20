from __future__ import annotations

import streamlit as st

from ..core.models import CharacterState


ABILITY_KEYS = ["STR", "DEX", "CON", "INT", "WIS", "CHA"]


def render_character_sheet(character: CharacterState) -> None:
    st.subheader("Character Sheet")

    st.text_input("Name", key="character_name")
    st.text_input("Race", key="character_race")
    st.text_input("Class", key="character_class_name")

    sheet_columns = st.columns(4)
    with sheet_columns[0]:
        st.number_input("Level", min_value=1, max_value=20, key="character_level")
        st.number_input("HP", min_value=0, key="character_hp")
    with sheet_columns[1]:
        st.number_input("Max HP", min_value=1, key="character_max_hp")
        st.number_input("Temp HP", min_value=0, key="character_temp_hp")
    with sheet_columns[2]:
        st.number_input("AC", min_value=0, key="character_ac")
        st.number_input("Speed", min_value=0, key="character_speed")
    with sheet_columns[3]:
        st.checkbox("Inspiration", key="character_inspiration")

    st.write("Ability Scores")
    ability_columns = st.columns(3)
    for index, ability in enumerate(ABILITY_KEYS):
        with ability_columns[index % 3]:
            st.number_input(
                ability,
                min_value=1,
                max_value=30,
                key=f"character_ability_{ability}",
            )

    st.write("Inventory")
    st.write(character.inventory)