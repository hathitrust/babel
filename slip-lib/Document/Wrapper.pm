package Document::Wrapper;

=head1 NAME

Document::Wrapper

=head1 DESCRIPTION

Wrapper packages the buffer containing the Solr document(s) generated
by Document::Generator->generate.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut


1;

sub wrap {
    my $C = shift;
    my $buf_ref = shift;

    my $wrapped_doc = '<add>' . $$buf_ref . '</add>';

    return \$wrapped_doc;
}


__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut


