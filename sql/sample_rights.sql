--- sample data for testing authenticated access
REPLACE INTO ht.rights_current (namespace, id, attr, reason, source, access_profile, user, note) values ('test','ic_currently_held','2','1','19','1','babel','Synthetic test item');
REPLACE INTO ht.rights_current (namespace, id, attr, reason, source, access_profile, user, note) values ('test','ic_not_held','2','1','19','1','babel','Synthetic test item');
REPLACE INTO ht.rights_current (namespace, id, attr, reason, source, access_profile, user, note) values ('test','ic_not_current','2','1','19','1','babel','Synthetic test item');
REPLACE INTO ht.rights_current (namespace, id, attr, reason, source, access_profile, user, note) values ('test','op_brlm','3','10','19','1','babel','Synthetic test item');

--- sample data for unit testing und-world which has an impoverished set of entries in db-image
REPLACE INTO ht.rights_current (namespace, id, attr, reason, source, access_profile, user, note) values ('test','und-world_open','18','1','19','1','babel','Synthetic test item');
REPLACE INTO ht.rights_current (namespace, id, attr, reason, source, access_profile, user, note) values ('test','und-world_google','18','1','19','2','babel','Synthetic test item');
REPLACE INTO ht.rights_current (namespace, id, attr, reason, source, access_profile, user, note) values ('test','und-world_page','18','1','19','3','babel','Synthetic test item');

--- sample data
REPLACE INTO ht.rights_current (namespace, id, attr, reason, source, access_profile, user, note) values ('test','lorem','1','1','19','1','babel','Synthetic test item');
