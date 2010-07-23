package MBooks::Operation::Test::Test;

#$Id: Test.pm,v 1.3 2007/11/01 20:57:39 tburtonw Exp $#
use Collection;
use AccessRights;



use base (Test::Class, MBooks::Operation::Test::OperationTestFixture);
#use base  (Test::Class, MBooks::TestFixture);
use Test::More;
#require ('setup-teardown.pl');

#@ISA =(MBooks::Operation::Test::MdpTestBase.pm);

#Move this to invoking program
my $DEBUG="true";
#$DEBUG=undef;

my $VERBOSE=undef;
$VERBOSE="true";

my $VERBOSE_ASSERTS=undef;
#$VERBOSE_ASSERTS="true";



#====================================================================
#   new               
#   copy_items        x  op and web (but needs to test status messages)
#   delete_items    
#    delete_one_item  x  op and web
#    delete_several_items x op and web
#   move_items     x two ops and web
#   list_items       
#     sort           
#     slice   
#     limit_to_full_text            
#   edit_status      
#   edit_description 
#   edit_coll_name   
#   create_or_update_item_metadata 
#   _get_item_id_from_extern_id? 
#   coll_owned_by_user
#   item_exists 
#  item_in_collection 
#=====================================================================
# Actual tests
#---------------------------------------------------------------------

sub testNew:Test(2)
{
    my $self=shift;
    my $co=$self->{co};
    
    diag("testing constructor new") if $VERBOSE;
    
    my @methods=qw (new );
    
    isa_ok($co, Collection);
    can_ok($co,@methods);
    
}



#----------------------------------------------------------------------
sub copy_items:Test(no_plan)
{
    my $self = shift;
    $self->do_copy_items();
    
}

sub copy_items_op:Test(no_plan)
{
    my $self = shift;
    $self->do_copy_items('op');
    
}
sub copy_items_web:Test(no_plan)
{
    my $self = shift;
    $self->do_copy_items('web');
    
}


#------------------------------------------------------------
sub do_copy_items
{
    my $self = shift;
    my $flag=shift;
      
    my $to_coll_id = 11;
    my $coll_id = 11;
    my $item_id_ref = [1,7];
    
    diag("testing  copy_items ") if $VERBOSE;
    #Check state before EXECUTE
    foreach my $item_id (@{$item_id_ref})
    {
        ok (! $self->item_in_collection($item_id,$to_coll_id),qq{before copy_items called: item $item_id is not in collection $to_coll_id});
    }
   
    #EXECUTE after specific setup
    $self->do_copy_items_setup_and_exec($flag,$coll_id,$to_coll_id,$item_id_ref);
    
    #VERIFY
    foreach my $item_id (@{$item_id_ref})
    {
        ok ( $self->item_in_collection($item_id,$to_coll_id),qq{after copy_items called: item $item_id is  in collection $to_coll_id});

    }
    
}
#----------------------------------------------------------------------
sub do_copy_items_setup_and_exec
{
    my $self=shift;
    my $flag=shift;
    my $coll_id = shift;
    my $to_coll_id = shift;
    my $item_id_ref = shift;
    my $action='copyit';

    if ($flag eq 'op')
    {
         diag("testing Operation: copy_items ") if $VERBOSE;
        my $C = $self->get_context();
         if ($DEBUG)
        {
        
            isa_ok($C,Context);    
        }

        my $temp_cgi = $C->get_object('CGI');
        $temp_cgi->param('a',"$action");
        $temp_cgi->param('c',"$coll_id");
        $temp_cgi->param('c2',"$to_coll_id");
        $temp_cgi->param('id',(@{$item_id_ref}));
        $C->set_object('CGI', $temp_cgi);

        my $attr_ref = $self->setup_operation($C);
        my $CopyItems = new MBooks::Operation::CopyItems($attr_ref);

         if ($DEBUG)
        {
            isa_ok($CopyItems, MBooks::Operation::CopyItems);
            #check cgi
            my $testCGI=$C->get_object('CGI');
            is ($testCGI->param('c'),11,qq{cgi coll param ok});
        }
    
        #EXECUTE
        my $status= $CopyItems->execute_operation($C);
        #WARNING!!   should test for status here
    #    is ($status,'0',"status from copy items is 0 ok success");
    
    }
    
    elsif($flag eq 'web')
    {
        diag("testing Web: copy_items") if $VERBOSE;
        # set up the Operation object with correct cgi params etc
        # this should be member data setup in startup!!!
        my $base_url='tburtonw.dev.umdl.umich.edu/cgi/m/mdp/mb';
        my $temp_cgi = new CGI ();
        
        $temp_cgi->param('a',"$action");
        $temp_cgi->param('c',"$coll_id");
        $temp_cgi->param('c2',"$to_coll_id");
        $temp_cgi->param('id',(@{$item_id_ref}));
        $temp_cgi->param('debug',"usetesttbl");
        my $url = $temp_cgi->self_url;
        $url =~s,localhost,$base_url,;
        
        if ($DEBUG)
        {
            diag "url is $url\n";
        }
        
        my $mech= Test::WWW::Mechanize->new;
        #EXECUTE
        $mech->get_ok($url);
             
    }

    else{
            diag("testing collection object copy_items") if $VERBOSE;
            my $co = $self->{co};
            $co->copy_items($coll_id,$item_id_ref);
    }
}

#----------------------------------------------------------------------
sub ASSERT_coll_not_owned_by_user_copy_items # :Test(no_plan)
{
    my $self=shift;
    my $co=$self->{co};
    diag("testing ASSERT_coll_not_owned_by_user_copy_items") if $VERBOSE;
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
    $coll_id = 9; #diabob
    my $item_id_ref = [1,7];
  
    my $method_ref = sub {$co->copy_items(@_)};
    my $arg_ref = [$coll_id, $item_id_ref];
    
    $self->ASSERT_test($method_ref,$arg_ref);

}
#----------------------------------------------------------------------
#----------------------------------------------------------------------
sub ASSERT_one_item_not_in_database_copy_items # :Test(1)
{
    my $self=shift;
    my $co=$self->{co};
    diag("testing ASSERT  item not in database_copy_items") if $VERBOSE;
    $coll_id = 11; #tburtonw
    my $item_id_ref = [666];
  
    my $method_ref = sub {$co->copy_items(@_)};
    my $arg_ref = [$coll_id, $item_id_ref];
    
    $self->ASSERT_test($method_ref,$arg_ref);

}

#----------------------------------------------------------------------
#----------------------------------------------------------------------
sub ASSERT_one_item_in_and_1_not_in_database_copy_items # :Test(1)
{
    my $self=shift;
    my $co=$self->{co};
    diag("testing ASSERT  one item in and one item not in database_copy_items") if $VERBOSE;
    $coll_id = 11;# tburtonw
    my $item_id_ref = [1,666];
  
    my $method_ref = sub {$co->copy_items(@_)};
    my $arg_ref = [$coll_id, $item_id_ref];
    
    $self->ASSERT_test($method_ref,$arg_ref);

}

#----------------------------------------------------------------------
sub delete_one_item:Test(no_plan)
{
    my $self=shift;
    $self->do_delete_one_item(undef);
}

sub delete_one_item_op:Test(no_plan)
{
    my $self=shift;
    $self->do_delete_one_item('op');
}

sub delete_one_item_web: Test(no_plan)
{
    my $self=shift;
    $self->do_delete_one_item('web');
}
   

#----------------------------------------------------------------------
#  delete items from collection
#----------------------------------------------------------------------
#  mysql> select MColl_ID, item_id from test_coll_item order by MColl_ID,item_id;
#    +----------+---------+
#    | MColl_ID | item_id |
#    +----------+---------+
#    |        9 |       1 |
#    |        9 |       2 |
#    |        9 |       3 |
#    |        9 |       4 |
#    |       11 |       3 |
#    |       11 |       4 |
#    |       11 |       5 |
#    |       11 |       6 |
#    +----------+---------+
#    +----------+---------+
#    | MColl_ID | owner   |
#    +----------+---------+
#    |        9 | diabob  |
#    |       11 | tburtonw |
#    +----------+---------+
sub do_delete_one_item  
{
    my $self = shift;
    my $flag =shift;
    
    diag("testing delete_items") if $VERBOSE;
    my $co = $self->{co};
    # default setup is with tburtonw userid
    my $user_id = $co->get_user_id;
    ok ($user_id eq 'tburtonw', qq{user_id is tburtonw});
    
    my $coll_id=11;
    my $item_id=4;
    my $item_id_ref = [$item_id];
  
    ok ( $self->item_in_collection($item_id,$coll_id),qq{before delete_items called: item $item_id is in collection $coll_id});    
  #PREP and EXECUTE
    $self->do_delete_items_setup_and_exec($flag,$user_id,$coll_id,$item_id_ref);
#VERIFY
    ok (! $self->item_in_collection($item_id,$coll_id),qq{after delete_items called: item $item_id is not in collection $coll_id});
    
}
#----------------------------------------------------------------------
sub do_delete_items_setup_and_exec{
    my $self=shift;
    my $flag= shift;
    my $user_id =shift;
    my $coll_id = shift;
    my $item_id_ref =shift;
    my $action='delit';

    if ($flag eq 'op')
    {
        diag("testing Operation: delete_items ") if $VERBOSE;
        my $C = $self->get_context();
       if ($DEBUG)
        {
            isa_ok($C,Context);    
        }

        my $temp_cgi = $C->get_object('CGI');
        $temp_cgi->param('a',"$action");
        $temp_cgi->param('c',"$coll_id");
        $temp_cgi->param('id',(@{$item_id_ref}));
        $C->set_object('CGI', $temp_cgi);
    
        my $attr_ref = $self->setup_operation($C);
        my $DeleteItems = new MBooks::Operation::DeleteItems($attr_ref);
        
         if ($DEBUG)
        {
            isa_ok($DeleteItems, MBooks::Operation::DeleteItems);
            #check cgi
            my $testCGI=$C->get_object('CGI');
            is ($testCGI->param('id'),4,qq{cgi id param ok});
        }
    
        #EXECUTE
        my $status= $DeleteItems->execute_operation($C);
        #WARNING!!   should test for status here
   #     is ($status,'0',"status from delete items is 0 ok success");
      
    }
    elsif ($flag eq 'web')
    {
        diag("testing Web: delete_items") if $VERBOSE;
        # set up the Operation object with correct cgi params etc
        # this should be member data setup in startup!!!
        my $base_url='tburtonw.dev.umdl.umich.edu/cgi/m/mdp/mb';
        my $temp_cgi = new CGI ();
        
      
        $temp_cgi->param('a',"$action");
        $temp_cgi->param('c',"$coll_id");
        $temp_cgi->param('id',(@{$item_id_ref}));
        $temp_cgi->param('debug',"usetesttbl");
        my $url = $temp_cgi->self_url;
        $url =~s,localhost,$base_url,;
        
        if ($DEBUG)
        {
            diag "url is $url\n";
        }
        my $mech= Test::WWW::Mechanize->new;
        #EXECUTE
        $mech->get_ok($url);
        
    }
    else
    {
        diag("testing Collection object: delete_items ") if $VERBOSE;
        my $co = $self->{co};
        $co->delete_items($coll_id,$item_id_ref);
    }
}

#----------------------------------------------------------------------
#----------------------------------------------------------------------
sub delete_several_items:Test(no_plan)
{
    my $self=shift;
    $self->do_delete_several_items(undef);
}

sub delete_several_items_op:Test(no_plan)
{
    my $self=shift;
    $self->do_delete_several_items('op');
}

sub delete_several_items_web:Test(no_plan)
{
    my $self=shift;
    $self->do_delete_several_items('web');
}
   

#----------------------------------------------------------------------
#    |       11 |       3 |
#    |       11 |       4 |
#    |       11 |       5 |
#    |       11 |       6 |



sub do_delete_several_items 
{
    my $self = shift;
    my $flag = shift;
    
    my $co = $self->{co};
    diag("testing delete_items with several items") if $VERBOSE;
    # default setup is with tburtonw userid
    my $user_id = $co->get_user_id;
    ok ($user_id eq 'tburtonw', qq{user_id is tburtonw});
    
    my $coll_id=11;
    my $item_id_ref = [4,5,6];
    my $item_leave_alone ='3';


    ok ( $self->item_in_collection($item_leave_alone,$coll_id),qq{before delete_items called: item $item_leave_alone is in collection $coll_id});    

    foreach  my $item  (@${item_id_ref})
    {
        ok ( $self->item_in_collection($item,$coll_id),qq{before delete_items called: item $item is in collection $coll_id});    
    }
    

    #EXECUTE after specific setup
    $self->do_delete_items_setup_and_exec($flag,$user_id,$coll_id,$item_id_ref);

    #VERIFY
        ok ( $self->item_in_collection($item_leave_alone,$coll_id),qq{after delete_items called: item $item_leave_alone is still in collection $coll_id});    

    foreach my $item  (@${item_id_ref})
    {
        ok ( ! $self->item_in_collection($item,$coll_id),qq{after delete_items called: item $item is not in collection $coll_id});    
    }
}



