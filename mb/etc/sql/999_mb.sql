USE ht;
DROP TABLE IF EXISTS mb_collection;
CREATE TABLE `mb_collection` (
  `MColl_ID` int(10) unsigned NOT NULL DEFAULT 0,
  `collname` varchar(100) NOT NULL DEFAULT '',
  `owner` varchar(256) DEFAULT NULL,
  `owner_name` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `num_items` int(11) DEFAULT NULL,
  `shared` tinyint(1) DEFAULT NULL,
  `modified` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `featured` date DEFAULT NULL,
  `branding` varchar(2048) DEFAULT NULL,
  `contact_info` mediumtext DEFAULT NULL,
  `contact_link` mediumtext DEFAULT NULL,
  `contributor_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`MColl_ID`),
  KEY `owner` (`owner`(255)),
  KEY `shared` (`shared`),
  KEY `collname` (`collname`),
  KEY `num_items` (`num_items`),
  KEY `featured` (`featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPRESSED;

GRANT INSERT, UPDATE, DELETE ON `ht`.`mb_collection` TO 'mdp-lib'@'%';
GRANT INSERT, UPDATE, DELETE ON `ht`.`mb_coll_item` TO 'mdp-lib'@'%';
GRANT INSERT, UPDATE, DELETE ON `ht`.`mb_item` TO 'mdp-lib'@'%';
GRANT INSERT, UPDATE, DELETE ON `ht`.`mb_transfer` TO 'mdp-lib'@'%';
GRANT INSERT, UPDATE, DELETE ON `ht`.`ht_sessions` TO 'mdp-lib'@'%';

