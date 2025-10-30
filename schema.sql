--To enable foreign key
PRAGMA foreign_keys = ON;
-- Stores player information and account details.
CREATE TABLE "users" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "first_name" VARCHAR(30) NOT NULL,
  "last_name" VARCHAR(30) NOT NULL,
  "nickname" VARCHAR(30) NOT NULL UNIQUE,
  "email" VARCHAR(100) NOT NULL UNIQUE CHECK("email" LIKE '%@%'),
  "password" TEXT NOT NULL,
  "amount" NUMERIC NOT NULL DEFAULT 0 CHECK("amount" >= 0),
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "deleted" INTEGER NOT NULL DEFAULT 0 CHECK("deleted" IN (0,1)) --1 = deleted
);

--Stores the genres of the games.
CREATE TABLE "genres" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" VARCHAR(30) NOT NULL UNIQUE
);

--Stores gaming platforms information.
CREATE TABLE "platforms" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" VARCHAR(40) NOT NULL UNIQUE
);
--Stores details about each game
CREATE TABLE "games" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "active_platform_id" INTEGER NOT NULL,
  "name" VARCHAR(40) NOT NULL UNIQUE,
  "studio" VARCHAR(30) NOT NULL ,
  "description" TEXT,
  "release_date" DATETIME,
  "price" NUMERIC NOT NULL CHECK(price >= 0),
  "deleted" INTEGER NOT NULL DEFAULT 0 CHECK("deleted" IN (0,1)), --1 = deleted
  FOREIGN KEY ("active_platform_id") REFERENCES "platforms"("id")
);

--Links games to their genres.
CREATE TABLE "game_genres" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "game_id" INTEGER NOT NULL,
  "genre_id" INTEGER NOT NULL,
  FOREIGN KEY ("game_id") REFERENCES "games"("id"),
  FOREIGN KEY ("genre_id") REFERENCES "genres"("id"),
  UNIQUE("game_id","genre_id")
);
--Tracks which games each user has added to their wishlist.
CREATE TABLE "wishlist" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "user_id" INTEGER NOT NULL,
  "game_id" INTEGER NOT NULL,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("user_id") REFERENCES "users"("id"),
  FOREIGN KEY ("game_id") REFERENCES "games"("id"),
  UNIQUE("user_id", "game_id")
);

--Stores user comments on games.
CREATE TABLE "game_comments" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "user_id" INTEGER NOT NULL,
  "game_id" INTEGER NOT NULL,
  "comment_text" TEXT NOT NULL,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "deleted" INTEGER NOT NULL DEFAULT 0 CHECK("deleted" IN (0,1)),
  FOREIGN KEY ("user_id") REFERENCES "users"("id"),
  FOREIGN KEY ("game_id") REFERENCES "games"("id")
);

--Stores ratings given by users to games.
CREATE TABLE "game_rating" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "user_id" INTEGER NOT NULL,
  "game_id" INTEGER NOT NULL,
  "rating" NUMERIC NOT NULL CHECK (rating >= 0 AND rating <= 10),
  FOREIGN KEY ("user_id") REFERENCES "users"("id"),
  FOREIGN KEY ("game_id") REFERENCES "games"("id"),
  UNIQUE("user_id","game_id")
);

--Tracks changes in game prices over time.
CREATE TABLE "game_price_log"(
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"game_id" INTEGER NOT NULL,
	"old_price" NUMERIC NOT NULL,
	"new_price" NUMERIC NOT NULL,
	"changed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY ("game_id") REFERENCES "games"("id")
);

--Stores the status of game keys (like Available, Sold, Refunded).
CREATE TABLE "key_status" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "status" VARCHAR(30) NOT NULL UNIQUE
);

--Stores information about suppliers providing game keys.
CREATE TABLE "suppliers" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "platform_id" INTEGER NOT NULL,
  "name" VARCHAR(30) NOT NULL UNIQUE,
  "website" VARCHAR(100) NOT NULL,
  "contact_email" VARCHAR(100) NOT NULL CHECK("contact_email" LIKE '%@%'),
  "deleted" INTEGER NOT NULL DEFAULT 0 CHECK("deleted" IN (0,1)),
  FOREIGN KEY ("platform_id") REFERENCES "platforms"("id")
);

--Stores batches of keys purchased from suppliers.
CREATE TABLE "key_batches" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "game_id" INTEGER NOT NULL,
  "supplier_id" INTEGER NOT NULL,
  "unit_price" NUMERIC NOT NULL,
  "quantity" INTEGER NOT NULL,
  "purchase_date" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("game_id") REFERENCES "games"("id"),
  FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id")
);