sub ASSERT_coll_not_owned_by_user_delete_items # :Test(1)
{
    my $self = shift;
    my $co = $self->{co};
    diag("ASSERT coll_not_owned_by_user delete_items") if $VERBOSE;

    my $item_id=4;
    my $item_id_array_ref = [$item_id];
    my $coll_id=9; #owned by diabob

    my $method_ref = sub {$co->delete_items(@_)};
    my $arg_ref = [$coll_id, $item_id_array_ref];
    
    $self->ASSERT_test($method_ref,$arg_ref);

}
#======================================================================
#   Move items tests
#======================================================================

#  mysql> select MColl_ID, owner,collname from test_collection where owner ='tburtonw';
#  +----------+----------+-----------------------+
#  | MColl_ID | owner    | collname              |
#  +----------+----------+-----------------------+
#  |        8 | tburtonw | Stuff for English 324 |   no items in collection
#  |        7 | tburtonw | Favorites             |   no items in collection
#  |       11 | tburtonw | Books & Stuff         |   items 3,4,5,6
#  +----------+----------+-----------------------+
# INSERT INTO `test_coll_item` VALUES (1,9),(2,9),(3,9),(4,9),(3,11),(4,11),(5,11),(6,11);


# Since Move items is a combination of copy and delete operations, we can only test the action or the web
# However we can simulate with  a combination of copy and delete 

# test with 
#  all items in $coll not in tocoll
#  some items already in tocoll
#  some items not in coll?


sub move_items_web:Test(no_plan)
{
    my $self=shift;
    $self->do_move_items('web');
}
sub move_items_op:Test(no_plan)
{
    my $self=shift;
    $self->do_move_items('op');
}

sub move_items:#Test(no_plan)
{
    my $self=shift;
    $self->do_move_items(undef);
}



sub do_move_items
{
    my $self = shift;
    my $flag = shift;
    
    my $coll_id = 11;
    my $to_coll_id = 7;
    my $item_id_ref = [4,5,6];
    my $param_ref={'coll_id'=>$coll_id,'to_coll_id'=>$to_coll_id,'item_id_ref'=>$item_id_ref};
   
    my $item_string = join (' and ',@{$item_id_ref});
    
    diag ("testing move items \(copy, delete\) moving items $item_string from collection $coll_id to $to_coll_id");
    
    #verify items in $coll_id and not in $to_coll_id
    foreach  my $item  (@${item_id_ref})
    {
            ok ( $self->item_in_collection($item,$coll_id),qq{before move_items called: item $item is in collection $coll_id});    
            ok ( ! $self->item_in_collection($item,$to_coll_id),qq{before move_items called: item $item is not in collection $to_coll_id});    
    }
    
    
    #EXECUTE after specific setup
    $self->do_move_items_setup_and_exec($flag,$param_ref);
    
    #VERIFY
    foreach  my $item  (@${item_id_ref})
    {
        ok ( ! $self->item_in_collection($item,$coll_id),qq{after move_items called: item $item is not in collection $coll_id});       
        ok ( $self->item_in_collection($item,$to_coll_id),qq{after move_items called: item $item is in collection $to_coll_id});    
    }
}

sub do_move_items_setup_and_exec{
    my $self = shift;
    my $flag =shift;
    my $param_ref = shift;
    #     my $param_ref={'coll_id'=>$coll_id,'to_coll_id'=>$to_coll_id,'item_id_ref'=>$item_id_ref};
    my $temp_cgi = undef;
    my $action = undef;
    
    if ($flag eq 'op')
    {
        diag("testing Operations:copy_items delete_items ") if $VERBOSE;
        my $C = $self->get_context();
        
        #1  Copy Items from coll to to_coll
        $action = 'copyit';
        
        $temp_cgi = $C->get_object('CGI');
        $temp_cgi->param('a',"$action");
        $temp_cgi->param('c',$param_ref->{'coll_id'});
        $temp_cgi->param('c2',$param_ref->{'to_coll_id'});
        $temp_cgi->param('id',@{$param_ref->{'item_id_ref'}});
        $C->set_object('CGI', $temp_cgi);

        my $attr_ref = $self->setup_operation($C);
        my $CopyItems = new MBooks::Operation::CopyItems($attr_ref);

         if ($DEBUG)
        {
            isa_ok($CopyItems, MBooks::Operation::CopyItems);
            #check cgi
            my $testCGI=$C->get_object('CGI');
            is ($testCGI->param('c'),11,qq{cgi coll param ok});
        }
    
        #EXECUTE
        my $status= $CopyItems->execute_operation($C);
        #WARNING!!   should test for status here
#        is ($status,'0',"status from (move) copy items is 0 ok success");

        #--------------------------------------------------------
        # 2 Delete items from coll
        $action = 'delit';
        $temp_cgi = $C->get_object('CGI');
        $temp_cgi->param('a',"$action");
        $temp_cgi->param('c',$param_ref->{'coll_id'});
        $temp_cgi->param('c2',$param_ref->{'to_coll_id'});
        $temp_cgi->param('id',@{$param_ref->{'item_id_ref'}});
        $C->set_object('CGI', $temp_cgi);

        my $attr_ref = $self->setup_operation($C);
        my $DeleteItems = new MBooks::Operation::DeleteItems($attr_ref);

         if ($DEBUG)
        {
            isa_ok($DeleteItems, MBooks::Operation::DeleteItems);
            #check cgi
            my $testCGI=$C->get_object('CGI');
        }
    
        #EXECUTE
        $status= $DeleteItems->execute_operation($C);
        #WARNING!!   should test for status here
#        is ($status,'0',"status from (move) delete items is 0 ok success");
    }
    elsif ($flag eq 'web')
    {
     
        diag("testing Web: move_items") if $VERBOSE;
        # set up the Operation object with correct cgi params etc
        # this should be member data setup in startup!!!
        my $base_url='tburtonw.dev.umdl.umich.edu/cgi/m/mdp/mb';
        $temp_cgi = new CGI ();
        $action ='movit';
        $temp_cgi->param('a',"$action");
        $temp_cgi->param('c',$param_ref->{'coll_id'});
        $temp_cgi->param('c2',$param_ref->{'to_coll_id'});
        $temp_cgi->param('id',@{$param_ref->{'item_id_ref'}});
        $temp_cgi->param('debug',"usetesttbl");
        
        my $url = $temp_cgi->self_url;
        $url =~s,localhost,$base_url,;
        
        if ($DEBUG)
        {
            diag "url is $url\n";
        }
        my $mech= Test::WWW::Mechanize->new;
        #EXECUTE
        $mech->get_ok($url, "got page for $url");
       
    }
    else
    {
    
    }
    

}
#----------------------------------------------------------------------
# list_items tests

