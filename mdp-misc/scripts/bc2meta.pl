#!/usr/bin/env perl

# Copyright 2005-6, The Regents of The University of Michigan, All Rights Reserved
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

# ----------  G L O B A L    V a r i a b l e s ----------
#

use strict;

# ----------------------------------------------------------------------
# Set up paths for local libraries -- must come first
# ----------------------------------------------------------------------
use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use Vendors;

# ----------  Perl packages ----------
use CGI;

# ----------  MDP Packages and globals ----------
use Utils;
use Debug::DUtils;
use Identifier;
use MdpGlobals;

# ---------------------------------------------------------------------
# Mirlyn host configuration dev vs. prod
#
my $gUseMirlynDevServer = $ENV{'HT_DEV'} ? 0 : 0;

my $gMirlynDevHost  = q{http://dev.mirlyn.lib.umich.edu:8998};
my $gMirlynProdHost = q{http://mirlyn-aleph.lib.umich.edu};

my $gMirlynHost = $gUseMirlynDevServer ? $gMirlynDevHost : $gMirlynProdHost;
                

# ---------------------------------------------------------------------
# Mirlyn base URLs sys & xserver
#
my $gMirlynXservBaseUrl = $gMirlynHost . q{/X};
my $gMirlynSysBaseUrl   = $gMirlynHost . q{/F};


# ----------------------------------------------------------------------
#  Mirlyn catalog link
#  --------------------------------------------------------------
#  NOTE: this needs to have &amp; used since Mirlyn cannot handle
#  semicolons and, since this string appears in the output XML
#  file, it can't have plain &s
#
my $gMirlynUrlParams = 
    q{?func=find-b&amp;find_code=MDN&amp;local_base=MIU01_PUB&amp;request=};
my $gMirlynLinkStem = $gMirlynSysBaseUrl . $gMirlynUrlParams;


# ----------------------------------------------------------------------
#  Mirlyn metadata fetch
#  --------------------------------------------------------------
#  NOTE: this script wraps a system script that takes parameters:
#  schema=oai_marc|marcxml (default is oai_marc) no_meta=1 (will only
#  return the document number)
#
my $gMirlynMetadataScriptQuery = 
    q{/cgi-bin/bc2meta?id=__METADATA_ID__;schema=oai_marc};
my $gMirlynMetadataURL = $gMirlynHost . $gMirlynMetadataScriptQuery;

# ----------------------------------------------------------------------
#  Mirlyn patron record fetch
#  --------------------------------------------------------------
#  NOTE: this XServer call returns the patron record
#
my $g_ssd_access_query_str = 
    q{?op=bor-info&bor_id=__UNIQNAME__&verification=__UNIQNAME__&loans=Y&cash=N&hold=N};
my $g_ssd_access_url = $gMirlynXservBaseUrl . $g_ssd_access_query_str;


## --------------------------------------------------
## This CGI takes an mdp id for a digitized item in Mirlyn
# (the "second call number" field, MDN) and, by making calls to
## the XServer, retrieves the item's OAI MARC XML metadata.
## --------------------------------------------------

my $gCgi = new CGI;

my $metadata = '';

my $gId = CheckParameters( $gCgi );

# create a user agent for making URL requests
my $gUserAgent = Utils::get_user_agent();

# Do first half of work requesting info from Aleph
my ( $setNumber, $numberOfEntries ) = 
    GetSetNumberFromAleph( $gMirlynXservBaseUrl, $gId );

# Do second half of work requesting info from Aleph
$metadata = 
    GetMetadataForSetNumber( $gMirlynXservBaseUrl, 
                             $setNumber, 
                             $numberOfEntries );

if ( $metadata !~ m,<doc_number>,s )
{
    Utils::silent_ASSERT(0, qq{ERROR in XServer: no doc_number for id: $gId});
}


binmode( STDOUT, ":utf8" );

print STDOUT $gCgi->header( -type    => 'text/xml',
                            -charset => 'UTF-8',
                          );

print STDOUT $metadata;

exit;

# ######################################################################
# ######################################################################

#       END MAIN

# ######################################################################
# ######################################################################


# ----------------------------------------------------------------------
# NAME         :
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub GetSetNumberFromAleph
{
    my ( $mirlynXservBaseUrl, $id ) = @_;

    my $url = GetSetNumberRequestUrl( $mirlynXservBaseUrl, $id );

    my $content = '';

    $content = GetContentFromUrl( $url, $gUserAgent );

    my ( $setNumber, $numberOfEntries ) = ParseSearchResults( \$content );

    return ( $setNumber, $numberOfEntries );
}

# ----------------------------------------------------------------------
# NAME         :
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub ParseSearchResults
{
    my $sRef = shift;

    my $setNumber = '';
    my $numberOfEntries = '';

    if ( $$sRef =~ m,<error>(.*?)</error>,s )
    {
        my $error = $1;
        Utils::silent_ASSERT(0, $error . qq{ from XServer for id="$gId"});
    }
    
    if ( $$sRef =~ m,<set_number>(.*?)</set_number>,s )
    {
        $setNumber = $1;
        Utils::silent_ASSERT($setNumber, qq{set_number not found for id=$"id"});
    }

    if ( $$sRef =~ m,<no_entries>(.*?)</no_entries>,s )
    {
        $numberOfEntries = $1;
    }

    return( $setNumber, $numberOfEntries );
}


# ----------------------------------------------------------------------
# NAME         :
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub GetMetadataForSetNumber
{
    my ( $xserverBaseUrl, $setNumber, $numberOfEntries ) = @_;

    my $url = &GetMetadataRequestUrl( $xserverBaseUrl, $setNumber, $numberOfEntries );

    my $content = '';

    $content = &GetContentFromUrl( $url, $gUserAgent );

    if ( $content =~ m,<error>(.*?)</error>,s )
    {
        my $error = $1;
        Utils::silent_ASSERT(0, $error . qq{ from XServer for set_number="$setNumber"});
    }

    return $content;
}


# ----------------------------------------------------------------------
# NAME         :
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub GetContentFromUrl
{
    my ( $url ) = @_;

    my $content = '';

    my $response = $gUserAgent->get( $url );

    Utils::silent_ASSERT($response->is_success, $response->message);
    
    $content = $response->content;
    use Encode;
    $content = Encode::decode_utf8($content);

    return $content;
}

# ----------------------------------------------------------------------
# NAME         :
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub GetMetadataRequestUrl
{
    my ( $xserverBaseUrl, $setNumber, $numberOfEntries ) = @_;

    my $url = $xserverBaseUrl . '?' .
        q{op=present&set_entry=000000001-} . $numberOfEntries . q{&set_number=} . $setNumber . q{&base=miu01};

    return $url;
}


# ----------------------------------------------------------------------
# NAME         :
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub BuildMirlynSysUrl
{
    my ( $mirlynSysBaseUrl, $sysNumber ) = @_;

    my $url = $mirlynSysBaseUrl . '?' .
        q{sys=} . $sysNumber . q{&base=miu01};

    return $url;
}

# ----------------------------------------------------------------------
# NAME         :
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub GetSetNumberRequestUrl
{
    my ( $mirlynXservBaseUrl, $id ) = @_;

    my $url = $mirlynXservBaseUrl . '?' .
        q{op=find&code=MDN&request=} . $id . q{&base=miu01};

    return $url;
}




sub CheckParameters
{
    my $cgi = shift;
    
    Utils::silent_ASSERT($cgi->param('id'), qq{No ID});
    Utils::silent_ASSERT(Identifier::validate_mbooks_id($cgi), qq{Invalid ID});
    
    return $cgi->param('id');
}

