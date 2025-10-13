package MBooks::PIFiller::JSON;


=head1 NAME

MBooks::PIFiller::Error (pif)

=head1 DESCRIPTION

This class implements the PI handlers for the ACTION_DISP_PAGE page=error_ajax action.

=head1 SYNOPSIS

See coding example in base class PIFiller

=head1 METHODS

=over 8

=cut

use strict;

use base qw(PIFiller);
use Search::Constants;



# ---------------------------------------------------------------------
sub  handle_COLLS_OWNED_JSON_PI
    : PI_handler(COLLS_OWNED_JSON) {
    my ($C, $act, $piParamHashRef) = @_;

    my $cs = $act->get_transient_facade_member_data($C, 'collection_set_object');
    my $cgi = $C->get_object('CGI');
    
    # XXX will this method of getting user name work accross scripts? i.e. vufind--cosign--CB?
    # If not do we send uniqname as a get parameter or as a post?
    
    my $owner = $C->get_object('Auth')->get_user_name($C);
    # Auth->get_user_name($C) returns 0 if there is neither a session
    # nor unique name.
    unless ($owner)
    {
        my $error_message = "There was a problem with authentication for the owner";
        return build_json_error($error_message);
    }
        
    # reference to an array of hashrefs with the keys being MColl_ID
    # and collname returns undef if bad user_id
    my $coll_hashref = $cs->get_coll_data_from_user_id($owner);
            
    if (! defined($coll_hashref)) {
        my $error_message="There was a problem with the database";
        return build_json_error($error_message);
    }
    
    my $label_hashref = {};
    
    # we need a hashref with key = id value = collname
    foreach my $row (@{$coll_hashref}) {
        $label_hashref->{$row->{'MColl_ID'}}= $row->{'collname'}
    }

    # we need list of ids sorted by coll_name
    my @sorted_ids =  
        sort 
        { 
            lc($label_hashref->{$a}) cmp lc($label_hashref->{$b})
        } (keys %{$label_hashref});
    
    my $name='coll_list';
    
    my $list_ref = \@sorted_ids;
    my $json = build_json($name, $list_ref, $label_hashref);

    return $json;
}


# ---------------------------------------------------------------------
# XXX  What should convention for JSON call failure be?
sub build_json_error
{
    my $msg = shift;
    my   $json_error='{error:"';
    $json_error .= "$msg";
    $json_error .= '"}';
        
    return "$json_error";
}

# ---------------------------------------------------------------------
#
#    sample json ouput
#

# {coll_list:[
#            {coll_id:collname},
#            {123:"My Collection"},
#            {453:"Another Collection"},
#            ]
# }
sub build_json
{
    my ($name, $list_ref, $label_hashref) = @_;
    my $json = "\{$name:\[\n\t";
    foreach my $id (@{$list_ref})
    {
        my $coll_name = $label_hashref->{$id};
        # escape json special characters: ":() { }"
    
        $coll_name =~s/([\:\}\{\(\)])/\\$1/g;
        
        $json .= "\{ $id\:\"$coll_name\"\}\,\n\t";
    }
    $json .= "\]\n\}";

    return $json;
}

# ---------------------------------------------------------------------

1;
__END__

=head1 AUTHOR

Tom Burton-West, University of Michigan, tburtonw@umich.edu

=cut