sub list_items:# Test(2)
{
    my $self = shift;
    my $co = $self->{co};
    diag("testing list_items") if $VERBOSE;
    
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
       
    $coll_id = 11;
    
    $sort_key = 'sort_title';
    $direction = 'a';
    
    my $list_ref=$co->list_items($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice);
    is ($list_ref->[2]->{'display_title'},'The motor book,',qq{third item is the motor book});
    like ($list_ref->[0]->{'display_title'},qr/Diseases of a gasolene automobile/,qq{first item is Diseases of a gasolene automobile });

}

#----------------------------------------------------------------------
sub list_items_sort_by_display_title:# Test(2)
{
    my $self = shift;
    my $co = $self->{co};
    diag("testing list_items sorting ") if $VERBOSE;
    
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
       
    $coll_id = 11;
    
    $sort_key = 'sort_title';
    $direction = 'd';
    
    my $list_ref = $co->list_items($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice);
    is ($list_ref->[1]->{'display_title'},'The motor book,',qq{second item is the motor book});
    like ($list_ref->[0]->{'display_title'},qr/The motor-car; an elementary handbook /,qq{first item is The motor-car; an elementary handbook });

}
#     mysql> select author, test_item.item_id,display_title  from test_item, test_coll_item where test_item.item_id =test_coll_item.item_id and test_coll_item.MColl_ID=11 order by author;
#+-------------------+---------+---------------------------------------------------+
#    | author            | item_id | display_title                                     |
#    +-------------------+---------+---------------------------------------------------+
#    | Dyke, Andrew Lee, |       3 | Diseases of a gasolene automobile and how to cure |
#    | Mercredy, R. J.   |       5 | The motor book,                                   |
#    | Thompson, Henry,  |       6 | The motor-car; an elementary handbook on its      |
#    | Young, Filson,    |       4 | The happy motorist; an introduction to the use    |
#    +-------------------+---------+---------------------------------------------------+

sub list_items_sort_by_author_ascending:# Test(2)
{
    my $self = shift;
    my $co = $self->{co};
    diag("testing list_items sorting by author ") if $VERBOSE;
    
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
       
    $coll_id = 11;
    $sort_key = 'author';
    $direction = 'a';
    
    my $first_author = qq{Dyke, Andrew Lee,};
    my $fourth_author = qq{Young, Filson,};
    
    
    
    my $list_ref = $co->list_items($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice);
    is ($list_ref->[0]->{'author'},$first_author,qq{first author $first_author});
    is ($list_ref->[3]->{'author'},$fourth_author, qq{fourth author $fourth_author});
}


#    mysql> select date, test_item.item_id,display_title  from test_item, test_coll_item where test_item.item_id =test_coll_item.item_id and test_coll_item.MColl_ID=11 order by date asc;
#    +------------+---------+---------------------------------------------------+
#    | date       | item_id | display_title                                     |
#    +------------+---------+---------------------------------------------------+
#    | 1902-01-01 |       6 | The motor-car; an elementary handbook on its      |
#    | 1903-01-01 |       3 | Diseases of a gasolene automobile and how to cure |
#    | 1903-01-01 |       5 | The motor book,                                   |
#    | 1906-01-01 |       4 | The happy motorist; an introduction to the use    |
#    +------------+---------+---------------------------------------------------+



sub list_items_sort_by_date_ascending:# Test(2)
{
    my $self = shift;
    my $co = $self->{co};
    diag("testing list_items sorting by date ascending ") if $VERBOSE;
    
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
       
    $coll_id = 11;
    $sort_key = 'date';
    $direction = 'a';
    
    my $first_date = qq{1902-01-01};
    my $fourth_date = qq{1906-01-01};
        
    my $list_ref = $co->list_items($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice);
    is ($list_ref->[0]->{'date'},$first_date,qq{first date $first_date});
    is ($list_ref->[3]->{'date'},$fourth_date, qq{fourth date $fourth_date});
}


sub list_items_slice:# Test(3)
{
    my $self=shift;
    my $co=$self->{co};
    diag("testing list_items slice ") if $VERBOSE;
    
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
       
    $coll_id=11;
    $sort_key='sort_title';
    $direction = 'a';
    $slice_start = 2;
    $recs_per_slice = 2;
    
        diag("testing slice of $recs_per_slice starting at $slice_start sorting in direction $direction") if $VERBOSE;
    
    $list_ref=$co->list_items($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice);
    is (scalar(@{$list_ref}),$recs_per_slice ,qq{slice returned correct number of records});
    
    like ($list_ref->[0]->{'display_title'},qr/The happy motorist/,qq{first item is The happy motororist});
    like ($list_ref->[1]->{'display_title'},qr/The motor book/,qq{second item is The motor book });
        
}


#
#  mysql> select id, dscr from attributes order by id;
#  +----+---------------------------------------------------------------+
#  | id | dscr                                                          |
#  +----+---------------------------------------------------------------+
#  |  1 | public domain                                                 |
#  |  2 | in copyright                                                  |
#  |  3 | out-of-print and brittle (implies in-copyright)               |
#  |  4 | copyright-orphaned (implies in-copyright)                     |
#  |  5 | undetermined copyright status                                 |
#  |  6 | available to UM affiliates and walk-in patrons (all campuses) |
#  |  7 | available to everyone in the world                            |
#  |  8 | available to nobody; blocked for all users                    |
#  |  9 | public domain only when viewed in the US                      |
#  +----+---------------------------------------------------------------+

