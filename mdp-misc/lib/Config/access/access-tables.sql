
-- ---------------------------------------------------------------------
-- query:
--
-- SELECT stmt_num, stmt_url, stmt_head, stmt_text FROM access_stmts 
--   WHERE access_stmts.stmt_key = 
--     SELECT stmt_key FROM access_stmts_map 
--       WHERE attr=$attr AND source=$source 
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS access_stmts;
CREATE TABLE `access_stmts` (`stmt_key` varchar(32) NOT NULL default '', `stmt_url` text NOT NULL default '', `stmt_head` text NOT NULL default '', `stmt_text` text NOT NULL default '', PRIMARY KEY (`stmt_key`));
 
DROP TABLE IF EXISTS access_stmts_map;
CREATE TABLE `access_stmts_map` (`a_attr` varchar(32) NOT NULL default '', `a_source` varchar(32) NOT NULL default '', `stmt_key` varchar(32) NOT NULL default '', PRIMARY KEY (`a_attr`, `a_source`)); 

