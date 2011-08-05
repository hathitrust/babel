
# URL parameter values must satisfy these regexps.  Parameters not
# listed can be anything and have any value.
%g_validator_for_param =
    (
     'id'       => '.*',
     'orient'   => '[0-3]',
     'page'     => 'root|search|mobile',
     'seq'      => '\d+',
     'size'     => '\d+',
     'view'     => 'image|text|pdf',
     'debug'    => '.*',
     'newsid'   => '1|[a-z0-9]{32}',
     'attr'     => '[1-9]',
     'src'      => '[1-4]',
     'num'      => '.*',
     'start'    => '\d+',
     'ssd'      => '1', # backwards compatible but obsolete
     'skin'     => '.*',
     'q1'       => '.*',
     'u'        => '1',
     'pgcount'  =>'.*', #changed to 10 by cgi but not forced here to avoid MAFR email overload
    );

# Specification of global *database* operations to be executed before
# Action-specific opertations are executed
$g_early_operations = [
                       'MBooks::Operation::Login',
                      ];

# Specification of global *database* operations to be executed after
# Action-specific opertations are executed
$g_late_operations = [
                     ];

# Specification of Operations for a given Action and the corresponding
# PIFiller and templates associated with the Action
%g_action_bindings =
    (
     # ----- UI action -----
     'ACTION_SSD'  =>
     {'action_param' => 'page',
      'action_type'  => 'UI',
      'operations'   => [],
      'view'         => {'ssd' =>     {
                                       'builders' => [],
                                       'template' => 'ssdviewer.xml',
                                       'filler'   => 'SSD::PIFiller::SSD',
                                      },
                        },
     },     
    );

