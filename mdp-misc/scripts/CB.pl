#!/l/local/bin/perl

use strict;

# Add submodule to Perl @INC
use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use Vendors;

use Utils;
use MdpConfig;
use Database;
use DbUtils;

# ---------------------------------------------------------------------
# 
# This script populates the Collection Builder test_* tables (which
# have a newer schema than the m_* tables) from the (currently named)
# m_* tables. It then migrates from the m_* tables by renameing the
# test_* tables to o_* (to be read by the new CB code) leaving behind
# the m_* tabels as a backup.  This process could be continued for
# more schema changes by changing 'm' to 'o' in the code below and
# creating p_* tables, etc.
#
# ---------------------------------------------------------------------

my $db_server = 'mysql-sdr';
my $dsn = qq{DBI:mysql:mdp:$db_server};

my $user = query("Enter user $dsn: ");
my $passwd = query("Enter password for pfarber at $dsn: ");

my $dbh = DBI->connect
  (
   $dsn, 
   $user, 
   $passwd, 
 {RaiseError => 1,}
  );

{
    my ($statement, $sth);
    
    # ---------------------------------------------------------------------
    print "drop test_collection\n";
    
    $statement = qq{DROP TABLE IF EXISTS test_collection};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    
    print "create test_collection\n";
    
    $statement = qq{CREATE TABLE `test_collection` (`MColl_ID` int(10) unsigned NOT NULL default '0', `collname` varchar(100) NOT NULL default '', `owner` varchar(256) default NULL, `owner_name` varchar(32) default NULL, `description` varchar(255) default NULL, `num_items` int(11) default NULL, `shared` tinyint(1) default NULL, `modified` timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP, PRIMARY KEY  (`MColl_ID`), KEY `owner` (`owner`), KEY `shared` (`shared`), KEY `collname` (`collname`), KEY `num_items` (`num_items`)) ENGINE=MyISAM DEFAULT CHARSET=utf8};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    
    print "insert into test_collection\n";
    
    $statement = qq{INSERT INTO test_collection (`MColl_ID`, `collname`, `owner`, `owner_name`, `description`, `num_items`, `shared` , `modified`) SELECT `MColl_ID`, `collname`, `owner`, `owner_name`, `description`, `num_items`, `shared` , `modified` FROM m_collection};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    
    # ---------------------------------------------------------------------
    print "drop test_item\n";
    
    $statement = qq{DROP TABLE IF EXISTS test_item};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    
    print "create test_item\n";
    
    $statement = qq{CREATE TABLE `test_item` (`extern_item_id` varchar(255) NOT NULL default '', `display_title` text, `sort_title` varchar(255) default NULL, `author` varchar(255) default NULL, `date` date default NULL, `modified` timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP, `rights` tinyint(3) unsigned default NULL, `bib_id` varchar(20) default NULL, KEY `sort_title` (`sort_title`), KEY `author` (`author`), KEY `date` (`date`)) ENGINE=MyISAM DEFAULT CHARSET=utf8};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    
    print "insert into test_item\n";
    
    $statement = qq{INSERT INTO test_item (`extern_item_id`, `display_title`, `sort_title`, `author`, `date`, `modified`, `rights`, `bib_id`) SELECT `extern_item_id`, `display_title`, `sort_title`, `author`, `date`, `modified`, `rights`, `bib_id` FROM m_item};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    
    print "alter test_item\n";
    
    $statement = qq{ALTER TABLE test_item ADD PRIMARY KEY extern_item_id (extern_item_id)};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    
    # ---------------------------------------------------------------------
    print "drop test_coll_item\n";
    
    $statement = qq{DROP TABLE IF EXISTS test_coll_item};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    
    print "create test_coll_item\n";
    
    $statement = qq{CREATE TABLE `test_coll_item` (`item_id` int(10) unsigned NOT NULL default '0', `extern_item_id` varchar(255) NOT NULL default '', `MColl_ID` int(10) unsigned NOT NULL default '0', KEY `item_id` (`item_id`)) ENGINE=MyISAM DEFAULT CHARSET=utf8};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    
    print "insert into test_coll_item\n";
    
    $statement = qq{INSERT INTO test_coll_item (`item_id`, `MColl_ID`) SELECT item_id, MColl_ID FROM m_coll_item};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    
    $statement = qq{SELECT DISTINCT item_id FROM m_coll_item};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    my $ref_to_ary_of_hashref = $sth->fetchall_arrayref({});
    my $ct = 0;
    my $total = 0;
    
    print "update test_coll_item\n";
    
    foreach my $hashref (@$ref_to_ary_of_hashref) {
        my $item_id = $hashref->{item_id};
        
        $statement = qq{SELECT extern_item_id FROM m_item WHERE item_id=$item_id};
        $sth = DbUtils::prep_n_execute($dbh, $statement);
        my $extern_item_id = $sth->fetchrow_array();
        if (! $extern_item_id) {
            print "item_id=$item_id missing extern_item_id\n";
            sleep 5;
        }
        
        $statement = qq{UPDATE test_coll_item SET extern_item_id='$extern_item_id' WHERE item_id=$item_id};
        $sth = DbUtils::prep_n_execute($dbh, $statement, \$ct);
        
        #print "updated $ct\n" if ($ct > 0);
        if (++$total % 500 == 0) {
            print "total = $total\n"
        }
    }
    
    print "drop index test_coll_item\n";
    
    $statement = qq{ALTER TABLE test_coll_item DROP INDEX item_id};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    
    print "drop column test_coll_item\n";
    
    $statement = qq{ALTER TABLE test_coll_item DROP COLUMN item_id};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    
    print "add primary key  test_coll_item\n";
    
    $statement = qq{ALTER TABLE test_coll_item ADD PRIMARY KEY (`extern_item_id`,`MColl_ID`) };
    $sth = DbUtils::prep_n_execute($dbh, $statement);

    
    print "renaming from test_item to o_item\n";

    $statement = qq{RENAME TABLE test_item TO o_item};
    $sth = DbUtils::prep_n_execute($dbh, $statement);

    print "renaming from test_coll_item to o_coll_item\n";

    $statement = qq{RENAME TABLE test_coll_item TO o_coll_item};
    $sth = DbUtils::prep_n_execute($dbh, $statement);

    print "renaming from test_collection to o_collection\n";

    $statement = qq{RENAME TABLE test_collection TO o_collection};
    $sth = DbUtils::prep_n_execute($dbh, $statement);

}

# ---------------------------------------------------------------------

=item query

Description

=cut

# ---------------------------------------------------------------------
sub query {
    my ($query) = @_;

    print "$query ";

    my $ans = <STDIN>;
    chomp $ans;

    $ans =~ s,^\s*(.*?)\s*$,$1,;
    if($ans =~ /^q$/) {
        print "Quitting...\n";
        exit 0;
    }

    if (! defined($ans) || ($ans eq '')) {
        print "Quitting...\n";
        exit 0;
    }

    return $ans;
}

