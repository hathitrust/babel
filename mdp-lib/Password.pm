package Password;


=head1 NAME

Password

=head1 DESCRIPTION

This package provides a routine to read a password from the command
line without echoing it in plaintext.

=head1 SYNOPSIS

use Password;
print "Enter passwd: ";
my $passwd = get_password();
print "\n";

=head1 METHODS

=over 8

=cut


use Term::ReadKey;

# ---------------------------------------------------------------------

=item get_password

http://stackoverflow.com/questions/701078/how-can-i-enter-a-password-using-perl-and-replace-the-characters-with

=cut

# ---------------------------------------------------------------------
sub get_password() {
    my $password = "";
    # Start reading the keys
    ReadMode(4); # Disable the control keys
    my $count = 0;
    while (ord(my $key = ReadKey(0)) != 10) {
        # This will continue until the Enter key is pressed (decimal value of 10)
        if(ord($key) == 127 || ord($key) == 8) {
            # DEL/Backspace was pressed
            if ($count > 0) {
                $count--;
                #1. Remove the last char from the password
                chop($password);
                #2 move the cursor back by one, print a blank character, move the cursor back by one
                print "\b \b";
            }
        }
        elsif(ord($key) >= 32) {
            $count++;
            $password = $password.$key;
            print "*";
        }
    }
    ReadMode(0); #Reset the terminal once we are done

    return $password;
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
