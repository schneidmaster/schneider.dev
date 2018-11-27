---
title: Building Phantom.js 2.0 for OSX
date: 2015-06-04 03:24:02 Z
tags:
- development
- phantomjs
layout: post
draft: false
category: development
---

Problem: You're trying to build the Phantom.js 2.0 branch for OSX and you're getting a bunch of compile time errors related to makefile generation.

Solution: `brew unlink cmake` and the compilation works without a hitch. (You can restore it with `brew link cmake` after compiling.)

Explanation: Qt relies on a bundled version of cmake to compile. Homebrew-installed cmake overrides this version and makes Qt unhappy.

Amount of time it took me to find such a simple solution: Ungodly.
