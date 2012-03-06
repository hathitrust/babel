-- ---------------------------------------------------------------------
-- HathiTrust Data API Client statistics data
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS da_statistics;
CREATE TABLE `da_statistics` 
       (`access_key` varchar(64) NOT NULL default '', 
        `accesses` int NOT NULL default 0, 
                   PRIMARY KEY (`access_key`));
