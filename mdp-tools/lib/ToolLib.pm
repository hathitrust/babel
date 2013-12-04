package ToolLib;

use Exporter ();
@ISA = qw(Exporter);
@EXPORT = qw(
                PrintY
                PrintN
                PrintM
                PrintG
                query
                query_yn
                query_option
                validate_existing_app
                chdir_to_app_dir
                execute_command
                execute_command_w_output
                get_HTDE_roots
                get_app_dir_list
                get_app_list

                G_list_tags
                G_last_tag
                G_sync_local_master
                G_sync_local_deployment
                G_checkout_branch
                G_checkout_master
                G_merge_master_branch
                G_update_submodules
                G_init_submodules
                G_tag_app
                G_push_origin_deployment
                G_push_origin_tags
                G_checkout_tag
                G_clone
                G_fetch_origin
                G_handle_diff
           );


$ToolLib::VERBOSE = 0;

@ToolLib::valid_beta_stages = qw(beta-1 beta-2 beta-3 beta-4);
@ToolLib::all_valid_stages = (@ToolLib::valid_beta_stages, 'test');

@ToolLib::valid_developers =
  qw (
         aelkiss 
         besmit 
         ezbrooks 
         jgmorse 
         jjyork 
         moseshll 
         pfarber 
         pulintz 
         roger 
         rrotter 
         scollett 
         sethajoh 
         skorner 
         sooty 
         stampy 
         tburtonw 
         nasirg
         sethip
    );
 
@ToolLib::valid_dev_repos = map { "/htapps/$_.babel" } @ToolLib::valid_developers;


# ====================================================================
#
#                         Git (G_) Utilities
#
# ====================================================================

# ---------------------------------------------------------------------

=item G_handle_diff

Description

=cut

# ---------------------------------------------------------------------
sub G_handle_diff {
    my ($app, $app_dir) = @_;

    return 0
      if (! chdir_to_app_dir($app_dir));

    my $last_tag = G_last_tag();
    my $diff_file = "/tmp/git-$last_tag-$$.diff";
    PrintY("Begin diff generation: diff between HEAD and tag ($last_tag), diff file: $diff_file ... ");

    my $diff;
    return 0
      if (! execute_command_w_output(qq{git diff --ignore-all-space --submodule=log $last_tag}, \$diff));

    # Clean up submodule log entries. we only want the SHA1s
    my @submodule_lines = ($diff =~ m,^(Submodule.*?:),gm);
    $diff =~ s,^Submodule.*,,gms;
    foreach my $sml (@submodule_lines) {
        next
          if ($sml =~ m,yui2-lib,);

        my ($path_arg, $sha1_arg) = ($sml =~ m,Submodule (.*?) ([0-9a-f]+\.\.[0-9-a-f]+),);
        # print "$path_arg $sha1_arg\n";

        return 0
          if (! chdir_to_app_dir("$app_dir/$path_arg"));

        my $sub_diff;
        return 0
          if (! execute_command_w_output(qq{git diff --ignore-all-space $sha1_arg}, \$sub_diff));

        $diff .= "\n#\n# ***** SUBMODULE $path_arg DIFF *****\n#\n\n" . $sub_diff;
    }

    if (! $diff) {
        $diff = "No difference between tag=$last_tag and app=$app staged at $app_dir";
    }
    
    write_data(\$diff, $diff_file);
    
    my $sysrc = system( "$ENV{EDITOR}", $diff_file );
    # system( "more", $diff_file );

    ($sysrc == 0) ? PrintY("OK\n") : PrintN("ERROR: could not invoke $ENV{EDITOR}\n");

    return ($sysrc == 0);
}


# ---------------------------------------------------------------------

=item G_last_tag

Description

=cut

# ---------------------------------------------------------------------
sub G_last_tag {
    my $tags = G_list_tags(1);
    my ($last_tag) = ($tags =~ m,Tag:\s*(.*),);
    return $last_tag;
}

# ---------------------------------------------------------------------

=item G_clone

Clone an app.

=cut

