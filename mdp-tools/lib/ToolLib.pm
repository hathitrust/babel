package ToolLib;

use Exporter ();
@ISA = qw(Exporter);
@EXPORT = qw(
                on
                off
                query
                query_yn
                validate_existing_app
                validate_clone_app
                chdir_to_app_dir
                execute_command
                execute_command_w_output
                get_HTDE_roots
                get_app_dir_list

                G_list_tags
                G_sync_local_master
                G_sync_local_deployment
                G_checkout_deployment
                G_checkout_master
                G_merge_master_branch
                G_update_submodules
                G_init_submodules
                G_tag_app
                G_push_origin_deployment
                G_checkout_tag
                G_clone
                G_fetch_origin
           );


$ToolLib::VERBOSE = 0;

# ====================================================================
#
#                         Git (G_) Utilities
#
# ====================================================================

# ---------------------------------------------------------------------

=item G_clone

Clone an app.

=cut

# ---------------------------------------------------------------------
sub G_clone {
    my ($app_root, $repo_root, $app_repo, $app_dir) = @_;

    print qq{Clone $app_repo under $app_dir ...};

    return 0
      if (! chdir_to_app_dir($app_root));

    my $cmd = "git clone $repo_root/$app_repo";
    return 0
      if (! execute_command($cmd));

    on(1);print qq{OK\n};off();
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

    print qq{Sync succeeds\n};
    return 1;
}


# ---------------------------------------------------------------------

=item G_fetch_origin

Description

=cut

# ---------------------------------------------------------------------
sub G_fetch_origin {
    my $app_dir = shift;

    my $cmd;
    print qq{Fetching origin/master ... };

    return 0
      if (! chdir_to_app_dir($app_dir));

    $cmd = "git fetch origin";
    return 0
      if (! execute_command($cmd));

    $cmd = "git fetch --tags origin";
    return 0
      if (! execute_command($cmd));

    on(1);print qq{OK\n};off();
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
    print qq{Sync local deployment branch to fetch of origin/deployment ...\n};

    return 0
      if (! chdir_to_app_dir($app_dir));

    # Start from master so G_checkout_deployment will branch from
    # master if new deployment branch is created.
    return 0
      if (! G_checkout_master($app_dir));

    my $new_branch;
    return 0
      if (! G_checkout_deployment($app_dir, \$new_branch));

    if (! $new_branch) {
        $cmd = "git reset --hard origin/deployment";
        return 0
          if (! execute_command($cmd));
    }

    $cmd = "git clean -xdf";
    return 0
      if (! execute_command($cmd));

    return 0
      if (! G_update_submodules($app_dir));

    print qq{Sync deployment succeeds\n};
    return 1;
}


# ---------------------------------------------------------------------

=item G_checkout_deployment

Checkout the deployment branch in preparation for operating on it.

=cut

# ---------------------------------------------------------------------
sub G_checkout_deployment {
    my $app_dir = shift;
    my $new_branch_ref = shift;

    my $cmd;
    print qq{Checkout local deployment branch ... };

    return 0
      if (! chdir_to_app_dir($app_dir));

    # Is there already a deployment branch at origin?
    my $output;
    $cmd = "git ls-remote  --heads origin";
    if (! execute_command_w_output($cmd, \$output)) {
        return 0;
    }

    my $new_branch;
    if ($output !~ m,refs/heads/deployment,s) {
        # Nope. So there was never a local deployment branch (which
        # would have been pushed to origin by a previous
        # deployment). Make one.
        $cmd = "git checkout -b deployment";
        $new_branch = 1;
    }
    else {
        $cmd = "git checkout deployment";
        $new_branch = 0;
    }

    if (! execute_command($cmd)) {
        return 0;
    }

    if ($new_branch_ref) {
        $$new_branch_ref = $new_branch
    }

    on(1);print qq{OK\n};off();
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

    on(1);print qq{OK\n};off();

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

    on(1);print qq{OK\n};off();
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

    my $cmd = "git submodule update --init";
    return 0
      if (! execute_command($cmd));

    on(1);print qq{OK\n};off();

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

    my $cmd = "git submodule init";
    return 0
      if (! execute_command($cmd));

    on(1);print qq{OK\n};off();

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

    on(1);print qq{OK\n};off();

    return 1;
}


# ---------------------------------------------------------------------

=item G_push_origin_deployment

Description

=cut

