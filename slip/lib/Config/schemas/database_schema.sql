
---------------------------------------------------------------------
-- VIEW creation, e.g.
---------------------------------------------------------------------
CREATE OR REPLACE SQL SECURITY INVOKER VIEW ht.holdings_deltas AS SELECT * FROM ht_repository.holdings_deltas;

-----------------------------------------------------------------------
-- shard producer updates the shards row for EACH ITEM indexed.
-- there may be more than one producer per row/shard
-----------------------------------------------------------------------
CREATE TABLE `slip_shard_stats` (
	 `run`            smallint(3) NOT NULL DEFAULT '0',
	 `shard`          smallint(2) NOT NULL DEFAULT '0',
	 `s_reindexed_ct` int(11)     NOT NULL DEFAULT '0',
	 `s_deleted_ct`   int(11)     NOT NULL DEFAULT '0',
	 `s_errored_ct`   int(11)     NOT NULL DEFAULT '0',
	 `s_num_docs`     int(11)     NOT NULL DEFAULT '0',
	 `s_doc_size`     bigint(20)  NOT NULL DEFAULT '0',
	 `s_doc_time`     float       NOT NULL DEFAULT '0',
	 `s_idx_time`     float       NOT NULL DEFAULT '0',
	 `s_tot_time`     float       NOT NULL DEFAULT '0',
                          PRIMARY KEY (`run`,`shard`)
          );

CREATE TABLE `slip_shard_stats` (`run` smallint(3) NOT NULL DEFAULT '0', `shard` smallint(2) NOT NULL DEFAULT '0', `s_reindexed_ct` int(11) NOT NULL DEFAULT '0', `s_deleted_ct` int(11) NOT NULL DEFAULT '0', `s_errored_ct`   int(11) NOT NULL DEFAULT '0', `s_num_docs` int(11) NOT NULL DEFAULT '0', `s_doc_size` bigint(20) NOT NULL DEFAULT '0', `s_doc_time` float NOT NULL DEFAULT '0', `s_idx_time` float NOT NULL DEFAULT '0', `s_tot_time` float NOT NULL DEFAULT '0', PRIMARY KEY (`run`,`shard`));

-----------------------------------------------------------------------
-- recorded rates since last checkpoint
-- at intervals of 100, 1000, 10000, 100000
-----------------------------------------------------------------------
CREATE TABLE `slip_rate_stats` (
        `run`           smallint(3) NOT NULL DEFAULT '0',
        `shard`         smallint(2) NOT NULL DEFAULT '0',
        `time_a_100`    int         NOT NULL DEFAULT '0',
        `rate_a_100`    float       NOT NULL DEFAULT '0',
                PRIMARY KEY  (`run`, `shard`)
        );

CREATE TABLE `slip_rate_stats` (`run` smallint(3) NOT NULL DEFAULT '0', `shard` smallint(2) NOT NULL DEFAULT '0', `time_a_100` int NOT NULL DEFAULT '0', `rate_a_100` float NOT NULL DEFAULT '0', PRIMARY KEY (`run`, `shard`)); 


---------------------------------------------------------------------
--
---------------------------------------------------------------------
CREATE TABLE `slip_errors` (
        `run`           smallint(3) NOT NULL DEFAULT '0',
        `shard`         smallint(2) NOT NULL DEFAULT '0',
        `id`            varchar(32) NOT NULL DEFAULT '',
        `pid`           int         NOT NULL DEFAULT '0',
        `host`          varchar(32) NOT NULL DEFAULT '',
        `error_time`    timestamp   NOT NULL DEFAULT '0000-00-00 00::00::00',
        `reason`        tinyint(1)  NULL,
                PRIMARY KEY  (`run`, `id`)
       );

CREATE TABLE `slip_errors` (`run` smallint(3) NOT NULL DEFAULT '0', `shard` smallint(2) NOT NULL DEFAULT '0', `id` varchar(32) NOT NULL DEFAULT '', `pid` int NOT NULL DEFAULT '0', `host` varchar(32) NOT NULL DEFAULT '', `error_time` timestamp NOT NULL DEFAULT '0000-00-00 00::00::00', `reason` tinyint(1) NULL, PRIMARY KEY (`run`, `id`));

