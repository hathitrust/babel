package Document::MirlynMetadataAPI;


=head1 NAME

Document::MirlynMetadataAPI

=head1 DESCRIPTION

This class is the base class of
index/Document/MirlynMetadataAPI/Schema_*.pm and a child of
index/Document.  It is an intermediate class to provide methods to
access metadata common to these Schema classes and will be the
eventual sibling to other APIs for metadata

=head1 VERSION

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut


# umich.edu Perl
use UMICH::HLB;

# App
use base qw(Document);
use Utils;
use Utils::Date;
use Utils::Serial;
use Debug::DUtils;
use Identifier;
use Context;
use Search::Constants;
use Search::Document;


# ---------------------------------------------------------------------

=item PURE VIRTUAL: get_structured_metadata_f_item_id

Description: Pure Virtual

=cut

# ---------------------------------------------------------------------
sub get_structured_metadata_f_item_id
{
    ASSERT(0, qq{Pure virtual method get_structured_metadata_f_item_id() not implemented in MirlynMetadataAPI::child});
}

# ---------------------------------------------------------------------

=item PUBLIC: get_metadata_f_item_id

Description

=cut

# ---------------------------------------------------------------------
sub get_metadata_f_item_id
{
    my $self = shift;
    my ($C, $item_id) = @_;

    my $metadata_ref;
    my $status = IX_METADATA_FAILURE;

    # EGREGIOUS MIUN HACK
    if (Identifier::the_namespace($item_id) eq 'miun')
    {
        ($metadata_ref, $status ) =
            ___get_metadata_from_METS($C, $item_id);
    }
    else
    {
        ($metadata_ref, $status) =
            $self->__get_metadata_from_mirlyn_f_item_id($C, $item_id);
    }

    my $metadata_struct_hashref =
        $self->get_structured_metadata_f_item_id($C, $item_id, $metadata_ref);

    # If any hash keys are not defined (particularly HLB) there has
    # been a metadata failure.  This hammer is too big.  Just test for
    # undef title.
    if (! defined($$metadata_struct_hashref{'title'}))
    {
        $status = IX_METADATA_FAILURE;
    }
                
    return ($metadata_struct_hashref, $status);
}


# ---------------------------------------------------------------------

=item PRIVATE CLASS METHOD: ___get_metadata_from_METS

Description

=cut

# ---------------------------------------------------------------------
sub ___get_metadata_from_METS
{
    my ($C, $item_id) = @_;

    my $item_filesystem_location = Identifier::get_item_location($item_id);
    my $stripped_id = Identifier::get_pairtree_id_wo_namespace($item_id);

    my $mets_filename =  $item_filesystem_location . qq{/$stripped_id} . '.mets.xml';
    my $mets_xml_ref = Utils::read_file($mets_filename, 'noassert', 'noretry');

    my $status = ($mets_xml_ref && $$mets_xml_ref) ? IX_NO_ERROR : IX_OCR_FAILURE;

    return ($mets_xml_ref, $status);
}


# ---------------------------------------------------------------------

=item PRIVATE: __get_metadata_from_mirlyn_f_item_id

Description

=cut

# ---------------------------------------------------------------------
sub __get_metadata_from_mirlyn_f_item_id
{
    my $self = shift;
    my ($C, $item_id) = @_;

    my $metadata = '';
    my $config = $C->get_object('MdpConfig');

    my $url = $config->get('mirlyn_metadata_url');
    $url =~ s,__METADATA_ID__,$item_id,;

    my $response = Utils::get_user_agent()->get($url);
    my $response_ok = $response->is_success;
    my $response_status = $response->status_line;
    my $status = IX_METADATA_FAILURE;

    if ( $response_ok  )
    {
        $metadata = $response->content;
        if ($metadata)
        {
            $metadata = Encode::decode_utf8($metadata);
            $status = IX_NO_ERROR;
        }
    }

    return (\$metadata, $status);
}



# ---------------------------------------------------------------------

=item PRIVATE: __get_metadata_HLB

Description

=cut

