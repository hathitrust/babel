-- ---------------------------------------------------------------------
-- HathiTrust Data API Client authorization data
--
-- Note that resource_id must coordinate with the values in
-- /htapps/babel/htd/lib/API/HTD/App/V_1/config.yaml:
--  meta structure aggregate pageimage pageocr pagecoordocr pagemeta
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS htd_authorization;
CREATE TABLE `htd_authorization` (`access_key` varchar(64) NOT NULL default '', `code` tinyint NOT NULL DEFAULT 0, `type` CHAR(1) NOT NULL DEFAULT 'U', PRIMARY KEY (`access_key`));
