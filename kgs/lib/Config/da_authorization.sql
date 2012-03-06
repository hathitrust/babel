-- ---------------------------------------------------------------------
-- HathiTrust Data API Client authorization data
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS da_authorization;
CREATE TABLE `da_authorization` (`access_key` varchar(64) NOT NULL default '', `resource_id` varchar(32) NOT NULL default '', `privilege_code` tinyint NOT NULL DEFAULT 0, `rate_info` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (`access_key`, `resource_id`));
