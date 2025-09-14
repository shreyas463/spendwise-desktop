-- Insert default categories
INSERT INTO categories (id, name, description, color, parent_id) VALUES
    (uuid_generate_v4(), 'Food & Dining', 'Restaurants, groceries, and food-related expenses', '#FF6B6B', NULL),
    (uuid_generate_v4(), 'Transportation', 'Gas, public transport, rideshare, car maintenance', '#4ECDC4', NULL),
    (uuid_generate_v4(), 'Shopping', 'Clothing, electronics, general merchandise', '#45B7D1', NULL),
    (uuid_generate_v4(), 'Entertainment', 'Movies, games, subscriptions, hobbies', '#96CEB4', NULL),
    (uuid_generate_v4(), 'Bills & Utilities', 'Electricity, water, internet, phone bills', '#FFEAA7', NULL),
    (uuid_generate_v4(), 'Healthcare', 'Medical expenses, pharmacy, health insurance', '#DDA0DD', NULL),
    (uuid_generate_v4(), 'Education', 'Tuition, books, courses, training', '#98D8C8', NULL),
    (uuid_generate_v4(), 'Travel', 'Hotels, flights, vacation expenses', '#F7DC6F', NULL),
    (uuid_generate_v4(), 'Income', 'Salary, freelance, investments, refunds', '#82E0AA', NULL),
    (uuid_generate_v4(), 'Transfer', 'Bank transfers, account movements', '#F8C471', NULL),
    (uuid_generate_v4(), 'Other', 'Miscellaneous expenses not categorized', '#BB8FCE', NULL)
ON CONFLICT (name) DO NOTHING;

-- Insert default categorization rules
INSERT INTO categorization_rules (name, description, pattern, category_id, priority) 
SELECT 
    'Restaurant Pattern',
    'Matches common restaurant keywords',
    '(restaurant|cafe|diner|bistro|grill|pizza|burger|sushi|chinese|mexican|italian|thai|indian)',
    c.id,
    10
FROM categories c WHERE c.name = 'Food & Dining'
ON CONFLICT DO NOTHING;

INSERT INTO categorization_rules (name, description, pattern, category_id, priority) 
SELECT 
    'Grocery Pattern',
    'Matches grocery store keywords',
    '(grocery|supermarket|walmart|target|costco|safeway|kroger|whole foods|trader joe)',
    c.id,
    10
FROM categories c WHERE c.name = 'Food & Dining'
ON CONFLICT DO NOTHING;

INSERT INTO categorization_rules (name, description, pattern, category_id, priority) 
SELECT 
    'Gas Station Pattern',
    'Matches gas station keywords',
    '(gas|fuel|shell|exxon|bp|chevron|mobil|arco|speedway)',
    c.id,
    10
FROM categories c WHERE c.name = 'Transportation'
ON CONFLICT DO NOTHING;

INSERT INTO categorization_rules (name, description, pattern, category_id, priority) 
SELECT 
    'Uber/Lyft Pattern',
    'Matches rideshare keywords',
    '(uber|lyft|rideshare)',
    c.id,
    10
FROM categories c WHERE c.name = 'Transportation'
ON CONFLICT DO NOTHING;

INSERT INTO categorization_rules (name, description, pattern, category_id, priority) 
SELECT 
    'Amazon Pattern',
    'Matches Amazon purchases',
    '(amazon|amzn)',
    c.id,
    10
FROM categories c WHERE c.name = 'Shopping'
ON CONFLICT DO NOTHING;

INSERT INTO categorization_rules (name, description, pattern, category_id, priority) 
SELECT 
    'Netflix Pattern',
    'Matches streaming services',
    '(netflix|spotify|hulu|disney|youtube|apple music)',
    c.id,
    10
FROM categories c WHERE c.name = 'Entertainment'
ON CONFLICT DO NOTHING;

INSERT INTO categorization_rules (name, description, pattern, category_id, priority) 
SELECT 
    'Utility Pattern',
    'Matches utility companies',
    '(electric|water|gas|internet|phone|verizon|at&t|comcast)',
    c.id,
    10
FROM categories c WHERE c.name = 'Bills & Utilities'
ON CONFLICT DO NOTHING;

-- Insert default user preferences
INSERT INTO user_preferences (key, value) VALUES
    ('theme', 'light'),
    ('currency', 'USD'),
    ('date_format', 'MM/DD/YYYY'),
    ('default_chart_period', '6'),
    ('auto_categorize', 'true'),
    ('notifications_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
