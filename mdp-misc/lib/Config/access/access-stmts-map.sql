-- ---------------------------------------------------------------------
-- Text maintained here for easy editing.  Make changes here then run
-- commands to re-populate access_stmts table. Do not change
-- access_stmts_map table using mysql client. 
--
-- Refer to RightsGlobals.pm for semantics.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- query:
--
-- SELECT stmt_num, stmt_url, stmt_head, stmt_text FROM access_stmts 
--   WHERE access_stmts.stmt_key = 
--     SELECT stmt_key FROM access_stmts_map 
--       WHERE attr=$attr AND source=$source 
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS access_stmts_map;
CREATE TABLE `access_stmts_map` (`a_attr` varchar(32) NOT NULL default '', `a_source` varchar(32) NOT NULL default '', `stmt_key` varchar(32) NOT NULL default '', PRIMARY KEY (`a_attr`, `a_source`)); 

-- All source=google
INSERT INTO access_stmts_map
       SET
       a_attr='pd',
       a_source='google',
       stmt_key='pd-google';
INSERT INTO access_stmts_map
       SET
       a_attr='ic',
       a_source='google',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='opb',
       a_source='google',
       stmt_key='section108';
INSERT INTO access_stmts_map
       SET
       a_attr='orph',
       a_source='google',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='und',
       a_source='google',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='umall',
       a_source='google',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='world',
       a_source='google',
       stmt_key='oa-google';
INSERT INTO access_stmts_map
       SET
       a_attr='nobody',
       a_source='google',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='pdus',
       a_source='google',
       stmt_key='pd-us-google';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by',
       a_source='google',
       stmt_key='cc-by';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nd',
       a_source='google',
       stmt_key='cc-by-nd';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc-nd',
       a_source='google',
       stmt_key='cc-by-nc-nd';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc',
       a_source='google',
       stmt_key='cc-by-nc';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc-sa',
       a_source='google',
       stmt_key='cc-by-nc-sa';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-sa',
       a_source='google',
       stmt_key='cc-by-sa';

-- All source=lit-dlps-dc
INSERT INTO access_stmts_map
       SET
       a_attr='pd',
       a_source='lit-dlps-dc',
       stmt_key='pd';
INSERT INTO access_stmts_map
       SET
       a_attr='ic',
       a_source='lit-dlps-dc',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='opb',
       a_source='lit-dlps-dc',
       stmt_key='section108';
INSERT INTO access_stmts_map
       SET
       a_attr='orph',
       a_source='lit-dlps-dc',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='und',
       a_source='lit-dlps-dc',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='umall',
       a_source='lit-dlps-dc',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='world',
       a_source='lit-dlps-dc',
       stmt_key='oa';
INSERT INTO access_stmts_map
       SET
       a_attr='nobody',
       a_source='lit-dlps-dc',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='pdus',
       a_source='lit-dlps-dc',
       stmt_key='pd-us';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by',
       a_source='lit-dlps-dc',
       stmt_key='cc-by';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nd',
       a_source='lit-dlps-dc',
       stmt_key='cc-by-nd';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc-nd',
       a_source='lit-dlps-dc',
       stmt_key='cc-by-nc-nd';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc',
       a_source='lit-dlps-dc',
       stmt_key='cc-by-nc';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc-sa',
       a_source='lit-dlps-dc',
       stmt_key='cc-by-nc-sa';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-sa',
       a_source='lit-dlps-dc',
       stmt_key='cc-by-sa';

-- All source=ump
INSERT INTO access_stmts_map
       SET
       a_attr='pd',
       a_source='ump',
       stmt_key='pd';
INSERT INTO access_stmts_map
       SET
       a_attr='ic',
       a_source='ump',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='opb',
       a_source='ump',
       stmt_key='section108';
INSERT INTO access_stmts_map
       SET
       a_attr='orph',
       a_source='ump',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='und',
       a_source='ump',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='umall',
       a_source='ump',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='world',
       a_source='ump',
       stmt_key='oa';
INSERT INTO access_stmts_map
       SET
       a_attr='nobody',
       a_source='ump',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='pdus',
       a_source='ump',
       stmt_key='pd-us';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by',
       a_source='ump',
       stmt_key='cc-by';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nd',
       a_source='ump',
       stmt_key='cc-by-nd';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc-nd',
       a_source='ump',
       stmt_key='cc-by-nc-nd';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc',
       a_source='ump',
       stmt_key='cc-by-nc';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc-sa',
       a_source='ump',
       stmt_key='cc-by-nc-sa';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-sa',
       a_source='ump',
       stmt_key='cc-by-sa';

-- All source=ia
INSERT INTO access_stmts_map
       SET
       a_attr='pd',
       a_source='ia',
       stmt_key='pd';