--Stores individual game keys.
CREATE TABLE "keys" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "game_id" INTEGER NOT NULL,
  "batch_id" INTEGER NOT NULL,
  "key_status_id" INTEGER NOT NULL,
  "key_code" VARCHAR(40) NOT NULL UNIQUE,
  FOREIGN KEY ("game_id") REFERENCES "games"("id"),
  FOREIGN KEY ("batch_id") REFERENCES "key_batches"("id"),
  FOREIGN KEY ("key_status_id") REFERENCES "key_status"("id")
);

--Stores orders placed by users.
CREATE TABLE "orders" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "user_id" INTEGER NOT NULL,
  "purchase_datetime" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

--Links keys to orders.
CREATE TABLE "order_keys" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "order_id" INTEGER NOT NULL,
	"key_id" INTEGER NOT NULL,
  "unit_price" NUMERIC NOT NULL,
  FOREIGN KEY ("order_id") REFERENCES "orders"("id"),
  FOREIGN KEY ("key_id") REFERENCES "keys"("id")
);

--Stores available payment methods.
CREATE TABLE "payment_method" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" VARCHAR(30) NOT NULL
);

--Stores payment transactions for orders.
CREATE TABLE "transactions" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "order_id" INTEGER NOT NULL,
  "payment_method_id" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Sold' CHECK("status" IN ('Sold', 'Refunded', 'Cancelled','Failed')),
  "transaction_datetime" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "total_price" NUMERIC NOT NULL CHECK(total_price >= 0),
  FOREIGN KEY ("payment_method_id") REFERENCES "payment_method"("id"),
  FOREIGN KEY ("order_id") REFERENCES "orders"("id")
);

--- VIEWS

--know if is necessary to buy keys for a game
CREATE VIEW "available_keys_per_game" AS
	SELECT g."name",COUNT(k."id") AS "available_keys"
	FROM "games" g
	JOIN "keys" k ON k."game_id" = g."id"
	JOIN "key_status" ks ON ks."id" = k."key_status_id"
	WHERE ks."status" = 'Available'
	GROUP BY g."id"
	ORDER BY "available_keys" DESC;

--How many keys of any game we has
CREATE VIEW "keys_per_game" AS
	SELECT g."name",COUNT(k."id") AS "total_keys"
	FROM "games" g
	JOIN "keys" k ON k."game_id" = g."id"
	GROUP BY g."id"
	ORDER BY "total_keys" DESC;

--Best game (maybe show to user)
CREATE VIEW "games_rank_rating" AS
	SELECT g."name",AVG(gr."rating") AS "average_rating"
	FROM "games" g
	JOIN "game_rating" gr ON gr."game_id" = g."id"
	GROUP BY g."id"
	ORDER BY  "average_rating" DESC;

--Know our best supplier
CREATE VIEW "keys_by_supplier" AS
	SELECT s."name", COUNT(k."id") AS "total_keys_bought",COUNT(DISTINCT(kb."id")) AS "total_batches_bought"
	FROM "suppliers" s
	JOIN "key_batches" kb ON kb."supplier_id" = s."id"
	JOIN "keys" k ON k."batch_id" = kb."id"
	GROUP BY s."id"
	ORDER BY "total_keys_bought" DESC, "total_batches_bought" DESC;

--Look what games the users are more interessing
CREATE VIEW "most_sold_games" AS
	SELECT g."name",COUNT(g."name") AS "sold_count"
	FROM "games" g
	JOIN "keys" k ON k."game_id" = g."id"
	JOIN "key_status" ks ON ks."id" = k."key_status_id"
	WHERE ks."status" = 'Sold'
	GROUP BY g."id"
	ORDER BY "sold_count" DESC;

--user without sensitive data
CREATE VIEW "user_essential_data" AS
	SELECT "first_name","last_name","nickname","email"
	FROM "users"
	WHERE "deleted" = 0;

--Initially I wanted to directly calculate the profit per game, but I realized that it would be better
--to break it down into views, making the query easier and still being able to reuse the other views.
CREATE VIEW "revenue_per_game" AS
	SELECT "g"."id" AS "game_id","g"."name" AS "name",SUM("ok"."unit_price") AS "total_revenue"
	FROM "order_keys" "ok"
	JOIN "keys" "k" ON "ok"."key_id" = "k"."id"
	JOIN "games" "g" ON "k"."game_id" = "g"."id"
	GROUP BY "g"."id", "g"."name"
	ORDER BY "total_revenue" DESC;