---------------------------------------------------------------------
--
---------------------------------------------------------------------

CREATE TABLE `slip_timeouts` (
        `run`           smallint(3) NOT NULL DEFAULT '0',
        `id`            varchar(32) NOT NULL DEFAULT '',
        `shard`         smallint(2) NOT NULL DEFAULT '0',
        `pid`           int         NOT NULL DEFAULT '0',
        `host`          varchar(32) NOT NULL DEFAULT '',
        `timeout_time`  timestamp   NOT NULL DEFAULT '0000-00-00 00::00::00'
       );

CREATE TABLE `slip_timeouts` (`run` smallint(3) NOT NULL DEFAULT '0', `id` varchar(32) NOT NULL DEFAULT '', `shard` smallint(2) NOT NULL DEFAULT '0', `pid` int NOT NULL DEFAULT '0', `host` varchar(32) NOT NULL DEFAULT '', `timeout_time` timestamp NOT NULL DEFAULT '0000-00-00 00::00::00');

---------------------------------------------------------------------
--
---------------------------------------------------------------------
CREATE TABLE `slip_indexed` (
        `run`           smallint(3) NOT NULL DEFAULT '0',
        `shard`         smallint(2) NOT NULL DEFAULT '0',
        `id`            varchar(32) NOT NULL DEFAULT '',
        `time`          timestamp   NOT NULL DEFAULT '0000-00-00 00::00::00',
        `indexed_ct`    smallint(3) NOT NULL DEFAULT '0',
                PRIMARY KEY    (`run`, `id`, `shard`),
                KEY `id`       (`id`),
                KEY `runshard` (`run`, `shard`),
                KEY `run`      (`run`),
                KEY `run_indexed_ct` (`run`, `indexed_ct`)
       );

CREATE TABLE `slip_indexed` (`run` smallint(3) NOT NULL DEFAULT '0', `shard` smallint(2) NOT NULL DEFAULT '0', `id` varchar(32) NOT NULL DEFAULT '', `time` timestamp NOT NULL DEFAULT '0000-00-00 00::00::00', `indexed_ct` smallint(3) NOT NULL DEFAULT '0', PRIMARY KEY (`run`, `id`, `shard`), KEY `id` (`id`), KEY `runshard` (`run`, `shard`), KEY `run` (`run`), KEY `run_indexed_ct` (`run`, `indexed_ct`));


---------------------------------------------------------------------
--
---------------------------------------------------------------------
CREATE TABLE `slip_indexed_temp` (
        `shard`         smallint(2) NOT NULL DEFAULT '0',
        `id`            varchar(32) NOT NULL DEFAULT '',
                KEY `id` (`id`)
       );

CREATE TABLE `slip_indexed_temp` (`shard` smallint(2) NOT NULL DEFAULT '0', `id` varchar(32) NOT NULL DEFAULT '', KEY `id` (`id`));

 
---------------------------------------------------------------------
--  
---------------------------------------------------------------------
CREATE TABLE `slip_queue` (
        `run`         smallint(3)      NOT NULL DEFAULT '0',
        `shard`       smallint(2)      NOT NULL DEFAULT '0',
        `id`          varchar(32)      NOT NULL DEFAULT '',
        `pid`         int(11)          NOT NULL DEFAULT '0',
        `host`        varchar(32)      NOT NULL DEFAULT '',
        `proc_status` smallint(1)      NOT NULL DEFAULT '0',
                      PRIMARY KEY (`run`,`id`),
                       KEY `run`            (`run`),
                       KEY `id`             (`id`),
                       KEY `pid`            (`pid`),
                       KEY `host`           (`host`),
                       KEY `proc_status`    (`proc_status`),
                       KEY `runstatus`      (`run`,`proc_status`),
                       KEY `runshardstatus` (`run`,`shard`,`proc_status`)
        );

