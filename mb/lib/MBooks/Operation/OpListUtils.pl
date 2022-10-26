#----------------------------------------------------------------------
# OpListUtils.pl
#----------------------------------------------------------------------

sub get_rights {
    my $self = shift;
    my ($C, $rights_ref) = @_;

    $rights_ref = Access::Rights::get_fulltext_attr_list($C);

    return $rights_ref;
}


# ---------------------------------------------------------------------

=item test_ownership

Description

=cut

# ---------------------------------------------------------------------
sub test_ownership {
    my $self = shift;
    my ($C, $co, $act, $coll_id, $owner) = @_;

    if($co->get_shared_status($coll_id) eq "draft") {
        return $ST_OK;
    }

    # only if collection not public do we care about owner!!
    if (($co->get_shared_status($coll_id) eq "private")
        &&
        (! $co->coll_owned_by_user($coll_id, $owner)))
    {
        my $msg = q{"} . $co->get_coll_name($coll_id) .
            q{" is a private collection.};
        unless ( $ENV{REMOTE_USER} ) { $msg .= q{ Login for more options.}; }
        else { $msg .= qq{ <a href="/cgi/mb?a=listcs;colltype=my-collections">View your collections</a>}; }
        $act->set_error_record($C, $act->make_error_record($C, $msg));

        return $ST_COLL_NOT_OWNER;
    }

    return $ST_OK;
}


# ---------------------------------------------------------------------


=item do_paging

Description

=cut

# ---------------------------------------------------------------------
sub do_paging
{
    my $self = shift;
    my $C = shift;
    my $cgi = shift;
    my $total_count = shift;

    my $act = $self->get_action();
    my $config = $C->get_object('MdpConfig');
    my $records_per_page = $config->get('default_records_per_page');
    my $current_page = 1; # default is page 1

    if (defined $cgi->param('sz'))
    {
        $records_per_page = $cgi->param('sz');
    }

    if (defined $cgi->param('pn'))
    {
        $current_page = $cgi->param('pn');
    }

    my $pager = Data::Page->new();

    $pager->total_entries($total_count);
    $pager->entries_per_page($records_per_page);
    $pager->current_page($current_page);

    return $pager;
}

# ---------------------------------------------------------------------

=item make_href_for_collid

Description

=cut

# ---------------------------------------------------------------------
sub make_href_for_collid
{
    my $self = shift;
    my $C = shift;
    my $coll_id = shift;

    my $cgi = $C->get_object('CGI');

    # copy cgi because we want pn and sz and sort params.  this always
    # goes to a list items even if called from list search results
    my $temp_cgi = new CGI($cgi);
    $temp_cgi->param('a', 'listis');
    $temp_cgi->param('c', $coll_id);
    $temp_cgi->delete('c2');
    # no relevance sort in list items urls!
    if ($temp_cgi->param('sort') =~ m,rel,)
    {
        $temp_cgi->delete('sort');
    }

    my $href = $temp_cgi->self_url();

    return $href;
}


# ---------------------------------------------------------------------

=item add_hrefs

Description

XXX TODO reimplement using memonization/hash lookup instead of calling
make_href_for_collid inside of loop a zillion times

=cut

# ---------------------------------------------------------------------
sub add_hrefs
{
    my $self = shift;
    my $C = shift;
    my $coll_ary_hashref = shift;

    # ref to array of refs to hashes
    my $out_ary_href = [];

    my $i = 0;
    my $id2href = {};

    foreach my $coll (@{$coll_ary_hashref})
    {
        my $coll_id = $coll->{'MColl_ID'};

        $out_ary_href->[$i]->{'MColl_ID'} = $coll_id;
        $out_ary_href->[$i]->{'collname'} = $coll->{'collname'};

        if (! exists $id2href->{$coll_id})
        {
            $id2href->{$coll_id} = $self->make_href_for_collid($C, $coll_id);
        }
        $out_ary_href->[$i]->{'href'} = $id2href->{$coll_id};
        $i++;
    }

    return $out_ary_href;
}


# ---------------------------------------------------------------------

=item is_full_text

Description

=cut

# ---------------------------------------------------------------------
sub is_full_text
{
    my $self = shift;
    my $rights_ref = shift;
    my $rights_attr = shift;

    return grep(/^$rights_attr$/, @$rights_ref);
}

sub is_emergency_access
{
    my $self = shift;
    my $C = shift;
    my $id = shift;
    my $rights_ref = shift;
    my $rights_attr = shift;

    my $emergency_flag = 0;
    if ( $self->is_full_text($rights_ref, $rights_attr) ) {
        my $ar = new Access::Rights($C, $id);
        $access_status = $ar->check_final_access_status_by_attribute($C, $rights_attr, $id);
        if ( $access_status eq 'allow' && $ar->in_copyright($C, $id) ) {
            my $initial_access_status = $ar->check_initial_access_status_by_attribute($C, $rights_attr, $id);
            $emergency_flag = ( $initial_access_status =~ m,emergency, ) || 0;
        }
    }
    return $emergency_flag;
}


# ---------------------------------------------------------------------

=item get_final_item_arr_ref

Description

=cut

# ---------------------------------------------------------------------
sub get_final_item_arr_ref {
    my $self = shift;
    my $C = shift;
    my $item_arr_ref = shift;
    my $rights_ref = shift;

    my $auth = $C->get_object('Auth');

    my $cgi = $C->get_object('CGI');
    my $coll_id = $cgi->param('c');
    my $co = $self->get_action()->get_transient_facade_member_data($C, 'collection_object');
    my $owner = $co->get_user_id;
    my $final_item_arr_ref = [];

    my $coll_items_hashref = $co->get_coll_data_for_items_and_user($item_arr_ref, $owner);

    foreach my $item_hashref (@$item_arr_ref) {
        my $item_rights_attr = $item_hashref->{'rights'};

        ## --- the classic mb algorithm is way permissive
        # if ( $self->is_full_text($rights_ref, $item_rights_attr)) {
        #     $item_hashref->{'fulltext'} = '1';
        # }
        # else {
        #     $item_hashref->{'fulltext'} = '0';
        # }

        # if ( $self->is_emergency_access($C, $$item_hashref{extern_item_id}, $rights_ref, $item_rights_attr)) {
        #     $item_hashref->{'emergency_flag'} = '1';
        # }
        # else {
        #     $item_hashref->{'emergency_flag'} = '0';
        # }

        ## --- use the ls algorithm
        # Access rights
        my $id = $$item_hashref{extern_item_id};
        my $access_status;
        eval {
            my $ar = new Access::Rights($C, $id);
            $access_status = $ar->check_final_access_status_by_attribute($C, $item_rights_attr, $id);
        };
        $access_status = 'deny'
            if ($@);

        my $fulltext_flag = ($access_status eq 'allow') ? 1 : 0;
        my $activated_role;
        my $emergency_flag = 0;
        my $initial_access_status;

        if ( $access_status eq 'allow' ) {
            my $initial_access_status;
            eval {
                my $ar = new Access::Rights($C, $id);
                if ( $ar->in_copyright($C, $id) ) {
                    $initial_access_status = $ar->check_initial_access_status_by_attribute($C, $item_rights_attr, $id);
                    $emergency_flag = ( $initial_access_status =~ m,emergency, ) || 0;
                    if ( $initial_access_status =~ m,allow_ssd, ) {
                        $activated_role = { role => 'enhancedText' };
                    } else {
                        $activated_role = $auth->get_activated_switchable_role($C);
                    }
                }
            };
        }

        $$item_hashref{fulltext} = $fulltext_flag;
        $$item_hashref{emergency_flag} = $emergency_flag;
        $$item_hashref{activated_role} = $$activated_role{role} 
            if ( ref $activated_role );

        # add array_of hashrefs of collection info for collections
        # owned by user that also include the item
        my $coll_ary_hashref;

        # eval {
        #     $coll_ary_hashref = $co->get_coll_data_for_item_and_user($id, $owner);
        # };
        # ASSERT(!$@, qq{Error: $@});

        my $coll_ary_hashref = $$coll_items_hashref{$id} || [];

        # add hrefs
        my $coll_ary_hashref_final = $self->add_hrefs($C, $coll_ary_hashref);
        $item_hashref->{'item_in_collections'} = $coll_ary_hashref_final;

        $item_hashref->{'record_no'} = $item_hashref->{'bib_id'};

        # create final_item_arr_ref with additional fulltext field in
        # each hashref set to full text or not and additional
        # item_in_collections field with info about collections owned
        # by user containing item
        push(@$final_item_arr_ref, $item_hashref);
    }

    return $final_item_arr_ref;
}


# ---------------------------------------------------------------------

=item get_item_data

Description

=cut

# ---------------------------------------------------------------------
sub get_item_data {
    my $self = shift;
    my $C = shift;
    my $rights_ref = shift;
    my $pager = shift;
    my $id_arr_ref = shift;

    my $ab = $C->get_object('Bind');
    my $act = $self->get_action();

    my $co = $act->get_transient_facade_member_data($C, 'collection_object');
    my $cgi = $C->get_object('CGI');
    my $coll_id = $cgi->param('c');
    my $sortkey = $ab->mapurl_param_to_field($C, scalar $cgi->param('sort'), 'title_a');

    # get direction by munging url sort param
    my $direction = MBooks::Utils::Sort::get_dir_from_sort_param(scalar $cgi->param('sort'));

    # XXX replace these will call to either cgi param or processing of
    # cgi param
    my $current_page = $pager->current_page;

    my $slice_start = $pager->first; # record number of first item on page
    my $recs_per_slice = $pager->entries_per_page;

    my $rights_limit;
    my $limit = $cgi->param('lmt');

    if ($limit eq 'ft') {
        $rights_limit = $rights_ref;
    }

    my $item_arr_ref;
    eval {
        $item_arr_ref = $co->list_items($coll_id, $sortkey, $direction,
                                        $slice_start, $recs_per_slice,
                                        $rights_limit, $id_arr_ref);
    };
    ASSERT(!$@, qq{Error: $@});

    return $item_arr_ref;
}

# ---------------------------------------------------------------------

=item test_mondo_collection

Description

=cut

# ---------------------------------------------------------------------
sub test_mondo_collection {
    my $self = shift;
    my ($C, $co, $act, $coll_id, $user_query_string ) = @_;
    my $cgi = $C->get_object('CGI');

    my $mondo_check_max_item_ids = $co->get_config()->get('mondo_check_max_item_ids');
    if ( ! defined $cgi->param('adm') &&
         $co->collection_is_large($coll_id) &&
         $co->count_all_items_for_coll($coll_id) >= $mondo_check_max_item_ids    
       ) {
        $user_query_string = '*' unless ( $user_query_string );

        my $redirect_url = "/cgi/ls?a=srchls;c=$coll_id;q1=$user_query_string";
        foreach my $facet ( $cgi->multi_param('facet') ) {
            $redirect_url .= qq{;facet=$facet};
        }
        print $cgi->redirect($redirect_url);
        exit;        
    }

}

# ---------------------------------------------------------------------

1;