#  mysql> select test_item.item_id, test_item.sort_title, test_item.rights  from test_item, test_coll_item
#  where test_coll_item.MColl_ID = 11 and test_coll_item.item_id = test_item.item_id order by test_item.sort_title;
#  +---------+---------------------------------------------------+--------+
#  | item_id | sort_title                                        | rights |
#  +---------+---------------------------------------------------+--------+
#  |       3 | Diseases of a gasolene automobile and how to cure |      4 |
#  |       4 | happy motorist; an introduction to the use        |      5 |
#  |       5 | motor book,                                       |      6 |
#  |       6 | motor-car; an elementary handbook on its          |      7 |
#  +---------+---------------------------------------------------+--------+
#  4 rows in set (0.00 sec)

sub list_items_limit_to_full_text_fakerights:Test(no_plan)
{
    my $self=shift;
    my $co=$self->{co};
    diag("testing list_items limit to full-text fakerights") if $VERBOSE;
    
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
       
    $coll_id=11;
    $sort_key='sort_title';
    $direction = 'a';
    my $rights_ref=[6,7];
    
   
    $list_ref=$co->list_items($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice,$rights_ref);
    
    like ($list_ref->[0]->{'display_title'},qr/motor book/,qq{first item is motor book});
    like ($list_ref->[1]->{'display_title'},qr/motor-car/,qq{second item is  motor-car});
}

sub list_items_limit_to_full_text:Test(no_plan)
{
    my $self=shift;
    my $co=$self->{co};
    diag("testing list_items limit to full-text ") if $VERBOSE;
    
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
       
    $coll_id=11;
    $sort_key='sort_title';
    $direction = 'a';


    my  $ar = new AccessRights($C, undef);
    $rights_ref=$ar->get_fulltext_attr_list($C);
    my $rights_bool ='';
    
    foreach my $attr (@{$rights_ref})
    {
        $rights_attr{$attr}=1;
    }
    my $rights_list = join ("\,",(sort(keys %rights_attr)));
    
    $list_ref=$co->list_items($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice,$rights_ref);

    foreach my $item_hash_ref (@{$list_ref})
    {
       my $item_id =$item_hash_ref->{'item_id'};
      my $item_rights_attr = $self->get_rights_attr($item_id);
      is ($rights_attr{$item_rights_attr},1,qq{item id $item_id rights att $item_rights_attr is  in  $rights_list});
    }

}




 #-------------------------------------------------------------------------------------------
 # list_items ASSERT tests
sub ASSERT_no_sort_key_list_items # :Test(1)
{
    my $self = shift;
    my $co = $self->{co};
    my $subname = (caller (0))[3];
    $subname =~ s/Collection: # :Test:://;
    diag("testing $subname") if $VERBOSE;
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
  
    $coll_id = 11;
    $sort_key = undef;
    $direction = 'a';
    
    my $method_ref = sub {$co->list_items(@_)};
    my $arg_ref = [$coll_id, $sort_key, $direction, $slice_start, $recs_per_slice];
    $self->ASSERT_test($method_ref,$arg_ref);


}
sub ASSERT_no_direction_list_items # :Test(1)
{
    my $self = shift;
    my $co = $self->{co};
    my $subname = (caller (0))[3];
    $subname =~ s/Collection: # :Test:://;
    diag("testing $subname") if $VERBOSE;
    
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
  
    $coll_id = 11;
    $sort_key = 'sort_title';
    $direction = undef;
    
    my $method_ref = sub {$co->list_items(@_)};
    my $arg_ref = [$coll_id, $sort_key, $direction, $slice_start, $recs_per_slice];
    $self->ASSERT_test($method_ref,$arg_ref);

}

sub ASSERT_sort_key_not_in_sort_fields_list_items # :Test(1)
{
    my $self = shift;
    my $co = $self->{co};
    my $subname = (caller (0))[3];
    $subname =~ s/Collection: # :Test:://;
    diag("testing $subname") if $VERBOSE;
    
    
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
  
    $coll_id = 11;
    $sort_key = 'foo_bar';
    $direction = 'a';
    
    my $method_ref = sub {$co->list_items(@_)};
    my $arg_ref = [$coll_id, $sort_key, $direction, $slice_start, $recs_per_slice];
   $self->ASSERT_test($method_ref,$arg_ref);
}




#---------------------------------------------------------------------------------
#     mysql> select MColl_ID, collname, description, shared from test_collection where owner = 'tburtonw';
#    +----------+-----------------------+---------------------------------+--------+
#    | MColl_ID | collname              | description                     | shared |
#    +----------+-----------------------+---------------------------------+--------+
#    |        8 | Stuff for English 324 | Assignments for class and notes |      1 |
#    |        7 | Favorites             | Collection of great stuff       |      0 |
#    |       11 | Books & Stuff         |                                 |      0 |
#    +----------+-----------------------+---------------------------------+--------+


sub edit_status:Test(6)
{
    my $self = shift;
    $self->do_edit_status('flag');
    
}

sub edit_status_op:Test(no_plan)
{
    my $self = shift;
    $self->do_edit_status('op');
    
}


sub edit_status_web:#Test(6);
{
    my $self = shift;
    $self->do_edit_status('web');
}




sub do_edit_status
{
    my $self = shift;
    my $flag = shift;
    
    diag("testing edit_status") if $VERBOSE; 
 
    my $st_before = 'public';
    my $st_after = 'private';
    my $MColl_ID = 8;

    $self->test_edit_status($flag,$MColl_ID,$st_before,$st_after);

    # private to private shouldn't do anything
    $MColl_ID = 7;
    $st_before='private';
    $st_after='private';

    $self->test_edit_status($flag,$MColl_ID,$st_before,$st_after);

    # private to public
    $MColl_ID = 11;
    $st_before='private';
    $st_after='public';

    $self->test_edit_status($flag,$MColl_ID,$st_before,$st_after);
}

#---
sub test_edit_status
    {
        my $self=shift;
        my $flag = shift;
        
        my $MColl_ID =shift;
        my $st_before = shift;
        my $st_after = shift;
        my $co = $self->{co};
        
        is ($co->get_shared_status($MColl_ID), $st_before,qq{before: status is $st_before for $st_before to $st_after});
        
        #EXECUTE (after additional setup)
        $self->edit_status_setup_and_execute($flag,$co,$MColl_ID,$st_after);
        #VERIFY
        is ($co->get_shared_status($MColl_ID), $st_after,qq{after: status is $st_after for  $st_before to $st_after});
        
    }
    
