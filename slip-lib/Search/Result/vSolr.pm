package Result::vSolr;


=head1 NAME

Result::vSolr (rs)

=head1 DESCRIPTION

This class does encapsulates the VuFind Solr search response data.

The VuFind Solr schema is a bib record associated with 1 or more item
records.  We want the IDs of the item records that fall within the
sought date range.

=head1 VERSION

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut


use strict;

use base qw(Search::Result);
use XML::LibXML;
use Time::HiRes;

use Debug::DUtils;


# ---------------------------------------------------------------------

=item AFTER_Result_initialize

Subclass Initialize Result::vSolr object.

=cut

# ---------------------------------------------------------------------
sub AFTER_Result_initialize {
    my $self = shift;
    
    $self->{'parser'} = XML::LibXML->new();
}

# ---------------------------------------------------------------------

=item __get_parser

Description

=cut

# ---------------------------------------------------------------------
sub __get_parser {
    my $self = shift;
    return $self->{'parser'};
}

# ---------------------------------------------------------------------

=item parse_vsolr_response

Description

=cut

# ---------------------------------------------------------------------
sub parse_vsolr_response {
    my $parser = shift;
    my $Solr_response_ref = shift;
    my $xpath_doc = shift;
    
    my $start = Time::HiRes::time();
    DEBUG('vsolrlibxml', qq{DEBUG: start } . Utils::Time::iso_Time());

    my $doc = $parser->parse_string($$Solr_response_ref);

    my $result_ids = [];
    my $complete_result = [];
    my $doc_node_count = 0;
    foreach my $doc_node ($doc->findnodes($xpath_doc)) {
        my $doc_start = Time::HiRes::time();

        $doc_node_count++;

        my $sysid;
        foreach my $sysid_node ($doc_node->findnodes(q{str[@name='id']})) {
            $sysid = $sysid_node->textContent();
            last;
        }

        foreach my $arr_node ($doc_node->findnodes(q{arr[@name='ht_id_display']})) {
            foreach my $str_node ($arr_node->findnodes('str')) {
                my $id_string = $str_node->textContent();
                my ($nid, $timestamp) = ($id_string =~ m,^(.*?)\|(.*?)\|,);

                my ($namespace, $id) = ($nid =~ m,^(.*?)\.(.*),);
                my $hash_ref = {
                                'sysid' => $sysid,
                                'id' => $id,
                                'namespace' => $namespace,
                                'ht_id_display_timestamp' => $timestamp,
                                'node_content' => $id_string,
                               };
                push(@$complete_result, $hash_ref);
                push(@$result_ids, $id);
            }
        }
        my $doc_elapsed = Time::HiRes::time() - $doc_start;
        DEBUG('vsolrlibxml', qq{DEBUG: doc_elapsed=$doc_elapsed});
    }
    
    my $elapsed = Time::HiRes::time() - $start;
    DEBUG('vsolrlibxml', qq{DEBUG: elapsed=$elapsed});

    return ($doc_node_count, $result_ids, $complete_result);
}

# ---------------------------------------------------------------------

=item AFTER_ingest_Solr_search_response

Example Solr result is:
   <response>
      <lst name="responseHeader">
         <int name="status">0</int>
         <int name="QTime">2</int>
         <lst name="params">
            <arr name="fl">
               <str>ht_id_display</str>
               <str>ht-id_update</str>
            </arr>
            <str name="start">0</str>
            <str name="q">ht_id_update:[20090723 TO *]</str>
            <str name="rows">25000</str>
         </lst>
      </lst>
      <result name="response" numFound="697" start="0">
         <doc>
            <arr name="ht_id_display">
               <str>mdp.39015024227566|20090723|</str>
            </arr>
         </doc>
         <doc>
            <arr name="ht_id_display">
               <str>mdp.39015003428037|20090723|</str>
               <str>mdp.39015006021433|20090723|</str>
               <str>uc1.b4532220|20090723|</str>
            </arr>
         </doc>
         <doc>
            <arr name="ht_id_display">
               <str>mdp.39015059701311|20090723|v.2 1836 Mar-Sep</str>
            </arr>
         </doc>

etc.

=cut

# ---------------------------------------------------------------------
sub AFTER_ingest_Solr_search_response
{
    my $self = shift;
    my $Solr_response_ref = shift;

    my $parser = $self->__get_parser();
    my $xpath_doc = q{/response/result/doc};

    my ($doc_node_count, $result_ids_arr_ref, $complete_result_arr_ref) = 
      parse_vsolr_response($parser, $Solr_response_ref, $xpath_doc);

    $self->{doc_node_count} = $doc_node_count;
    $self->{rows_returned} = scalar(@$result_ids_arr_ref);
    $self->set_complete_result($complete_result_arr_ref);
    $self->__set_result_ids($result_ids_arr_ref);
}


# ---------------------------------------------------------------------

=item PRIVATE: __set_result_ids

Description

=cut

# ---------------------------------------------------------------------
sub __set_result_ids
{
    my $self = shift;
    my $arr_ref = shift;
    $self->{'result_ids'} = $arr_ref;
}

# ---------------------------------------------------------------------

=item get_result_ids

Description

=cut

# ---------------------------------------------------------------------
sub get_result_ids
{
    my $self = shift;
    return $self->{'result_ids'};
}

# ---------------------------------------------------------------------

=item get_doc_node_count

Description

=cut

# ---------------------------------------------------------------------
sub get_doc_node_count
{
    my $self = shift;
    return $self->{'doc_node_count'};
}



1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
