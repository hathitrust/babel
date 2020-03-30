#!/usr/bin/env perl

use strict;

use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use Vendors;
use Database;

use Try::Tiny;

my $TABLE_NAME = q{pt_exclusivity_ng};

# Database connection
my $db =  new Database('ht_web');
my $dbh = $db->get_DBH();
$dbh->{RaiseError} = 1;

my $manage_sql = <<SQL;
DELETE FROM $TABLE_NAME WHERE expires < NOW() - INTERVAL 12 HOUR
SQL

$dbh->{AutoCommit} = 0;

try {
    $dbh->do($manage_sql);
    $dbh->commit();
} catch {
    $dbh->rollback;
}
