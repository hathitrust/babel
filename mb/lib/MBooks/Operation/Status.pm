package MBooks::Operation::Status;


=head1 NAME

Operation:Status

=head1 DESCRIPTION

This package defines opcodes returned from methods in subclasses of
Operation.

=head1 SYNOPSIS

use MBooks::Operation::Status;

my $status = $ST_ADD_COLL_FAILED;

To add a new status code:

=over 4

define the code variable, e.g. $ST_ADD_COLL_FAILED

assign it the next available highest power of 2

add the code to the %status_code_2_key_map with a new key

add the code to @EXPORT

add the key and a corresponding message to the lookup table in SDRROOT/web/m/mdp/MBooks/langmap.xml

=back

SDRROOT/web/m/mdp/MBooks/status_codes.xsl reads this table.

=over 8

=cut

# Define shared $ST_OK = 0 return code
use Operation::Status;

use Exporter;
use base qw(Exporter);

our @EXPORT = qw(
                 %status_code_2_key_map 

                 $MAX_STATUS_VALUE

                 $ST_OK
                 $ST_NOT_OK
                 $ST_ADD_COLL_FAILED
                 $ST_LIST_COLL_PUBLIC_FAILED
                 $ST_LIST_COLL_PRIV_FAILED
                 $ST_DEL_COLL_NOT_OWNER
                 $ST_DEL_COLL_FAILED
                 $ST_LIST_ITEMS_FAILED
                 $ST_COLL_NOT_OWNER
                 $ST_COPY_ITEMS_FAILED 
                 $ST_DELETE_ITEMS_FAILED 
                );

our $ST_OK                       = $Operation::Status::ST_OK;
our $ST_NOT_OK                   = -1; # For use with error.{xsl,xml}

our $ST_ADD_COLL_FAILED          = 1;
our $ST_LIST_COLL_PUBLIC_FAILED  = 2;
our $ST_LIST_COLL_PRIV_FAILED    = 4;
our $ST_DEL_COLL_NOT_OWNER       = 8;
our $ST_DEL_COLL_FAILED          = 16;
our $ST_LIST_ITEMS_FAILED        = 32 ;
our $ST_COLL_NOT_OWNER           = 64;
our $ST_COPY_ITEMS_FAILED        = 128;
our $ST_DELETE_ITEMS_FAILED      = 256;

# Be sure to update this value
our $MAX_STATUS_VALUE            = 256;

# Be sure to update this map
our %status_code_2_key_map =
    (
     $ST_OK                      => 'st.ok', 
     $ST_ADD_COLL_FAILED         => 'st.addcoll.failed',
     $ST_LIST_COLL_PUBLIC_FAILED => 'st.listcoll.public.failed',
     $ST_LIST_COLL_PRIV_FAILED   => 'st.listcoll.private.failed',
     $ST_DEL_COLL_NOT_OWNER      => 'st.not.owner.delete.failed',
     $ST_DEL_COLL_FAILED         => 'st.delete.failed',
     $ST_LIST_ITEMS_FAILED       => 'st.list.items.failed',         
     $ST_COLL_NOT_OWNER          => 'st.not.owner.op.failed',
     $ST_COPY_ITEMS_FAILED       => 'st.copy.items.failed',
     $ST_DELETE_ITEMS_FAILED     => 'st.delete.items.failed',
    );


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
