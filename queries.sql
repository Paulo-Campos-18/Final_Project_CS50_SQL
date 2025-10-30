--Selects

-- Lists games with low available stock of keys.
SELECT g."name",kp."total_keys", ak."available_keys"
FROM "games" g
LEFT JOIN "keys_per_game" kp ON g."name" = kp."name"
LEFT JOIN "available_keys_per_game" ak ON g."name" = ak."name"
WHERE ak."available_keys" < 5
ORDER BY ak."available_keys" ASC;

-- List each game's revenue, total cost of all keys purchased, and total profit
SELECT g."name", r."total_revenue", c."total_cost",p."total_profit"
FROM "games" g
JOIN "revenue_per_game" r ON g."id" = r."game_id"
JOIN "cost_per_game" c ON g."id" = c."game_id"
JOIN "profit_per_game" p ON g."id" = p."game_id"
ORDER BY p."total_profit" DESC;

--Show most used payment mnethod
SELECT pm."name",count(t."id") AS "payment_count"
FROM "payment_method" pm
JOIN "transactions" t ON t."payment_method_id" = pm."id"
GROUP BY pm."id"
ORDER BY "payment_count" DESC;

--Show amount of users money in the site
SELECT SUM("amount")
FROM "users";

--Show amount money in deleted accoutns
SELECT SUM("amount") AS "amount_sum"
FROM "users"
WHERE "deleted" = 1;

--Shwo money espent by deleted accounts
SELECT SUM(t."total_price") AS "Total_espent"
FROM "transactions" t
JOIN "orders" o ON t."order_id" = o."id"
JOIN "users" u ON u."id" = o."user_id"
WHERE u."deleted" = 1;

--Show avarenge of espend money this month per user
SELECT
    ROUND(AVG(total_gasto), 2) AS "average_spend_per_user"
FROM (
    SELECT
        u."id" AS user_id,
        SUM(t."total_price") AS total_gasto
    FROM "transactions" t
    JOIN "orders" o ON t."order_id" = o."id"
    JOIN "users" u ON u."id" = o."user_id"
    WHERE
        DATE(t."transaction_datetime") BETWEEN '2024-03-01' AND '2024-03-31'
    GROUP BY u."id"
);

-- Shows the total profit across all games in the store.
SELECT SUM("total_profit") AS "overall_profit"
FROM "profit_per_game";

--Show information from deleted users (if exist)
SELECT * FROM "users"
WHERE "deleted" = 1;

--Show games genre with most comments
SELECT ge."name" AS "genre_name",
    COUNT(gc."id") AS "total_comments"
FROM "genres" ge
JOIN "game_genres" gg ON gg."genre_id" = ge."id"
JOIN "games" g ON g."id" = gg."game_id"
JOIN "game_comments" gc ON gc."game_id" = g."id"
GROUP BY ge."id", ge."name"
ORDER BY "total_comments" DESC;

--Show games with most comments
SELECT g."name", COUNT(gc."id") AS "comments_count"
FROM "games" g
JOIN "game_comments" gc ON gc."game_id" = g."id"
GROUP BY g."id"
ORDER BY "comments_count" DESC;

--Show how many keys per status
SELECT ks."status" AS "key_status",
  COUNT(k."id") AS "keys_count"
FROM "key_status" ks
LEFT JOIN "keys" k ON k."key_status_id" = ks."id"
GROUP BY ks."id", ks."status"
ORDER BY "keys_count" DESC, ks."status";


--Show users accounts create per year
SELECT COUNT("id") AS "total_users_created",strftime('%Y',"created_at") AS "year"
FROM "users"
GROUP BY "year"
ORDER BY "year" DESC;

--Show how many sold and bought and total per game
SELECT
    g."name" AS "game_name",
    kp."total_keys",
    ms."sold_count",
    av."available_keys"
FROM "games" g
LEFT JOIN "keys_per_game" kp ON g."name" = kp."name"
LEFT JOIN "most_sold_games" ms ON g."name" = ms."name"
LEFT JOIN "available_keys_per_game" av ON g."name" = av."name"
ORDER BY "total_keys" DESC, "sold_count" DESC;

