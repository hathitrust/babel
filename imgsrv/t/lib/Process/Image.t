#!/usr/bin/perl

use strict;
use warnings;

use Data::Dumper;
use File::Spec;
use Test::More;

use lib File::Spec->catdir($ENV{SDRROOT}, 'imgsrv', 't');
use TestHelper qw(setup_context_for_volume);

use Auth::Auth;
use Access::Rights;
use Context;
use Image::ExifTool;
use MdpItem;
use Process::Image;

my $C = setup_context_for_volume('test.pd_open');
my $mdpItem = $C->get_object('MdpItem');

=item get_exiftool_fields()

Returns a hash of all the tags found by ExifTool in the specified file.
The keys are in the format GroupName:TagName in the same format as the
tag names returned by exiftool -X $file

$fields_ref = get_exiftool_fields($file)

Adapted from feed - HTFeed/Stage/ImageRemediate.pm

=cut



subtest 'tiff export' => sub {
  sub processor {
    my $processor = new Process::Image;
    $processor->mdpItem($C->get_object('MdpItem'));
    my $seq = 1;
    my $source_path = $mdpItem->GetFilePathMaybeExtract($seq, 'imagefile');
    $processor->source( filename => $source_path);
    $processor->quality('full');
    $processor->format('tif');
    $processor->watermark(1);

    return $processor;
  }

  sub get_exiftool_fields {
    my $file   = shift;
    my $fields = {};

    my $exifTool = new Image::ExifTool;

    $exifTool->ExtractInfo($file);

    foreach my $tag ($exifTool->GetFoundTags()) {
      # get only the groupname we'll use to update it later
      my $group   = $exifTool->GetGroup($tag, "1");
      my $tagname = Image::ExifTool::GetTagName($tag);
      $fields->{"$group:$tagname"} = $exifTool->GetValue($tag);
    }

    return $fields;
  }

  subtest 'full resolution' => sub {
    my $output_file = '/tmp/t_lib_process_image_full.tif';
    my $processor = processor();
    $processor->output( filename => $output_file);
    $processor->process();
    ok(-e $output_file, 'output TIFF file exists');

    my $fields = get_exiftool_fields($output_file);
    is($fields->{"IFD0:XResolution"}, 400, 'image has original (400x400 ppi) resolution');
    is($fields->{"IFD0:YResolution"}, 400, 'image has original (400x400 ppi) resolution');
    is($fields->{"IFD0:ResolutionUnit"}, "inches", 'image has original (400x400 ppi) resolution');
    is($fields->{"IFD0:Compression"}, "Adobe Deflate", 'image has AdobeDeflate compression');
  };

  subtest '300 ppi resolution' => sub {
    my $output_file = '/tmp/t_lib_process_image_300.tif';
    my $processor = processor();
    $processor->output( filename => $output_file);
    $processor->size('ppi:300');
    $processor->process();
    ok(-e $output_file, 'output TIFF file exists');

    my $fields = get_exiftool_fields($output_file);
    is($fields->{"IFD0:XResolution"}, 300, 'image has 300x300 ppi resolution');
    is($fields->{"IFD0:YResolution"}, 300, 'image has 300x300 ppi resolution');
    is($fields->{"IFD0:ResolutionUnit"}, "inches", 'image has 300x300 ppi resolution');
    is($fields->{"IFD0:Compression"}, "Adobe Deflate", 'image has AdobeDeflate compression');
  };
};

done_testing();
