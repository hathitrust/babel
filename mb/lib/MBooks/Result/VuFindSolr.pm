package MBooks::Result::VuFindSolr;


=head1 NAME

MBooks::Result::VuFindSolr (rs)

=head1 DESCRIPTION

This class d encapsulates the VuFind Solr search response data.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut


use strict;

use base qw(Search::Result);
use XML::LibXML;

use Utils;
use Namespaces;


# ---------------------------------------------------------------------

=item AFTER_initialize

Subclass Initialize Result::vSolr object.

=cut

# ---------------------------------------------------------------------
sub AFTER_Result_initialize {
    my $self = shift;
    my ($C, $id_ary_ref) = @_;

    $self->{_parser} = XML::LibXML->new();
}

# ---------------------------------------------------------------------

=item __get_parser

Description

=cut

# ---------------------------------------------------------------------
sub __get_parser {
    my $self = shift;
    return $self->{_parser};
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
sub AFTER_ingest_Solr_search_response {
    my $self = shift;
    my $Solr_response_ref = shift;

    my $parser = $self->__get_parser();
    my $doc = $parser->parse_string($$Solr_response_ref);
    my $xpath_doc = q{/response/result/doc};

    my $ref_to_arr_of_metadata_hashref = [];

    foreach my $doc_node ($doc->findnodes($xpath_doc)) {
        my $metadata_hashref = {};
        foreach my $node ($doc_node->childNodes()) {
            # NAME ::= arr|str
            my $name = $node->nodeName();
            # FIELD_NAME ::= <NAME name="FIELD_NAME>
            my $anode = $node->getAttributeNode('name');
            my $field_name = $anode->textContent();

            # FIELD_VAL ::= <NAME name="FIELD_NAME>FIELD_VAL</>
            if ($name eq 'arr') {
                foreach my $str_node ($node->childNodes()) {
                    my $text_node = $str_node->firstChild();
                    # Sometimes a field is empty
                    if ($text_node) {
                        my $field_val = $text_node->toString();
                        push(@{$metadata_hashref->{$field_name}}, $field_val);
                    }
                }
            }
            else {
                my $text_node = $node->firstChild();
                # Sometimes a field is empty
                if ($text_node) {
                    my $field_val = $text_node->toString();
                    push(@{$metadata_hashref->{$field_name}}, $field_val);
                }
            }
        }

        push(@$ref_to_arr_of_metadata_hashref, $metadata_hashref);
    }
    
    $self->set_complete_result($ref_to_arr_of_metadata_hashref);
}


1;

__END__

=head1 AUTHOR

Tom Burton-West, University of Michigan, tburtonw@umich.edu
Phillip Frber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2009-14 ©, The Regents of The University of Michigan, All Rights Reserved

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