# ---------------------------------------------------------------------
sub __get_metadata_HLB
{ 
    my $self = shift;    
    my ($C, $item_id, $metadata_ref) = @_;

    my $hlb = new UMICH::HLB;
    my $vol_data_hashref = Utils::Serial::get_volume_data($metadata_ref);

    # Add a single callno to set 1
    $hlb->add(1 => qq{$$vol_data_hashref{'callno'}});
    # An HTTP error?
    $hlb->fetch || return undef;
    
    my @hlb_vals;
    
    # Get all the HLB stuff associated with the call number associated
    # with set 1
    foreach my $aref ($hlb->hlb(1)) 
    {
        if (defined $aref)
        {
            my ($top, $second) = @$aref;
            DEBUG('hlb', qq{HLB: Top level category="$top" second level="$second"});

            Utils::map_chars_to_cers(\$top);
            push(@hlb_vals, $top);
        }
    }

    Utils::sort_uniquify_list(\@hlb_vals)
            if (scalar(@hlb_vals));
    
    return \@hlb_vals;
}


# ---------------------------------------------------------------------

=item PUBLIC: get_metadata_HLB

Description

=cut

# ---------------------------------------------------------------------
sub get_metadata_HLB
{
    my $self = shift;
    my ($C, $item_id, $metadata_ref) = @_;

    # MIUN HACK
    if (Identifier::the_namespace($item_id) eq 'miun')
    {
        return tei_HLB($C, $item_id, $metadata_ref);
    }
    else
    {
        return $self->__get_metadata_HLB(@_);
    }
}



# ---------------------------------------------------------------------

=item PUBLIC: get_metadata_title

Description

=cut

# ---------------------------------------------------------------------
sub get_metadata_title
{
    my $self = shift;
    my ($C, $item_id, $metadata_ref) = @_;

    my $title;

    # MIUN HACK
    if (Identifier::the_namespace($item_id) eq 'miun')
    {
        $title = tei_title($C, $item_id, $metadata_ref);
    }
    else
    {
        # Title
        my ($varfield_245) = ($$metadata_ref =~ m,<varfield id="245"[^>]*>(.*?)</varfield>,s);

        my ($subfield_ta) = ($varfield_245 =~ m,<subfield label="a">(.*?)</subfield>,s);
        my ($subfield_tb) = ($varfield_245 =~ m,<subfield label="b">(.*?)</subfield>,s);
        my ($subfield_tc) = ($varfield_245 =~ m,<subfield label="c">(.*?)</subfield>,s);

        $title .= $subfield_ta;
        $title .= ' '. $subfield_tb if $subfield_tb;
        $title .= ' '. $subfield_tc if $subfield_tc;

        my $vol_data_hashref = Utils::Serial::get_volume_data($metadata_ref);
        my $vol_info = $$vol_data_hashref{'vol'};
        
        $title .= ' '. $vol_info if $vol_info;
    }

    return $title;
}


# ---------------------------------------------------------------------

=item PUBLIC: get_metadata_date

Description

=cut

# ---------------------------------------------------------------------
sub get_metadata_date
{
    my $self = shift;
    my ($C, $item_id, $metadata_ref) = @_;

    my $date;

    # MIUN HACK
    if (Identifier::the_namespace($item_id) eq 'miun')
    {
        $date = tei_date($C, $item_id, $metadata_ref);
    }
    else
    {
        if (Utils::Serial::item_is_serial($metadata_ref))
        {
            my $vol_data_hashref = Utils::Serial::get_volume_data($metadata_ref);
            $date = Utils::Date::get_volume_date($$vol_data_hashref{'vol'});
        }
        else
        {
            my ($fixed_008_data) = ($$metadata_ref =~ m,<fixfield id="008">(.*?)</fixfield>,s);
            $date = substr($fixed_008_data, 7, 4);
            $date =~ s,[^0-9],0,g;
        }
    }

    if ($date !~ m,\d{4},)
    {
        $date = '0000-00-00';
    }
    else
    {
        $date .= '-00-00';
    }

    my $normalized_date = Search::Document::normalize_solr_date($date);

    return $normalized_date;
}




# ---------------------------------------------------------------------

=item PUBLIC: get_metadata_author