# ---------------------------------------------------------------------
sub G_clone {
    my ($app_root, $repo_root, $app_repo, $app_dir, $branch) = @_;

    print qq{Clone $app_repo at $app_dir ...};

    return 0
      if (! chdir_to_app_dir($app_root));

    my $branch_cmd = " --branch $branch" if (defined($branch));
    my $cmd_1 = "git clone $repo_root/$app_repo $branch_cmd";
        
    return 0
      if (! execute_command($cmd_1));

    return 0
      if (! chdir_to_app_dir($app_dir));

    my $cmd_2 = "git init --shared=group";
    return 0
      if (! execute_command($cmd_2));

    my $cmd_3 = "git remote show origin";
    return 0
      if (! execute_command($cmd_3));
    
    PrintY("OK\n");
    return 1;
}


# ---------------------------------------------------------------------

=item G_sync_local_master

Make local master branch match exactly the remote repository. Now the
local master branch should have all the changes published for this
app.

Should only be called from stage-app.

=cut

# ---------------------------------------------------------------------
sub G_sync_local_master {
    my $app_dir = shift;

    my $cmd;
    print qq{Sync local master branch to origin/master ... \n};

    return 0
      if (! chdir_to_app_dir($app_dir));

    return 0
      if (! G_checkout_master($app_dir));

    $cmd = "git reset --hard origin/master";
    return 0
      if (! execute_command($cmd));

    $cmd = "git clean -xdf";
    return 0
      if (! execute_command($cmd));

    return 0
      if (! G_update_submodules($app_dir));

    PrintY("Sync master succeeds\n");
    return 1;
}


# ---------------------------------------------------------------------

=item G_fetch_origin

Description

=cut

# ---------------------------------------------------------------------
sub G_fetch_origin {
    my $app_dir = shift;
    my $silent = shift;
    
    my $cmd;
    print qq{Fetching origin ... };

    return 0
      if (! chdir_to_app_dir($app_dir));

    $cmd = "git fetch origin";
    return 0
      if (! execute_command($cmd));

    $cmd = "git fetch --tags origin";
    return 0
      if (! execute_command($cmd));

    PrintY("OK\n") unless ($silent);
    return 1;
}

# ---------------------------------------------------------------------

=item G_sync_local_deployment

Make local deployment branch match exactly the stage of the state of
origin/deployment previously obtained by the fetch during staging.

=cut

# ---------------------------------------------------------------------
sub G_sync_local_deployment {
    my $app_dir = shift;

    my $cmd;
    print qq{Sync local deployment branch to origin/deployment ...\n};

    return 0
      if (! chdir_to_app_dir($app_dir));

    # Start from master so G_checkout_branch('deployment') will branch from
    # master if new deployment branch is created.
    return 0
      if (! G_checkout_master($app_dir));

    my $branch_is_remote;
    return 0
      if (! G_checkout_branch($app_dir, 'deployment', \$branch_is_remote));

    if ($branch_is_remote) {
        $cmd = "git reset --hard origin/deployment";
        return 0
          if (! execute_command($cmd));
    }

    $cmd = "git clean -xdf";
    return 0
      if (! execute_command($cmd));

    return 0
      if (! G_update_submodules($app_dir));

    PrintY("Sync deployment succeeds\n");
    return 1;
}

# ---------------------------------------------------------------------

=item __exists_remote_branch

Description

=cut

# ---------------------------------------------------------------------
sub __exists_remote_branch {
    my $branch = shift;

    my $output;
    my $cmd = "git ls-remote --heads origin";
    return 0
      if (! execute_command_w_output($cmd, \$output));

    return ($output =~ m,refs/heads/$branch,s);
}

# ---------------------------------------------------------------------

=item __exists_local_branch

Description

=cut

# ---------------------------------------------------------------------
sub __exists_local_branch {
    my $branch = shift;

    my $output;
    my $cmd = "git branch";
    if (! execute_command_w_output($cmd, \$output)) {
        return 0;
    }
    my @branches = split(/\n/, $output);
    @branches = map {($_ =~ s,\s*|\*,,g , $_)[1]} @branches;
    
    return (grep(/^$branch$/, @branches));
}

# ---------------------------------------------------------------------

