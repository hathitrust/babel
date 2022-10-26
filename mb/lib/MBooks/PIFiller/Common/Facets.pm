use URI::Escape;

sub handle_FACETS_PI
    : PI_handler(FACETS)
{
    my ($C, $act, $piParamHashRef) = @_;
    my $fconfig=$C->get_object('FacetConfig');

    my $cgi = $C->get_object('CGI');
    my $coll_id = $cgi->param('c');

    my $search_result_data_hashref; my $facet_hash;

    $search_result_data_hashref = MBooks::Utils::ResultsCache->new($C, $coll_id)->get();
    $rs = $$search_result_data_hashref{'result_object'};
    $facet_hash =$rs->{'facet_hash_ref'};

    my $xml;
    my ($selected,$unselected)= get_selected_unselected($facet_hash,$cgi);
    # $selected= array ref of hashes
    #        $hash->{'value'}
    #        $hash->{'count'}
    #        $hash->{'facet_name'}
    #        $hash->{'selected'}= "false"|"true";
    #        $hash->{'select_url'}   url for unselected facets on click will select it
    #        $hash->{'unselect_url'}   url for selected facets on click will unselect it

    # unselected= hash key= facet name, values = array of hashes as above

    # output whether any facets are selected include the multivalued and the psuedo facet full-view/limited i.e. lmt param  add the date_range facets pdate_start or end but one must be



    if (defined ($cgi->param('facet')) ||
        defined ($cgi->param('facet_lang'))
        ||defined ($cgi->param('facet_format'))
        || $cgi->param('lmt') ne "all"
        || pdate_selected($cgi)
       )
    {
        $xml .= wrap_string_in_tag('true','facetsSelected') . "\n";
    }

    my $selected_facets_xml = make_selected_facets_xml($selected,$fconfig,$cgi);
    $xml .= $selected_facets_xml;

    my $unselected_facets_xml = make_unselected_facets_xml($unselected,$fconfig, $cgi);
    $xml .= $unselected_facets_xml;

    return $xml
}

# ---------------------------------------------------------------------
sub isFacetSelected {
    my $cgi_facets  = shift;
    my $facet_name  = shift;
    my $facet_value = shift;

   #if there is a cgi facet with matching name, verify that they have same value
    foreach my $facet ( @{$cgi_facets} ) {
        my ( $cgi_facet_name, @rest ) = split( /\:/, $facet );
        my $cgi_facet_value = join( ':', @rest );
        if ( $facet_name eq $cgi_facet_name ) {
            if (
                doFacetValuesMatch( $facet_value, $cgi_facet_value ) eq "true" )
            {
                return ("true");
            }
        }
    }
}

