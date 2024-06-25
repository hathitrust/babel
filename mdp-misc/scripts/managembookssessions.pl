#!/usr/bin/env perl

=head1 managemdpsessions.pl

=head1 USAGE

From the command line or via a cron job.

=head1 DESCRIPTION

Clean expired MDP sessions and remove temp collections from the database

=head1 OPTIONS

=over 8

 m for mode: 

 "-m list" for list of sessions in sessions file

 "-m clean" to clean old sessions, requires value in -a

 a for age: 

 "-a 120" to clean out sessions older than 120 minutes (age
 in minutes) only valid with "-m clean"; default value of 120 minutes
 will be used if no age is given

=back

=cut

use strict;

BEGIN {
    ## $ENV{DEBUG_LOCAL} = 1;
}

our ( $opt_m, $opt_a, $opt_i, $opt_v );

use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use Vendors;

# for getting at session files
use DBI;

use Getopt::Std;
use MdpConfig;
use Database;
use Session;
use CollectionSet;
use Utils::GlobalSwitch;

use Utils::Logger;
use Utils::Time qw();

use Storable;      # for thawing data

# configuration
my $g_config = new MdpConfig(
                             Utils::get_uber_config_path('mdp-misc'),
                             $ENV{SDRROOT} . "/mdp-misc/lib/Config/global.conf",
                             $ENV{SDRROOT} . "/mdp-misc/lib/Config/local.conf"
                          );

# Database connection
my $db = new Database('ht_maintenance');
my $g_dbh = $db->get_DBH();

my $CS = CollectionSet->new($g_dbh, $g_config, 0);

# --------------------------------------------------
# configurable default value for age in minutes
my $g_default_age = '120';

# --------------------------------------------------
#       MAIN
# --------------------------------------------------

check_usage();

print "Operating ...\n" if ( $opt_v );

if ($opt_m eq 'list')
{
    list_sessions();
}
elsif ($opt_m =~ 'examine')
{
    my $short = ($opt_m eq 'examineshort');
    examine_sessions($opt_i, $short);
}
elsif ($opt_m =~ 'dump')
{
    examine_sessions(undef, undef);
}
else
{
    clean_sessions($opt_a);
}

exit;

# --------------------------------------------------
#       END MAIN
# --------------------------------------------------

# ---------------------------------------------------------------------

=item list_sessions

Description

=cut

# ---------------------------------------------------------------------
sub list_sessions
{
    my $sth = $g_dbh->prepare_cached('SELECT id FROM ht_sessions;')
        or die "Couldn't prepare statement: " . $g_dbh->errstr;

    $sth->execute();
    my @data;
    my @id_list;
    while (@data = $sth->fetchrow_array()) {
        push (@id_list, $data[0]);
    }
    $sth->finish;

    my ($statement, $ses, $timestamp, $localtime, $checked_count, $a_session);
    foreach my $id (@id_list)
    {
        $statement = qq{SELECT a_session  FROM ht_sessions where id='$id';};
        $sth = $g_dbh->prepare_cached($statement)
          or die "Couldn't prepare statement: " . $g_dbh->errstr;

        $sth->execute();

        $sth->bind_columns(undef, \$a_session);

        while($sth->fetch())
        {
            $checked_count++;

            # create a new blessed, but empty Session object
            $ses = new Session(undef, undef, 1);

            # unserialize the DlpsSession object hash and assign to empty blessed object
            $ses->set_persistent_session_hash(Storable::thaw($a_session));

            $timestamp = $ses->get_persistent('timestamp');
            $timestamp = $timestamp || 'NO TIMESTAMP';
            $localtime = format_timestamp($timestamp);
            my $age = ($timestamp eq 'NO TIMESTAMP') ? 'unknown' : int((time() - $timestamp)/60); 

            my $coll_data_arrayref = $CS->get_coll_data_from_user_id($id);
            my $num_temporary_colls = scalar(@$coll_data_arrayref);

            print STDOUT "Session id=$id timestamp: $localtime, Age=$age collections owned=$num_temporary_colls\n";
        }
    }

    print STDOUT qq{\nFound $checked_count sessions.\n};
    $sth->finish();
    $g_dbh->disconnect();
}


# ---------------------------------------------------------------------

=item dump_id

Description

=cut

