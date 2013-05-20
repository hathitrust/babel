#!/usr/bin/perl -w
#$Id:  $#
use strict;
use Getopt::Long qw(:config auto_version auto_help);
use Pod::Usage;
use Date::Parse;
use Date::Calc;
use Time::HiRes;


# pod2usage settings
my $help = 0;
my $man = 0;




my $TIMEOUT=600; #This should match whatever was used so we report timeouts as taking 1 millisecond longer than the timeout.

my $TESTROBOT_IP='141.211.175.164'; #pilsner
my $DEV_IP='141\.211\.43\.191'; # tom ip

my $MAXTIME = 30000;# max number of milliseconds response time
my $MAX_MINUTES=60; # numbrer of minutes previous to current time to monitor
my $START_TIME;

#turn on timeouts and quiet by default
my $TIMEOUTS='true';
my $QUIET ='quiet';
my $Q_ONLY= '';
my $BRIEF;

#
my $rv=GetOptions(    'h|help|?'        =>\$help, 
                      'man'             =>\$man,
                      'm|maxtime:i'     =>\$MAXTIME,
                      'p|time_period:i' =>\$MAX_MINUTES,
                      's|start:s'       =>\$START_TIME,
                      'b|brief'         =>\$BRIEF,
                      
#                      'q|quiet'       =>\$QUIET,
#                      'qo|queryonly'       =>\$Q_ONLY,

                  );
#print usage if return value is false (i.e. problem processing options)
if (!($rv))
{
    pod2usage(1)
}
pod2usage(1) if $help;
pod2usage (-exitstatus=>0, -verbose =>2) if $man;

if ($MAX_MINUTES == 0)
{
    $MAX_MINUTES=60;
}


#======================================================================
# main
#======================================================================



if (!defined($START_TIME))
{
    $START_TIME=iso_Time('time');
}
else
{
    if ($START_TIME !~/\d\d\:\d\d\:\d\d/)
    {
        print STDERR "invalid format for START_TIME $START_TIME\n";
        pod2usage(1);
        exit;
    }
    
    
}

print STDERR "START_TIME is $START_TIME \n" if (! $BRIEF);

my $logfile;
# not yet used
my $logfh =getOutFH($logfile);
my $hashref={};
my $count=0;

while (<>)
{
    my $current_file =$ARGV;
    #XXX need to reset count if file changes
    
    chomp;

    my @junk;

    # handle STDIN
    if ($current_file eq "-")
    {
        # reading stdin so assume we used a grep across multiple files
        ($current_file, @junk) = split;
    }
    


    next if /$DEV_IP/;
    
    my $pl = parseLogLine($_);
        
    $pl->{'date'} = getDateFromFilename($current_file);
    
    
    $pl->{'linenum'} =$count;
    $count++;
    
    # for debugging  
    #    printHashref($pl);

    # put everything into a hash keyed by session+pid
        my $key = getKeys($pl);
        my $type = getType($pl);
        $hashref->{$key}->{$type}=$pl;
}



outputStats($START_TIME, $hashref);

#----------------------------------------------------------------------
#   sub outputStats
#
# input hash of hashes, key = $sessionid . $pid
# member hash keys = etime|q1|q2
# value = hash of log values
#----------------------------------------------------------------------
sub outputStats
{
    my $time = shift;   
    my $hashref =shift; # hash key = sessionid.pid
    my $allcount=0;
    my $allcount_over=0;
    
    my $count=0;
    my $over_count=0;
    
    foreach my $key (keys %{$hashref})
    {
        $allcount++;
        my $logEntry=$hashref->{$key};
        my $elapsed = $logEntry->{'etime'}->{'elapsed'};
        if (defined($elapsed))
        {
                            
            if (timeCheck($time,$MAX_MINUTES,$logEntry))
            {
                $count++;
                
                if ($elapsed ne "na" && $elapsed > $MAXTIME)
                {
                    $allcount_over++;
                    $over_count++;
                    if (! $BRIEF)
                    {
                        outputEntry($logEntry);
                    }
                }
                
            }
            else
            {
                if ($elapsed ne "na" && $elapsed > $MAXTIME)
                {
                    $allcount_over++;
                }
            }
        }
        else
        {
            print STDERR "no elapsed for pid  $logEntry->{'q1'}->{'pid'}\n";
        }
        
    }

    
    # Report
    
    my $MAX_TIME_SECONDS= int($MAXTIME/1000);
    
    #calc percentages
    my $percent;
    my $allpercent;
    # total for log
    if ($allcount > 0)
    {
        $allpercent= round(($allcount_over/$allcount) * 100);
    }
    
    # total for time period $current_time - $MAX_MINUTES    
    if ($count > 0)
    {
        $percent= round(($over_count/$count) * 100);
    }
    my $hours="0 hours";
    my $remainder;   
    if ($MAX_MINUTES >59)
    {
        $remainder=($MAX_MINUTES % 60);
        $hours=int ($MAX_MINUTES/60) . " hours and $remainder minutes";
    }
    
if (! $BRIEF)
{
    
    print "During time period $MAX_MINUTES minutes or $hours previous to current time $time \nover max=$over_count\nout of $count\n$percent\%\n";
}

print "Total queries today= $allcount\ntotal over $MAX_TIME_SECONDS seconds   $allcount_over\n"; 

print "Total percent over 30 seconds: $allpercent\%\n";
    
    
}

