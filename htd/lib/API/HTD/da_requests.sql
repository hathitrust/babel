-- ---------------------------------------------------------------------
-- HathiTrust Data API Client request data
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS htd_requests;
CREATE TABLE `htd_requests` (`access_key` varchar(64) NOT NULL default '', `nonce` varchar(64) NOT NULL default '', `stamptime` int NOT NULL default 0, KEY (`access_key`), KEY (`nonce`), KEY (`stamptime`));