--Inserts
INSERT INTO users ("first_name","last_name","nickname","email","password")
VALUES
('Paulo','Campos','paulo_campos','paulo@gmail','abc'),
('Emylly','Portela','Aiko','emylly@gmail','46554##$$'),
('Pedro','Henrique','Pedroca','pedro@gmail.com','marcela123'),
('Marcela','Mafra','little_marcela','marcela@gmail.com','pedro123');

INSERT INTO genres ("name")
VALUES
('Action'),
('Adventure'),
('RPG'),
('Horror'),
('Strategy'),
('Simulation'),
('Sports'),
('Puzzle');

INSERT INTO platforms ("name")
VALUES
('Epic Games'),
('Nintendo'),
('PlayStation'),
('Steam'),
('Xbox');

INSERT INTO key_status ("status")
VALUES
('Available'),
('Sold'),
('Refunded'),
('Expired');

INSERT INTO games ("active_platform_id", "name", "studio", "description", "release_date", "price")
VALUES
(4, 'The Witcher 3: Wild Hunt', 'CD Projekt Red', 'Open-world RPG following Geralt of Rivia', '2015-05-19', 39.99),
(4, 'Cyberpunk 2077', 'CD Projekt Red', 'Futuristic open-world RPG', '2020-12-10', 59.99),
(3, 'God of War', 'Santa Monica Studio', 'Action-adventure following Kratos and Atreus', '2018-04-20', 49.99),
(4, 'Grand Theft Auto V', 'Rockstar Games', 'Open-world action-adventure game', '2015-04-14', 29.99),
(4, 'Red Dead Redemption 2', 'Rockstar Games', 'Western action-adventure epic', '2019-11-05', 59.99),
(3, 'The Last of Us Part II', 'Naughty Dog', 'Post-apocalyptic action-adventure', '2020-06-19', 69.99),
(2, 'The Legend of Zelda: Breath of the Wild', 'Nintendo', 'Open-world adventure game', '2017-03-03', 59.99),
(4, 'Elden Ring', 'FromSoftware', 'Open-world action RPG', '2022-02-25', 59.99),
(4, 'Baldur''s Gate 3', 'Larian Studios', 'Fantasy role-playing game', '2023-08-03', 59.99),
(4, 'Minecraft', 'Mojang Studios', 'Sandbox survival game', '2011-11-18', 26.95),
(3, 'Spider-Man: Miles Morales', 'Insomniac Games', 'Superhero action-adventure game', '2020-11-12', 49.99),
(4, 'Starfield', 'Bethesda', 'Space-themed action RPG', '2023-09-06', 69.99),
(1, 'Alan Wake 2', 'Remedy Entertainment', 'Survival horror game sequel', '2023-10-27', 59.99);

INSERT INTO suppliers ("platform_id", "name", "website", "contact_email")
VALUES
(4, 'Humble Bundle', 'https://humblebundle.com', 'partners@humblebundle.com'),
(3, 'PlayStation Store', 'https://store.playstation.com', 'publishing@sony.com'),
(2, 'Nintendo eShop', 'https://nintendo.com', 'developer@nintendo.com'),
(1, 'Epic Games Publishing', 'https://epicgames.com', 'dev-support@epicgames.com');

INSERT INTO game_genres ("game_id", "genre_id")
VALUES
-- The Witcher 3: Wild Hunt (RPG, Adventure)
(1, 3), (1, 2),
-- Cyberpunk 2077 (RPG, Action)
(2, 3), (2, 1),
-- God of War (Action, Adventure)
(3, 1), (3, 2),
-- Grand Theft Auto V (Action, Adventure)
(4, 1), (4, 2),
-- Red Dead Redemption 2 (Action, Adventure)
(5, 1), (5, 2),
-- The Last of Us Part II (Action, Adventure, Horror)
(6, 1), (6, 2), (6, 4),
-- The Legend of Zelda: Breath of the Wild (Adventure, Action, RPG)
(7, 2), (7, 1), (7, 3),
-- Elden Ring (RPG, Action, Adventure)
(8, 3), (8, 1), (8, 2),
-- Baldur's Gate 3 (RPG, Strategy)
(9, 3), (9, 5),
-- Minecraft (Adventure, Simulation)
(10, 2), (10, 6),
-- Spider-Man: Miles Morales (Action, Adventure)
(11, 1), (11, 2),
-- Starfield (RPG, Action, Adventure)
(12, 3), (12, 1), (12, 2),
-- Alan Wake 2 (Horror, Action)
(13, 4), (13, 1);

