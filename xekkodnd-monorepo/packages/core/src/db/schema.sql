-- XekkoDND — Database Schema (PLAN_V5 §6)
-- 28+ bảng SQLite — dùng Tauri SQL plugin (M1) hoặc Dexie IndexedDB (fallback web)
-- TODO: Implement schema đầy đủ

-- ============================================================
-- ADVENTURES & CAMPAIGNS (2 bảng)
-- ============================================================
-- adventures
-- campaigns

-- ============================================================
-- ENTITIES & CHARACTERS (8 bảng)
-- ============================================================
-- entities            (gốc cho mọi character: player, npc, monster, pet)
-- inventory_items
-- equipment_slots
-- skills_proficiencies
-- save_proficiencies
-- abilities           (spells + class features)
-- conditions_active
-- entity_knowledge    (NPC knowledge với privacy levels M2)

-- ============================================================
-- POSITION & MAP (10 bảng)
-- ============================================================
-- entity_positions
-- world_maps
-- world_regions
-- world_pois
-- maps                (regional + local)
-- map_tiles           (terrain per tile)
-- map_pois
-- tile_visibility
-- tile_visits
-- entity_known_locations

-- ============================================================
-- ITEMS (1 bảng thêm)
-- ============================================================
-- floating_items      (items đang nổi trong scene chờ pickup)
-- tile_items          (items trên map tile)

-- ============================================================
-- QUESTS (4 bảng)
-- ============================================================
-- quests
-- quest_objectives
-- quest_branches
-- quest_events

-- ============================================================
-- MEMORY (4 bảng)
-- ============================================================
-- messages
-- memories            (auto-summary mỗi 5 turn)
-- events              (raw event log)
-- story_cards         (manual user-created)

-- ============================================================
-- WORLD STATE (1 bảng)
-- ============================================================
-- world_state         (singleton per adventure)

-- ============================================================
-- INDEXES quan trọng
-- ============================================================
-- CREATE INDEX idx_memories_adventure ON memories(adventure_id, importance DESC);
-- CREATE INDEX idx_npcs_name ON entities(adventure_id, name);
-- CREATE INDEX idx_events_turn ON events(adventure_id, turn);
-- CREATE INDEX idx_tile_visibility ON tile_visibility(entity_id, map_id);
-- CREATE INDEX idx_tile_items ON tile_items(map_id, tile_x, tile_y);
-- CREATE INDEX idx_floating_state ON floating_items(adventure_id, state);
-- CREATE INDEX idx_quest_objectives ON quest_objectives(quest_id, status);
-- CREATE INDEX idx_inventory_owner ON inventory_items(entity_id, equipped);
