package TIFFConvert;

use Convert;


use vars qw( @ISA );
@ISA = qw( Convert );


use strict;







sub TifToWebHandler_HOLD
{
    my $self = shift;
    my ($step_hr)=(@_);

    my $sfi_hr = $self->Get('StartingFileInfo');
    my $efi_hr = $self->Get('EndingFileInfo');
    my $cgi = $self->Get('cgi');

    # value saved in object should already have been determined
    my $rotationInDegrees = $cgi->param('rotate');

    my $preRotationOutputFileName = $$step_hr{'file'};

    my $sheight;
    my $outputRatio=4.0;
    if ( $$efi_hr{sheight} > 0 )
    {
	$outputRatio = $$sfi_hr{height} / $$efi_hr{sheight};
	if ($outputRatio > 16)
	{
	    $outputRatio=16;
	}
    }

    $self->Tif2WebCreateFile( $$sfi_hr{file},
			      $$step_hr{'file'},
			      $outputRatio );
}

# ----------------------------------------------------------------------
# NAME         : Tif2WebCreateFile
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub Tif2WebCreateFile_HOLD
{
    my $self = shift;
    my ( $inFilePath, $outFilePath, $outputRatio ) = @_;

    my $NumGrey = 4;
    my $Gamma   = 1.1;
    my $Tif2WebOutputTypeArg = '-P';

    my $scaleCmd = qq{ -A $outputRatio };
    my $arg = $Tif2WebOutputTypeArg;
    my $commandParams =
        qq{$arg -N $NumGrey -g $Gamma } .
            $scaleCmd .
                qq{ -x -o $outFilePath $inFilePath};

    my $command = qq{/l1/bin/symlinks/tif2web $commandParams};

    qx( $command 2>> /l1/dev/jweise/web/cache/tif2weblog.txt );
}





# ----------------------------------------------------------------------
1;