sub edit_status_setup_and_execute
{
    my $self = shift;
    my $flag = shift;
    my $co = shift;
    my $MColl_ID = shift;
    my $st_after = shift;
    my $status_code=undef;
    
    if ($st_after eq 'private')
    {
        $status_code=0;
    }
    elsif($st_after eq 'public')
    {
        $status_code=1;
    }
    else
    {
        is ($st_after,'private',qq{st_after must be either public or private it is $st_after});
    }
    


    if ($flag eq 'op')
    {
        diag("testing Operations: edit_status ") if $VERBOSE;
        my $C = $self->get_context();
        
        #1  Copy Items from coll to to_coll
        $action = 'editc';
        
        $temp_cgi = $C->get_object('CGI');
        $temp_cgi->param('a',"$action");
        $temp_cgi->param('c',"$MColl_ID");
        $temp_cgi->param('shrd',"$status_code");
        $C->set_object('CGI', $temp_cgi);

        my $attr_ref = $self->setup_operation($C);
        my $EditColl = new MBooks::Operation::EditColl($attr_ref);

         if ($DEBUG)
        {
            isa_ok($EditColl, MBooks::Operation::EditColl);
        }
    
        #EXECUTE
        my $status= $EditColl->execute_operation($C);
#        is ($status,'0',"status from edit status  is 0 ok success");
    }
    elsif ($flag eq 'web')
    {
    }
    else{
        $co->edit_status($MColl_ID,$st_after);
    }
    
}




#---------------------------------------------------------------------------------
sub ASSERT_bad_status_edit_status # :Test(1)
{
    my $self = shift;
    my $co = $self->{co};
    diag("testing ASSERT bad status edit_status") if $VERBOSE; 
    my $MColl_ID=8; # start with public collection
    my $status=100;
    
    my $method_ref = sub {$co->edit_status(@_)};
    my $arg_ref = [$MColl_ID,$status];
    $self->ASSERT_test($method_ref,$arg_ref);




    # bad string  
    #WARNING!! Collection::edit_status currently has two asserts because one isn't working properly
   # $MColl_ID=11;
#    is ($co->get_shared_status($MColl_ID), 'private',qq{before: private to public bad string});
 #   $co->edit_status($MColl_ID,"x");
  #  is ($co->get_shared_status($MColl_ID),  'public',qq{after: private to public bad string});



}

#---------------------------------------------------------------------------------



#---------------------------------------------------------------------------------
#     mysql> select MColl_ID, collname, description, shared from test_collection where owner = 'tburtonw';
#    +----------+-----------------------+---------------------------------+--------+
#    | MColl_ID | collname              | description                     | shared |
#    +----------+-----------------------+---------------------------------+--------+
#    |        8 | Stuff for English 324 | Assignments for class and notes |      1 |
#    |        7 | Favorites             | Collection of great stuff       |      0 |
#    |       11 | Books & Stuff         |                                 |      0 |
#    +----------+-----------------------+---------------------------------+--------+
sub edit_description :Test(2)
{
    my $self = shift;
    $self->do_edit_description(); 
}

sub edit_description_op :Test(2)
{
    my $self = shift;
    $self->do_edit_description('op'); 
}

sub do_edit_description 
{
    my $self = shift;
    my $flag = shift;
    my $co = $self->{co};
    diag("testing edit_description") if $VERBOSE; 
    my $MColl_ID=8;
    my $description=qq{Great Collection};
    my $before=qq{Assignments for class and notes};
    
    is ($co->get_description($MColl_ID),$before, qq{before: description = $before...});
    
    #EXECUTE after prep
    $self->do_edit_description_setup_and_execute($flag,$co,$MColl_ID,$description);
    
    
    #VERIFY
    is ($co->get_description($MColl_ID),$description, qq{after: description = $description});

}
sub do_edit_description_setup_and_execute
{
    my $self = shift;
    my $flag = shift;
    my $co = shift;
    my $MColl_ID = shift;
    my $description = shift;

    
    if ($flag eq 'op')
    {
        diag("testing Operations: edit_description ") if $VERBOSE;
        my $C = $self->get_context();
        

        $action = 'editc';
        
        $temp_cgi = $C->get_object('CGI');
        $temp_cgi->param('a',"$action");
        $temp_cgi->param('c',"$MColl_ID");
        $temp_cgi->param('desc',"$description");
        $C->set_object('CGI', $temp_cgi);

        my $attr_ref = $self->setup_operation($C);
        my $EditColl = new MBooks::Operation::EditColl($attr_ref);

         if ($DEBUG)
        {
            isa_ok($EditColl, MBooks::Operation::EditColl);
        }
    
        #EXECUTE
        my $status= $EditColl->execute_operation($C);
#        is ($status,'0',"status from edit collection description  is 0 ok success");
    }
    elsif ($flag eq 'web')
    {
    }
    else
    {
        $co->edit_description($MColl_ID, $description);
    }
    
    
}


#------------------------------------------------------------------------------------------
sub ASSERT_description_over255chars_edit_description # :Test(no_plan)
{
my $self = shift;
    my $co = $self->{co};
    diag("testing ASSERT desc over 255 chars edit_description") if $VERBOSE; 
    my $MColl_ID=11;
    my $description="";
    my $TEN_CHARS='1234567890';
    my $big_string="";
    
    for $i (0..25)
    {
        $big_string.=$TEN_CHARS 
    }
    
    $description = $big_string;
    my $l = length($description);
    diag "length of desc = $l\n" if $VERBOSE;

    my $method_ref = sub {$co->edit_description(@_)};
    my $arg_ref = [$MColl_ID, $description];
    
    $self->ASSERT_test($method_ref,$arg_ref);
    
}

#---------------------------------------------------------------------------------
#---------------------------------------------------------------------------------
#     mysql> select MColl_ID, collname, description, shared from test_collection where owner = 'tburtonw';
#    +----------+-----------------------+---------------------------------+--------+
#    | MColl_ID | collname              | description                     | shared |
#    +----------+-----------------------+---------------------------------+--------+
#    |        8 | Stuff for English 324 | Assignments for class and notes |      1 |
#    |        7 | Favorites             | Collection of great stuff       |      0 |
#    |       11 | Books & Stuff         |                                 |      0 |
#    +----------+-----------------------+---------------------------------+--------+

sub edit_coll_name  :Test(2)
{
    my $self = shift;
    $self->do_edit_coll_name('foo');
}

sub edit_coll_name_op  :Test(3)
{
    my $self = shift;
    $self->do_edit_coll_name('op');
}

