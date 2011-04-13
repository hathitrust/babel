#
# Bindings of parameters to actions and definitions of minimal set of
# parameters which must be present to constitute a valid parameter set
#

# URL parameter values must satisfy these regexps.  Parameters not
# listed can be anything and have any value.
%g_validator_for_param =
  (
   'a'      => 'srchls|page',
   'q1'     => '.*',
   'debug'  => '.*',
   'newsid' => '1|[a-z0-9]{32}',
   'pn'     => '\d+',
   'ti'     => '.*',
   'au'     => '.*',
   'da'     => '.*',
   'sz'     => '\d+',
   'start'  => '\d+',
   'lmt'    => 'ft|all',
  );

# Specification of global *database* operations to be executed before
# Action-specific opertations are executed
$g_early_operations = [
                      ];

# Specification of global *database* operations to be executed after
# Action-specific opertations are executed
$g_late_operations = [
                     ];


# Specification of required parameters (req_params) and optional
# parameters (opt_params) for a given Operation
%g_operation_params =
  (
   'LS::Operation::Search'   => {'req_params' => {
                                                  'a'      => 'srchls',
                                                 },
                                 'opt_params' => {
                                                  'q1'     => undef,
                                                  'pn'     => '1',
                                                  'sz'     => undef,
                                                  'start'  => undef,
                                                  'au'     => undef,
                                                  'ti'     => undef,
                                                  'da'     => undef,
                                                  'lmt'    => undef,
                                                  'debug'  => undef,
                                                  'newsid' => undef,
                                                 }
                                },
   
   'Operation::Login' => {'req_params' => {
                                          },
                          'opt_params' => {
                                          },
                         },
  );


# Specification of Operations for a given Action and the corresponding
# PIFiller and templates associated with the Action
%g_action_bindings =
  (
   # ----- UI (view) production action -----
   'ACTION_LS_SEARCH'  =>
 {'action_param' => 'srchls',
  'action_type'  => 'UI',
  'operations'   => [  
                     'LS::Operation::Search',
                    ],
  'view'         => {'default' => {
                                   'builders' => [
                                                  'LS::Operation::ListSearchResults',
                                                 ],
                                   'template' => 'list_search_results.xml',
                                   'filler'   => 'LS::PIFiller::ListSearchResults',
                                  },
                    },
 },
   
   # ----- UI (page) production action -----
   # e.g. a=page;page=error
   'ACTION_DISP_PAGE'   =>
 {'action_param' => 'page',
  'action_type'  => 'UI',
  'operations'   => [
                    ],
  'view'         => {'error' => {
                                 'builders' => [],
                                 'template' => 'error.xml',
                                 'filler'   => 'PIFiller::Error',
                                },
                     'help'  => {
                                 'builders' => [],
                                 'template' => 'help.xml',
                                 'filler'   => 'PIFiller::Help',
                                },
                     'faq'   => {
                                 'builders' => [],
                                 'template' => 'faq.xml',
                                 'filler'   => 'PIFiller::Faq',
                                },
                     'home'  => {
                                 'builders' => [],
                                 'template' => 'home.xml',
                                 'filler'   => 'LS::PIFiller::Home',
                                },
                                
#                     'advanced'  => {
#                                 'builders' => [],
#                                 'template' => 'advanced.xml',
#                                 'filler'   => 'LS::PIFiller::Advanced',
#                                },

                    },
 },
  );