#----------------------------------------------------------------------

sub timeCheck
{
    my $time =shift;
    my $MAX_MINUTES=shift;
    
   #for debugging
#    $time='19:11:00';
    
    
    my $entry=shift;
    
    
    
    
    my $q1 = $entry->{'q1'};
    my $q2 = $entry->{'q2'};
    my $elapsed = $entry->{'etime'}->{'elapsed'};


    my $q_time = $q1->{'time'}||$q2->{'time'};

    if (!defined($q_time))
    {
        if ($elapsed > $MAXTIME)
        {
           #only bother to report lack of q_time if elapsed over maxtime
            print STDERR "$elapsed| no q_time for PID  $entry->{'etime'}->{'pid'}\n";
        }
    }
    else
    {

        if (defined($elapsed) && $elapsed ne "na" )
        {
            my ($hr,$min,$sec)=split(/\:/,$time);
            my ($entry_hr,$entry_min,$entry_sec)=split(/\:/,$q_time);
            my $minutes= (60 * $hr) + $min;
            my $entry_minutes = (60 *$entry_hr) + $entry_min;
         
            my $diff=$minutes - $entry_minutes;
            if ($diff < 0)
            {
               # print STDERR "current time before log time\n";
            }
            
            
            # does this work with 24 hr clock?
            if ( $diff < $MAX_MINUTES && $diff > 0 )
            {
                return "true";
            }
            else
            {
                return undef;
            }
        }
        else
        {
            return undef; 
        }
    }
}

    #----------------------------------------------------------------------
sub outputQuery 
{
    my $entry = shift;
    my $query   =  $entry->{'q1'}->{'query'};
    print "$query\n";
}
#----------------------------------------------------------------------
sub outputEntry
{
    my $entry = shift;
    
    # query|qtime1|qtime2|elapsed|apphost
    my $query   =  $entry->{'q1'}->{'query'};
    my $qtime1  = $entry->{'q1'}->{'qtime'};
    my $qtime2  = $entry->{'q2'}->{'qtime'};
    my $elapsed = $entry->{'etime'}->{'elapsed'};
    my $apphost ="na";
   # my ($start,$rows,$nextpage) = getPaging($entry);
    
    $apphost = $entry->{'q1'}->{'apphost'};
    my $pid     = $entry->{'q1'}->{'pid'};
   
    my @output;
    
    # check for missing either elapsed or qtimes
    # seems to be either elapsed no qtimes or vice versa.
    if (!defined ($elapsed))
    {
        $elapsed = "na";
        print STDERR "missing elapsed for pid $entry->{'q1'}->{'pid'}\n" if (!$QUIET);
    }
    
    if (!defined ($qtime1))
    {
        $qtime1 = "na";
        print STDERR "missing q1 time  for pid $entry->{'etime'}->{'pid'}\n"if (!$QUIET);
    }
    if (!defined ($qtime2))
    {
        $qtime2 = "na";
        print STDERR "missing q2 time  for pid $entry->{'etime'}->{'pid'}\n"if (!$QUIET);
    }


    

#    my @out     = ($elapsed, $query,$qtime1,$qtime2, $apphost, $pid);
    my @out     = ($elapsed, $query,$qtime1,$qtime2);
#    my @out     = ($elapsed, $query,$start,$rows, $qtime1,$qtime2);
    
    if ($TIMEOUTS)
    {
        if (defined($elapsed) && $elapsed ne "na" && $elapsed > $MAXTIME)
        {
            #            dumpEntry($entry);
            my $aryref = getAddInfo($entry);
            push (@out, @{$aryref});
            
            #XXX cheat here
          #  @out = ($entry->{q1}->{'time'},@out);
        }
    }
    
                
            # this is temp workaround  If both qtime lines are missing we are probably missing any other variables
            foreach my $value (@out)
            {
                if (!defined $value)
                {
                    $value = "na";
                    my $linenum = $entry->{'q1'}->{'linenum'};
                    if (!defined ($linenum))
                    {
                        $linenum="no linenum avail";
                    };
            
                    print STDERR "some message about undefined value starting with q1 line $linenum goes here\n" if (!$QUIET);
                }
                else
                {
        }
                push (@output, $value);
                
            }
        #XXX fix this duplication!!!
        if ($TIMEOUTS)
        {
       if (defined($elapsed) && $elapsed ne "na" && $elapsed > $MAXTIME)
            {
                
                my $out = join("|",@output);
                print "$out\n";
            }
        }
        
        else
        {
            my $out = join("|",@output);
            print "$out\n";
            
        }
    
    
}
#----------------------------------------------------------------------
sub getAddInfo
{
    my $entry = shift;
    my $q1 =$entry->{'q1'};
    my $q2 =$entry->{'q2'};
    my $e =$entry->{'etime'};
    my $head=$q1->{'head'};
    my $date = $entry->{'q1'}->{'date'};
    my $time=$q1->{'time'};
    my $apphost = $q1->{'apphost'};
    
   # my $head=$q1->{''};
   # my $head=$q1->{''};
    my @add=($date, $time, $apphost, $head);
    return \@add;     
}

