--- inserts for users with elevated access
REPLACE INTO ht.ht_users (userid, displayname, email, usertype, role, access, expires, iprestrict, identity_provider, inst_id) VALUES
('totaluser@hathitrust.org','HathiTrust Totaluser','totaluser@hathitrust.org','staff','staffdeveloper','total',DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 YEAR),'^.*$','https://idp.hathitrust.org/entity','hathitrust');

REPLACE INTO ht.ht_users (userid, displayname, email, usertype, role, access, expires, iprestrict, identity_provider, inst_id) VALUES
('ssdproxy@hathitrust.org','HathiTrust Ssdproxy','ssdproxy@hathitrust.org','external','ssdproxy','normal',DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 YEAR),'^.*$','https://idp.hathitrust.org/entity','hathitrust');

REPLACE INTO ht.ht_users (userid, displayname, email, usertype, role, access, expires, iprestrict, identity_provider, inst_id) VALUES
('ssduser@hathitrust.org','HathiTrust Ssduser','ssduser@hathitrust.org','student','ssd','normal',DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 YEAR),'^.*$','https://idp.hathitrust.org/entity','hathitrust');

REPLACE INTO ht.ht_users (userid, displayname, email, usertype, role, access, expires, iprestrict, identity_provider, inst_id) VALUES
('rsuser@hathitrust.org','HathiTrust Resource-Sharinguser','rsuser@hathitrust.org','external','resource_sharing','normal',DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 YEAR),'^.*$','https://idp.hathitrust.org/entity','hathitrust');

--- inserts/updates for ht_institutions
REPLACE INTO ht.ht_institutions (inst_id, name, domain, us, enabled, entityID, allowed_affiliations)
  VALUES ('umich','University of Michigan','umich.edu','1','1','https://shibboleth.umich.edu/idp/shibboleth','^(member|alum|faculty|staff|student|employee)@umich.edu');

REPLACE INTO ht.ht_institutions (inst_id, name, domain, us, enabled, entityID, allowed_affiliations)
  VALUES ('hathitrust','HathiTrust','hathitrust.org','1','1','https://idp.hathitrust.org/entity','^(member|alum|faculty|staff|student|employee)@hathitrust.org');

REPLACE INTO ht.ht_institutions (inst_id, name, domain, us, enabled, entityID, allowed_affiliations, emergency_status)
  VALUES ('etas','ETAS Example Inst','etas.example','1','1','https://idp.etas.example','^(member)@etas.example','^(member)@etas.example');

REPLACE INTO ht.ht_institutions (inst_id, name, domain, us, enabled, entityID, allowed_affiliations)
  VALUES ('nonus','Example Non-US Institution','nonus.ac.uk','0','1','https://registry.shibboleth.nonus.ac.uk/idp','^(member|alum|faculty|staff|student|employee)@nonus.ac.uk');

--- sample data for testing authenticated access
REPLACE INTO ht.rights_current (namespace, id, attr, reason, source, access_profile, user, note) values ('test','ic_currently_held','2','1','19','1','babel','Synthetic test item');
REPLACE INTO ht.rights_current (namespace, id, attr, reason, source, access_profile, user, note) values ('test','ic_not_held','2','1','19','1','babel','Synthetic test item');
REPLACE INTO ht.rights_current (namespace, id, attr, reason, source, access_profile, user, note) values ('test','ic_not_current','2','1','19','1','babel','Synthetic test item');

--- sample data for unit testing und-world which has an impoverished set of entries in db-image
REPLACE INTO ht.rights_current (namespace, id, attr, reason, source, access_profile, user, note) values ('test','und-world_open','18','1','19','1','babel','Synthetic test item');
REPLACE INTO ht.rights_current (namespace, id, attr, reason, source, access_profile, user, note) values ('test','und-world_google','18','1','19','2','babel','Synthetic test item');
REPLACE INTO ht.rights_current (namespace, id, attr, reason, source, access_profile, user, note) values ('test','und-world_page','18','1','19','3','babel','Synthetic test item');
