-- Update existing product conditions to match the new detailed scale

UPDATE products SET condition = '🟢 New / Brand New' WHERE condition = 'New';
UPDATE products SET condition = '🟢 Mint / Like New' WHERE condition = 'Like New';
UPDATE products SET condition = '🟢 Excellent' WHERE condition = 'Excellent';
UPDATE products SET condition = '🟡 Good' WHERE condition = 'Good';
UPDATE products SET condition = '🟠 Fair' WHERE condition = 'Fair';