CREATE TABLE `slip_queue` (`run` smallint(3) NOT NULL DEFAULT '0', `shard` smallint(2) NOT NULL DEFAULT '0', `id` varchar(32) NOT NULL DEFAULT '', `pid` int(11) NOT NULL DEFAULT '0', `host` varchar(32) NOT NULL DEFAULT '', `proc_status` smallint(1) NOT NULL DEFAULT '0', PRIMARY KEY (`run`,`id`), KEY `run` (`run`), KEY `id` (`id`), KEY `pid` (`pid`), KEY `host` (`host`), KEY `proc_status` (`proc_status`), KEY `runstatus` (`run`,`proc_status`), KEY `runshardstatus` (`run`,`shard`,`proc_status`));
 
---------------------------------------------------------------------
-- IDs to re-index with a coll_id field when added to a "Large"
-- Personal Collection
---------------------------------------------------------------------
CREATE TABLE `slip_shared_queue` (
        `id`   varchar(32) NOT NULL DEFAULT '',
        `time` timestamp   NOT NULL DEFAULT CURRENT_TIMESTAMP,
             PRIMARY KEY `id` (`id`)
       );

CREATE TABLE `slip_shared_queue` (`id` varchar(32) NOT NULL DEFAULT '', `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY `id` (`id`));

---------------------------------------------------------------------
-- List of IDs for Collection Builder metadata update. No primary
-- key. Useful to allow duplicates in queue.
---------------------------------------------------------------------
CREATE TABLE `slip_metadata_update_queue` (
        `id`          varchar(32) NOT NULL DEFAULT '',
        `time`        timestamp   NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY (`id`)
       );

CREATE TABLE `slip_metadata_update_queue` (`id` varchar(32) NOT NULL DEFAULT '', `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, KEY (`id`));

---------------------------------------------------------------------
-- Changes to slip_rights MUST be made to slip_rights_temp also!  
-- AND modify Db::initialize_slip_rights_temp!
---------------------------------------------------------------------
CREATE TABLE `slip_rights_temp` (
        `nid`         varchar(32) NOT NULL DEFAULT '',
        `attr`        tinyint(4)  NOT NULL DEFAULT '0',
        `reason`      tinyint(4)  NOT NULL DEFAULT '0',
        `source`      tinyint(4)  NOT NULL DEFAULT '0',
        `user`        varchar(32) NOT NULL DEFAULT '',
        `time`        timestamp   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `sysid`       varchar(32) NOT NULL DEFAULT '',
        `update_time` int         NOT NULL DEFAULT '00000000',
                PRIMARY KEY (`nid`),
                KEY `update_time` (`update_time`),
                KEY `attr` (`attr`)
        );

CREATE TABLE `slip_rights_temp` (`nid` varchar(32) NOT NULL DEFAULT '', `attr` tinyint(4) NOT NULL DEFAULT '0', `reason` tinyint(4) NOT NULL DEFAULT '0', `source` tinyint(4) NOT NULL DEFAULT '0', `user` varchar(32) NOT NULL DEFAULT '', `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `sysid` varchar(32) NOT NULL DEFAULT '', `update_time` int NOT NULL DEFAULT '00000000', PRIMARY KEY (`nid`), KEY `update_time` (`update_time`), KEY `attr` (`attr`));

---------------------------------------------------------------------
--
---------------------------------------------------------------------
CREATE TABLE `slip_rights` (
        `nid`         varchar(32) NOT NULL DEFAULT '',
        `attr`        tinyint(4)  NOT NULL DEFAULT '0',
        `reason`      tinyint(4)  NOT NULL DEFAULT '0',
        `source`      tinyint(4)  NOT NULL DEFAULT '0',
        `user`        varchar(32) NOT NULL DEFAULT '',
        `time`        timestamp   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `sysid`       varchar(32) NOT NULL DEFAULT '',
        `update_time` int         NOT NULL DEFAULT '00000000',
                PRIMARY KEY (`nid`),
                KEY `update_time` (`update_time`),
                KEY `attr` (`attr`)
        );

CREATE TABLE `slip_rights` (`nid` varchar(32) NOT NULL DEFAULT '', `attr` tinyint(4) NOT NULL DEFAULT '0', `reason` tinyint(4) NOT NULL DEFAULT '0', `source` tinyint(4) NOT NULL DEFAULT '0', `user` varchar(32) NOT NULL DEFAULT '', `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `sysid` varchar(32) NOT NULL DEFAULT '', `update_time` int NOT NULL DEFAULT '00000000', PRIMARY KEY (`nid`), KEY `update_time` (`update_time`), KEY `attr` (`attr`));


