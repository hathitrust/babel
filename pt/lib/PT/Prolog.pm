package PT::Prolog;

# Copyright 2007, The Regents of The University of Michigan, All Rights Reserved
#
# Permission is hereby granted, free of charge, to any person obtaining
# a copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject
# to the following conditions:
#
# The above copyright notice and this permission notice shall be
# included in all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
# IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
# CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
# TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

use CGI;

# ----------  MBooks Lib related ----------
use Utils;
use App;
use Access::Rights;
use Collection;
use CollectionSet;
use Session;
use Auth::Auth;
use MdpConfig;

# Pageturner specific
use PT::Bind;
use PT::Action;
use PT::MdpItem;
use PT::PageTurnerUtils;

# Return codes from ValidityChecks()
use constant ST_EMPTY            => 0;
use constant ST_SEQ_NOT_SUPPLIED => 1;

my $C;

sub new
{
    my $class = shift;

    my $self = {};
    bless $self, $class;

    return $self;
}


sub GetContext
{
    my $self = shift;
    return $C;
}

# ---------------------------------------------------------------------
#
#  Code shared between pt and ptsearch and ssd
#
# ---------------------------------------------------------------------
sub Run {
    my $self = shift;
    my ($validityCheckRoutine, $app_name) = @_;

    $C = new Context;

    # CGI -- order matters
    my $cgi = new CGI;    

    $C->set_object('CGI', $cgi);

    Utils::clean_cgi_params( $cgi );
    my $validityCheckStatus = &{$validityCheckRoutine}( $cgi );

    # App
    my $app = new App($C, $app_name);
    $C->set_object('App', $app);

    # MBooks App configuration -- order matters
    my $config = new MdpConfig(
                               Utils::get_uber_config_path($app_name),
                               $ENV{SDRROOT} . "/$app_name/lib/Config/global.conf",
                               $ENV{SDRROOT} . "/$app_name/lib/Config/local.conf"
                              );
    $C->set_object('MdpConfig', $config);

    # Database connection -- order matters
    my $db = new Database($config);
    $C->set_object('Database', $db);

    # Session -- order matters
    my $ses = Session::start_session($C);
    $C->set_object('Session', $ses);

    # Minimal bindings to take advantage of virtual stylesheets
    my $g_bindings = $ENV{SDRROOT} . "/$app_name/lib/Config/bindings.pl";
    my $ab = new PT::Bind($C, $g_bindings);
    $C->set_object('Bind', $ab);

    # Auth
    my $auth = new Auth::Auth($C);
    $C->set_object('Auth', $auth);

    # Action subclass for pageturner
    my $act = new PT::Action($C);
    $C->set_object('Action', $act);

    PT::PageTurnerUtils::Debug( $cgi, $ses );

    my $id = $cgi->param( 'id' );

    # Tests for ssd user access
    $self->SSD_user_login_trap($C, $id);
    # POSSIBLY NOTREACHED

    my $dbh = $db->get_DBH();
    my $user_id = $auth->get_user_name($C);

    my $co = new Collection($dbh, $config, $user_id);
    $C->set_object('Collection', $co);

    my $cs = new CollectionSet($dbh, $config, $user_id);
    $C->set_object('CollectionSet', $cs);

    $act->set_transient_facade_member_data($C, 'collection_object', $co);
    $act->set_transient_facade_member_data($C, 'collection_set_object', $cs);

    # Find where this item's pages and METS manifest are located
    my $itemFileSystemLocation = Identifier::get_item_location($id);

    # Determine access rights and store them on the MdpItem object
    $ar = new Access::Rights($C, $id);
    $C->set_object('Access::Rights', $ar);

    # MdpItem is instantiated if it cannot be found  already cached on the session object.
    $mdpItem = PT::PageTurnerUtils::GetMdpItem($C, $id, $itemFileSystemLocation);
    $C->set_object('MdpItem', $mdpItem);

    # Support for starting at the title page
    if ( $validityCheckStatus & PT::Prolog::ST_SEQ_NOT_SUPPLIED ) {
        SetDefaultPage( $cgi, $mdpItem );
    }

    # Emit OWNERID if debug=ownerid. No-op otherwise
    PT::PageTurnerUtils::_get_OWNERID($C, $id);
}

# ----------------------------------------------------------------------
# NAME         : SetDefaultPage
# PURPOSE      :
# NOTES        : Force page to title page or first TOC page
#                if page-level metadata is available
# ----------------------------------------------------------------------
sub SetDefaultPage {
    my ( $cgi, $mdpItem ) = @_;
    
    my $seq;
    if ( $seq = $mdpItem->HasTitleFeature()) {
        $cgi->param('seq', $seq );
    }
    elsif ($seq = $mdpItem->HasTOCFeature()) {
        $cgi->param('seq', $seq );
    }
}


# ----------------------------------------------------------------------
# NAME         : SSD_user_login_trap
# PURPOSE      :
# NOTES        : Force login in ssd cases
# ----------------------------------------------------------------------
sub SSD_user_login_trap {
    my $self = shift;

    my ($C, $id) = @_; 

    my $force_login = 0;

    my $logged_in = $C->get_object('Auth')->is_logged_in();
    my $ssd_requested = $C->get_object('CGI')->param('ssd');
    
    # SSD user access requires the user to be authenticated
    if ($ssd_requested) {
        $force_login = (! $logged_in);
    }

    if ($force_login) {
        # Force login to get identity for further validation
        my $login_url = $C->get_object('CGI')->self_url();
        $login_url = Utils::url_over_SSL_to($login_url);
        my $login_cgi = new CGI('');
        print $login_cgi->redirect($login_url);
        exit;
    }
}


1;
