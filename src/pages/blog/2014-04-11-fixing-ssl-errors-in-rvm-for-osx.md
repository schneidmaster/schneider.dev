---
title: Fixing SSL errors in rvm for OSX
date: 2014-04-11 16:39:03 Z
tags:
- development
- rvm
- ssl
- osx
layout: post
draft: false
category: development
---

I recently had a fairly extended and annoying fight trying to get [rvm](http://rvm.io/) to install gems from HTTPS sources, so I decided to post the quick solution for other people in my predicament:

The error in question is:

    ERROR:  While executing gem ... (Gem::Exception)
    Unable to require openssl, install OpenSSL and rebuild ruby (preferred) or use non-HTTPS sources
    
And the solution (assuming you use Homebrew) is:

1. `rvm get stable`

2. `rvm reload`

3. `brew update`

4. `brew install openssl`

5. `brew link openssl --force` (I have no idea why, but this was the ticket)

6. `brew install curl-ca-bundle` (Makes sure your CA certs are up to date)

7. `rvm autolibs enable` (Tells rvm to automatically use the OpenSSL library installed by Homebrew)

8. `rvm remove x.x.x` (x.x.x is the Ruby version you're using- e.g. 2.1.0.  If you use multiple Rubies, you will need to do this for all of them.)

9. `rvm install x.x.x` (Reinstall the Ruby you just uninstalled.  For some reason, I had to manually uninstall/reinstall rather than just using `rvm reinstall x.x.x`- YMMV.)

10. `gem install bundler` and be on your merry way!