=item G_create_local_branch_track_remote

Description

=cut

# ---------------------------------------------------------------------
sub G_create_local_branch_track_remote {
    my $branch = shift;
    
    my $cmd = "git checkout --track -b $branch origin/$branch";
    if (! execute_command($cmd)) {
        return 0;
    }

    return 1;
}


# ---------------------------------------------------------------------

=item G_checkout_branch

Checkout the branch in preparation for operating on it.

=cut

# ---------------------------------------------------------------------
sub G_checkout_branch {
    my $app_dir = shift;
    my $branch = shift;
    my $branch_exists_at_remote_ref = shift;

    my $exists_remotely = 0;

    my $cmd;
    my $output;
    print qq{Checkout local branch=$branch from $app_dir ...\n};

    return 0
      if (! chdir_to_app_dir($app_dir));

    # If there's a remote branch, a local branch
    # must have been created and pushed to remote. But the local could
    # have been deleted so track the remote again to restore it.
    if (__exists_remote_branch($branch)) {
        if (! G_fetch_origin($app_dir, 'silent')) {
            return 0;
        }
        if (! __exists_local_branch($branch)) {
            if (! G_create_local_branch_track_remote($branch)) {
                return 0;
            }
        }

        $cmd = "git checkout $branch";
        if (! execute_command($cmd)) {
            return 0;
        }
        $exists_remotely = 1;
    }
    else {
        if (__exists_local_branch($branch)) {
            $cmd = "git checkout $branch";
            if (! execute_command($cmd)) {
                return 0;
            }
        }
        else {
            $cmd = "git checkout -b $branch";
            if (! execute_command($cmd)) {
                return 0;
            }
        }
    }

    if (defined($branch_exists_at_remote_ref)) {
        $$branch_exists_at_remote_ref = $exists_remotely;
    }

    PrintY("OK\n");
    return 1;
}

# ---------------------------------------------------------------------

=item G_checkout_master

Checkout the master branch in preparation for operating on it.

=cut

# ---------------------------------------------------------------------
sub G_checkout_master {
    my $app_dir = shift;

    print qq{Checkout local master branch ... };

    return 0
      if (! chdir_to_app_dir($app_dir));

    my $cmd = "git checkout master";
    return 0
      if (! execute_command($cmd));

    PrintY("OK\n");
    return 1;
}


# ---------------------------------------------------------------------

=item G_merge_master_branch

Merge local master branch into current branch.  Current branch is
assumed to be the local deployment branch.  Do this --no-ff (no
fast-forward) so that a commit point will be created.  This commit
serves as a permanent record on the state of the [deployment] branch
as of this merge prior to tagging and production rdist.

Note that since this merge can usually be carried out fast-forward,
there will be 2 different SHAs for the same state.

=cut

# ---------------------------------------------------------------------
sub G_merge_master_branch {
    my $app_dir = shift;

    print qq{Merge local master branch (--no-ff) into current branch ... };

    return 0
      if (! chdir_to_app_dir($app_dir));

    my $cmd = "git merge master --no-ff";
    return 0
      if (! execute_command($cmd));

    PrintY("OK\n");
    return 1;
}


# ---------------------------------------------------------------------

=item G_update_submodules

Make submodules in the current agree with the commit recorded for them
in the super-project.

=cut

# ---------------------------------------------------------------------
sub G_update_submodules {
    my $app_dir = shift;

    print qq{Updating submodules ... };

    return 0
      if (! chdir_to_app_dir($app_dir));

    my $cmd_2 = "git submodule foreach 'git init --shared=group'";
    return 0
      if (! execute_command($cmd_2));

    my $cmd_1 = "git submodule update";
    return 0
      if (! execute_command($cmd_1));

    my $cmd_3 = "git submodule foreach 'chmod g+w .'";
#    return 0
#      if (! execute_command($cmd_3));
    execute_command($cmd_3);
    
    PrintY("OK\n");
    return 1;
}

# ---------------------------------------------------------------------

=item G_init_submodules

Initialize submodules.

=cut

