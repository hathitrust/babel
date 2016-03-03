#
# Bindings of parameters to actions and definitions of minimal set of
# parameters which must be present to constitute a valid parameter set
#

# URL parameter values must satisfy these regexps.  Parameters not
# listed can be anything and have any value.
%g_validator_for_param =
    (
     'a'        => 'addits|aditsnc|copyit|copyitnc|movit|movitnc|delit|listis|addc|delc|editc|editst|listcs|srch|page|srchm|listrchm|random|download',

     'c'        => '\d+',
     'c2'       => '\d+',
     'cn'       => '.*',
     'iid'      => '.*',
     'q1'       => '.*',
     'desc'     => '.*',
     'page'     => 'addc|ajax|srchresults|opac_srchresults|srch|help|faq|mbookshome|home|colls_owned_json',
     'sort'     => 'auth_a|auth_d|title_a|title_d|cn_a|cn_d|date_a|date_d|acc_a|acc_d|num_a|num_d|own_d|own_a|shrd_a|shrd_d|rel_a|rel_d',
     'shrd'     => '0|1',
     'lmt'      => 'ft',
     'debug'    => '.*',
     'newsid'   => '1|[a-z0-9]{32}',
     'pn'       => '\d+',
     'i2'       => '\d+',
     'ti'       => '.*',
     'au'       => '.*',
     'da'       => '.*',
     'id'       => '.*',
     'rattr'    => '\d+',
     'sz'       => '^([1-9]|[1-9][0-9]|100)$', # 1 <= sz <= 100
     'solridx'  => 'text|author|title|subject|isbn',
     'solrfct'  => '.*',
     'start'    => '\d+',
     'colltype' => 'pub|priv|updated|class|all|my-collections|updated|featured|my_colls|all_colls',
     'undo'     => '.*',  #XXX consider limiting to values of a param
     'skin'     => '.*',
     'testUser' => '.*',
     'callback' => '.*',
     'format'   => 'text|json',
     '_' => '.*',
    );

%g_url_to_field_name_map =
    (
     'auth_a'   => 'sort_author',
     'auth_d'   => 'sort_author',
     'title_d'  => 'sort_title',
     'title_a'  => 'sort_title',
     'cn_a'     => 'collname',
     'cn_d'     => 'collname',
     'date_a'   => 'sort_date',
     'date_d'   => 'sort_date',
     'num_a'    => 'num_items',
     'num_d'    => 'num_items',
     'own_a'    => 'owner_name',
     'own_d'    => 'owner_name',
     'shrd_a'   => 'shared',
     'shrd_d'   => 'shared',
     'rel_a'    => 'rel',   #XXX temp until lucene integration
     'rel_d'    => 'rel',   #XXX temp until lucene integration
    );


# Specification of global *database* operations to be executed before
# Action-specific opertations are executed
$g_early_operations = [
                       'Operation::Login',
                       'MBooks::Operation::LogoutTrap',
                      ];

# Specification of global *database* operations to be executed after
# Action-specific opertations are executed
$g_late_operations = [
                     ];