#----------------------------------------------------------------------
sub dumpEntry
{
    my $entry = shift;
    my $q1 =$entry->{'q1'};
    my $q2 =$entry->{'q2'};
    my $e =$entry->{'etime'};
    print "\n\n======================================\n";
    
    print "q1\n";
    printHashref($q1);
    print "q2\n";
    printHashref($q2);
    print "elapsed\n";
    printHashref($e);
    
}

#----------------------------------------------------------------------
sub getPaging
{
    my $entry = shift;
    
    my $start =0;
    my $rows;
    my $nextpage;
    
    if (!defined ($entry->{'q1'}->{'rows'}))
    {
        printHashref($entry->{'q1'});
        die "bad q1";
        
             
    }
    
    if ($entry->{'q1'}->{'rows'} > 0)
    {
        $rows  = $entry->{'q1'}->{'rows'};
        $start = $entry->{'q1'}->{'start'};
    }
    else
    {
        $rows  = $entry->{'q2'}->{'rows'};
        $start = $entry->{'q2'}->{'start'};
    }
    if ($start > 0)
    {
        $nextpage="nextpage";
    }
    return ($start,$rows,$nextpage);
    
}

#----------------------------------------------------------------------
sub parseLogLine

{
    my $line=shift;
    my $log={};
    my @params;
    my $params;
    my $server;
    my $phash; # parameter hash
    my $junk;
    my $junk2;
    my $elapsed;
    
    # Need to deal with PID when change gets made to production and 
    #XXX  should have robust way of dealing with previous format!

    if ($line =~/url=/)
    {
            
        #new format around 9-26-09
#        ($log->{'ip'},$log->{'ses'},$log->{'time'},$log->{'qtime'},$log->{'numfound'},$log->{'url'}) = split(/\s+/,$line);

       ($log->{'ip'},$log->{'ses'},$log->{'pid'},$log->{'time'},$log->{'qtime'},$log->{'numfound'},$log->{'url'}) = split(/\s+/,$line);


       my $hashref = parseURL($log->{'url'});
       $phash=parseParams($hashref->{'params'});
       my $queryMess = $phash->{'q'};
       my $query = extractFromDismax($queryMess);
       
       if (! defined ($query))
       {
           $query="undef bug";
           
       }
       
        $log->{'query'}= normalizeQuery($query);
        $log->{'head'} = $hashref->{'head'};
       $log->{'start'} = $phash->{'start'};
       $log->{'rows'} =  $phash->{'rows'};
       #XXX why not just store phash on $log
       # better yet lets make a logentry object!


        # fix qtime
        my $qtime;
        ($junk,$qtime)=split(/\=/,$log->{'qtime'});
        $log->{'qtime'}= int(1000 * $qtime);  #convert back to milliseconds
        
        #fix numfound
        ($junk,$log->{'numfound'})=split(/\=/,$log->{'numfound'});
    }
    else
    {
#/2010/bancha/q-2010-01-28.log:141.211.175.164 24b7b990d8e595644b30a7836955c9ef 12:11:40 total elapsed=3.56 sec. 
#        ($log->{'ip'},$log->{'ses'},$log->{'time'},$junk,$elapsed,$junk2) = split(/\s+/,$line);
        ($log->{'ip'},$log->{'ses'},$log->{'pid'},$log->{'time'},$junk,$elapsed,$junk2) = split(/\s+/,$line);
        ($junk,$log->{'elapsed'})=split(/\=/,$elapsed);
        #convert to milliseconds
        $log->{'elapsed'}=int($log->{'elapsed'} * 1000);
    }
    
# clean ip and add bancha/lassi
    if ($log->{'ip'}=~/\:/)
    {
        my ($file,$ip) = split(/\:/,$log->{'ip'});                             
        if ($file =~/moxie/)
        {
            $log->{'apphost'}='MACC';       
        }
        else
        {
            $log->{'apphost'}='ICTC';       
        }
    }
    
    
    return $log;
    
}
#----------------------------------------------------------------------


