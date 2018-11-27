---
title: 'Code Golf: Archive Entire Website to PDF'
date: 2014-09-27 01:05:19 Z
tags:
- development
- codegolf
layout: post
draft: false
category: development
---

Recently, a friend asked me for help with a research project. He needed to gather data on high school websites, which required him to capture a snapshot of a bunch of complete websites (recursively following links) as a PDF. Obviously, manually printing every page of a website is ludicrously tedious so he asked if I had any computer science magic that could help. I've never met a computer problem that bash can't solve, so I hacked around for a few hours and came up with the following script, which I decided to post for posterity. To run it, install [wkhtmltopdf](http://wkhtmltopdf.org/) (tested with the OSX 10.6+ Carbon version; the Homebrew version will definitely not work), install wget (with Homebrew, `brew install wget`), save the script as `web2pdf.sh`, `chmod a+x web2pdf.sh`, and `./web2pdf.sh website.com`. The script will recursively crawl all links on the site and save each page as a PDF file. The files will be saved in a directory named `website.com` created in the same directory as the `web2pdf.sh` script, and the URL structure of the site will be replicated in subdirectories (so `http://website.com/some/dir/page.html` will be saved in `website.com/some/dir/page.html.pdf`). I hope this is of use to somebody sometime because it was surprisingly hellaciously fun to write. Cheers!

```bash
#!/bin/bash
WNAME=$(basename $1)
mkdir -p $WNAME
wget -r -p -U Mozilla --follow-tags=a --delete-after $1 2>&1 | grep http:// | awk '{print $3}' | grep -v 'txt$' | while read -r url; do
  BNAME=$(basename $url)
  DNAME=$(dirname $url)
  DIRS=$(echo $(echo "$DNAME" | cut -d"/" -f4-))
  if [ "$DIRS" != "http:" ]; then
    if [ ! -d "$WNAME/$DIRS" ]; then
      mkdir -p $("$WNAME/$DIRS")
    fi
  fi
  if [ ${url##*.} = "pdf" ]; then
    if [ "$DIRS" = "http:" ]; then
      wget -U Mozilla -O "$WNAME/$BNAME" $url
    else
      wget -U Mozilla -O "$WNAME/$DIRS/$BNAME" $url
    fi
  else
    if [ "$DIRS" = "http:" ]; then
      wkhtmltopdf --orientation Landscape "$url" "$WNAME/$BNAME.pdf"
    else
      wkhtmltopdf --orientation Landscape "$url" "$WNAME/$DIRS/$BNAME.pdf"
    fi
  fi
done
```