sub do_edit_coll_name
{
    my $self = shift;
    my $flag = shift;
    
    my $co = $self->{co};
    diag("testing edit_coll_name") if $VERBOSE; 
    my $MColl_ID = 8;
    my $coll_name = qq{These are times that try mens souls};
    
    is ($co->get_coll_name($MColl_ID),"Stuff for English 324",qq{before coll name edit});
#EXECUTE after addional setup
    $self->do_edit_coll_name_setup_and_execute($flag,$MColl_ID,$coll_name,$co);
    

#VERIFY
    is ($co->get_coll_name($MColl_ID),$coll_name,qq{after coll name edit newcoll = $coll_name});
}
sub do_edit_coll_name_setup_and_execute
{
    my $self = shift;
    my $flag = shift;
    my $coll_id = shift;
    my $coll_name = shift;
    my $co = shift;    
    
    if ($flag eq 'op')
    {
        diag("testing Operations: edit_coll_name ") if $VERBOSE;
        my $C = $self->get_context();
        

        $action = 'editc';
        
        $temp_cgi = $C->get_object('CGI');
        $temp_cgi->param('a',"$action");
        $temp_cgi->param('c',"$coll_id");
        $temp_cgi->param('cn',"$coll_name");
        $C->set_object('CGI', $temp_cgi);

        my $attr_ref = $self->setup_operation($C);
        my $EditColl = new MBooks::Operation::EditColl($attr_ref);

         if ($DEBUG)
        {
            isa_ok($EditColl, MBooks::Operation::EditColl);
        }
    
        #EXECUTE
        my $status= $EditColl->execute_operation($C);
#        is ($status,'0',"status from edit collection description  is 0 ok success");
    }
    elsif ($flag eq 'web')
    {
    }
    else
    {
        $co->edit_coll_name($coll_id,$coll_name);
    }
    
}



#    +----------+-----------------------+---------------------------------+--------+
sub ASSERT_dup_coll_name_edit_coll_name # :Test(1)
{
    my $self = shift;
    my $co = $self->{co};
    diag("testing ASSERT duplicate coll_name edit_coll_name") if $VERBOSE; 
    my $MColl_ID = 8;
    my $coll_name = $co->get_coll_name($MColl_ID);
    
    # ASSERT Test
    $coll_name="Stuff for English 324";
    my $method_ref = sub {$co->edit_coll_name(@_)};
    my $arg_ref = [$MColl_ID, $coll_name];
    
    $self->ASSERT_test($method_ref,$arg_ref);

}
#----------------------------------------------------------------------------------------------

#Note we are testing private method directly since that is where the ASSERT lives and we want to 
#test it independently of the other methods that use it
sub ASSERT_bad_Coll_ID_edit_metadata # :Test(1)
{
    my $self = shift;
    my $co = $self->{co};
    diag("testing ASSERT bad Coll_ID _edit_metatdata") if $VERBOSE; 
    
    $MColl_ID=666; # coll 666 does not exist
    $field="field";
    $value="value";
    
    my $method_ref = sub {$co->_edit_metadata(@_)};
    my $arg_ref = [$MColl_ID, $field,$value];
    
    $self->ASSERT_test($method_ref,$arg_ref);
}



sub ASSERT_user_does_not_own_collection_edit_metadata # :Test(1)
{

    my $self = shift;
    my $co = $self->{co};
    diag("testing ASSERT user does not own collection: _edit metatdata") if $VERBOSE; 
    $MColl_ID=9; # coll 9 owned by diabob!
    $field="field";
    $value="value";
    
    my $method_ref = sub {$co->_edit_metadata(@_)};
    my $arg_ref = [$MColl_ID, $field,$value];
    
    $self->ASSERT_test($method_ref,$arg_ref);
}





#----------------------------------------------------------------------------------------------
sub ASSERT_prep_n_exec_bad_statement#    # :Test(no_plan)
{
    my $self = shift;
    my $co = $self->{co};
    my $dbh = $co->get_dbh;
    
    my $table=$co->get_coll_table_name;
    my $statement = qq{selectx * from $table limit 1\;};
    my $sth =DbUtils::prep_n_execute($dbh, $statement);
    my $fields_ar = $sth->{NAME};
    $sth->finish;
    is ($fields_ar[2], "foo");
}



#----------------------------------------------------------------------

