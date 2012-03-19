-- ---------------------------------------------------------------------
-- HathiTrust Data API Client authentication data
-- 
-- +-------------+--------------+------+-----+---------------------+-------+
-- | Field       | Type         | Null | Key | Default             | Extra |
-- +-------------+--------------+------+-----+---------------------+-------+
-- | access_key  | varchar(64)  | NO   | PRI |                     |       |
-- | secret_key  | varchar(64)  | NO   |     |                     |       |
-- | name        | varchar(256) | NO   |     |                     |       |
-- | org         | varchar(256) | NO   |     |                     |       |
-- | email       | varchar(256) | NO   | MUL |                     |       |
-- | created     | timestamp    | NO   |     | CURRENT_TIMESTAMP   |       |
-- | activated   | tinyint(1)   | NO   |     | 0                   |       |
-- | last_access | timestamp    | NO   |     | 0000-00-00 00:00:00 |       |
-- +-------------+--------------+------+-----+---------------------+-------+
-- 8 rows in set (0.00 sec)
-- 
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS da_authentication;
CREATE TABLE `da_authentication` (`access_key` varchar(64) NOT NULL default '', `secret_key` varchar(64) NOT NULL default '', `name` varchar(256) NOT NULL default '', `org` varchar(256) NOT NULL default '', `email` varchar(256) NOT NULL default '', `created` timestamp NOT NULL default NOW(), `activated` tinyint(1) NOT NULL default 0, `last_access` timestamp NOT NULL default '0000-00-00 00::00::00', PRIMARY KEY (`access_key`), KEY (`email`));
