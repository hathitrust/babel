#
# Bindings of parameters to actions and definitions of minimal set of
# parameters which must be present to constitute a valid parameter set
#

# URL parameter values must satisfy these regexps.  Parameters not
# listed can be anything and have any value.
%g_validator_for_param =
    (
     'a'      => 'wayf',
     'url'    => '.*',
     'debug'  => '.*',
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
     'WAYF::Operation::WAYF' => {'req_params' => {
                                                 },
                                 'opt_params' => {
                                                  'target' => undef,
                                                  'debug'  => undef,
                                                 }
                                },
    );


# Specification of Operations for a given Action and the corresponding
# PIFiller and templates associated with the Action
%g_action_bindings =
    (
     # ----- UI (view) production action -----
     'ACTION_WAYF'  => {'action_param' => 'wayf',
                        'action_type'  => 'UI',
                        'operations'   => [  
                                           'WAYF::Operation::WAYF',
                                          ],
                        'view'         => {'default' => {
                                                         'builders' => [
                                                                       ],
                                                         'template' => 'wayf.xml',
                                                         'filler'   => 'WAYF::PIFiller::WAYF',
                                                        },
                                          },
                       },
    );

