-- Seed provision items and expenses
INSERT INTO provision_items (id, name, unit, unit_cost, unit_measure) VALUES 
  ('prov_001', 'Rice', 'kg', 45.00, '1 kg'),
  ('prov_002', 'Dal (Toor)', 'kg', 120.00, '1 kg'),
  ('prov_003', 'Wheat Flour', 'kg', 35.00, '1 kg'),
  ('prov_004', 'Cooking Oil', 'ltr', 140.00, '1 ltr'),
  ('prov_005', 'Onions', 'kg', 25.00, '1 kg'),
  ('prov_006', 'Potatoes', 'kg', 20.00, '1 kg'),
  ('prov_007', 'Tomatoes', 'kg', 30.00, '1 kg'),
  ('prov_008', 'Milk', 'ltr', 55.00, '1 ltr'),
  ('prov_009', 'Sugar', 'kg', 42.00, '1 kg'),
  ('prov_010', 'Salt', 'kg', 18.00, '1 kg'),
  ('prov_011', 'Tea Leaves', 'kg', 280.00, '1 kg'),
  ('prov_012', 'Spices Mix', 'kg', 150.00, '1 kg'),
  ('prov_013', 'Vegetables (Mixed)', 'kg', 35.00, '1 kg'),
  ('prov_014', 'Chicken', 'kg', 180.00, '1 kg'),
  ('prov_015', 'Fish', 'kg', 220.00, '1 kg')
ON CONFLICT (name) DO NOTHING;

-- Add sample expenses for December 2024
INSERT INTO expenses (id, type, amount, date, description) VALUES 
  ('exp_001', 'LABOUR', 25000.00, '2024-12-01', 'Kitchen staff salaries'),
  ('exp_002', 'LABOUR', 8000.00, '2024-12-01', 'Cleaning staff wages'),
  ('exp_003', 'PROVISION', 15000.00, '2024-12-02', 'Monthly grocery purchase'),
  ('exp_004', 'UTILITY', 3500.00, '2024-12-03', 'Electricity bill'),
  ('exp_005', 'UTILITY', 1200.00, '2024-12-03', 'Water bill'),
  ('exp_006', 'MAINTENANCE', 2500.00, '2024-12-05', 'Kitchen equipment repair'),
  ('exp_007', 'PROVISION', 8000.00, '2024-12-10', 'Fresh vegetables and meat'),
  ('exp_008', 'OTHER', 1500.00, '2024-12-12', 'Cleaning supplies'),
  ('exp_009', 'PROVISION', 12000.00, '2024-12-15', 'Mid-month grocery restock'),
  ('exp_010', 'LABOUR', 5000.00, '2024-12-15', 'Overtime payments')
ON CONFLICT (id) DO NOTHING;

-- Add provision usage records
INSERT INTO provision_usage (id, provision_item_id, date, quantity) VALUES 
  ('usage_001', 'prov_001', '2024-12-01', 50.000), -- Rice 50kg
  ('usage_002', 'prov_002', '2024-12-01', 20.000), -- Dal 20kg
  ('usage_003', 'prov_003', '2024-12-01', 30.000), -- Wheat flour 30kg
  ('usage_004', 'prov_004', '2024-12-02', 15.000), -- Oil 15ltr
  ('usage_005', 'prov_005', '2024-12-02', 25.000), -- Onions 25kg
  ('usage_006', 'prov_006', '2024-12-02', 40.000), -- Potatoes 40kg
  ('usage_007', 'prov_007', '2024-12-03', 20.000), -- Tomatoes 20kg
  ('usage_008', 'prov_008', '2024-12-03', 100.000), -- Milk 100ltr
  ('usage_009', 'prov_013', '2024-12-05', 35.000), -- Mixed vegetables 35kg
  ('usage_010', 'prov_014', '2024-12-07', 25.000)  -- Chicken 25kg
ON CONFLICT (id) DO NOTHING;
