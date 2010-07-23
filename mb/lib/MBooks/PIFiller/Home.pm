package MBooks::PIFiller::Home;

=head1 NAME



=head1 DESCRIPTION

This class is a dummy class that would implement the PI handlers for the ACTION_DISP_PAGE page=home action if
there were any PI handlers.  

=head1 SYNOPSIS

See coding example in base class PIFiller

=head1 METHODS

=over 8

=cut

use strict;

use PIFiller;

use base qw(PIFiller);


BEGIN
{
    require "PIFiller/Common/Globals.pm";
    require "PIFiller/Common/Group_HEADER.pm";
}



# ---------------------------------------------------------------------

=item handle_CATEGORIES_PI :  PI_handler(CATEGORIES)

is user logged in?  emits javascript that returns true or false

=cut

# ---------------------------------------------------------------------
sub handle_CATEGORIES_PI
    : PI_handler(CATEGORIES)
{
    my ($C, $act, $piParamHashRef) = @_;
    
    my $Content = qq{<span class="label">Categories Content goes here</span>};
    $Content .= '<br></br>' . "\n" . get_lorum();    
    return $Content;
}

# ---------------------------------------------------------------------

=item handle_

fsfsdf

=cut

# ---------------------------------------------------------------------
sub handle_SCHEDULE_PI
    : PI_handler(SCHEDULE)
{
    my ($C, $act, $piParamHashRef) = @_;
    
    my $Content = qq{<span class="label">Schedule Content goes here</span>};
        $Content .= '<br></br>' . "\n" . get_lorum();    
    return $Content;
}



# ---------------------------------------------------------------------

=item handle_FEATURED_ITEM_POS_PI :  PI_handler(FEATURED_ITEM_POS)

is user logged in?  emits javascript that returns true or false

=cut

# ---------------------------------------------------------------------
sub handle_FEATURED_ITEM_POS_PI
    : PI_handler(FEATURED_ITEM_POS)
{
    my ($C, $act, $piParamHashRef) = @_;
    my $config = $C->get_object('MdpConfig');
    my $MAX_NUMBER = $config->get('number_featured_items');
    
    #return number
    my $number = int(rand($MAX_NUMBER))+1;
    return $number;
}

# ---------------------------------------------------------------------

=item handle_MTAGS_PI :  PI_handler(MTAGS)

is user logged in?  emits javascript that returns true or false

=cut

# ---------------------------------------------------------------------
sub handle_MTAGS_PI
    : PI_handler(MTAGS)
{
    my ($C, $act, $piParamHashRef) = @_;
    
    my $Content = qq{<span class="label">Mtags Content goes here</span>};
    $Content .= '<br></br>' . "\n" . get_lorum();    

    
    return $Content;
}


# ---------------------------------------------------------------------

=item handle_MBOOKS_NEWS_PI :  PI_handler(MBOOKS_NEWS)

is user logged in?  emits javascript that returns true or false

=cut

# ---------------------------------------------------------------------
sub handle_MBOOKS_NEWS_PI
    : PI_handler(MBOOKS_NEWS)
{
    my ($C, $act, $piParamHashRef) = @_;
    
    my $Content = qq{<span class="label">MBooks_News Content goes here</span>};
    $Content .= "\n   " . get_lorum()     ;
        return $Content;
}

# ---------------------------------------------------------------------

=item handle_BLOG_PI :  PI_handler(BLOG)

is user logged in?  emits javascript that returns true or false

=cut

# ---------------------------------------------------------------------
sub handle_BLOG_PI
    : PI_handler(BLOG)
{
    my ($C, $act, $piParamHashRef) = @_;
    
    my $Content = qq{
<div class="blog">
<script language="JavaScript" src="http://www.lib.umich.edu/javascript/feed2js/feed2js.php?src=http%3A%2F%2Fmblog.lib.umich.edu%2Fblt%2Fmbooks.xml&amp;chan=y&amp;date=y&amp;css=LITFEED&amp;html=a" type="text/javascript"></script>

<noscript>
<a href="http://www.lib.umich.edu/javascript/feed2js/feed2js.php?src=http%3A%2F%2Fmblog.lib.umich.edu%2Fblt%2Fmbooks.xml&amp;chan=y&amp;date=y&amp;css=LITFEED&amp;html=y">View RSS feed</a>
</noscript>
</div>
};
    
    
    return $Content;
}

# ---------------------------------------------------------------------

sub get_lorum
{
    # No fun jokes all lorem ipsum
    my @lorum = 
        (
         "Suspendisse vel ligula. In congue mollis dui. Fusce ligula ligula, accumsan id, ultricies nec, lobortis sit amet, risus. Aliquam tincidunt urna id erat. Mauris sed erat. Donec volutpat porta quam. Nulla congue, quam eget consequat facilisis, nisi elit euismod augue, vitae sodales ligula sem id erat. Phasellus rutrum.",
         
         " Aliquam erat volutpat. Phasellus quis orci in nibh vulputate ornare. Vestibulum aliquam enim sit amet lacus. Duis ac est. Suspendisse lacinia porta massa. Proin massa. Vestibulum elementum nunc id augue. Mauris et risus at massa fringilla ullamcorper. Curabitur aliquet ante sit amet tortor iaculis pretium."
         ,
         "Vivamus auctor, velit at vehicula vestibulum, quam libero placerat velit, id dignissim libero risus ac metus. Mauris consectetuer consequat magna. Pellentesque aliquam quam ut sem. Integer dignissim semper dolor. Fusce ut purus in nunc mollis mollis."
         ,
         " Nunc elit. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.",
         " Duis volutpat, urna a imperdiet ornare, magna augue eleifend lectus, nec feugiat eros ipsum posuere nisl. Mauris erat.",
         
         "Quisque imperdiet vestibulum orci. Suspendisse ac risus a ante porttitor varius. Vivamus ornare enim ut mi. Nulla facilisi. Nulla facilisi. Suspendisse neque nibh, dignissim sed, venenatis at, lacinia sed, tortor. Pellentesque at orci blandit mi interdum semper. Mauris purus lacus, aliquet vel, dapibus vel, sodales elementum, ipsum.",
         
         "Morbi eget purus in erat blandit lacinia. Duis sem. Pellentesque pellentesque, risus vitae volutpat facilisis, mi mi tincidunt nunc, ut sagittis tortor tortor vitae ipsum.",

         "Etiam ultrices fringilla leo. Vivamus cursus. Fusce venenatis lacus non turpis.",

         " In ut odio ac mi convallis condimentum. Integer venenatis ultricies sapien. Fusce ut risus. Praesent suscipit risus bibendum quam. Nullam magna nulla, venenatis et, blandit sit amet, pulvinar at, leo. Donec quis leo in enim placerat sodales.",
         
         "Etiam arcu lorem, faucibus vitae, convallis nec, cursus ut, libero. Fusce nulla justo, mattis sit amet, tincidunt in, tempus ut, lorem. Mauris venenatis hendrerit magna.",
" Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.",

         " Vivamus porttitor accumsan justo. Nulla eleifend imperdiet ipsum. Nulla dictum diam in erat. In vitae purus eget eros suscipit consectetuer. Sed sed lectus iaculis sapien ultrices lacinia. Nullam et massa. Mauris volutpat."
        );

    my $num = int(rand(scalar(@lorum)));
    return $lorum[$num];
}


# ---------------------------------------------------------------------

1;

__END__

=head1 AUTHORS

Tom Burton-West, University of Michigan, tburtonw@umich.edu
Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2007 ©, The Regents of The University of Michigan, All Rights Reserved

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject
to the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

=cut
