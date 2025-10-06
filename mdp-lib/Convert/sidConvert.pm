package sidConvert;

use Convert;


use vars qw( @ISA );
@ISA = qw( Convert );


use strict;
use IPC::Open3;


sub Extract
{
    my $self=shift;
    my ($step_hr)=(@_);

    $self->SIDConversion($step_hr);
}

sub SIDConversion
{
    my $self=shift;
    my ($step_hr)=(@_);

    my $sfi_hr=$self->Get('StartingFileInfo');
    my $efi_hr=$self->Get('EndingFileInfo');
    my $cgi = $self->Get('cgi');

    my $width=$$efi_hr{extractWidth};
    my $height=$$efi_hr{extractHeight};
    my $x=$$efi_hr{extractX};
    my $y=$$efi_hr{extractY};
    my $res=$$efi_hr{res};


    my $reduce;
    if ($res ne '')
    {
	$reduce = qq{-s $res};
    }


    my $sid2jpeg = $self->GetBinary('sid') . " -jpeg -i $$sfi_hr{file} -x $x -y $y $reduce -w $width -h $height -o $$step_hr{file}";

    if (-e $$sfi_hr{file})
    {
	my $pid = open3('IN', 'OUT', 'ERR', $sid2jpeg);
	my @stderr = <ERR>;
	close(IN);
	close(OUT);
	close(ERR);
    }

#    print $sid2jpeg . "\n";

}




# ----------------------------------------------------------------------
1;