# ---------------------------------------------------------------------
sub dump_id
{
    my ($examine_id, $a_session, $short) = @_;

    print STDOUT qq{\n\n***** Dump of SID=$examine_id *****\n\n};

    # create a new blessed, but empty DlpsSession object
    my $ses = new Session(undef, undef, 1);
    
    # unserialize the DlpsSession object hash and assign to empty blessed object
    $ses->set_persistent_session_hash(Storable::thaw($a_session));
    
    use Data::Dumper;
    $Data::Dumper::Indent = 1;         # mild pretty print
    my $dump = Data::Dumper->Dump([$ses], [qw($ses)]);

    print STDOUT $dump;
}

# ---------------------------------------------------------------------

=item examine_sessions 

Description

=cut

# ---------------------------------------------------------------------
sub examine_sessions
{
    my $examine_id = shift;
    my $short = shift;

    my $statement;
    
    if ($examine_id)
    {
        $statement = qq{SELECT id, a_session FROM ht_sessions where id = '$examine_id'};
    }
    else
    {  
        $statement = qq{SELECT id, a_session FROM ht_sessions};
        $short = 1;
    }

    my $sth = $g_dbh->prepare_cached($statement)
        or die "Couldn't prepare statement: " . $g_dbh->errstr;

    $sth->execute();


    if ($examine_id)
    {
        my ($id, $a_session);
        $sth->bind_columns(undef, \$id, \$a_session);

        $sth->fetch();

        dump_id($examine_id, $a_session, $short);
    }
    else
    {
        my $hash_ref;
        
        while ($hash_ref = $sth->fetchrow_hashref())
        {
            dump_id($$hash_ref{'id'}, $$hash_ref{'a_session'}, $short);
        }   
    }


    $sth->finish();
    $g_dbh->disconnect();
}


# ---------------------------------------------------------------------

=item clean_sessions

Description

=cut

# ---------------------------------------------------------------------
sub clean_sessions
{
    my $cutoff_age = shift;

    # get cutoff time based on now's time and cutoff age in minutes
    my $cutoff_time = time - (60 * $cutoff_age);

    my $now = format_timestamp(time);

    print STDOUT qq{Will delete inactive sessions that are older than } .
        $cutoff_age . qq{ minutes from now ($now)\n} if ( $opt_v );

    my $sth = $g_dbh->prepare_cached('SELECT id FROM ht_sessions;')
        or die "Couldn't prepare statement: " . $g_dbh->errstr;

    $sth->execute();

    my @data;
    my @id_list;
    while (@data = $sth->fetchrow_array()) {
        push (@id_list, $data[0]);
    }
    $sth->finish;

    my ($ses_deleted_count, $colls_deleted_count, $checked_count) = (0, 0);
    my ($statement, $session_deleted, $temp_colls_deleted, $a_session);
    foreach my $id (@id_list)
    {
        $statement = qq{SELECT a_session FROM ht_sessions where id='$id';};
        $sth = $g_dbh->prepare_cached($statement)
          or die "Couldn't prepare statement: " . $g_dbh->errstr;

        $sth->execute();

        # prepare to get the session id and the DlpsSession object itself
        $sth->bind_columns(undef, \$a_session);

        while($sth->fetch())
        {
            $checked_count++;

            ($session_deleted, $temp_colls_deleted)
                = delete_session_for_id($g_dbh, $id, $a_session, $cutoff_time);
            $ses_deleted_count += $session_deleted;
            $colls_deleted_count += $temp_colls_deleted;
        }

    }
    
    $sth->finish();
    $g_dbh->disconnect();

    my $C = new Context;
    $C->set_object('MdpConfig', $g_config);
    ## hacking the logfile key
    $$g_config{config}{_}{managembooksessions_logfile} = 'sessions___DATE___.log';

    my $s = "timestamp=" . Utils::Time::iso_Time('datetime');
    my $hostname = `hostname`; chomp $hostname;
    $s .= "|hostname=$hostname";
    $s .= "|processed=$checked_count|deleted=$ses_deleted_count|colls_deleted_count=$colls_deleted_count";
    if ( $checked_count ) {
        $s .= sprintf("|freshness=%.1f", (($checked_count - $ses_deleted_count)/$checked_count)*100);
    } else {
        $s .= "freshness=100";
    }

    Utils::Logger::__Log_string($C, $s, 'managembooksessions_logfile', '___QUERY___', 'managembooksessions');

    if ( $opt_v ) {
        print STDOUT "Processed $checked_count sessions\n";
        print STDOUT "Deleted $ses_deleted_count sessions\n";
        print STDOUT "Deleted $colls_deleted_count temporary collections\n";
        if ($checked_count) {
            printf("Freshness: %.1f %\n", (($checked_count - $ses_deleted_count)/$checked_count)*100);
        }
        else {
            print("Freshness: 100 %\n");
        }
    }
}


