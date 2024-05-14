#!/bin/bash

SOLR_URL=${SOLR_URL:-$LSS_SOLR}
SOLR_URL=${SOLR_URL:-"http://localhost:8983/solr/core-x"}

echo "Indexing records into Solr... ($SOLR_URL)"
for file in "$@";
do
  echo "Indexing $file"
  (echo '<add>'; cat $file; echo '</add>') |
   curl -S -s -X POST -H "Content-Type:application/xml"  --data-binary @- "$SOLR_URL/update" && echo "Done"
done

echo "Committing"
curl -S -s -H "Content-Type: application/json" -X POST -d'{"commit": {}}' "$SOLR_URL/update?wt=json" && echo "Done"
