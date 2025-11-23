use seproject;

-- 1. Refresh Token Table
CREATE TABLE refresh_token (
    id INT AUTO_INCREMENT PRIMARY KEY,
    refresh_token VARCHAR(255),
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES auth_user(id)
);

-- 2. Category Table
CREATE TABLE category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) UNIQUE
);

-- 3. Budget Table
CREATE TABLE budget (
    id INT AUTO_INCREMENT PRIMARY KEY,
    amount DECIMAL(10, 2),
    user_id INT,
    category_id INT,
    FOREIGN KEY (user_id) REFERENCES auth_user(id),
    FOREIGN KEY (category_id) REFERENCES category(id)
);

-- 4. Transaction Table
CREATE TABLE transaction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_date DATE,
    transaction_name VARCHAR(255),
    amount DECIMAL(10, 2),
    category_id INT,
    user_id INT,
    FOREIGN KEY (category_id) REFERENCES category(id),
    FOREIGN KEY (user_id) REFERENCES auth_user(id)
);

DELIMITER //

CREATE PROCEDURE insertRefreshToken(
    IN token VARCHAR(255),
    IN userId INT
)
BEGIN
    IF EXISTS (SELECT 1 FROM refresh_token WHERE user_id = userId) THEN
        UPDATE refresh_token SET refresh_token = token WHERE user_id = userId;
    ELSE
        INSERT INTO refresh_token (refresh_token, user_id) VALUES (token, userId);
    END IF;
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE insertNewCategory(
    IN catName VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM category WHERE category_name = catName) THEN
        INSERT INTO category (category_name) VALUES (catName);
    END IF;
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE createBudget(
    IN amount DECIMAL(10,2),
    IN userId INT,
    IN categoryName VARCHAR(255)
)
BEGIN
    DECLARE catId INT;

    SELECT id INTO catId FROM category WHERE category_name = categoryName;

    INSERT INTO budget (amount, user_id, category_id) 
    VALUES (amount, userId, catId);
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE createTransaction(
    IN t_date DATE,
    IN t_name VARCHAR(255),
    IN t_amount DECIMAL(10,2),
    IN categoryName VARCHAR(255),
    IN userId INT
)
BEGIN
    DECLARE catId INT;

    SELECT id INTO catId FROM category WHERE category_name = categoryName;

    INSERT INTO transaction (transaction_date, transaction_name, amount, category_id, user_id)
    VALUES (t_date, t_name, t_amount, catId, userId);
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE getAllTransaction(
    IN userId INT
)
BEGIN
    SELECT * FROM transaction WHERE user_id = userId;
END //

DELIMITER ;
auth_groupauth_group
DELIMITER //

CREATE PROCEDURE getAllBudget(
    IN userId INT
)

    SELECT * FROM budget WHERE user_id = userId;
END //

DELIMITER ;

delimiter //
CREATE PROCEDURE getAllTransaction(
     IN userId INT
 )
 BEGIN
     SELECT * FROM transaction WHERE user_id = userId;
 END//

delimiter ;

drop procedure createBudget;

DELIMITER //

CREATE PROCEDURE createBudget(
    IN amount DECIMAL(10,2),
    IN userId INT,
    IN categoryName VARCHAR(255),
)
BEGIN
    DECLARE catId INT;

    SELECT id INTO catId FROM category WHERE category_name = categoryName;

    IF NOT EXISTS (
        SELECT 1 FROM budget WHERE user_id = userId AND category_id = catId
    ) THEN
        INSERT INTO budget (amount, user_id, category_id) 
        VALUES (amount, userId, catId);
    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Budget for this category already exists for the user';
    END IF;
END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE deleteTransaction (
    IN transName VARCHAR(255),
    IN transDate DATE,
    IN transAmount DECIMAL(10, 2),
    IN transCategoryId INT,
    IN account_id INT	
)
BEGIN
    DELETE FROM transaction
    WHERE id = (
        SELECT id FROM (
            SELECT id
            FROM transaction
            WHERE transaction_name = transName
              AND transaction_date = transDate
              AND amount = transAmount
              AND category_id = transCategoryId
	      AND user_id = account_id	
            ORDER BY RAND()
            LIMIT 1
        ) AS t
    );
END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE deleteBudget (
    IN transAmount DECIMAL(10, 2),
    IN transCategoryId INT,
    IN account_id INT	
)
BEGIN
    DELETE FROM budget
    WHERE id = (
        SELECT id FROM (
            SELECT id
            FROM budget
            WHERE amount = transAmount
              AND category_id = transCategoryId
	      AND user_id = account_id
            ORDER BY RAND()
            LIMIT 1
        ) AS t
    );
END //

DELIMITER ;