CREATE VIEW "cost_per_game" AS
SELECT g."id" AS "game_id",g."name" AS "name",
    SUM(kb."unit_price" * kb."quantity") AS "total_cost"
FROM "games" g
JOIN "key_batches" kb ON kb."game_id" = g."id"
GROUP BY g."id", g."name"
ORDER BY "total_cost" DESC;

CREATE VIEW "profit_per_game" AS
	SELECT g."id" AS "game_id", g."name" AS "name",
	(r."total_revenue" - c."total_cost") AS "total_profit"
	FROM "games" g
	JOIN "revenue_per_game" r ON g."id" = r."game_id"
	JOIN "cost_per_game" c ON g."id" = c."game_id"
	ORDER BY "total_profit" DESC;

--Every key bought can be linked to the user simplifying other querys
CREATE VIEW "keys_bought_user" AS
	SELECT o."user_id", g."name" AS "game_name", o."purchase_datetime", k."id" AS "key_id"
	FROM "games" g
	JOIN "keys" k ON k."game_id" = g."id"
	JOIN "order_keys" ok ON ok."key_id" = k."id"
	JOIN "orders" o ON o."id" = ok."order_id"
	JOIN "transactions" t ON t."order_id" = o."id"
	WHERE t."status" = 'Sold';

----------INDEX

CREATE INDEX idx_orders_user_id ON orders(user_id);

CREATE INDEX idx_keys_game_id  ON keys(game_id);
CREATE INDEX idx_keys_status_id  ON keys(key_status_id);

CREATE INDEX idx_rating_user_id ON game_rating(user_id);
CREATE INDEX idx_rating_game_id ON game_rating(game_id);

CREATE INDEX idx_order_key_id ON order_keys(key_id);
CREATE INDEX idx_order_keys_order_id ON order_keys(order_id);

CREATE INDEX idx_transactions_order_id ON transactions(order_id);

CREATE INDEX idx_game_comments ON game_comments(user_id,game_id);

	--Triggers
-- Soft delete games
CREATE TRIGGER "del_game"
BEFORE DELETE ON "games"
FOR EACH ROW
BEGIN
  UPDATE "games"
  SET "deleted" = 1
  WHERE "id" = OLD."id";
  SELECT RAISE(IGNORE);
END;

-- Soft delete users
CREATE TRIGGER "del_user"
BEFORE DELETE ON "users"
FOR EACH ROW
BEGIN
  UPDATE "users"
  SET "deleted" = 1
  WHERE "id" = OLD."id";
  SELECT RAISE(IGNORE);
END;

-- Soft delete game comments
CREATE TRIGGER "del_game_comments"
BEFORE DELETE ON "game_comments"
FOR EACH ROW
BEGIN
  UPDATE "game_comments"
  SET "deleted" = 1
  WHERE "id" = OLD."id";
  SELECT RAISE(IGNORE);
END;

	-- Soft delete suppliers
CREATE TRIGGER "del_suppliers"
BEFORE DELETE ON "suppliers"
FOR EACH ROW
BEGIN
  UPDATE "suppliers"
  SET "deleted" = 1
  WHERE "id" = OLD."id";
  SELECT RAISE(IGNORE);
END;

--remove from wishlist when bought
CREATE TRIGGER "remov_from_wishlist"
AFTER INSERT ON "transactions"
FOR EACH ROW
WHEN NEW."status" = 'Sold'
BEGIN
	DELETE FROM "wishlist"
	WHERE "user_id" = (
		SELECT "user_id"
		FROM "orders"
		WHERE "id" = NEW."order_id"
		)
	  AND
    "game_id" IN (
        SELECT k."game_id"
        FROM "keys" k
        JOIN "order_keys" ok ON ok."key_id" = k."id"
        WHERE ok."order_id" = NEW."order_id"
		);
	END;


	--Alter key status when bought
	CREATE TRIGGER "sold_status"
	AFTER INSERT ON "transactions"
	FOR EACH ROW
	WHEN NEW."status" = 'Sold'
	BEGIN
		UPDATE "keys"
		SET "key_status_id" = (
			SELECT "id"
			FROM "key_status"
			WHERE "status" = 'Sold')
		WHERE "id" IN(
			SELECT "key_id"
			FROM "order_keys"
			WHERE "order_id" = NEW."order_id"
			);
		END;