# Specification of required parameters (req_params) and optional
# parameters (opt_params) for a given Operation
%g_operation_params =
    (
     'MBooks::Operation::DisplayPage' => {'req_params' => {
                                                           'page'  => undef,
                                                          },
                                          'opt_params' => {
                                                          },
                                         },
     'MBooks::Operation::AddColl'     => {'req_params' => {
                                                           'cn'    => undef,
                                                          },
                                          'opt_params' => {
                                                           'desc'  => '',
                                                           'colltype' =>undef,
                                                          },
                                         },
     'MBooks::Operation::CopyItems'   => {'req_params' => {
                                                           'c2'    => undef,
                                                           'id'   => undef,
                                                          },
                                          'opt_params' => {
                                                          }
                                         },
     'MBooks::Operation::DeleteColl'  => {'req_params' => {
                                                           'a'     => 'delc',
                                                           'c'     => undef,
                                                          },
                                          'opt_params' => {
                                                          }
                                         },
     'MBooks::Operation::DeleteItems' => {'req_params' => {
                                                           'c'     => undef,
                                                           'id'   => undef,
                                                          },
                                          'opt_params' => {
                                                          }
                                         },
     'MBooks::Operation::EditColl'    => {'req_params' => {
                                                           'a'     => 'editc',
                                                           'c'     => undef,
                                                          },
                                          'opt_params' => {
                                                          }
                                         },
     'MBooks::Operation::ListColls'   => {'req_params' => {
                                                           'a'     => 'listcs',
                                                          },
                                          'opt_params' => {
                                                           'colltype' => 'pub',
                                                           'sort'     => 'cn_a',
                                                           'skin'     => undef,
                                                          }
                                         },
     'MBooks::Operation::ListItems'   => {'req_params' => {
                                                           'a'     => 'listis',
                                                           'c'     => undef,
                                                          },
                                          'opt_params' => {
                                                           'sort'  => 'title_a',
                                                           'pn'    => '1',
                                                           'sz'    => undef,
                                                           'skin'  => undef,
                                                          }
                                         },
     'MBooks::Operation::DownloadItemsMetadata'   => {'req_params' => {
                                                           'a'     => 'download',
                                                           'c'     => undef,
                                                          },
                                          'opt_params' => {
                                                           'sort'  => undef,
                                                           'pn'    => undef,
                                                           'sz'    => undef,
                                                           'skin'  => undef,
                                                           'format' => undef,
                                                          }
                                         },
     'MBooks::Operation::ListSearchResults'   => {'req_params' => {
                                                           'a'     => 'listsrch',
                                                           'c'     => undef,  #XXX
                                                           'q1'    => undef,  #XXX
                                                           },
                                          'opt_params' => {
                                                           'sort'  => 'rel_d',
                                                           'pn'    => '1',
                                                           'sz'    =>  undef,
                                                           'skin'  => undef,
                                                          }
                                         },

     'MBooks::Operation::ListSearchResults_AllMARC'   => {'req_params' => {
                                                           'a'     => 'listsrchm',
                                                           'c'     => undef,  #XXX
                                                           'q1'    => undef,  #XXX
                                                          },
                                          'opt_params' => {
                                                           'sort'  => 'rel_d',
                                                           'pn'    => '1',
                                                           'sz'    => undef,
                                                           'start' => '0',
                                                           'solridx' =>undef,
                                                           'solrfct' =>undef,
                                                          }
                                         },




     'MBooks::Operation::Search'      => {'req_params' => {
                                                           'a'     => 'srch',
                                                           'c'     => undef,
                                                           'q1'    => undef,
                                                          },
                                          'opt_params' => {
                                                          },
                                         },
     'MBooks::Operation::Search_AllMARC'      => {'req_params' => {
                                                           'a'     => 'srchm',
                                                           'c'     => undef,
                                                           'q1'    => undef,
                                                          },
                                          'opt_params' => {
                                                           'solrfct' =>undef,
                                                           'solridx' =>undef,
                                                          },
                                         },


     'MBooks::Operation::Login'       => {'req_params' => {
                                                          },
                                          'opt_params' => {
                                                          },
                                         },
    );


