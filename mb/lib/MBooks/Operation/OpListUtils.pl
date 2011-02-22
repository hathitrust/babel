# $Id: OpListUtils.pl,v 1.17 2010/07/06 17:57:00 tburtonw Exp $
#----------------------------------------------------------------------

sub get_rights
{
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
sub test_ownership
{
    my $self = shift;
    my ($C, $co, $act, $coll_id, $owner) = @_;

    # only if collection not public do we care about owner!!
    if (($co->get_shared_status($coll_id) eq "private")
        &&
        (! $co->coll_owned_by_user($coll_id, $owner)))
    {
        my $msg = q{"} . $co->get_coll_name($coll_id) . 
            q{" is a private collection. Login for more options.};  
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


# ---------------------------------------------------------------------

=item get_final_item_arr_ref

Description

=cut

# ---------------------------------------------------------------------
sub get_final_item_arr_ref
{
    my $self = shift;
    my $C = shift;
    my $cgi = $C->get_object('CGI');
    my $coll_id = $cgi->param('c');

    my $item_arr_ref = shift;
    my $rights_ref = shift;
    
    my $co = $self->get_action()->get_transient_facade_member_data($C, 'collection_object');
    my $owner = $co->get_user_id;
    my $final_item_arr_ref = [];
    
    foreach my $item_hashref (@{$item_arr_ref})
    {
        # add isindexed field moved to PIFiller ListSearchResults
        # SEARCH_RESULTS_PI and PIFiller::ListItems ITEM_LIST_PI.  Add
        # "fulltext" field
        my $item_rights_attr = $item_hashref->{'rights'};
        
        if ( $self->is_full_text($rights_ref, $item_rights_attr))
        {
            $item_hashref->{'fulltext'} = '1';
        }
        else
        {
            $item_hashref->{'fulltext'} = '0';
        }
        
        # add array_of hashrefs of collection info for collections
        # owned by user that also include the item
        my $coll_ary_hashref;
        my $item_id = $item_hashref->{'item_id'};
        
        eval
        {
            $coll_ary_hashref = $co->get_coll_data_for_item_and_user($item_id, $owner);
        };
        ASSERT(!$@, qq{Error: $@});
                
        # add hrefs
        my $coll_ary_hashref_final = $self->add_hrefs($C, $coll_ary_hashref);        
        $item_hashref->{'item_in_collections'} = $coll_ary_hashref_final;
        
        # get catalog record number for item
        my $extern_id = $co->get_extern_id_from_item_id($item_id);
        
        # temporary hack to get bib_id if its not in the item metadata
        my $record_no = $item_hashref->{'bib_id'};
        
        if (! defined($record_no))
        {
            # Catalog record number.  Beware of ids like 'uc1.$b776044'
            # ($BARCODE) when interpolating Perl variables and
            # uc2.ark:/13960/t0dv1g69b (colon causes Solr parse error)
            $extern_id =~ s,ark:,ark\\:,;
            my $solr_response = 
            `curl -s 'http://solr-vufind:8026/solr/biblio/select?q=ht_id:$extern_id&start=0&rows=1&fl=id'`;
            ($record_no) = ($solr_response =~ m,<str name="id">(.*?)</str>,);
        }
        
        $item_hashref->{'record_no'} = $record_no;
        #$item_hashref->{'record_no'} = $item_hashref->{'bib_id'};
        
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
sub get_item_data
{
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
    my $sortkey = $ab->mapurl_param_to_field($C, $cgi->param('sort'));

    # get direction by munging url sort param
    my $direction = MBooks::Utils::Sort::get_dir_from_sort_param($cgi->param('sort'));
    
    # XXX replace these will call to either cgi param or processing of
    # cgi param
    my $current_page = $pager->current_page;

    my $slice_start = $pager->first; # record number of first item on page
    my $recs_per_slice = $pager->entries_per_page;
    
    my $rights_limit; 
    my $limit = $cgi->param('lmt');
    
    if ($limit eq 'ft')
    {
        $rights_limit=$rights_ref;
    }
    
    my $item_arr_ref;
    eval
    {
        $item_arr_ref = 
            $co->list_items($coll_id, $sortkey, $direction, 
                            $slice_start, $recs_per_slice, 
                            $rights_limit, $id_arr_ref);
    };
    ASSERT(!$@, qq{Error: $@});

    return $item_arr_ref;
}




# ---------------------------------------------------------------------

1;