# ---------------------------------------------------------------------
sub G_init_submodules {
    my $app_dir = shift;

    print qq{Initializing submodules ... };

    return 0
      if (! chdir_to_app_dir($app_dir));

    my $cmd_1 = "git submodule init";
    return 0
      if (! execute_command($cmd_1));

    PrintY("OK\n");
    return 1;
}

# ---------------------------------------------------------------------

=item G_tag_app

Description

=cut

# ---------------------------------------------------------------------
sub G_tag_app {
    my $app_dir = shift;
    my $tag = shift;

    print qq{Applying tag ($tag) to state of current branch ... };

    return 0
      if (! chdir_to_app_dir($app_dir));

    my $msg = qq{Tagging the $tag release of $app on } . `date`;
    my $cmd = qq{git tag -a -m'$msg' $tag};
    return 0
      if (! execute_command($cmd));

    PrintY("OK\n");
    return 1;
}


# ---------------------------------------------------------------------

=item G_push_origin_deployment

Description

=cut

# ---------------------------------------------------------------------
sub G_push_origin_deployment {
    my $app_dir = shift;

    print qq{Push local deployment branch to origin ...\n};

    return 0
      if (! chdir_to_app_dir($app_dir));

    return 0
      if (! G_checkout_branch($app_dir, 'deployment'));

    my $cmd = "git push origin deployment";
    return 0
      if (! execute_command($cmd));

    PrintY("Push succeeds\n");
    return 1;
}

# ---------------------------------------------------------------------

=item G_push_origin_tags

Description

=cut

# ---------------------------------------------------------------------
sub G_push_origin_tags {
    my $app_dir = shift;

    print qq{Push tags to origin ... };

    return 0
      if (! chdir_to_app_dir($app_dir));

    my $cmd = "git push origin --tags";
    return 0
      if (! execute_command($cmd));

    PrintY("OK\n");
    return 1;
}

# ---------------------------------------------------------------------

=item __list_tags_short

Description

=cut

# ---------------------------------------------------------------------
sub __list_tags_short {
    my $num = shift;
    
    my $cmd = qq{git for-each-ref --count=$num --sort='-taggerdate' --format='%0a%09Tag: %(refname)%(*body)%0a%09%09Date: %(taggerdate)%0a%09%09Author: %(*authorname)' 'refs/tags'};

    my $list;
    if (execute_command_w_output($cmd, \$list)) {
        $list =~ s,refs/tags/,,g;
        if ($list) {
            return $list;
        }
    }
}

# ---------------------------------------------------------------------

=item __list_tags_verbose

Description

=cut

# ---------------------------------------------------------------------
sub __list_tags_verbose {
    my $num = shift;

    my $cmd_0 = qq{git for-each-ref --count=$num --sort='-taggerdate' --format='%(refname)%(*body)' 'refs/tags'};

    my $list;
    if (execute_command_w_output($cmd_0, \$list)) {
        if ($list) {
            my @verbose_list = ();
            my @list = split(/\n/, $list);
            foreach my $tag (@list) {
                my $cmd_1 = qq{git show $tag};
                execute_command_w_output($cmd_1, \$list);
                push (@verbose_list, $list);
            }
            
            return join("===\n\n", @verbose_list);
        }
    }
}

# ---------------------------------------------------------------------

=item G_list_tags

List tags known to the local repository.

=cut

# ---------------------------------------------------------------------
sub G_list_tags {
    my $num = shift;
    my $verbose = shift;

    $num = $num ? $num : 3;

    if ($verbose) {
        return __list_tags_verbose($num);
    }
    else {
        return __list_tags_short($num);
    }
}



# ---------------------------------------------------------------------

=item G_checkout_tag

Description

=cut

# ---------------------------------------------------------------------
sub G_checkout_tag {
    my $app_dir = shift;
    my $tag = shift;

    print qq{Checking out tag ($tag) ... };

    return 0
      if (! chdir_to_app_dir($app_dir));

    my $cmd = "git checkout $tag";
    return 0
      if (! execute_command($cmd));

    PrintY("OK\n");
    return 1;
}



# ====================================================================
#
#                         General Utilities
#
# ====================================================================