INSERT INTO access_stmts_map
       SET
       a_attr='ic',
       a_source='ia',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='opb',
       a_source='ia',
       stmt_key='section108';
INSERT INTO access_stmts_map
       SET
       a_attr='orph',
       a_source='ia',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='und',
       a_source='ia',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='umall',
       a_source='ia',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='world',
       a_source='ia',
       stmt_key='oa';
INSERT INTO access_stmts_map
       SET
       a_attr='nobody',
       a_source='ia',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='pdus',
       a_source='ia',
       stmt_key='pd-us';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by',
       a_source='ia',
       stmt_key='cc-by';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nd',
       a_source='ia',
       stmt_key='cc-by-nd';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc-nd',
       a_source='ia',
       stmt_key='cc-by-nc-nd';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc',
       a_source='ia',
       stmt_key='cc-by-nc';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc-sa',
       a_source='ia',
       stmt_key='cc-by-nc-sa';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-sa',
       a_source='ia',
       stmt_key='cc-by-sa';

-- All source=yale
INSERT INTO access_stmts_map
       SET
       a_attr='pd',
       a_source='yale',
       stmt_key='pd';
INSERT INTO access_stmts_map
       SET
       a_attr='ic',
       a_source='yale',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='opb',
       a_source='yale',
       stmt_key='section108';
INSERT INTO access_stmts_map
       SET
       a_attr='orph',
       a_source='yale',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='und',
       a_source='yale',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='umall',
       a_source='yale',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='world',
       a_source='yale',
       stmt_key='oa';
INSERT INTO access_stmts_map
       SET
       a_attr='nobody',
       a_source='yale',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='pdus',
       a_source='yale',
       stmt_key='pd-us';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by',
       a_source='yale',
       stmt_key='cc-by';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nd',
       a_source='yale',
       stmt_key='cc-by-nd';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc-nd',
       a_source='yale',
       stmt_key='cc-by-nc-nd';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc',
       a_source='yale',
       stmt_key='cc-by-nc';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc-sa',
       a_source='yale',
       stmt_key='cc-by-nc-sa';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-sa',
       a_source='yale',
       stmt_key='cc-by-sa';

-- All source=umn
INSERT INTO access_stmts_map
       SET
       a_attr='pd',
       a_source='umn',
       stmt_key='pd';
INSERT INTO access_stmts_map
       SET
       a_attr='ic',
       a_source='umn',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='opb',
       a_source='umn',
       stmt_key='section108';
INSERT INTO access_stmts_map
       SET
       a_attr='orph',
       a_source='umn',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='und',
       a_source='umn',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='umall',
       a_source='umn',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='world',
       a_source='umn',
       stmt_key='oa';
INSERT INTO access_stmts_map
       SET
       a_attr='nobody',
       a_source='umn',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='pdus',
       a_source='umn',
       stmt_key='pd-us';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by',
       a_source='umn',
       stmt_key='cc-by';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nd',
       a_source='umn',
       stmt_key='cc-by-nd';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc-nd',
       a_source='umn',
       stmt_key='cc-by-nc-nd';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc',
       a_source='umn',
       stmt_key='cc-by-nc';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc-sa',
       a_source='umn',
       stmt_key='cc-by-nc-sa';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-sa',
       a_source='umn',
       stmt_key='cc-by-sa';

-- All source=mhs
INSERT INTO access_stmts_map
       SET
       a_attr='pd',
       a_source='mhs',
       stmt_key='pd';
INSERT INTO access_stmts_map
       SET
       a_attr='ic',
       a_source='mhs',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='opb',
       a_source='mhs',
       stmt_key='section108';
INSERT INTO access_stmts_map
       SET
       a_attr='orph',
       a_source='mhs',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='und',
       a_source='mhs',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='umall',
       a_source='mhs',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='world',
       a_source='mhs',
       stmt_key='oa';
INSERT INTO access_stmts_map
       SET
       a_attr='nobody',
       a_source='mhs',
       stmt_key='ic';
INSERT INTO access_stmts_map
       SET
       a_attr='pdus',
       a_source='mhs',
       stmt_key='pd-us';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by',
       a_source='mhs',
       stmt_key='cc-by';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nd',
       a_source='mhs',
       stmt_key='cc-by-nd';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc-nd',
       a_source='mhs',
       stmt_key='cc-by-nc-nd';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc',
       a_source='mhs',
       stmt_key='cc-by-nc';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-nc-sa',
       a_source='mhs',
       stmt_key='cc-by-nc-sa';
INSERT INTO access_stmts_map
       SET
       a_attr='cc-by-sa',
       a_source='mhs',
       stmt_key='cc-by-sa';