# Specification of Operations for a given Action and the corresponding
# PIFiller and templates associated with the Action
%g_action_bindings =
    (
     # ----- UI (page) production action -----
     # e.g. a=page;page=error
     'ACTION_DISP_PAGE'   =>
     {'action_param' => 'page',
      'action_type'  => 'UI',
      'operations'   => [
                         'MBooks::Operation::DisplayPage',
                        ],
      'view'         => {'error' => {
                                     'builders' => [],
                                     'template' => 'error.xml',
                                     'filler'   => 'MBooks::PIFiller::Error',
                                    },
                         'error_ajax' => {
                                          'builders' => [],
                                          'template' => 'error_ajax.xml',
                                          'filler'   => 'MBooks::PIFiller::Error_Ajax',
                                    },

                         'colls_owned_json' => {
                                          'builders' => [],
                                          'template' => 'colls_owned_json.xml',
                                          'filler'   => 'MBooks::PIFiller::JSON',
                                    },


                         'help'   => {
                                     'builders' => [],
                                     'template' => 'help.xml',
                                     'filler'   => 'MBooks::PIFiller::Help',
                                    },
                         'faq'   => {
                                     'builders' => [],
                                     'template' => 'faq.xml',
                                     'filler'   => 'MBooks::PIFiller::Faq',
                                    },
                         #XXX temp fix for old bookmarks to discontinued old home page
                         'home'  => {
                                     'builders' => [],
                                     'template' => 'NoHome.xml',
                                     'filler'   => 'MBooks::PIFiller::NoHome',
                                    },


                         'mbookshome'  => {
                                     'builders' => [],
                                     'template' => 'home.xml',
                                     'filler'   => 'MBooks::PIFiller::Home',
                                    },
                        },
     },

     # ----- UI (view) production action -----
     'ACTION_LIST_COLLS'  =>
     {'action_param' => 'listcs',
      'action_type'  => 'UI',
      'operations'   => [
                        ],
      'view'         => {
                          'ajax' => {
                                       'builders' => [
                                                      'MBooks::Operation::ListColls',
                                                     ],
                                       'template' => 'list_colls_ajax.xml',
                                       'filler'   => 'MBooks::PIFiller::ListColls',
                                       'content_type' => 'application/javascript',
                                      },
                          'default' => {
                                       'builders' => [
                                                      'MBooks::Operation::ListColls',
                                                     ],
                                       'template' => 'list_colls.xml',
                                       'filler'   => 'MBooks::PIFiller::ListColls',
                                      },
                        },
     },

     # ----- UI (view) production action -----
     'ACTION_LIST_ITEMS'  =>
     {'action_param' => 'listis',
      'action_type'  => 'UI',
      'operations'   => [
                        ],
      'view'         => {
                          'ajax' => {
                                       'builders' => [
                                                      'MBooks::Operation::ListItems',
                                                     ],
                                       'template' => 'list_items_ajax.xml',
                                       'filler'   => 'MBooks::PIFiller::ListItems',
                                       'content_type' => 'application/javascript',
                                      },
                          'default' => {
                                       'builders' => [
                                                      'MBooks::Operation::ListItems',
                                                     ],
                                       'template' => 'list_items.xml',
                                       'filler'   => 'MBooks::PIFiller::ListItems',
                                      },
                        },
     },
     # ----- UI (view) production action -----
     'ACTION_DOWNLOAD_ITEMS_METADATA'  =>
     {'action_param' => 'download',
      'action_type'  => 'database',
      'operations'   => [
                        ],
      'view'         => {
                          'ajax' => {
                                    },
                          'default' => {
                                          'builders' => [
                                            'MBooks::Operation::DownloadItemsMetadata',
                                          ],
                                          'content_type' => 'text/plain',
                                          'template' => undef,
                                      },
                        },
     },
     # ----- UI (view) production action -----
     'ACTION_LIST_SEARCH_RESULTS'  =>
     {'action_param' => 'listsrch',
      'action_type'  => 'UI',
      'operations'   => [
                        ],
      'view'         => {'default' => {
                                       'builders' => [
                                                      'MBooks::Operation::ListSearchResults',
                                                     ],
                                       'template' => 'list_search_results.xml',
                                       'filler'   => 'MBooks::PIFiller::ListSearchResults',
                                      },
                        },
     },

     # ----- database read/update action -----
     'ACTION_ADD_COLL'    =>
     {'action_param' => 'addc',
      'action_type'  => 'database',
      'operations'   => [
                         'MBooks::Operation::AddColl',
                        ],
      'view'         => {'default' => {
                                       'redirect' => 'ACTION_LIST_COLLS',
                                      },
                        },
     },


     # ----- database read/update action -----
     'ACTION_DEL_COLL'    =>
     {'action_param' => 'delc',
      'action_type'  => 'database',
      'operations'   => [
                         'MBooks::Operation::DeleteColl',
                        ],
      'view'         => {'default' => {
                                       'redirect' => 'ACTION_LIST_COLLS',
                                      },
                        },
     },


     # ----- database read/update action -----
     'ACTION_EDIT_COLL'   =>
     {'action_param' => 'editc',
      'action_type'  => 'database',
      'operations'   => [
                         'MBooks::Operation::EditColl',
                        ],
      'view'         => {'default' => {
                                       'redirect' => 'ACTION_LIST_ITEMS',
                                      },
                        },
     },


     # ----- database read/update action -----
     'ACTION_EDIT_STATUS'   =>
     {'action_param' => 'editst',
      'action_type'  => 'database',
      'operations'   => [
                         'MBooks::Operation::EditColl',
                        ],
      'view'         => {'default' => {
                                       'redirect' => 'ACTION_LIST_COLLS',
                                      },
                        },
     },


     # ----- database read/update action -----
     'ACTION_ADD_MULTIPLE_ITEMS'   =>
     {'action_param' => 'addits',
      'action_type'  => 'database',
      'operations'   => [
                         'MBooks::Operation::AddMultipleItems',
                         'MBooks::Operation::CopyItems',
                        ],
      'view'         => {'default' => {
                                       'redirect' => 'ACTION_LIST_ITEMS',
                                      },
                         'ajax'    => {
                                       'builders' => [],
                                       'template' => 'add_multiple_items_ajax.xml',
                                       'filler'   => 'MBooks::PIFiller::AddMultipleItems',
                                      },
                        },
     },


     # ----- database read/update action -----
     'ACTION_ADD_MULTIPLE_ITEMS_NC'   =>
     {'action_param' => 'additsnc',
      'action_type'  => 'database',
      'operations'   => [
                         'MBooks::Operation::AddColl',
                         'MBooks::Operation::AddMultipleItems',
                         'MBooks::Operation::CopyItems',
                        ],
      'view'         => {'default' => {
                                       'redirect' => 'ACTION_LIST_COLLS',
                                      },
                         'ajax'    => {
                                       'builders' => [],
                                       'template' => 'add_multiple_items_ajax.xml',
                                       'filler'   => 'MBooks::PIFiller::AddMultipleItems',
                                      },
                        },
     },


     # ----- database read/update action -----
     'ACTION_COPY_ITEM'   =>
     {'action_param'  => 'copyit',
      'action_type'   => 'database',
      'operations'    => [
                          'MBooks::Operation::CopyItems',
                         ],
      # delete and move get redirect, copy should be ajax for both
      # search and list_items
      'view'         => {'default'     => {
                                           'redirect' => 'ACTION_LIST_ITEMS',
                                          },
                         'srchresults' => {
                                           'redirect' => 'ACTION_LIST_SEARCH_RESULTS',
                                          },
                         'srch'        => {
                                           'redirect' => 'ACTION_SEARCH',
                                          },
                        },
     },

     # ----- database read/update action -----
     'ACTION_COPY_ITEM_NC'=>
     {'action_param' => 'copyitnc',
      'action_type'  => 'database',
      'operations'   => [
                         'MBooks::Operation::AddColl',
                         'MBooks::Operation::CopyItems',
                        ],
      # delete and move get redirect, copy should be ajax for both
      # search and list_items
      'view'         => {'default'     => {
                                           'redirect' => 'ACTION_LIST_ITEMS',
                                          },
                         'srchresults' => {
                                           'redirect' => 'ACTION_LIST_SEARCH_RESULTS',
                                          },
                        },
     },


     # ----- database read/update action -----
     'ACTION_MOVE_ITEM'    =>
     {'action_param' => 'movit',
      'action_type'  => 'database',
      'operations'   => [
                         'MBooks::Operation::CopyItems',
                         'MBooks::Operation::DeleteItems',
                        ],
      'view'         => {'default'     => {
                                           'redirect' => 'ACTION_LIST_ITEMS',
                                          },
                         'srchresults' => {
                                           'redirect' => 'ACTION_LIST_SEARCH_RESULTS',
                                          },
                        },
     },


     # ----- database read/update action -----
     'ACTION_MOVE_ITEM_NC'    =>
     {'action_param' => 'movitnc',
      'action_type'  => 'database',
      'operations'   => [
                         'MBooks::Operation::AddColl',
                         'MBooks::Operation::CopyItems',
                         'MBooks::Operation::DeleteItems',
                        ],
      'view'         => {'default'     => {
                                           'redirect' => 'ACTION_LIST_ITEMS',
                                          },
                         'srchresults' => {
                                           'redirect' => 'ACTION_LIST_SEARCH_RESULTS',
                                          },
                        },
     },


     # ----- database read/update action -----
     'ACTION_DEL_ITEM'    =>
     {'action_param'  => 'delit',
      'action_type'   => 'database',
      'operations'    => [
                          'MBooks::Operation::DeleteItems',
                         ],
      'view'          => {'default'     => {
                                            'redirect' => 'ACTION_LIST_ITEMS',
                                           },
                          'srchresults' => {
                                            'redirect' => 'ACTION_LIST_SEARCH_RESULTS',
                                           },
                         },
     },


     # ----- database read action -----
     'ACTION_SEARCH'      =>
     {'action_param' => 'srch',
      'action_type'  => 'database',
      'operations'   => [
                         'MBooks::Operation::Search',
                        ],
      'view'         => {'default' => {
                                       'redirect' => 'ACTION_LIST_SEARCH_RESULTS',
                                      },
                         'ajax'    => {
                                       'builders' => [],
                                       'template' => 'search_results_ajax.xml',
                                       'filler'   => 'MBooks::PIFiller::Search',
                                      },
                        },

     },

     # ----- database read action -----
     'ACTION_RANDOM'      =>
     {'action_param' => 'random',
      'action_type'  => 'UI',
      'operations'   => [
                         'MBooks::Operation::RandomFeatured',
                        ],
      'view'         => {'default' => {
                                       'builders' => [
                                                      'MBooks::Operation::RandomFeatured',
                                                     ],
                                       'template' => 'random_featured.xml',
                                       'filler'   => 'MBooks::PIFiller::RandomFeatured',
                                      },
                        },

     },

    );