sub doFacetValuesMatch {

    my $facet_value = shift;

# following is how the cgi is processed in clean_cgi.  We process json facet value to match
    Utils::map_chars_to_cers( \$facet_value, [ qq{"}, qq{'} ] );
    my $cgi_facet_value = shift;

    #XXX check why do we have quotes from cgi and not from json?
    #remove leading and trailing quotes from cgi facet string
    $cgi_facet_value =~ s/^\"//;
    $cgi_facet_value =~ s/\"$//;

    #facet=language:German
    if ( $cgi_facet_value eq $facet_value ) {
        return "true";
    }
    return "false";
}

# ---------------------------------------------------------------------
sub get_selected_unselected

{
    my $facet_hash = shift;    # from JSON
    my $cgi        = shift;

    my @selected;
    my $unselected   = {};
    my $EMPTY_FACETS = "true";
    my @cgi_facets   = $cgi->multi_param('facet');

    foreach my $facet_name ( keys %{$facet_hash} ) {
        my $ary_for_this_facet_name = [];
        my $facet_list_ref          = $facet_hash->{$facet_name};
        foreach my $facet_ary ( @{$facet_list_ref} ) {
            my $hash = {};
            $hash->{'selected'}   = "false";
            $hash->{'count'}      = $facet_ary->[1];
            $hash->{'facet_name'} = $facet_name;

            my $facet_value = $facet_ary->[0];

           # clean facet data from json Solr response so we can output it in XML
            $hash->{'value'} = clean_for_xml($facet_value);

            if (@cgi_facets) {
                if ( isFacetSelected( \@cgi_facets, $facet_name, $facet_value )
                    eq "true" )
                {
                    $hash->{'selected'} = "true";
                }
            }

            if ( $hash->{'selected'} eq "true" ) {

                # add the unselect url to the hash
                $hash->{'unselect_url'} = __get_unselect_url( $hash, $cgi );
                push( @selected, $hash );
            }
            else {
                # add the select url
                $hash->{'select_url'} = __get_select_url( $hash, $cgi );
            }

            # unselected needs array of array of hashes
            # facet1->hashes for facet 1
            # facet2->hashes for facet 2
            push( @{$ary_for_this_facet_name}, $hash );
        }
        if ( scalar( @{$facet_list_ref} ) > 0 ) {
            $EMPTY_FACETS = "false";
        }
        $unselected->{$facet_name} = $ary_for_this_facet_name;
    }

    # Handle search with no results for sticky facets
    if ( $EMPTY_FACETS eq "true" ) {
        @selected = get_selected_from_cgi( $cgi, \@cgi_facets );
    }
    return ( \@selected, $unselected );
}

#----------------------------------------------------------------------
sub get_selected_from_cgi {
    my $cgi        = shift;
    my $cgi_facets = shift;
    my @selected;

    foreach my $facet ( @{$cgi_facets} ) {
        my $hash = {};
        my ( $cgi_facet_name, @rest ) = split( /\:/, $facet );
        my $facet_value = join( ':', @rest );

        # remove leading/trailing quotes XXX is this right place?
        $facet_value =~ s/^\"//g;
        $facet_value =~ s/\"$//g;

        # clean facet data from json Solr response so we can output it in XML
        $hash->{'value'}        = clean_for_xml($facet_value);
        $hash->{'facet_name'}   = $cgi_facet_name;
        $hash->{'unselect_url'} = __get_unselect_url( $hash, $cgi );
        push( @selected, $hash );
    }
    return (@selected);
}

#----------------------------------------------------------------------
sub make_selected_facets_xml {
    my $selected = shift;
    my $fconfig  = shift;
    my $cgi      = shift;

    my $facet2label = $fconfig->get_facet_mapping;
    my $xml;
    my $unselect_url;

    $xml = '<SelectedFacets>' . "\n";

    #   insert any advanced search multiselect OR facets on top of list
    my $multiselect_xml = __get_multiselect_xml( $fconfig, $cgi );
    $xml .= $multiselect_xml;

    my $daterange_xml;
    if (   __IsUndefOrBlank( scalar $cgi->param('pdate_start') )
        && __IsUndefOrBlank( scalar $cgi->param('pdate_end') ) )
    {
        # if they are both blank/undef don't bother getting the xml
    }
    else {
        $daterange_xml = __get_daterange_xml( $fconfig, $cgi );
        $xml .= $daterange_xml;
    }

    foreach my $facet ( @{$selected} ) {
        $unselect_url = $facet->{'unselect_url'};
        my $facet_name = $facet->{facet_name};
        my $field_name = $facet2label->{$facet_name};

        $xml .=
          '<facetValue name="' . $facet->{value} . '" class="selected">' . "\n";
        $xml .= wrap_string_in_tag( $field_name,   'fieldName' ) . "\n";
        $xml .= wrap_string_in_tag( $unselect_url, 'unselectURL' ) . "\n";
        $xml .= '</facetValue>' . "\n";
    }

    $xml .= '</SelectedFacets>' . "\n";
    return $xml;
}

sub __get_multiselect_xml {
    my $fconfig = shift;
    my $cgi     = shift;
    my $xml;
    my $multiselect;

# XXX should read names of multiselect facets from config file for now hard code
    my @lang   = $cgi->multi_param('facet_lang');
    my @format = $cgi->multi_param('facet_format');
    my $lang   = get_multifacet_xml( \@lang,   $cgi, $fconfig );
    my $format = get_multifacet_xml( \@format, $cgi, $fconfig );
    $multiselect = $lang . $format;
    $xml .= wrap_string_in_tag( $multiselect, 'multiselect' ) . "\n";
    return $xml;
}

sub get_multifacet_xml {
    my $ary     = shift;
    my $cgi     = shift;
    my $fconfig = shift;

    my $xml;

    if ( !defined($ary) || scalar( @{$ary} ) < 1 ) {

        # return blank
        return "";
    }

    my $clause;
    my $field;

    foreach my $fquery ( @{$ary} ) {

        my @rest;
        ( $field, @rest ) = split( /\:/, $fquery );
        my $string = join( ':', @rest );

        # &fq=language:( foo OR bar OR baz)
        $clause .= $string . " OR ";
    }

    # remove last OR and add &fq=field:
    $clause =~ s/OR\s*$//g;
    $clause = '(' . $clause . ' )';
    my $facetValueXML = wrap_string_in_tag( $clause, 'facetValue' ) . "\n";

    #XXX need to map url param field name to dispay value
    # so language= Language  see regular facet code for this, is there a lookup?

    my $facet2label  = $fconfig->get_facet_mapping;
    my $field_label  = $facet2label->{$field};
    my $fieldnameXML = wrap_string_in_tag( $field_label, 'fieldName' ) . "\n";

    my $unselectURL = getMultiUnselectURL( $field, $cgi );

    my $unselectURLXML =
      wrap_string_in_tag( $unselectURL, 'unselectURL' ) . "\n";
    $clause .= $facetValueXML . $fieldnameXML . $unselectURLXML;

    $xml .= wrap_string_in_tag( $clause, 'multiselectClause' ) . "\n";
    return $xml;
}

sub __IsUndefOrBlank {
    my $var = shift;
    $var =~ s/\s+//g;
    return ( ( !defined($var) ) || $var eq "" );
}

sub make_unselected_facets_xml {
    my $unselected = shift;
    my $fconfig    = shift;
    my $cgi        = shift;

    my $facet2label = $fconfig->get_facet_mapping;
    my $facet_order = $fconfig->{'facet_order'};
    my $MINFACETS   = $fconfig->get_facet_initial_show;

    my $current_url = $cgi->url( -relative => 1, -query => 1 );

    # remove page number since changing facets changes facet count
    $current_url =~ s,[\;\&]pn=\d+,,g;

    my $xml = '<unselectedFacets>' . "\n";

    foreach my $facet_name ( @{$facet_order} ) {
        my $facet_label = $facet2label->{$facet_name};

        # normalize filed name by replacing spaces with underscores
        my $norm_field_name = $facet_label;
        $norm_field_name =~ s,\s+,\_,g;

        $xml .=
            '<facetField name="'
          . $facet_label . '" '
          . 'normName=' . '"'
          . "$norm_field_name" . '" ' . ' >' . "\n";

        my ( $xml_for_facet_field, $SHOW_MORE_LESS ) =
          make_xml_for_unselected_facet_field(
            $facet_name,  $norm_field_name, $unselected,
            $current_url, $MINFACETS
          );
        $xml .= $xml_for_facet_field;

        $xml .=
          "\n" . '<showmoreless>' . $SHOW_MORE_LESS . '</showmoreless>' . "\n";
        $xml .= '</facetField>' . "\n";

    }
    $xml .= '</unselectedFacets>' . "\n";
    return $xml;
}

#----------------------------------------------------------------------
# change name to for unselected facet field
sub make_xml_for_unselected_facet_field {
    my $facet_name      = shift;
    my $norm_field_name = shift;
    my $unselected      = shift;
    my $current_url     = shift;
    my $MINFACETS       = shift;

    my $SHOW_MORE_LESS = "false";
    my $xml;

    my $ary_ref = $unselected->{$facet_name};
    my $counter = 0;
    foreach my $value_hash ( @{$ary_ref} ) {

#instead of displaying selected facets greyed out don't display them per Suz email 7/22/11
        next if ( $value_hash->{'selected'} eq "true" );
        my $value     = $value_hash->{'value'};
        my $facet_url = $value_hash->{'select_url'};
        my $class     = ' class ="showfacet';

        if ( $counter >= $MINFACETS ) {
            $class          = ' class ="hidefacet';
            $SHOW_MORE_LESS = "true";
        }

        # add normalized facet field to class
        $class .= ' ' . $norm_field_name . '" ';

        my $count = commify( $value_hash->{'count'} );

        $xml .= '<facetValue name="' . $value . '" ' . $class . '> ' . "\n";
        $xml .= '<facetCount>' . $count . '</facetCount>' . "\n";
        $xml .= '<url>' . $facet_url . '</url>' . "\n";
        $xml .= '<selected>' . $value_hash->{'selected'} . '</selected>' . "\n";
        $xml .= '</facetValue>' . "\n";
        $counter++;

    }
    return ( $xml, $SHOW_MORE_LESS );
}


#XXX this should probably be moved to Utils, but I don't want to mess with submodule stuff now!
sub commify {
    my $text = reverse $_[0];
    $text =~ s/(\d\d\d)(?=\d)(?!\d*\.)/$1,/g;
    return scalar reverse $text;
}

sub __get_unselect_url {
    my $facet_hash = shift;

    #add qoutes to the facet string
    my $quoted_facet_string =
      $facet_hash->{facet_name} . ':"' . $facet_hash->{'value'} . '"';
    my $facet_string = $facet_hash->{facet_name} . ':' . $facet_hash->{value};

    # convert from xml friendly to url friendly

    Utils::remap_cers_to_chars( \$facet_string );

    #        my $escaped_value= uri_escape_utf8($url_value);

    my $cgi    = shift;
    my @facets = $cgi->multi_param('facet');

    my $temp_cgi = CGI->new($cgi);

# remove paging since selecting/unselecting facets causes result set changes and reordering
    $temp_cgi->delete('pn');

    my @new_facets;
    my $debug;

    # get list of all facet params except the one we got as an argument

    foreach my $f (@facets) {
        Utils::remap_cers_to_chars( \$f );
        if ( $facet_string eq $f || $quoted_facet_string eq $f ) {
            $debug = $1;
        }
        else {
            #escape quotes
            #      $f=~s/\"/\&quot\;/g;

            push( @new_facets, $f );
        }
    }

    #delete all facet params
    $temp_cgi->delete('facet');

    #$query->param(-name=>'foo',-values=>['an','array','of','values']);

    $temp_cgi->param( -name => 'facet', -values => \@new_facets );
    my $url = $temp_cgi->url( -relative => 1, -query => 1 );
    return $url;
}

sub __get_select_url {
    my $hashref    = shift;
    my $cgi        = shift;
    my $facet_name = $hashref->{'facet_name'};
    my $value      = $hashref->{'value'} || '';

    # remove page number since changing facets changes facet count

    my $select_cgi = new CGI($cgi);
    if ( $cgi->param('a') eq 'listis' ) {
        $select_cgi->param('a', 'listsrch');
        $select_cgi->param('q1', '*');
    }
    my $current_url = $select_cgi->url( -relative => 1, -query => 1 );
    $current_url =~ s,[\;\&]pn=\d+,,g;

    my $url_value = $value;
    Utils::remap_cers_to_chars( \$url_value );
    my $escaped_value = uri_escape_utf8($url_value);
    my $facet_url =
        $current_url
      . '&amp;facet='
      . $facet_name
      . ':&quot;'
      . $escaped_value
      . '&quot;';
    return $facet_url;

}


#  map xml chars to character entities so we can output good xml
sub clean_for_xml {
    my $value = shift;
    Utils::map_chars_to_cers( \$value );
    return $value;
}

1;