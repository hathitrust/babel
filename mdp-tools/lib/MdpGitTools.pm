package MdpGitTools;

# ---------------------------------------------------------------------

=item get_app_dir_list

Description

=cut

# ---------------------------------------------------------------------
sub get_app_dir_list {
    my $SDRROOT = shift;
    
    my @app_dirs = ();
    
    if (! opendir(DIR, $SDRROOT)) {
        print STDERR "could read $SDRROOT\n";
        exit 1;
    }
        
    @app_dirs = map { "$SDRROOT/$_" } grep(! /^(\.|\..)/, readdir(DIR));
    closedir(DIR);

    return @app_dirs;
}

1;