# ---------------------------------------------------------------------
sub G_push_origin_deployment {
    my $app_dir = shift;

    print qq{Push local deployment branch + tags to origin ...\n};

    return 0
      if (! chdir_to_app_dir($app_dir));

    return 0
      if (! G_checkout_deployment($app_dir));

    my $cmd = "git push --tags origin deployment";
    return 0
      if (! execute_command($cmd));

    print qq{Push succeeds\n};

    return 1;
}


# ---------------------------------------------------------------------

=item G_list_tags

List tags known to the local repository.

=cut

# ---------------------------------------------------------------------
sub G_list_tags {
    my $num = shift;

    $num = $num ? $num : 3;

    my $cmd = qq{git for-each-ref --count=$num --sort='-taggerdate' --format='%09Tag: %(refname) %(*body)%0a%09%09Date: %(taggerdate)%0a%09Commit: %(*objectname) %0a%09%09Author: %(*authorname) %0a%09%09Date: %(*authordate) %0a' 'refs/tags'};

    my $list;
    if (execute_command_w_output($cmd, \$list)) {
        $list =~ s,refs/tags/,,g;
        if ($list) {
            return $list;
        }
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

    on(1);print qq{OK\n};off();

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

    my @app_dirs = ();

    if (! opendir(DIR, $app_root)) {
        on();print STDERR "ERROR: Could not read $app_root\n";off();
        exit 1;
    }

    @app_dirs = map { "$app_root/$_" } grep(! /^(\.|\..)/, readdir(DIR));
    closedir(DIR);

    return @app_dirs;
}

# ---------------------------------------------------------------------

=item chdir_to_app_dir

Description

=cut

# ---------------------------------------------------------------------
sub chdir_to_app_dir {
    my $app_dir = shift;

    if (! chdir($app_dir)) {
        on();print qq{ERROR: could not cd to $app_dir\n};off();
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

    print qq{$cmd\n}
      if ($ToolLib::VERBOSE);

    $ToolLib::VERBOSE ? print qx($cmd) : qx($cmd 1> /dev/null 2>&1);
    if ($?) {
        if ($ToolLib::VERBOSE) {
            on();print qq{ERROR: $?\ncmd=$cmd\n};off();
        }
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

    print qq{$cmd\n}
      if ($ToolLib::VERBOSE);

    $ToolLib::VERBOSE
      ? ($$output_ref = qx($cmd))
        : ($$output_ref = qx($cmd 2> /dev/null));
    if ($?) {
        if ($ToolLib::VERBOSE) {
            on();print qq{ERROR: $?\ncmd=$cmd\n};off();
        }
        return 0;
    }

    print $$output_ref
      if ($ToolLib::VERBOSE);

    return 1;
}


# ---------------------------------------------------------------------

=item get_HTDE_roots

Description

=cut

# ---------------------------------------------------------------------
sub get_HTDE_roots {
    my $test = shift;

    my $where;
    if ($test) {
        $where = 'test';
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

=item validate_clone_app

Make some reasonable checks to derermine the validity of cloning an app.

=cut

# ---------------------------------------------------------------------
sub validate_clone_app {
    my ($repo_root, $app_root, $app_repo, $app_dir) = @_;

    print qq{Validating application ($app) ... };

    if (! -e "$repo_root/$app_repo") {
        on();print qq{ERROR: no central repo: $repo_root/$app_repo does not exist\n};off();
        return 0;
    }
    if (-e "$app_dir") {
        on();print qq{ERROR: application appears to exist already under $app_dir\n};off();
        return 0;
    }

    on(1);print qq{OK\n};off();
    return 1;
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

    if (! -e "$repo_root/$app.git") {
        on();print qq{ERROR: '$app' is not a valid app: no central repo: $repo_root/$app.git does not exist\n};off();
        return 0;
    }
    if (! -e "$app_dir") {
        on();print qq{ERROR: '$app' is not a valid app: $app_dir does not exist\n};off();
        return 0;
    }
    if (! -e "$app_dir/.git") {
        on();print qq{ERROR: '$app' is not a valid app: $app_dir/.git does not exist\n};off();
        return 0;
    }
    if (! -e "$app_dir/bin/rdist.app") {
        on();print qq{ERROR: '$app' appears valid but: $app_dir/bin/rdist.app does not exist\n};off();
        return 0;
    }

    return 0
      if (! chdir_to_app_dir($app_dir));

    on(1);print qq{OK\n};off();

    return 1;
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

sub on {
    return unless $ENV{TERM};
    my $ok = shift;
    $ok ? print "\033[1;30m" : print "\033[1;31m";
}
sub off {
    return unless $ENV{TERM};
    print "\033[0m";
}

1;
