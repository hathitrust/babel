-- ---------------------------------------------------------------------
-- HathiTrust Data API Client statistics data
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS htd_statistics;
CREATE TABLE `htd_statistics` 
       (`access_key` varchar(64) NOT NULL default '', 
        `accesses` int NOT NULL default 0, 
        `authentication_failures` int NOT NULL default 0, 
        `authorization_failures` int NOT NULL default 0, 
        `last_access` timestamp NOT NULL default '0000-00-00 00::00::00',
                   PRIMARY KEY (`access_key`));
