package WAYF::IdpConfig;

# HathiTrust Shibboleth IdP URLs and link text, icons, etc. Keyed by GRIN code

%HT = 
    (
     # Test
     'testshib' => {
                    'authtype' => 'shibboleth',
                    'link_text' => 'University of Michigan Test Shibboleth',
                    'template'  => 'https://___HOST___/Shibboleth.sso/uom?target=___TARGET___',
                    'enabled' => '0',
                   },
     
     # Live
     'uom'  =>     {
                    'authtype' => 'cosign',
                    'link_text' => 'University of Michigan',
                    'template'  => '___TARGET___',
                    'enabled' =>  '1',
                   },     
     'msu'  =>     {
                    'authtype' => 'shibboleth',
                    'link_text' => 'Michigan State University',
                    'template'  => 'https://___HOST___/Shibboleth.sso/msu?target=___TARGET___',
                    'enabled' =>  '1',
                   },
     'nwu'  =>     {
                    'authtype' => 'shibboleth',
                    'link_text' => 'Northwestern University',
                    'template'  => 'https://___HOST___/Shibboleth.sso/nwu?target=___TARGET___',
                    'enabled' =>  '1',
                   },
     'chi'  =>     {
                    'authtype' => 'shibboleth',
                    'link_text' => 'University of Chicago',
                    'template'  => 'https://___HOST___/Shibboleth.sso/chi?target=___TARGET___',
                    'enabled' =>  '1',
                   },
     'ind'  =>     {
                    'authtype' => 'shibboleth',
                    'link_text' => 'Indiana University',
                    'template'  => 'https://___HOST___/Shibboleth.sso/ind?target=___TARGET___',
                    'enabled' => '1',
                   },
     'iowa' =>     {
                    'authtype' => 'shibboleth',
                    'link_text' => 'University of Iowa',
                    'template'  => 'https://___HOST___/Shibboleth.sso/iowa?target=___TARGET___',
                    'enabled' => '1',
                   },
     'purd' =>     {
                    'authtype' => 'shibboleth',
                    'link_text' => 'Purdue University',
                    'template'  => 'https://___HOST___/Shibboleth.sso/purd?target=___TARGET___',
                    'enabled' => '1',
                   },
     'uiuc' =>     {
                    'authtype' => 'shibboleth',
                    'link_text' => 'University of Illinois at Urbana-Champaign',
                    'template'  => 'https://___HOST___/Shibboleth.sso/uiuc?target=___TARGET___',
                    'enabled' => '1',
                   },
     'wisc' =>     {
                    'authtype' => 'shibboleth',
                    'link_text' => 'University of Wisconsin - Madison',
                    'template'  => 'https://___HOST___/Shibboleth.sso/wisc?target=___TARGET___',
                    'enabled' => '1',
                  },
     'columbia' => {
                    'authtype' => 'shibboleth',
                    'link_text' => 'Columbia University',
                    'template'  => 'https://___HOST___/Shibboleth.sso/columbia?target=___TARGET___',
                    'enabled' => '1',
                  },
     'minn' =>    {
                   'authtype' => 'shibboleth',
                   'link_text' => 'University of Minnesota',
                   'template'  => 'https://___HOST___/Shibboleth.sso/minn?target=___TARGET___',
                   'enabled' => '1',
                  },
     'psu'  =>    {
                   'authtype' => 'shibboleth',
                   'link_text' => 'Pennsylvania State University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/psu?target=___TARGET___',
                   'enabled' => '1',
                  },
     'prnc'  =>   {
                   'authtype' => 'shibboleth',
                   'link_text' => 'Princeton University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/prnc?target=___TARGET___',
                   'enabled' => '1',
                  },
     
     # Waiting
     'uic'  =>     {
                    'authtype' => 'shibboleth',
                    'link_text' => 'University of Illinois, Chicago',
                    'template'  => 'https://___HOST___/Shibboleth.sso/uic?target=___TARGET___',
                    'enabled' => '0',
                   },
     'uva'  =>     {
                    'authtype' => 'shibboleth',
                    'link_text' => 'University of Virginia',
                    'template'  => 'https://___HOST___/Shibboleth.sso/uva?target=___TARGET___',
                    'enabled' => '0',
                   },
     'osu'  =>     {
                    'authtype' => 'shibboleth',
                    'link_text' => 'Ohio State University',
                    'template'  => 'https://___HOST___/Shibboleth.sso/osu?target=___TARGET___',
                    'enabled' => '0',
                   },
     'ucal' =>     {
                    'authtype' => 'shibboleth',
                    'link_text' => 'University of California, Berkeley',
                    'template'  => 'https://___HOST___/Shibboleth.sso/ucal?target=___TARGET___',
                    'enabled' => '0',
                   },
     'ucal-1' =>   {
                    'authtype' => 'shibboleth',
                    'link_text' => 'University of California, Davis',
                    'template'  => 'https://___HOST___/Shibboleth.sso/ucal-1?target=___TARGET___',
                    'enabled' => '0',
                   },
     'ucal-2' =>   {
                    'authtype' => 'shibboleth',
                    'link_text' => 'University of California, Irvine',
                    'template'  => 'https://___HOST___/Shibboleth.sso/ucal-2?target=___TARGET___',
                    'enabled' => '0',
                   },
     'ucal-3' =>   {
                    'authtype' => 'shibboleth',
                    'link_text' => 'University of California, Los Angeles',
                    'template'  => 'https://___HOST___/Shibboleth.sso/ucal-3?target=___TARGET___',
                    'enabled' => '0',
                   },
     'ucal-4' =>   {
                    'authtype' => 'shibboleth',
                    'link_text' => 'University of California, Merced',
                    'template'  => 'https://___HOST___/Shibboleth.sso/ucal-4?target=___TARGET___',
                    'enabled' => '0',
                   },
     'ucal-5' =>   {
                    'authtype' => 'shibboleth',
                    'link_text' => 'University of California, Riverside',
                    'template'  => 'https://___HOST___/Shibboleth.sso/ucal-5?target=___TARGET___',
                    'enabled' => '0',
                   },
     'ucal-6' =>   {
                    'authtype' => 'shibboleth',
                    'link_text' => 'University of California, San Diego',
                    'template'  => 'https://___HOST___/Shibboleth.sso/ucal-6?target=___TARGET___',
                    'enabled' => '0',
                   },
     'ucal-7' =>   {
                    'authtype' => 'shibboleth',
                    'link_text' => 'University of California, San Francisco',
                    'template'  => 'https://___HOST___/Shibboleth.sso/ucal-7?target=___TARGET___',
                    'enabled' => '0',
                   },
     'ucal-8' =>   {
                    'authtype' => 'shibboleth',
                    'link_text' => 'University of California, Santa Barbara',
                    'template'  => 'https://___HOST___/Shibboleth.sso/ucal-8?target=___TARGET___',
                    'enabled' => '0',
                   },
     'ucal-9' =>   {
                    'authtype' => 'shibboleth',
                    'link_text' => 'University of California, Santa Cruz',
                    'template'  => 'https://___HOST___/Shibboleth.sso/ucal-9?target=___TARGET___',
                    'enabled' => '0',
                   },
    );

1;