# ---------------------------------------------------------------------

=item get_app_dir_list

Description

=cut

# ---------------------------------------------------------------------
sub get_app_dir_list {
    my $app_root = shift;

    my @app_dirs = __get_list($app_root, 0);

    return @app_dirs;
}


# ---------------------------------------------------------------------

=item get_app_list

Description

=cut

# ---------------------------------------------------------------------
sub get_app_list {
    my $app_root = shift;

    my @apps = __get_list($app_root, 1);

    return @apps;
}


# ---------------------------------------------------------------------

=item get_app_dir_list

Description

=cut

# ---------------------------------------------------------------------
sub __get_list {
    my $app_root = shift;
    my $apps_only = shift;

    my @list = ();

    if (! opendir(DIR, $app_root)) {
        PrintN("ERROR: Could not read $app_root\n");
        exit 1;
    }

    my @temp_list = map { "$app_root/$_" } grep(! /^(\.|\..)/, readdir(DIR));
    closedir(DIR);

    foreach my $dir (@temp_list) {
        next if (! -e "$dir/.git");
        if ($apps_only) {
            my ($app) = ($dir =~ m,.+/(.+)$,);
            push(@list, $app);
        }
        else {
            push(@list, $dir);
        }
    }

    return @list;
}

# ---------------------------------------------------------------------

=item chdir_to_app_dir

Description

=cut

# ---------------------------------------------------------------------
sub chdir_to_app_dir {
    my $app_dir = shift;

    if (! chdir($app_dir)) {
        PrintN("ERROR: could not cd to $app_dir\n");
        return 0;
    }

    return 1;
}

# ---------------------------------------------------------------------

=item execute_command

Description

=cut

# ---------------------------------------------------------------------
sub execute_command {
    my $cmd = shift;

    my $verbose = ($ToolLib::VERBOSE || ($cmd =~ m,-v,) );
    
    print qq{$cmd\n} if ($verbose);

    $verbose ? print qx($cmd) : qx($cmd 1> /dev/null 2>&1);
    if ($?) {
        PrintN("ERROR: $?\ncmd=$cmd\n") if ($verbose);
        return 0;
    }

    return 1;
}

# ---------------------------------------------------------------------

=item execute_command_w_output

Description

=cut

# ---------------------------------------------------------------------
sub execute_command_w_output {
    my ($cmd, $output_ref) = @_;

    my $verbose = ($ToolLib::VERBOSE || ($cmd =~ m,-v,) );
    
    print qq{$cmd\n} if ($verbose);

    $verbose
      ? ($$output_ref = qx($cmd))
        : ($$output_ref = qx($cmd 2> /dev/null));
    if ($?) {
        PrintN("ERROR: $?\ncmd=$cmd\n") if ($verbose);
        return 0;
    }

    print $$output_ref if ($verbose);

    return 1;
}


# ---------------------------------------------------------------------

=item get_HTDE_roots

Description

=cut

# ---------------------------------------------------------------------
sub get_HTDE_roots {
    my $stage = shift;

    my $where;
    if ($stage) {
        $where = $stage;
        delete $ENV{HTDE_REPOROOT};
        delete $ENV{HTDE_APPROOT};
    }
    else {
        $where = `whoami`;
        chomp($where);
    }

    if ($ToolLib::VERBOSE) {
        if (defined $ENV{HTDE_REPOROOT}) {
            print "Using env=$ENV{HTDE_REPOROOT} to set \$repo_root\n";
        }
        if (defined $ENV{HTDE_APPROOT}) {
            print "Using env=$ENV{HTDE_APPROOT} to set \$app_root\n";
        }
    }

    my $repo_root = $ENV{HTDE_REPOROOT} || "/htapps/repos";
    my $app_root = $ENV{HTDE_APPROOT} || "/htapps/$where.babel";

    return ($repo_root, $app_root);
}


# ---------------------------------------------------------------------

=item validate_existing_app

Make some reasonable checks to derermine the validity of an app name.

SIDE EFFECT: changes the current working directory to "$app_root/$app"

=cut

