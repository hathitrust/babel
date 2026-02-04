#!/usr/bin/perl

use strict;
use warnings;

use Test::More;
use File::Spec;

use lib File::Spec->catdir($ENV{SDRROOT}, 'imgsrv/lib');
use PDF::API2::Resource::XObject::Image::JPEG2000;

subtest 'extract_usable_colorspace' => sub {

  subtest 'prefers "ColorSpace (1)" over "ColorSpace" when the latter is unusable' => sub {
    my $info = {
      'ColorSpace (1)' => 'Grayscale',
      'ColorSpace' => 'Uncalibrated'
    };
    my $cs = PDF::API2::Resource::XObject::Image::JPEG2000::extract_usable_colorspace($info);
    is($cs, 'Grayscale');
  };

  subtest 'prefers "Colorspace" over "ColorSpace" when the both are usable' => sub {
    my $info = {
      'ColorSpace' => 'Grayscale',
      'Colorspace' => 'sRGB'
    };
    my $cs = PDF::API2::Resource::XObject::Image::JPEG2000::extract_usable_colorspace($info);
    is($cs, 'sRGB');
  };
  
  subtest 'prefers "Colorspace (1)" over "ColorSpace (1)" when the both are usable' => sub {
    my $info = {
      'ColorSpace (1)' => 'Grayscale',
      'Colorspace (1)' => 'sRGB'
    };
    my $cs = PDF::API2::Resource::XObject::Image::JPEG2000::extract_usable_colorspace($info);
    is($cs, 'sRGB');
  };
};

done_testing();