---------------------------------------------------------------------
-- Pointer into VuFind Solr index
---------------------------------------------------------------------
CREATE TABLE `slip_vsolr_timestamp` (
       `time` int NOT NULL DEFAULT '00000000',
                PRIMARY KEY (`time`)
       );

CREATE TABLE `slip_vsolr_timestamp` (`time` int NOT NULL DEFAULT '00000000', PRIMARY KEY (`time`));


---------------------------------------------------------------------
-- Pointer into rights_current for the queue of each run
---------------------------------------------------------------------
CREATE TABLE `slip_rights_timestamp` (
        `run`          smallint(3) NOT NULL DEFAULT '0',
        `time`         int         NOT NULL DEFAULT '00000000',
                PRIMARY KEY (`run`)
       );

CREATE TABLE `slip_rights_timestamp` (`run` smallint(3) NOT NULL DEFAULT '0', `time` int NOT NULL DEFAULT '00000000', PRIMARY KEY (`run`));


---------------------------------------------------------------------
--
---------------------------------------------------------------------
CREATE TABLE `slip_host_control` (
        `run`           smallint(3) NOT NULL DEFAULT '0',
        `host`          varchar(32) NOT NULL DEFAULT '',
        `num_producers` smallint(2) NOT NULL DEFAULT '0',
        `num_running`   smallint(2) NOT NULL DEFAULT '0', 
        `enabled`  tinyint(1)  NOT NULL DEFAULT '0',
                PRIMARY KEY (`run`, `host`)
       );

CREATE TABLE `slip_host_control` (`run` smallint(3) NOT NULL DEFAULT '0', `host` varchar(32) NOT NULL DEFAULT '', `num_producers` smallint(2) NOT NULL DEFAULT '0', `num_running` smallint(2) NOT NULL DEFAULT '0', `enabled`  tinyint(1) NOT NULL DEFAULT '0', PRIMARY KEY (`run`, `host`));


---------------------------------------------------------------------
--
-- build    ::= 0=noerror                   2=error
-- optimiz  ::= 0=unoptimized, 1=optimized, 2=error
-- checkd   ::= 0=unchecked,   1=checked,   2=error
--
---------------------------------------------------------------------
CREATE TABLE `slip_shard_control` (
        `run`           smallint(3) NOT NULL DEFAULT '0',
        `shard`         smallint(2) NOT NULL DEFAULT '0',
        `enabled`       tinyint(1)  NOT NULL DEFAULT '0',
        `suspended`     tinyint(1)  NOT NULL DEFAULT '0',
        `num_producers` smallint(2) NOT NULL DEFAULT '0',
        `allocated`     smallint(2) NOT NULL DEFAULT '0',
        `build`         tinyint(1)  NOT NULL DEFAULT '0',
        `optimiz`       tinyint(1)  NOT NULL DEFAULT '0',
        `checkd`        tinyint(1)  NOT NULL DEFAULT '0',
        `build_time`    timestamp   NOT NULL DEFAULT '0000-00-00 00::00::00',
        `optimize_time` timestamp   NOT NULL DEFAULT '0000-00-00 00::00::00',
        `checkd_time`   timestamp   NOT NULL DEFAULT '0000-00-00 00::00::00',
        `release_state` tinyint(1)  NOT NULL DEFAULT '0',
                PRIMARY KEY  (`run`, `shard`)
       );

CREATE TABLE `slip_shard_control` (`run` smallint(3) NOT NULL DEFAULT '0', `shard` smallint(2) NOT NULL DEFAULT '0', `enabled` tinyint(1) NOT NULL DEFAULT '0', `suspended` tinyint(1) NOT NULL DEFAULT '0', `num_producers` smallint(2) NOT NULL DEFAULT '0', `allocated` smallint(2) NOT NULL DEFAULT '0', `build` tinyint(1) NOT NULL DEFAULT '0', `optimiz` tinyint(1) NOT NULL DEFAULT '0', `checkd` tinyint(1) NOT NULL DEFAULT '0', `build_time` timestamp NOT NULL DEFAULT '0000-00-00 00::00::00', `optimize_time` timestamp NOT NULL DEFAULT '0000-00-00 00::00::00', `checkd_time` timestamp NOT NULL DEFAULT '0000-00-00 00::00::00', `release_state` tinyint(1) NOT NULL DEFAULT '0', PRIMARY KEY (`run`, `shard`)); 