# ---------------------------------------------------------------------

=item format_timestamp

Description

=cut

# ---------------------------------------------------------------------
sub format_timestamp
{
    my $timestamp = shift;

    my $localtime = $timestamp;
    if ($timestamp =~ m,\d+,)
    {
        #     0    1    2     3     4    5     6     7     8
        my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime($timestamp);
        my $month = $mon + 1;
        $hour = (length($hour) == 1) ? '0' . $hour : $hour;
        $min  = (length($min) == 1)  ? '0' . $min  : $min;
        $localtime = "$month/$mday $hour:$min";
    }

    return $localtime;
}


# ---------------------------------------------------------------------

=item delete_session_for_id

Description

=cut

# ---------------------------------------------------------------------
sub delete_session_for_id
{
    my ($g_dbh, $id, $a_session, $cutoff_time) = @_;

    my $session_deleted = 0;
    my $temp_colls_deleted = 0;

    # create a new blessed, but empty DlpsSession object
    my $ses = new Session(undef, undef, 1);

    # unserialize the DlpsSession object hash and assign to empty blessed object
    $ses->set_persistent_session_hash(Storable::thaw($a_session));

    my $timestamp = $ses->get_persistent('timestamp');
    $timestamp = $timestamp || 'NO TIMESTAMP';

    if ($timestamp eq 'NO TIMESTAMP' ||
         $timestamp < $cutoff_time)
    {
        my $localtime = format_timestamp($timestamp);

        #print STDOUT "DELETE Session id=$id timestamp: $localtime, ";

        my $sth = $g_dbh->prepare_cached(qq{DELETE FROM ht_sessions WHERE id=\'} .
                                        $id .
                                        qq{\';})
            or die "Couldn't prepare statement: " . $g_dbh->errstr;

        $sth->execute();

        my $num_deleted = delete_temporary_collections($id);

        if ($num_deleted > 0) {
            $temp_colls_deleted = $num_deleted;
        }
        $session_deleted = 1
    }

    return ($session_deleted, $temp_colls_deleted);
}


# ---------------------------------------------------------------------

=item delete_temporary_collections

Description

=cut

# ---------------------------------------------------------------------
sub delete_temporary_collections
{
    my $id = shift;

    my $coll_data_arrayref = $CS->get_coll_data_from_user_id($id);
    my $num_temporary_colls = scalar(@$coll_data_arrayref);

    if ($num_temporary_colls)
    {
        $CS->delete_all_colls_for_user($id);
    }
    
    return $num_temporary_colls;
}

# ---------------------------------------------------------------------

=item check_usage


=cut

# ---------------------------------------------------------------------
sub check_usage
{
    # get command line options
    getopts('vm:a:i:');

    if (! $opt_m  ||
         ($opt_m  ne 'list' &&
           $opt_m  ne 'examine' &&
           $opt_m  ne 'examineshort' &&
           $opt_m  ne 'dump' &&
           $opt_m  ne 'clean')
      )
    {
        &print_usage() ;
        exit;
    }
    elsif ($opt_m eq 'clean' && ! $opt_a)
    {
        $opt_a = $g_default_age;
        return;
    }
}

# ----------------------------------------------------------------------
# NAME         : print_usage
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub print_usage
{
    print STDOUT qq{Usage:\n};
    print STDOUT qq{managemdpsessions.pl -m list\n\t\tfor a list of current sessions\n};
    print STDOUT qq{managemdpsessions.pl -m clean -a age\n\t\twhere "age" is maximum age in minutes of sessions to leave alive\n};
    print STDOUT qq{managemdpsessions.pl -m clean\n\t\twhere "age" defaults to $g_default_age\n\n};
    print STDOUT qq{managemdpsessions.pl -m examine[short] -i sid\n\t\twhere "sid" is a session id\n\n};
    print STDOUT qq{managemdpsessions.pl -m dump\n\n};
}





__END__;


=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2007 ©, The Regents of The University of Michigan, All Rights Reserved

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject
to the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

=cut

