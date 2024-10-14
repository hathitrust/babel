#!/bin/bash

dl_dir=/usr/src/babel/stage-item
htid="$1"

echo "This will only stage the text (not images), and only for public domain material."
echo "You must be connected to the Library VPN in order for this to work."
echo "⚠️  Items WILL NOT LOAD in PageTurner, but they will show in full-text search results and via ssd."

if [[ -z "$htid" ]]; then cat <<EOT
Usage: $0 namespace.id
EOT
  exit 1
fi

path=$(echo $htid | bundle exec ruby -e 'require "pairtree";ARGF.each {|l|l.chomp!;n,i=l.split(/\./,2);puts "#{n}/pairtree_root/#{Pairtree::Path.id_to_path i}"}')

echo

echo "🔽 Downloading $1 from $HT_REPO_HOST to $dl_dir"

rsync --copy-links --delete --ignore-errors --recursive --times --verbose datasets.hathitrust.org::ht_text_pd/"$path"/* $dl_dir

bundle exec ruby stage_item.rb "$htid"