Description

=cut

# ---------------------------------------------------------------------
sub get_metadata_author
{
    my $self = shift;
    my ($C, $item_id, $metadata_ref) = @_;

    my $author;

    # MIUN HACK
    if (Identifier::the_namespace($item_id) eq 'miun')
    {
        $author = tei_author($C, $item_id, $metadata_ref);
    }
    else
    {
        my ($varfield_100) = ($$metadata_ref =~ m,<varfield id="100"[^>]*>(.*?)</varfield>,s);

        my ($subfield_aa) = ($varfield_100 =~ m,<subfield label="a">(.*?)</subfield>,s);
        my ($subfield_ac) = ($varfield_100 =~ m,<subfield label="c">(.*?)</subfield>,s);
        my ($subfield_ae) = ($varfield_100 =~ m,<subfield label="e">(.*?)</subfield>,s);
        my ($subfield_aq) = ($varfield_100 =~ m,<subfield label="q">(.*?)</subfield>,s);
        my ($subfield_ad) = ($varfield_100 =~ m,<subfield label="d">(.*?)</subfield>,s);

        $author .= $subfield_aa;
        $author .= ' ' . $subfield_ac if $subfield_ac;
        $author .= ' ' . $subfield_ae if $subfield_ae;
        $author .= ' ' . $subfield_aq if $subfield_aq;
        $author .= ' ' . $subfield_ad if $subfield_ad;

        my @varfield_110 = $$metadata_ref =~ m,\s*<varfield id="110"[^>]*>\s*(.*?)\s*</varfield>,gs;

        foreach my $varfield (@varfield_110)
        {
            my $temp;
            ($temp) = ($varfield =~ m,\s*<subfield label="a">\s*(.*?)\s*</subfield>,s);
            $author .= $temp;
            ($temp) = ($varfield =~ m,\s*<subfield label="b">\s*(.*?)\s*</subfield>,s);
            if ($temp)
            {
                ($temp) = ($varfield =~ m,\s*<subfield label="c">\s*(.*?)\s*</subfield>,s);
                $author .= ' ' . $temp;
            }
        }

        my @varfield_111 =~ ($$metadata_ref =~ m,\s*<varfield id="111"[^>]*>\s*(.*?)\s*</varfield>,gs);
        foreach my $varfield (@varfield_111)
        {
            my $temp;
            ($temp) = ($varfield =~ m,\s*<subfield label="a">\s*(.*?)\s*</subfield>,s);
            $author .= $temp;
        }
    }

    return $author;
}

# ---------------------------------------------------------------------

=item tei_author

Description

=cut

# ---------------------------------------------------------------------
sub tei_author
{
    my ($C, $item_id, $metadata_ref) = @_;

    my ($author) =
        ($$metadata_ref =~ m,<TITLESTMT[^>]*><TITLE\s+TYPE="245"[^>]*>.*<AUTHOR[^>]*>(.*?)</AUTHOR>,is);

    return $author;
}

# ---------------------------------------------------------------------

=item tei_title

Description

=cut

# ---------------------------------------------------------------------
sub tei_title
{
    my ($C, $item_id, $metadata_ref) = @_;

    my ($title) =
        ($$metadata_ref =~ m,<TITLESTMT[^>]*><TITLE\s+TYPE="245"[^>]*>(.*?)</TITLE>,is);

    return $title;
}

# ---------------------------------------------------------------------

=item tei_date

Description

=cut

# ---------------------------------------------------------------------
sub tei_date
{
    my ($C, $item_id, $metadata_ref) = @_;

    my ($date) =
        ($$metadata_ref =~ m,<SOURCEDESC[^>]*>.*<DATE[^>]*>(.*?)</DATE>,is);

    my ($normalized_date) = ($date =~ m,(\d{4}),);
    $normalized_date = $normalized_date ? $normalized_date : '0000';

    return $normalized_date;
}

# ---------------------------------------------------------------------

=item tei_HLB

Description

=cut

# ---------------------------------------------------------------------
sub tei_HLB
{
    my ($C, $item_id, $metadata_ref) = @_;

    return ['TEI miun namespace'];
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
