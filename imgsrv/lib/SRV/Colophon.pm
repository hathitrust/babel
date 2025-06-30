package SRV::Colophon;
# Utilities for generating plain text colophon for .txt and .zip text and image

use strict;
use warnings;

use POSIX qw(strftime);
use Text::Wrap qw();

use Institutions;
use SRV::Utils;

sub colophon_text {
  my $C                  = shift;
  my $additional_message = shift || '';

  # $additional_message is the "This file has been created from the computer-extracted text..."
  # message. Pass undef if you are an image .zip download.

  my $mdpItem = $C->get_object('MdpItem');
  my $auth = $C->get_object('Auth');

  my $access_stmts = SRV::Utils::get_access_statements($mdpItem);

  my $publisher = $mdpItem->GetPublisher();
  my $title = Text::Wrap::wrap("Title:     ", "           ", $mdpItem->GetFullTitle());
  my $author = Text::Wrap::wrap("Author:    ", "           ", $mdpItem->GetAuthor());

  my $handle = SRV::Utils::get_itemhandle($mdpItem);

  my $contents = <<TEXT;
$title
$author
Publisher: $publisher

Find this book online: $handle

TEXT

  # watermarks!
  my ( $digitization_source, $collection_source ) = SRV::Utils::get_sources($mdpItem);
  my $watermark_text = '';
  if ($digitization_source) {
    my $name = Institutions::get_institution_inst_id_field_val($C, $digitization_source, 'name');
    $watermark_text .= "Digitized by:  $name\n";
  }
  if ($collection_source) {
    my $name = Institutions::get_institution_inst_id_field_val($C, $collection_source, 'name');
    $watermark_text .= "Original from: $name\n";
  }
  $contents .= $watermark_text . "\n";

  $contents .= <<TEXT;
This file was downloaded from HathiTrust Digital Library.
Find more books at https://www.hathitrust.org.

$$access_stmts{stmt_head}
$$access_stmts{stmt_url}

TEXT

  $contents .= Text::Wrap::wrap("", "", $$access_stmts{stmt_text}) . "\n\n";

  # marginalia
  my $generated_text = generated_text($C);
  if ($generated_text) {
    $contents .= Text::Wrap::wrap("", "", $generated_text) . "\n\n";
  }
  if ($additional_message) {
    $contents .= Text::Wrap::wrap("", "", $additional_message) . "\n\n";
  }
  return $contents;
}

# Appropriated from ETT-332 with which it will be merged at a later date
sub generated_text {
  my $C = shift;

  my $auth = $C->get_object('Auth');

  my @message = ('Generated');
  my $institution = $auth->get_institution_name($C);
  if ($institution) {
    push @message, 'at', $institution;
  }
  push @message, 'through HathiTrust';

  if ($auth->user_is_print_disabled_proxy($C)) {
    push @message, 'Accessible Text Request Service';
  } elsif($auth->user_is_resource_sharing_user($C)) {
    push @message, 'Resource Sharing';
  }

  push @message, 'on', strftime("%Y-%m-%d %H:%M GMT", gmtime());
  return join(' ', @message);
}

1;
