package WAYF::IdpConfig;

# HathiTrust Shibboleth IdP URLs and link text, icons, etc. Keyed by GRIN code

%HT =
  (
   # Test
   'testshib'  => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of Michigan Test Shibboleth',
                   'template'  => 'https://___HOST___/Shibboleth.sso/uom?target=___TARGET___',
                   'enabled'   => '0',
                  },           
                               
   # Live                      
   'uom'       => {            
                   'authtype'  => 'cosign',
                   'link_text' => 'University of Michigan',
                   'template'  => '___TARGET___',
                   'enabled'   =>  '1',
                  },           
   'msu'       => {            
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Michigan State University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/msu?target=___TARGET___',
                   'enabled'   =>  '1',
                  },           
   'nwu'       => {            
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Northwestern University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/nwu?target=___TARGET___',
                   'enabled'   =>  '1',
                  },           
   'chi'       => {            
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of Chicago',
                   'template'  => 'https://___HOST___/Shibboleth.sso/chi?target=___TARGET___',
                   'enabled'   =>  '1',
                  },           
   'ind'       => {            
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Indiana University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/ind?target=___TARGET___',
                   'enabled'   => '1',
                  },           
   'iowa'      => {            
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of Iowa',
                   'template'  => 'https://___HOST___/Shibboleth.sso/iowa?target=___TARGET___',
                   'enabled'   => '1',
                  },           
   'purd'      => {            
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Purdue University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/purd?target=___TARGET___',
                   'enabled'   => '1',
                  },           
   'uiuc'      => {            
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of Illinois at Urbana-Champaign',
                   'template'  => 'https://___HOST___/Shibboleth.sso/uiuc?target=___TARGET___',
                   'enabled'   => '1',
                  },           
   'wisc'      => {            
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of Wisconsin - Madison',
                   'template'  => 'https://___HOST___/Shibboleth.sso/wisc?target=___TARGET___',
                   'enabled'   => '1',
                  },           
   'columbia'  => {            
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Columbia University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/columbia?target=___TARGET___',
                   'enabled'   => '1',
                  },
   'minn'      => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of Minnesota',
                   'template'  => 'https://___HOST___/Shibboleth.sso/minn?target=___TARGET___',
                   'enabled'   => '1',
                  },
   'psu'       => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Pennsylvania State University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/psu?target=___TARGET___',
                   'enabled'   => '1',
                  },
   'prnc'      => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Princeton University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/prnc?target=___TARGET___',
                   'enabled'   => '1',
                  },
   'jhu'       => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Johns Hopkins University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/jhu?target=___TARGET___',
                   'enabled'   => '1',
                  },
   'ucsd'      => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of California, San Diego',
                   'template'  => 'https://___HOST___/Shibboleth.sso/ucsd?target=___TARGET___',
                   'enabled'   => '1',
                  },
   'stanford'  => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Stanford University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/stanford?target=___TARGET___',
                   'enabled'   => '1',
                  },
   'cornell'   => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Cornell University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/cornell?target=___TARGET___',
                   'enabled'   => '1',
                  },
   'tamu'      => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Texas A&amp;M University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/tamu?target=___TARGET___',
                   'enabled'   => '1',
                  },
   'dart'      => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Dartmouth College',
                   'template'  => 'https://___HOST___/Shibboleth.sso/dart?target=___TARGET___',
                   'enabled'   => '1',
                  },
   'washington' => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of Washington',
                   'template'  => 'https://___HOST___/Shibboleth.sso/washington?target=___TARGET___',
                   'enabled'   => '1',
                  },
   'ucla'      => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of California, Los Angeles',
                   'template'  => 'https://___HOST___/Shibboleth.sso/ucla?target=___TARGET___',
                   'enabled'   => '1',
                  },
   'utah'      => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of Utah',
                   'template'  => 'https://___HOST___/Shibboleth.sso/utah?target=___TARGET___',
                   'enabled'   => '1',
                  },
   'baylor'    => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Baylor University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/baylor?target=___TARGET___',
                   'enabled'   => '1',
                  },
   
   # Waiting
   'usu'       => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Utah State University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/usu?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'upenn'     => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of Pennsylvania',
                   'template'  => 'https://___HOST___/Shibboleth.sso/upenn?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'uic'       => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of Illinois at Chicago',
                   'template'  => 'https://___HOST___/Shibboleth.sso/uic?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'uva'       => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of Virginia',
                   'template'  => 'https://___HOST___/Shibboleth.sso/uva?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'osu'       => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Ohio State University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/osu?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'berkeley'  => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of California, Berkeley',
                   'template'  => 'https://___HOST___/Shibboleth.sso/berkeley?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'ucdavis'   => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of California, Davis',
                   'template'  => 'https://___HOST___/Shibboleth.sso/ucdavis?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'uci'       => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of California, Irvine',
                   'template'  => 'https://___HOST___/Shibboleth.sso/uci?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'ucmerced'  => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of California, Merced',
                   'template'  => 'https://___HOST___/Shibboleth.sso/ucmerced?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'ucr'       => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of California, Riverside',
                   'template'  => 'https://___HOST___/Shibboleth.sso/ucr?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'ucsf'      => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of California, San Francisco',
                   'template'  => 'https://___HOST___/Shibboleth.sso/ucsf?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'ucsb'      => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of California, Santa Barbara',
                   'template'  => 'https://___HOST___/Shibboleth.sso/ucsb?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'ucsc'      => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of California, Santa Cruz',
                   'template'  => 'https://___HOST___/Shibboleth.sso/ucsc?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'asu'       => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Arizona State University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/asu?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'duke'      => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Duke University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/duke?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'emory'     => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Emory University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/emory?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'harvard'   => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Harvard University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/harvard?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'mit'       => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Massachusetts Institute of Technology',
                   'template'  => 'https://___HOST___/Shibboleth.sso/mit?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'nyu'       => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'New York University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/nyu?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'ncsu'      => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'North Carolina State University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/ncsu?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'ucm'       => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Universidad Complutense Madrid',
                   'template'  => 'https://___HOST___/Shibboleth.sso/ucm?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'umaryland' => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of Maryland, Baltimore',
                   'template'  => 'https://___HOST___/Shibboleth.sso/umaryland?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'umd'       => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of Maryland, College Park',
                   'template'  => 'https://___HOST___/Shibboleth.sso/umd?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'unc'       => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'University of North Carolina, Chapel Hill',
                   'template'  => 'https://___HOST___/Shibboleth.sso/unc?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'yale'      => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'Yale University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/yale?target=___TARGET___',
                   'enabled'   => '0',
                  },
   'nccu'      => {
                   'authtype'  => 'shibboleth',
                   'link_text' => 'North Carolina Central University',
                   'template'  => 'https://___HOST___/Shibboleth.sso/nccu?target=___TARGET___',
                   'enabled'   => '0',
                  },
  );

1;
