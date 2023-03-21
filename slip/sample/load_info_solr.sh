#!/bin/bash

SOLR_URL="http://localhost:8983/solr/core-x"
echo "Indexing records into Solr..."
nrec=$(/bin/ls *.xml | wc -l)
i=0
for file in $(/bin/ls *.xml);
do
  (echo '<add>'; cat $file; echo '</add>') |
   curl -s -X POST -H "Content-Type:application/xml"  --data-binary @- "$SOLR_URL/update"

  echo "Indexed $file"
done

echo "Committing"
curl -s -H "Content-Type: application/json" -X POST -d'{"commit": {}}' "$SOLR_URL/update?wt=json"
echo "Done"
