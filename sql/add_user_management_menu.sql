-- Tambah menu User Management dan submenunya
INSERT INTO menu_items (menu_key, menu_name, parent_id, sort_order) VALUES
('user_management', 'User Management', NULL, 8),
('user-details', 'Details', (SELECT id FROM menu_items WHERE menu_key = 'user_management'), 1),
('user-privileges', 'Group Privilege', (SELECT id FROM menu_items WHERE menu_key = 'user_management'), 2);