---------------------------------------------------------------------
--
---------------------------------------------------------------------
CREATE TABLE `slip_driver_control` (
        `run`           smallint(3) NOT NULL DEFAULT '0',
        `enabled`       tinyint(1)  NOT NULL DEFAULT '0',
        `stage`         varchar(32) NOT NULL DEFAULT 'Undefined',
                PRIMARY KEY  (`run`)
       );

CREATE TABLE `slip_driver_control` (`run` smallint(3) NOT NULL DEFAULT '0', `enabled` tinyint(1) NOT NULL DEFAULT '0', `stage` varchar(32) NOT NULL DEFAULT 'Undefined', PRIMARY KEY (`run`));



---------------------------------------------------------------------
--
---------------------------------------------------------------------
CREATE TABLE `slip_enqueuer_control` (
        `run`      smallint(3) NOT NULL DEFAULT '0',
        `enabled`  tinyint(1)  NOT NULL DEFAULT '0',
                PRIMARY KEY  (`run`)
       );

CREATE TABLE `slip_enqueuer_control` (`run` smallint(3) NOT NULL DEFAULT '0', `enabled` tinyint(1) NOT NULL DEFAULT '0', PRIMARY KEY (`run`));


---------------------------------------------------------------------
--
---------------------------------------------------------------------
CREATE TABLE `slip_commit_control` (
        `run`      smallint(3) NOT NULL DEFAULT '0',
        `shard`    smallint(2) NOT NULL DEFAULT '0',
        `enabled`  tinyint(1)  NOT NULL DEFAULT '0',
                PRIMARY KEY  (`run`, `shard`)
       );

CREATE TABLE `slip_commit_control` (`run` smallint(3) NOT NULL DEFAULT '0', `shard` smallint(2) NOT NULL DEFAULT '0', `enabled` tinyint(1) NOT NULL DEFAULT '0', PRIMARY KEY (`run`, `shard`));

---------------------------------------------------------------------
--
---------------------------------------------------------------------
CREATE TABLE `slip_check_control` (
        `run`      smallint(3) NOT NULL DEFAULT '0',
        `shard`    smallint(2) NOT NULL DEFAULT '0',
        `enabled`  tinyint(1)  NOT NULL DEFAULT '0',
                PRIMARY KEY  (`run`, `shard`)
       );

CREATE TABLE `slip_check_control` (`run` smallint(3) NOT NULL DEFAULT '0', `shard` smallint(2) NOT NULL DEFAULT '0', `enabled` tinyint(1) NOT NULL DEFAULT '0', PRIMARY KEY (`run`, `shard`));


---------------------------------------------------------------------
--
---------------------------------------------------------------------
CREATE TABLE `slip_rights_control` (
        `enabled`  tinyint(1)  NOT NULL DEFAULT '0'
       );

CREATE TABLE `slip_rights_control` (`enabled` tinyint(1) NOT NULL DEFAULT '0');


---------------------------------------------------------------------
-- Track version loaded from ht_repository.holdings_deltas for a given
-- run
---------------------------------------------------------------------
CREATE TABLE `slip_holdings_version` (
       `run`                 smallint(3) NOT NULL DEFAULT '0',
       `last_loaded_version` int         NOT NULL DEFAULT '0',
       `load_time`           timestamp   NOT NULL DEFAULT '0000-00-00 00::00::00'   
   PRIMARY KEY  (`run`)
);

CREATE TABLE `slip_holdings_version` (`run` smallint(3) NOT NULL DEFAULT '0', `last_loaded_version` int NOT NULL DEFAULT '0', `load_time` timestamp  NOT NULL DEFAULT '0000-00-00 00::00::00', PRIMARY KEY (`run`)); 


