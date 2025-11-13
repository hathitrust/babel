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
use MdpItem;
use Process::Image;

my $C = setup_context_for_volume('test.pd_open');
my $mdpItem = $C->get_object('MdpItem');

subtest 'tiff export' => sub {
  subtest 'full resolution' => sub {
    my $output_file = '/tmp/t_lib_process_image_full.tif';
    my $processor = new Process::Image;
    $processor->mdpItem($C->get_object('MdpItem'));
    my $seq = 1;
    my $source_path = $mdpItem->GetFilePathMaybeExtract($seq, 'imagefile');
    $processor->source( filename => $source_path);
    $processor->output( filename => $output_file);
    $processor->format('tif');
    $processor->watermark(1);
    #$processor->restricted(0);
    $processor->quality('full');
    $processor->process();
    ok(-e $output_file, 'output TIFF file exists');
    my $identify_output = `identify -verbose $output_file`;
    ok($identify_output =~ /Resolution:\s+400x400/, 'image has original (400x400) resolution');
  };

  subtest '300 ppi resolution' => sub {
    my $output_file = '/tmp/t_lib_process_image_300.tif';
    my $processor = new Process::Image;
    $processor->mdpItem($C->get_object('MdpItem'));
    my $seq = 1;
    my $source_path = $mdpItem->GetFilePathMaybeExtract($seq, 'imagefile');
    $processor->source( filename => $source_path);
    $processor->output( filename => $output_file);
    $processor->format('tif');
    $processor->watermark(1);
    #$processor->restricted(0);
    $processor->quality('full');
    $processor->size('ppi:300');
    $processor->process();
    ok(-e $output_file, 'output TIFF file exists');
    my $identify_output = `identify -verbose $output_file`;
    ok($identify_output =~ /Resolution:\s+300x300/, 'image has 300x300 resolution');
  };
};

done_testing();