INSERT INTO key_batches ("game_id", "supplier_id", "unit_price", "quantity", "purchase_date")
VALUES
(1, 1, 15.00, 100, '2024-01-15'),
(2, 1, 25.00, 50, '2024-02-01'),
(3, 2, 20.00, 75, '2024-01-20'),
(7, 3, 30.00, 60, '2024-02-10');

INSERT INTO keys ("game_id", "batch_id", "key_status_id", "key_code")
VALUES
(1, 1, 1, 'TW3H-7XK9-B2N4-M8P6'),
(1, 1, 1, 'TW3H-5R2D-9F7G-1H3J'),
(1, 1, 2, 'TW3H-8K4L-6Q9W-2E5R'),
(2, 2, 1, 'CP77-3T6Y-8U1I-4O7P'),
(2, 2, 1, 'CP77-9A2S-5D4F-7G8H'),
(3, 3, 1, 'GOW4-1J5K-9L2Z-6X8C'),
(3, 3, 2, 'GOW4-4V7B-3N1M-5Q9W'),
(7, 4, 1, 'ZELDA-2E4R-6T8Y-1U3I'),
(7, 4, 1, 'ZELDA-5O7P-9A2S-4D6F'),
(7, 4, 1, 'ZELDA-8G1H-3J5K-7L9Z'),
(1, 1, 3, 'TW3H-6X8C-4V2B-9N1M'),
(2, 2, 1, 'CP77-7Q3W-5E1R-2T4Y');

INSERT INTO orders ("user_id", "purchase_datetime")
VALUES
(1, '2024-03-01 14:30:00'),
(2, '2024-03-02 10:15:00'),
(3, '2024-03-03 16:45:00'),
(4, '2024-03-04 20:20:00');

INSERT INTO payment_method ("name")
VALUES
('Wallet'),
('Credit Card'),
('Debit Card'),
('PayPal'),
('PIX');

INSERT INTO order_keys ("order_id", "key_id", "unit_price")
VALUES
(1, 12, 39.99),
(2, 2, 59.99),
(3, 8, 59.99),
(4, 4, 59.99);

INSERT INTO transactions ("order_id", "payment_method_id", "total_price", "transaction_datetime")
VALUES
(1, 1, 39.99, '2024-03-01 14:32:00'),
(2, 4, 49.99, '2024-03-02 10:18:00'),
(3, 2, 59.99, '2024-03-03 16:47:00'),
(4, 3, 59.99, '2024-03-04 20:25:00');

INSERT INTO wishlist ("user_id", "game_id")
VALUES
(1, 2),
(2, 7),
(3, 8),
(4, 9),
(1, 5),
(1, 11),
(2, 3);

INSERT INTO game_comments ("user_id", "game_id", "comment_text")
VALUES
(1, 1, 'Amazing game! The story and characters are incredible.'),
(2, 7, 'Best Zelda game ever made, the open world is breathtaking.'),
(3, 8, 'Challenging but rewarding, FromSoftware did it again!'),
(4, 9, 'The depth of choices and character development is outstanding.'),
(1, 7, 'Exceeded my expectations.');

INSERT INTO game_rating ("user_id", "game_id", "rating")
VALUES
(1, 1, 9.5),
(1, 2, 8.0),
(2, 7, 10.0),
(3, 8, 9.8),
(4, 9, 9.7),
(2, 3, 9.2),
(3, 5, 9.4),
(4, 11, 8.5);

INSERT INTO game_price_log ("game_id", "old_price", "new_price")
VALUES
(1, 49.99, 39.99),
(2, 69.99, 59.99),
(3, 59.99, 49.99),
(4, 39.99, 29.99);
