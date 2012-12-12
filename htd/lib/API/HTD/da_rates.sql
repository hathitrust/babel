-- ---------------------------------------------------------------------
-- HathiTrust Data API Client rate data
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS htd_rates;
CREATE TABLE `htd_rates` (`access_key` varchar(64) NOT NULL default '', `requests` int NOT NULL DEFAULT 0, `bytes` int NOT NULL DEFAULT 0, PRIMARY KEY (`access_key`));
