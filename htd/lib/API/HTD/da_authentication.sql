-- ---------------------------------------------------------------------
-- HathiTrust Data API Client authentication data
-- 
-- +------------+--------------+------+-----+-------------------+-------+
-- | Field      | Type         | Null | Key | Default           | Extra |
-- +------------+--------------+------+-----+-------------------+-------+
-- | access_key | varchar(64)  | NO   | PRI |                   |       |
-- | secret_key | varchar(64)  | NO   |     |                   |       |
-- | name       | varchar(256) | NO   |     |                   |       |
-- | org        | varchar(256) | NO   |     |                   |       |
-- | email      | varchar(256) | NO   | MUL |                   |       |
-- | userid     | varchar(256) | NO   | PRI |                   |       |
-- | created    | timestamp    | NO   |     | CURRENT_TIMESTAMP |       |
-- | activated  | tinyint(1)   | NO   |     | 0                 |       |
-- +------------+--------------+------+-----+-------------------+-------+
-- 8 rows in set (0.00 sec)
-- 
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS htd_authentication;
CREATE TABLE `htd_authentication` (`access_key` varchar(64) NOT NULL default '', `secret_key` varchar(64) NOT NULL default '', `name` varchar(256) NOT NULL default '', `org` varchar(256) NOT NULL default '', `email` varchar(256) NOT NULL default '', `userid` varchar(256) NOT NULL default '', `created` timestamp NOT NULL default NOW(), `activated` tinyint(1) NOT NULL default 0, PRIMARY KEY (`access_key`, `userid`), KEY (`userid`), KEY (`email`));
