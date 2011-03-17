package Document;

=head1 NAME

Document

=head1 DESCRIPTION

This class is the parent of the Solr_* documents for large-scale
full-text indexing intermediated by the intermediate classes like
MirlynMetadataAPI which provide the interface to the metadata getting
functionality.

=head1 VERSION

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;

# App
use base qw(Search::Document);
use Utils;
use Utils::Serial;
use Debug::DUtils;
use Identifier;
use Context;
use Search::Constants;

use Db;

# ---------------------------------------------------------------------

=item PUBLIC: after_initialize

Initialize Document.

=cut

# ---------------------------------------------------------------------
sub after_initialize {
    my $self = shift;
    my $param_hashref = shift;

    my $C = $$param_hashref{'C'};
    my $dbh = $$param_hashref{'dbh'};
    my $item_id = $$param_hashref{'id'};
    
    my %stats;

    DEBUG('doc', qq{build_solr_document: start});
    my ($doc_ref, $ocr_status, $metadata_status, $elapsed) = 
        $self->build_solr_document($C, $dbh, $item_id);

    DEBUG('doc', qq{build_solr_document: elapsed=$elapsed sec, ocr=$ocr_status metadata=$metadata_status});

    my $data_failure = ($ocr_status != IX_NO_ERROR) || ($metadata_status != IX_NO_ERROR);
    
    if ($doc_ref) {
        $stats{'create'}{'doc_size'} = (! $data_failure) ? length($$doc_ref) : 0;
        $stats{'create'}{'elapsed'}  = (! $data_failure) ? $elapsed : 0;
    }

    $self->{'complete_solr_doc'}{'doc_ref'} = $doc_ref;
    $self->{'complete_solr_doc'}{'ocr_status'} = $ocr_status;
    $self->{'complete_solr_doc'}{'metadata_status'} = $metadata_status;
    $self->{'complete_solr_doc'}{'stats'} = \%stats;
}

# ---------------------------------------------------------------------

=item PUBLIC: build_solr_document

Description

=cut

# ---------------------------------------------------------------------
sub build_solr_document {
    my $self = shift;
    my ($C, $dbh, $item_id) = @_;
    
    my $complete_solr_doc = '';
    
    my $ocr_status = IX_NO_ERROR;
    my $metadata_status = IX_NO_ERROR;
    
    # OCR
    my ($ocr_data_ref, $ocr_elapsed) = $self->get_ocr_data($C, $item_id);
    if (! $ocr_data_ref) {
        $ocr_status = IX_OCR_FAILURE;
    }

    my $start = Time::HiRes::time();

    # rights attribute field
    my $rights_attribute = ___get_rights_f_id($C, $item_id);
    if (! $rights_attribute) {
        $metadata_status = IX_METADATA_FAILURE;
    }
    
    # Metadata fields
    my ($metadata_fields_ref, $m_status) = $self->get_metadata_fields($C, $dbh, $item_id);
    if ($m_status != IX_NO_ERROR) {
        $metadata_status = IX_METADATA_FAILURE;
    }
    
    my $ck = Time::HiRes::time() - $start;
    DEBUG('doc', qq{METADATA: read rights+meta in sec=$ck});

    if (($ocr_status == IX_NO_ERROR) && ($metadata_status == IX_NO_ERROR)) {
        # namespace-qualified id field
        my $item_id_field = wrap_string_in_tag($item_id, 'field', [['name', 'id']]);

        # OCR field
        wrap_string_in_tag_by_ref($ocr_data_ref, 'field', [['name', 'ocr']]);

        # rights field
        my $rights_field = wrap_string_in_tag($rights_attribute, 'field', [['name', 'rights']]);
    
        $complete_solr_doc =
            $item_id_field .
                $rights_field .
                    $$metadata_fields_ref .
                        $$ocr_data_ref;
        
        wrap_string_in_tag_by_ref(\$complete_solr_doc, 'doc');
        wrap_string_in_tag_by_ref(\$complete_solr_doc, 'add');

        if (DEBUG('docfulldebug,doconly')) {
            my $pairtree_item_id = Identifier::get_pairtree_id_wo_namespace($item_id);
            my $logdir = Utils::get_tmp_logdir();
            my $temporary_dir = $ENV{'SOLR_DOC_DIR'} ? $ENV{'SOLR_DOC_DIR'} : $logdir; 
            my $complete_solr_doc_filename = "$temporary_dir/" . $pairtree_item_id . "-$$" . '.solr.xml';
            Utils::write_data_to_file(\$complete_solr_doc, $complete_solr_doc_filename);
            chmod(0666, $complete_solr_doc_filename) if (-o $complete_solr_doc_filename);
            DEBUG('docfulldebug,doconly', qq{build_solr_document: save solr doc: "$complete_solr_doc_filename"});
        }
    }
    
    my $total_elapsed = (Time::HiRes::time() - $start) + $ocr_elapsed;

    return (\$complete_solr_doc, $ocr_status, $metadata_status, $total_elapsed);
}

# ---------------------------------------------------------------------

=item PRIVATE CLASS METHOD: ___get_rights_f_id

Description

=cut

# ---------------------------------------------------------------------
sub ___get_rights_f_id {
    my ($C, $id) = @_;

    my $db = $C->get_object('Database');
    my $dbh = $db->get_DBH($C);
    my $attr = Db::Select_j_rights_id_attr($C, $dbh, $id);

    DEBUG('doc', qq{METADATA: $id MISSING from j_rights}) if (! $attr);

    return $attr;
}


# ---------------------------------------------------------------------

=item PUBLIC: get_document_content

Description: Implements pure virtual method

=cut

# ---------------------------------------------------------------------
sub get_document_content {
    my $self = shift;
    my $C = shift;

    return $self->{'complete_solr_doc'}{'doc_ref'};
}

# ---------------------------------------------------------------------

=item PUBLIC: get_document_status

Description: 

=cut

# ---------------------------------------------------------------------
sub get_document_status {
    my $self = shift;
    my $C = shift;

    return (
            $self->{'complete_solr_doc'}{'ocr_status'},
            $self->{'complete_solr_doc'}{'metadata_status'},
           );
}

# ---------------------------------------------------------------------

=item PUBLIC: get_document_stats

Description: 

=cut

# ---------------------------------------------------------------------
sub get_document_stats {
    my $self = shift;
    my $C = shift;

    return $self->{'complete_solr_doc'}{'stats'};
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2008 ©, The Regents of The University of Michigan, All Rights Reserved

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
