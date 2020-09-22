#!/usr/bin/env perl

use IPC::Run qw(run);
use POSIX qw(floor);
use File::Slurp qw(read_file write_file);
use File::Basename;
use Getopt::Long;

use FindBin qw($Bin);

my %gSizes =
    (
        '400'  => 4.00,
        '300'  => 3.00,
        '200'  => 2.00,
        '175'  => 1.75,
        '150'  => 1.50,
        '125'  => 1.25,
        '100'  => 1.00,
        '75'   => 0.75,
        '50'   => 0.50,
        '25'   => 0.25,
    );

my %LABELS = (
    Orig => "Original from",
    Dig  => "Digitized by",
);

my %PARTS = (
    Orig => "collection",
    Dig  => "digitization",
);

my ( $op_original, $op_digitize, $code, $organization );
GetOptions(
    "original" => \$op_original,
    "digitized" => \$op_digitize,
    "code=s" => \$code,
    "organization=s" => \$organization,
    "digitized_label=s" => \$LABELS{Dig},
    "original_label=s" => \$LABELS{Orig},
);

unless ( $op_original || $op_digitize ) {
  print "$0 --original --digitized --code=... --organiziation=... --digitized_label=... --original_label=...\n";
  exit;
}

my @parts = ();
push @parts, "Orig" if ( $op_original );
push @parts, "Dig" if ( $op_digitize );

my $base_pointsize = 14; my $base_labelsize = 10;

if ( ! -d "$Bin/../$code/collection" && $op_original ) {
    run [ "mkdir", "-p", "$Bin/../$code/collection" ];
}
if ( ! -d "$Bin/../$code/digitization" && $op_digitize ) {
    run [ "mkdir", "-p", "$Bin/../$code/digitization/" ];
}

foreach my $prefix ( @parts ) {
    my $base_width = 680.0 / 2;
    my $label = $LABELS{$prefix};

    # always?
    $organization = uc $organization;

    my $part = $PARTS{$prefix};

    foreach my $size ( sort keys %gSizes ) {
        my $target_width = floor(int($base_width * $gSizes{$size}) * 0.8);
        my $target_height = floor($target_width * 0.2);
        $target_width += ( $target_width * 0.1 );
        my $target_pointsize = $base_pointsize * $gSizes{$size};
        my $label_pointsize = int($target_pointsize * 0.85);
        $target_pointsize = 10 if ( $target_pointsize < 10 );
        $label_pointsize = 9 if ( $label_pointsize < 9 );
        run [ "convert",
            "-fill", "#979797",
            "-background", "None",
            "-font", "$ENV{SDRROOT}/imgsrv/share/fonts/DejaVuSansCondensed.ttf",
            "-pointsize", "$label_pointsize",
            "label:$label",
            "-pointsize", $target_pointsize,
            "-size", "$target_width\x",
            "-gravity", "center",
            "caption:$organization", 
            "-background", "None",
            "-gravity", "center",
            "-append",
            "-depth", "8",
            # "-transparent", "white",
            # "marks/$prefix${code}-$size.png"
            "$Bin/../$code/$part/$size.png"
            ]
            ;

        run [ "convert",
            "-flatten",
            "$Bin/../$code/$part/$size.png",
            "$Bin/../$code/$part/$size.flat.png"
            ]
            ;

        # pngtopam $pngfile > parts/$pnmfile
        run [ "pngtopam",
            "$Bin/../$code/$part/$size.png",
        ], ">", "$Bin/../$code/$part/$size.pnm";

        # # extract transparency
        # pngtopam -alpha $pngfile > parts/$pgmfile
        run [ "pngtopam",
            "-alpha",
            "$Bin/../$code/$part/$size.png",
        ], ">", "$Bin/../$code/$part/$size.pgm";

        print "== $size : $target_width x $target_height\n";
    }    
}

