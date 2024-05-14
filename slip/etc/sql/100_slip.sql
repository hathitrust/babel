USE ht;

DROP TABLE IF EXISTS slip_rights;
CREATE TABLE slip_rights (
  nid varchar(32) NOT NULL DEFAULT '',
  attr tinyint(4) NOT NULL DEFAULT 0,
  reason tinyint(4) NOT NULL DEFAULT 0,
  source tinyint(4) NOT NULL DEFAULT 0,
  user varchar(32) NOT NULL DEFAULT '',
  time timestamp /* mariadb-5.3 */ NOT NULL DEFAULT '0000-00-00 00:00:00',
  sysid varchar(32) NOT NULL DEFAULT '',
  update_time int(11) NOT NULL DEFAULT 0,
  insert_time timestamp /* mariadb-5.3 */ NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (nid),
  KEY update_time (update_time),
  KEY attr (attr),
  KEY insert_time (insert_time)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS slip_host_control;
CREATE TABLE slip_host_control (
  `run` smallint(3) NOT NULL DEFAULT 0,
  `host` varchar(32) NOT NULL DEFAULT '',
  `num_producers` smallint(2) NOT NULL DEFAULT 0,
  `num_running` smallint(2) NOT NULL DEFAULT 0,
  `enabled` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`run`,`host`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS slip_shard_control;
CREATE TABLE `slip_shard_control` (
  `run` smallint(3) NOT NULL DEFAULT 0,
  `shard` smallint(2) NOT NULL DEFAULT 0,
  `enabled` tinyint(1) NOT NULL DEFAULT 0,
  `selected` tinyint(1) NOT NULL DEFAULT 0,
  `num_producers` smallint(2) NOT NULL DEFAULT 0,
  `allocated` smallint(2) NOT NULL DEFAULT 0,
  `build` tinyint(1) NOT NULL DEFAULT 0,
  `optimiz` tinyint(1) NOT NULL DEFAULT 0,
  `checkd` tinyint(1) NOT NULL DEFAULT 0,
  `build_time` timestamp /* mariadb-5.3 */ NOT NULL DEFAULT '0000-00-00 00:00:00',
  `optimize_time` timestamp /* mariadb-5.3 */ NOT NULL DEFAULT '0000-00-00 00:00:00',
  `checkd_time` timestamp /* mariadb-5.3 */ NOT NULL DEFAULT '0000-00-00 00:00:00',
  `release_state` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`run`,`shard`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS slip_indexed;
CREATE TABLE `slip_indexed` (
  `run` smallint(3) NOT NULL DEFAULT 0,
  `shard` smallint(2) NOT NULL DEFAULT 0,
  `id` varchar(32) NOT NULL DEFAULT '',
  `time` timestamp /* mariadb-5.3 */ NOT NULL DEFAULT '0000-00-00 00:00:00',
  `indexed_ct` smallint(3) NOT NULL DEFAULT 0,
  PRIMARY KEY (`run`,`shard`,`id`),
  KEY `id` (`id`),
  KEY `runshard` (`run`,`shard`),
  KEY `run` (`run`),
  KEY `run_indexed_ct` (`run`,`indexed_ct`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS slip_errors;
CREATE TABLE `slip_errors` (
  `run` smallint(3) NOT NULL DEFAULT 0,
  `shard` smallint(2) NOT NULL DEFAULT 0,
  `id` varchar(32) NOT NULL DEFAULT '',
  `pid` int(11) NOT NULL DEFAULT 0,
  `host` varchar(32) NOT NULL DEFAULT '',
  `error_time` timestamp /* mariadb-5.3 */ NOT NULL DEFAULT '0000-00-00 00:00:00',
  `reason` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`run`,`id`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS slip_shard_stats;
CREATE TABLE `slip_shard_stats` (
  `run` smallint(3) NOT NULL DEFAULT 0,
  `shard` smallint(2) NOT NULL DEFAULT 0,
  `s_reindexed_ct` int(11) NOT NULL DEFAULT 0,
  `s_deleted_ct` int(11) NOT NULL DEFAULT 0,
  `s_errored_ct` int(11) NOT NULL DEFAULT 0,
  `s_num_docs` int(11) NOT NULL DEFAULT 0,
  `s_doc_size` bigint(20) NOT NULL DEFAULT 0,
  `s_doc_time` float NOT NULL DEFAULT 0,
  `s_idx_time` float NOT NULL DEFAULT 0,
  `s_tot_time` float NOT NULL DEFAULT 0,
  PRIMARY KEY (`run`,`shard`)
) ENGINE=InnoDB;

GRANT INSERT, UPDATE, DELETE ON `ht`.`slip_host_control` TO 'mdp-lib'@'%';
GRANT INSERT, UPDATE, DELETE ON `ht`.`slip_shard_control` TO 'mdp-lib'@'%';
GRANT INSERT, UPDATE, DELETE ON `ht`.`slip_shard_stats` TO 'mdp-lib'@'%';
GRANT INSERT, UPDATE, DELETE ON `ht`.`slip_indexed` TO 'mdp-lib'@'%';
GRANT INSERT, UPDATE, DELETE ON `ht`.`slip_errors` TO 'mdp-lib'@'%';
GRANT INSERT, UPDATE, DELETE ON `ht`.`slip_rights` TO 'mdp-lib'@'%';
