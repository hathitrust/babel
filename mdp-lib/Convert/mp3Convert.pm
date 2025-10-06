package mp3Convert;

use Convert;


use vars qw( @ISA );
@ISA = qw( Convert );


use strict;


sub CacheFilePartsList
{
    my $self=shift;

    my %CacheFilePartsList = (
			      'final' => [],
			     );
    $self->Set('CacheFilePartsList', \%CacheFilePartsList);
}



sub EndingFilenamesForCacheing
{
    my $self=shift;

    my $sfi_hr = $self->Get('StartingFileInfo');
    my $efi_hr = $self->Get('EndingFileInfo');
    my $cgi = $self->Get('cgi');

    my @conversionSteps;
    $$efi_hr{conversionSteps} = \@conversionSteps;

    $self->FilenameForCacheingStep('final');
}


sub Final
{
    my $self=shift;
    my ($step_hr)=(@_);

    my $sfi_hr = $self->Get('StartingFileInfo');
    my $efi_hr = $self->Get('EndingFileInfo');

    symlink $$sfi_hr{file}, $$step_hr{file};

}

sub FinalizeConversionMedia{};

# ----------------------------------------------------------------------
1;
