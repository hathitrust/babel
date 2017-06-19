package LS::Operation::CollectionUtil;

sub test_collection {
    my ( $C, $act ) = @_;
    my $cgi = $C->get_object('CGI');

    if ( defined $cgi->param('c') ) {
        my $coll_id = $cgi->param('c');
        my $co = $act->get_transient_facade_member_data($C, 'collection_object');
        my $owner = $co->get_user_id;
        my $CS = $act->get_transient_facade_member_data($C, 'collection_set_object');

        if (! $CS->exists_coll_id($coll_id))
        {
            # Note: we would like to give the user the collection name if
            # they clicked on a link to a non-existent collection, but we
            # can't get it.
            my $msg = q{Collection "} . $coll_id .  q{" does not exist. };  
            $act->set_error_record($C, $act->make_error_record($C, $msg));
            print $cgi->redirect("/cgi/mb");
            exit;
        }

        # only if collection not public do we care about owner!!
        if (($co->get_shared_status($coll_id) eq "private")
            &&
            (! $co->coll_owned_by_user($coll_id, $owner)))
        {
            my $msg = q{"} . $co->get_coll_name($coll_id) .
                q{" is a private collection. Login for more options.};
            $act->set_error_record($C, $act->make_error_record($C, $msg));

            print $cgi->redirect("/cgi/mb");
            exit;
        }
    }
}

1;