USE ht;
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
