-- ---------------------------------------------------------------------
-- HathiTrust Data API Client request data
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS da_requests;
CREATE TABLE `da_requests` (`access_key` varchar(64) NOT NULL default '', `nonce` varchar(64) NOT NULL default '', `stamptime` int NOT NULL default 0, KEY (`access_key`), KEY (`nonce`), KEY (`stamptime`));
