
# URL parameter values must satisfy these regexps.  Parameters not
# listed can be anything and have any value.
%g_validator_for_param =
    (
     'id'       => '.*',
     'orient'   => '[0-3]',
     'page'     => 'root|search',
     'seq'      => '\d+',
     'size'     => '\d+',
     'view'     => 'image|text|1up|2up|thumb|plaintext|search',
     'debug'    => '.*',
     'newsid'   => '1|[a-z0-9]{32}',
     'attr'     => '\d+',
     'src'      => '\d+',
     'num'      => '.*',
     'start'    => '\d+',
     'ssd'      => '1', # backwards compatible but obsolete
     'skin'     => '.*',
     'q1'       => '.*',
     'u'        => '1',
     'ui'       => 'reader|embed',
    );

# Specification of global *database* operations to be executed before
# Action-specific opertations are executed
$g_early_operations = [
                       'Operation::Login',
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
     'ACTION_VIEW'   =>
     {'action_param' => 'page',
      'action_type'  => 'UI',
      'operations'   => [
                        ],
      'view'         => {'root' =>   {
                                      'builders' => [],
                                      'template' => 'pageviewer.xml',
                                      'filler'   => 'PT::PIFiller::Root',
                                      },
                        },
     },     

     # ----- UI action -----
     'ACTION_SEARCH'  =>
     {'action_param' => 'page',
      'action_type'  => 'UI',
      'operations'   => [],
      'view'         => {'search' => {
                                       'builders' => [],
                                       'template' => 'searchresults.xml',
                                       'filler'   => 'PT::PIFiller::Search',
                                      },
                        },
     },     

    );

