package API::DbIF;

=head1 NAME

API::DbIF;

=head1 DESCRIPTION

This package contains database DBI utilities

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use DBI;

use Utils;

my $_h_prod_root = q{/htapps/babel/etc/};
my $_h_test_root = q{/htapps/test.babel/etc/};

my $Production_Config_Root = (-e $_h_prod_root) ? $_h_prod_root : $_h_test_root ;

my $Full_Access_Config_Root = q{/htapps/test.babel/etc/};
my $Sample_Access_Config_Root = q{/htapps/} . $ENV{HT_DEV} . q{.babel/etc/};

# ---------------------------------------------------------------------

=item __read_conf

Description

=cut

# ---------------------------------------------------------------------
sub __read_conf {
    my $filename = shift;

    my $conf;
    
    my $ok = open(CONF, '<:utf8', "$filename");
    if ($ok) {
        my @lines = <CONF>;
        chomp(@lines);
        
        foreach my $line (@lines) {
            my ($key, $value) = split(/\s*=\s*/, $line);
            $conf->{$key} = $value;
        }
    }
    close (CONF);

    return $conf;
}

# ---------------------------------------------------------------------

=item __htd_db_connect_params

The config file to use depends on whether the development user is
config'd for the sample environment or the full.

=cut

# ---------------------------------------------------------------------
sub ___htd_conf_file {
    my ($root, $user) = @_;
    my $conf_file = $root . $user . q{.conf};
    return $conf_file;
}

sub __htd_db_connect_params {
    my $_db_user = shift;

    my $conf_file;
    if ($ENV{HT_DEV}) {
        if ($ENV{SDRVIEW} eq 'sample') {
            $conf_file = ___htd_conf_file($Sample_Access_Config_Root, $_db_user);
        }
        else {
            $conf_file = ___htd_conf_file($Full_Access_Config_Root, $_db_user);
        }
    }
    else {
        $conf_file = ___htd_conf_file($Production_Config_Root, $_db_user);
    }
    my $db_config = __read_conf($conf_file);

    return $db_config;
}


# ---------------------------------------------------------------------

=item databaseConnect

Description:

=cut

# ---------------------------------------------------------------------
sub databaseConnect {
    my $db_user = shift;
    
    my $db_config = __htd_db_connect_params($db_user);
       
    return undef if (! $db_config);
    
    my $dsn = qq{DBI:mysql:$db_config->{db_name}:$db_config->{db_server}};
    my $dbh = DBI->connect(
                           $dsn,
                           $db_config->{db_user},
                           $db_config->{db_passwd},
                           {
                            PrintError => 1,
                            RaiseError => 0,
                            AutoCommit => 1,
                           }
                          );
    return $dbh;
}


# ---------------------------------------------------------------------

=item prepAndExecute

Description

=cut

# ---------------------------------------------------------------------
sub prepAndExecute {
    my ($dbh, $statement, @params) = @_;

    my $count;
    my $sth = $dbh->prepare($statement);
    if ($sth) {
        $count = $sth->execute(@params);
    }

    return $sth;
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2009-12 ©, The Regents of The University of Michigan, All Rights Reserved

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