sub extractFromDismax
{
    #'0.9'+}+derrida+and+husserl"&foo
    my $qmess=shift;
    my $q="undef debug";
    
    if ($qmess =~/9\'\+\}([^&]+)/)
    {
        $q=$1;
        # remove trailing quote
        $q=~s/"$//;
        # change escaped quotes to quotes
        $q=~s/\\\"/\"/g;

    }
    else
    {
        # pre-dismax parsing
        $q= $qmess;
    }
    
    return $q;
}

#----------------------------------------------------------------------
sub getDateFromFilename{
    my $current_filename=shift;
    my $date;
    
    if ($current_filename =~/q-20(10|11)-(\d+-\d+)/)
    {
        $date = "20" . $1 ." " . $2;
    }
    return $date;
}

#----------------------------------------------------------------------
sub getKeys
{
    my $pl = shift;
    my $key= $pl->{'ses'}. $pl->{'pid'};
    return $key;
    
}
#----------------------------------------------------------------------
#
#  sub getType
#
# q1 is the first query. It appears that the app does a 0 row query first in time
# this needs to be confirmed.  Check app for logic of primary query 
#----------------------------------------------------------------------
sub getType
{
    my $pl = shift;
    my $url=$pl->{'url'};
    my $type;
    
    if (defined ($pl->{'elapsed'}))
    {
        $type='etime';
    }
    elsif ($url =~/rows=0/)
    {
        $type='q1';
    }
    else
    {
        $type='q2';
    }
    return $type;
}
#----------------------------------------------------------------------
sub getInFH{
    my $Filename = shift;
    my $in;
    
    if ($Filename)
    {
        open ( $in,'>>',$Filename) or die "couldn't open input file $Filename $!";
    }
    else
    {
        open ( $in,'>-') or die "couldn't open $Filename file STDIN $!";
    }
    return $in;
}
#----------------------------------------------------------------------

sub getOutFH{
    my $Filename = shift;
    
    my $out;
    
    if ($Filename)
    {
        open ( $out,'>>',$Filename) or die "couldn't open output file $Filename $!";
    }
    else
    {
        open ( $out,'>-') or die "couldn't open output file STDOUT $!";
    }
    return $out;
}

#-------------------------------------------------------------------

sub parseURL
{
    my $url = shift;
    my $hash={};
    my $server;
    my @rest;
    
    ($server,@rest)= split (/\?/,$url);
    $hash->{'params'}=join('?',@rest);
    $hash->{'head'}=getHead($server);
    return $hash;
}
#-------------------------------------------------------------------
sub parseParams
{
    my $params=shift;
    my $phash={};
    # remove empty params
    $params=~s/\&\&/\&/g;
    

    my @params=split(/[&;]/,$params);
    foreach my $p (@params)
    {
        my ($key,@rest)=split(/=/,$p);# should check that there is an equals in p or else below gives undef
        my $value=join('=',@rest);
        $phash->{$key}=$value;
        #        print "$key $value\n";
    }

    return $phash;
}
#-------------------------------------------------------------------
sub normalizeQuery
{
    my $q=shift;
#   print "debug query=$q\n";
    #routine to decode hex percent encoded characters
    $q =~ s/%([0-9A-Fa-f]{2})/chr(hex($1))/eg;
    $q =~s/\+/ /g;
    $q =~s/%20/ /g;
    $q =~s/%22/\"/g;
    # replace "+" with spaces
   #WARNING what about the plus operator in a query
  
    $q=~s/\+/ /g;
    

    # are plus  logged?
    #are minuses logged
    return $q;
}
#-------------------------------------------------------------------
sub getHead
{
    my $server = shift;
    if ($server =~/serve-([0-9]+)/)
    {
        return $1;
    }
    else
    {
        return "head format unknown";
    }
}
#-------------------------------------------------------------------
sub printHashref
{
    my $ref=shift;
    foreach my $key (sort (keys %{$ref}))
    {
        print "$key\t$ref->{$key}\n"
    }
    print "\n---\n";
    
} 


#-------------------------------------------------------------------
sub ipLocal
{
    my $ip =shift;
    if ($ip=~/141\.211\.43\./)
    {
         return "true";
     }
    else
    {
        return 0;
    }
    
}
#-------------------------------------------------------------------



sub iso_Time {
    my $num_args = scalar(@_);

    my ($what, $time);

    if ($num_args == 0) {
        $what = 'datetime';
    }
    elsif ($num_args == 1) {
        $what = shift;
    }
    elsif ($num_args == 2) {
        ($what, $time) = @_;
    }

    $time = time if (! defined($time));
    my @time = localtime($time);
    #  0    1    2     3     4    5     6     7     8
    # ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst)
    my $zon = $time[8] ? 'EDT' : 'EST';
    my $yea = sprintf("20%02d", $time[5] - 100);
    my $mon = $time[4] + 1;
    my $day = $time[3];
    my $hou = $time[2];
    my $min = $time[1];
    my $sec = $time[0];

    my $include_zone = 0;
    if ($what =~ m,^z,) {
        $include_zone = 1;
        $what =~ s,^z,,;
    }

    my $isoTime;
    if ($what eq 'date') {
        $isoTime = sprintf("%4d-%02d-%02d", $yea, $mon, $day);
    }
    elsif ($what eq 'time') {
        $isoTime = sprintf("%02d:%02d:%02d", $hou, $min, $sec);
        $isoTime .= " $zon" if ($include_zone);
    }
    elsif  ($what eq 'datetime') {
        $isoTime = sprintf("%4d-%02d-%02d %02d:%02d:%02d", $yea, $mon, $day, $hou, $min, $sec);
        $isoTime .= " $zon" if ($include_zone);
    }
    elsif  ($what eq 'sdt') {
        $isoTime = sprintf("%4d-%02d-%02d_%02d:%02d:%02d", $yea, $mon, $day, $hou, $min, $sec);
        $isoTime .= "_$zon" if ($include_zone);
    }

    return $isoTime;
}



#----------------------------------------------------------------------
sub round
{
    my $number = shift;
    my $rounded;

    if ($number <=9||$number =~/[eE]/) # if perl sees 1.233e+10 it thinks its a string so this will correctly convert and round it
    {
        $rounded = sprintf("%.2f", $number);
    }
    else
    {

        # see page 47 cookbook for better algortihm using ciel of floor
        return int($number);
    }
    

    return $rounded;
}


__END__

=head1 SYNOPSIS

monitorElapsed.pl [options] 

report elapsed time and query metadata for queries with response time 
over $MAXTIME (default is 30,000 ms = 30 seconds)for period starting with current time 
report summary statistics for period and for entire log

   monitorElapsed.pl -s 15:00:00   q-2013-03-30.log

monitorElapsed.pl --man    Full manual page

=head1 Options:

=over 8

=item B<-s>

START TIME: format HH:MM:SS
default = current time


=item B<-p,--time_period>  

Time period to monitor in minutes previous to start time.
Default = 60 minutes prior to start time


=item B<-m,--maxtime> F<integer (number of milliseconds)>

number of milliseconds for $MAXTIME. Report only queries where etime >=$MAXTIME
default = 30 seconds (30,000 ms)

=item B<-b,--brief>

report only total time statistics in entire file
suppress display of queries and statistics during time period

=item B<-h,--help>

Prints this help


=item B<--version>

Prints version and exits.

=back

=head1 DESCRIPTION

B<This program reads a specified query log and produces tab delimited output consolidating qtime and etime data>

=head1 ENVIRONMENT

=cut