# ---------------------------------------------------------------------
sub validate_existing_app {
    my ($repo_root, $app_root, $app) = @_;

    print qq{Validating application ($app) ... };

    my $app_dir = "$app_root/$app";

    if (! $app) {
        PrintN(qq{\nERROR: '$app' is not a valid app\n});
        return 0;
    }

    if (! -e "$repo_root/$app.git") {
        PrintN(qq{\nERROR: '$app' is not a valid app: no central repo:\n\t$repo_root/$app.git does not exist\n});
        PrintN(qq{\nPerhaps you need to run clone-repo -s test $app.git\n});
        return 0;
    }
    if (! -e "$app_dir") {
        PrintN(qq{\nERROR: '$app' is not a valid app: $app_dir does not exist\n});
        return 0;
    }
    if (! -e "$app_dir/.git") {
        PrintN(qq{\nERROR: '$app' is not a valid app: $app_dir/.git does not exist\n});
        return 0;
    }

    return 0
      if (! chdir_to_app_dir($app_dir));

    PrintY("OK\n");
    return 1;
}


# ---------------------------------------------------------------------

=item write_data

Description

=cut

# ---------------------------------------------------------------------
sub write_data {
    my ($data_ref, $filename) = @_;

    open(OUTFILE, ">:utf8", $filename) || die qq{Cannot open $filename for writing};
    print OUTFILE $$data_ref;
    close( OUTFILE );
}

# ---------------------------------------------------------------------

=item query

Description

=cut

# ---------------------------------------------------------------------
sub query {
    my ($query, $default) = @_;


    if ($default) {
        print "$query [$default] ";
    }
    else {
        print "$query ";
    }

    my $ans = <STDIN>;
    chomp $ans;

    $ans =~ s,^\s*(.*?)\s*$,$1,;
    if($ans =~ /^q$/) {
        print "Quitting...\n";
        exit 0;
    }

    if (! defined($ans) || ($ans eq '')) {
        $ans = $default;
    }

    return $ans;
}

# ---------------------------------------------------------------------

=item query_yn

Description

=cut

# ---------------------------------------------------------------------
sub query_yn {
    my ($query, $default) = @_;

    if (! $default || $default !~ /^[y|n]/) {
        $default = ($default ? "y" : "n");
    }

    my $ans = query($query, $default);

    while ($ans !~ /^[y|n]/i) {
        print "Options are: y)es or n)o\n";
        $ans = query($query, $default);
    }

    $ans = ($ans =~ /^y/i ? 1 : 0);

    return $ans;
}

# ---------------------------------------------------------------------

=item query_option

Description

=cut

# ---------------------------------------------------------------------
sub query_option {
    my $query = shift;
    my $default = shift;

    my @options = @_;
    my @answers;
    my $options_list = "";
    my $i;

    # Make sure default is one of the options.
    $default = 'none' if ( ! $default );
    push @options, $default unless grep /$default/i, @options;

    # Format list of options
    for( $i = 0; $i < @options - 1; $i++ ) {
        $options_list .= "$options[$i]|";
    }
    $options_list .= "$options[$i]";
    $query .= " ($options_list)";

    # Query until one of the options is chosen
    my $ans = query($query, $default);
    while(! (@answers = grep /^$ans$/, @options )) {
        print "Options are: $options_list\n";
        $ans = query( $query, $default );
    }
    $ans = ( $answers[0] eq 'none' ) ? '' : $answers[0];

    return $ans;
}

# gray=30, red=31, green=32
sub on {
    return unless ($ENV{TERM} eq 'xterm');
    my $color = shift;
    $ok ? print "\033[1;${color}m" : print "\033[1;${color}m";
}
sub off {
    return unless ($ENV{TERM} eq 'xterm');
    print "\033[0m";
}

sub PrintY {
    my $s = shift;
    on(30);
    print $s;
    off();
}
sub PrintN {
    my $s = shift;
    on(31);
    print $s;
    off();
}

sub PrintM {
    my $s = shift;
    on(35);
    print $s;
    off();
}

sub PrintG {
    my $s = shift;
    on(32);
    print $s;
    off();
}

1;

__END__

