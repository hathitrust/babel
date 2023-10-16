#
# RDIST Large-scale indexing scripts Distribution File
#
# PURPOSE: deploy SLIP from test.babel.hathitrust.org to production
# ingest and Solr hosts. The Solr build and ingest machines all see
# /sdr1 NFS so we only need to rdist to each site for all hosts to see
# the updates.
#
# Destination Servers
#
NASMACC = ( nas-macc.umdl.umich.edu )
NASICTC = ( nas-ictc.umdl.umich.edu )

#
# File Directories to be released (source) and (destination)
#
APP_src  = ( /htapps/test.babel/slip )
APP_dest = ( /htapps/babel/slip )

#
# Release instructions
#
( ${APP_src} ) -> ( ${NASMACC} ${NASICTC} )
        install -oremove ${APP_dest};
        except_pat ( \\.git yui2-lib STOPSLIP );
        notify hathitrust-release@umich.edu ;

