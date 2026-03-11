-- Add theme_color to agents
ALTER TABLE agents ADD COLUMN theme_color VARCHAR(7) DEFAULT '#3B82F6';

-- Update existing agents
UPDATE agents SET theme_color = '#3B82F6' WHERE theme_color IS NULL;