--Log price
CREATE TRIGGER "log_price_change"
AFTER UPDATE OF "price" ON "games"
FOR EACH ROW
BEGIN
    INSERT INTO game_price_log(game_id, old_price, new_price, changed_at)
    VALUES(OLD."id", OLD."price", NEW."price", CURRENT_TIMESTAMP);
END;

--update key_status to refunded when refunded the transaction
CREATE TRIGGER "update_key_status_refunded"
AFTER UPDATE ON "transactions"
FOR EACH ROW
WHEN NEW."status" = 'Refunded'
BEGIN
	UPDATE "keys"
	SET "key_status_id" = (
		SELECT "id"
		FROM "key_status"
		WHERE "status" = 'Refunded'
		LIMIT 1
	)
	WHERE "id" IN (
		SELECT "key_id"
		FROM "order_keys"
		WHERE "order_id" = NEW."order_id"
	);
END;

--check if key is available before add on order
CREATE TRIGGER "validate_key_availability"
BEFORE INSERT ON "order_keys"
FOR EACH ROW
WHEN (
    SELECT ks.status
    FROM keys k
    JOIN "key_status" ks ON ks."id" = k."key_status_id"
    WHERE k.id = NEW.key_id
) != 'Available'
BEGIN
    SELECT RAISE(ABORT, 'Key not available for sale');
END;

--update user amount when refunde
CREATE TRIGGER "update_user_amount_refund"
AFTER UPDATE ON transactions
FOR EACH ROW
WHEN NEW.status = 'Refunded' AND OLD.status != 'Refunded'
BEGIN
    UPDATE "users"
    SET "amount" = "amount" + NEW.total_price
    WHERE "id" = (
	    SELECT "user_id"
	    FROM "orders"
	    WHERE "id" = NEW.order_id);
END;

--checks if game_id is the same in keys and key_batches
CREATE TRIGGER "validate_key_batch_game_insert"
BEFORE INSERT ON "keys"
FOR EACH ROW
WHEN NEW."game_id" != (
    SELECT "game_id"
    FROM "key_batches"
    WHERE "id" = NEW."batch_id"
)
BEGIN
    SELECT RAISE(ABORT, 'Game ID of key does not match batch game ID');
END;


--Prevent double keys on one order
CREATE TRIGGER "prevent_double_keys_on_order"
BEFORE INSERT ON "order_keys"
FOR EACH ROW
WHEN (
    (SELECT COUNT(*)
     FROM "order_keys"
     WHERE "order_id" = NEW."order_id"
       AND "key_id" = NEW."key_id") > 0
)
BEGIN
    SELECT RAISE(ABORT, 'Key already added to this order');
END;


--Prevent a user with insufficient money on amount buy using the wallet payment method
CREATE TRIGGER "validate_wallet_payment"
BEFORE INSERT ON "transactions"
FOR EACH ROW
WHEN NEW.status = 'Sold' AND NEW.payment_method_id = (
    SELECT "id" FROM "payment_method" WHERE "name" = 'Wallet'
) AND (
    SELECT "amount" FROM "users"
    WHERE "id" = (SELECT "user_id" FROM "orders" WHERE "id" = NEW.order_id)
) < NEW.total_price
BEGIN
    SELECT RAISE(ABORT, 'Insufficient balance for wallet payment');
END;

--debit when the user purchases with the wallet
CREATE TRIGGER "deduct_wallet_payment"
AFTER INSERT ON "transactions"
FOR EACH ROW
WHEN NEW.status = 'Sold' AND NEW.payment_method_id = (
    SELECT "id" FROM "payment_method" WHERE "name" = 'Wallet'
)
BEGIN
    UPDATE "users"
    SET "amount" = "amount" - NEW.total_price
    WHERE "id" = (SELECT "user_id" FROM "orders" WHERE "id" = NEW.order_id);
END;

--Ensures that the purchasing user is active
CREATE TRIGGER "validate_active_user_purchase"
BEFORE INSERT ON "orders"
FOR EACH ROW
WHEN (SELECT "deleted" FROM "users" WHERE "id" = NEW.user_id) = 1
BEGIN
    SELECT RAISE(ABORT, 'Cannot create order for deleted user');
END;

--Ensures that the purchased game is active
CREATE TRIGGER "validate_active_game_sale"
BEFORE INSERT ON "order_keys"
FOR EACH ROW
WHEN (
    SELECT "deleted" FROM "games"
    WHERE "id" = (SELECT "game_id" FROM "keys" WHERE "id" = NEW.key_id)
) = 1
BEGIN
    SELECT RAISE(ABORT, 'Cannot sell key for deleted game');
END;