#    mysql> select item_id, extern_item_id, display_title from test_item;
#    +---------+----------------+---------------------------------------------------+
#    | item_id | extern_item_id | display_title                                     |
#    +---------+----------------+---------------------------------------------------+
#    |       1 | 39015020230051 | The automobile hand-book;                         |
#    |       2 | 39015021038404 | ChaufÃ¯eur chaff; or, Automobilia,                |
#    |       3 | 39015002057589 | Diseases of a gasolene automobile and how to cure |
#    |       4 | 39015021302552 | The happy motorist; an introduction to the use    |
#    |       5 | 39015021112043 | The motor book,                                   |
#    |       6 | 39015021302602 | The motor-car; an elementary handbook on its      |
#    |       7 | 39015021302586 | Motor vehicles for business purposes; a practical |
#    |       8 | 39015020229939 | Self-propelled vehicles; a practical treatise on  |
#    |       9 | 39015021057735 | Tramways et automobiles,                          |
#    |      10 | 39015021054963 | Tube, train, tram, and car, or, Up-to-date        |
#    |      11 | 39015002056151 | Whys and wherefores of the automobile, A simple   |
#    +---------+----------------+---------------------------------------------------+
sub get_item_id_from_extern_id # :Test(2)
{
    my $self = shift;
    my $co = $self->{co};
    diag("get_item_id_from_extern_id") if $VERBOSE; 
    my $extern_id= 39015021038404; #extern_id for item 2 see above
    is ($co->_get_item_id_from_extern_id($extern_id),2,qq{extern_id in db});
    $extern_id=666;# non-existant extern_id
    is ($co->_get_item_id_from_extern_id($extern_id),undef,qq{extern_id $extern_id not in db});
    
}
#----------------------------------------------------------------------
sub update_item_metadata # :Test(7)
{
    my $self = shift;
    my $co = $self->{co};
    diag("update function of create_or_update_item_metadata") if $VERBOSE; 

    my $dbh = $self->{'dbh'};
    


#  mysql> select * from test_item where item_id=5;
#  +---------+----------------+-----------------+-------------+-----------------+------------+---------------------+--------+
#  | item_id | extern_item_id | display_title   | sort_title  | author          | date       | modified            | rights |
#  +---------+----------------+-----------------+-------------+-----------------+------------+---------------------+--------+
#  |       5 | 39015021112043 | The motor book, | motor book, | Mercredy, R. J. | 1903-01-01 | 2007-06-21 17:07:56 |      3 |
#  +---------+----------------+-----------------+-------------+-----------------+------------+---------------------+--------+
#  1 row in set (0.00 sec)

    my $statement = qq{SELECT * from test_item where item_id = 5};
    my $sth = DbUtils::prep_n_execute($dbh, $statement);
    my $hash_ref = $sth->fetchrow_hashref;
    $sth->finish;

     if ($DEBUG)
    {
        diag("confirming test data for item 5 ");
        
        $self->num_method_tests('update_item_metadata','14');
        is ($hash_ref->{item_id}, 5, qq{checking item id });
        is ($hash_ref->{extern_item_id}, 39015021112043, qq{checking extern_id/external_item_id});
        is ($hash_ref->{display_title}, qq{The motor book,}, qq{ title is The motor book});
        is ($hash_ref->{sort_title}, qq{motor book,}, qq{sort title is motor book});
        is ($hash_ref->{author},  'Mercredy, R. J.', qq{ author is Mercredy});
        is ($hash_ref->{date}, '1903-01-01', qq{checking date});
        is ($hash_ref->{rights}, 3, qq{checking rights = 3});
    }
    
    is ($hash_ref->{display_title}, qq{The motor book,}, qq{before: title is The motor book});
    is ($hash_ref->{author},  'Mercredy, R. J.', qq{before: author is Mercredy});
    is ($hash_ref->{rights}, 3, qq{before: rights = 3});

    #setup
    #change three  fields

    $hash_ref->{display_title} = qq{This is a new title};
    $hash_ref->{author} = qq{foo,von author};
    $hash_ref->{rights} = 5;
    
    my $extern_id = $hash_ref->{extern_item_id};
    my $metadata_ref = $hash_ref;
    
    #execute 
    my $item_id = $co->create_or_update_item_metadata($extern_id, $metadata_ref);

    # verify
    is ($item_id,5,qq{extern_id $extern_id is item $item_id});
    
    $statement = qq{SELECT * from test_item where item_id = 5};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    $new_hash_ref = $sth->fetchrow_hashref;
    $sth->finish;
    
    is ($new_hash_ref->{display_title}, qq{This is a new title}, qq{after: title is 'This is a new title'});
    is ($new_hash_ref->{author},  'foo,von author', qq{after: author is 'foo'});
    is ($new_hash_ref->{rights}, 5, qq{after: rights = 5});
    
}
#-----------------------------------------------------

# this tests the create function of sub create_or_update_item_metadata
sub create_item_metadata # :Test(no_plan)
{
    my $self = shift;
    my $co = $self->{co};
    diag("create function of create_or_update_item_metadata") if $VERBOSE; 
    my $dbh = $self->{'dbh'};

    #get number of items in test db
    $statement = qq{SELECT count(*) as numrecs from test_item };
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    $hash_ref = $sth->fetchrow_hashref;
    $sth->finish;
    my $numrecs = $hash_ref->{numrecs};
    my $expected_new_id = $numrecs +1;
    
    
    my $extern_id ='12345';
#  | item_id | extern_item_id | display_title   | sort_title  | author          | date       | modified            | rights |
 
    my $metadata_ref = {
                       'extern_item_id'=> $extern_id,
                       'display_title' =>qq{The rain in spain},
                       'sort_title' =>qq{rain in spain},
                       'author' => qq{Higgins, Henry H.},
                       'date' => qq{1937-04-04},
                        'rights' => '7',
                       };
    
    my $item_id = $co->create_or_update_item_metadata($extern_id, $metadata_ref);
    $statement = qq{SELECT * from test_item where item_id = $item_id};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    my $new_hash_ref = $sth->fetchrow_hashref;
    $sth->finish;
    is ($item_id, $expected_new_id, qq{returned id is $expected_new_id });  
    is ($new_hash_ref->{display_title},$metadata_ref->{'display_title'}, "title is $metadata_ref->{'display_title'}");
    is ($new_hash_ref->{author}, $metadata_ref->{'author'}, "author is $metadata_ref->{'author'}");
    is ($new_hash_ref->{rights}, $metadata_ref->{'rights'}, "rights = $metadata_ref->{'rights'}");

}
#======================================================================
#  Test Collection utility routines
#----------------------------------------------------------------------

#----------------------------------------------------------------------
#    +----------+---------+
#    | MColl_ID | owner   |
#    +----------+---------+
#    |        9 | diabob  |
#    |       11 | tburtonw |
#    +----------+---------+
sub coll_owned_by_user # :Test(3)
           
{
    my $self=shift;
    my $co=$self->{co};
    diag("testing coll_owned_by_user") if $VERBOSE;
    my $user_id = 'tburtonw';
    my $coll_id = 11;
    
    ok ($co->coll_owned_by_user($coll_id, $user_id),"collection $coll_id owned by $user_id");

    my $coll_id = 9; #not owned by $user_id tburtonw
    ok (!$co->coll_owned_by_user($coll_id, $user_id),"collection $coll_id not owned by $user_id");

    #non-existant user_id
    my $user_id = 999;
   ok (! $co->coll_owned_by_user($coll_id, $user_id),"collection $coll_id not owned by non-existent user:$user_id");


}
           

#----------------------------------------------------------------------
sub item_exists  # :Test(2)
{
    my $self=shift;
    my $co=$self->{co};
    diag("item_exists") if $VERBOSE;
    my $item_id = 5;  #5 exists
    ok ($co->item_exists($item_id),"item $item_id exists");
        
    $item_id = 666;  # item 666 does not exist
    ok (! $co->item_exists($item_id)," item $item_id does not exist");
    
}

#----------------------------------------------------------------------
sub test_item_in_collection  # :Test(2)
{
    my $self=shift;
    my $co=$self->{co};
    diag("testing $co->item_in_collection") if $VERBOSE;
    my $coll_id = 11;
    my $item_id = 6;
    ok ($co->item_in_collection($item_id,$coll_id), "item $item_id is in collection $coll_id");
    $item_id=666;
    ok (!$co->item_in_collection($item_id,$coll_id), "item $item_id is not  in collection $coll_id");
}


#----------------------------------------------------------------------

#---------------------------------------------------------------------------------------------------------------
1;
