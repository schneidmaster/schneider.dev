---
title: My life is in my Dropbox (and yours should be too)
date: 2014-12-15 00:11:25 Z
tags:
- workflow
- dropbox
layout: post
draft: false
category: productivity
---

A few months ago, I realized that I was managing my files wrong. They lived on my Macbook and every so often when I thought about it I would plug in my old Seagate HDD and back up with Time Machine. I had a Dropbox and it was synced to my machine, but all it really held was a few odd files that I used Dropbox to share with people online. 

This setup was fine in 2008 or so, when Time Machine had just been released and I was still T9ing away on a Razr. But in 2014, it's not ideal for a few reasons:

* My files weren't really backed up. My backups relied on me remembering to plug in my Time Machine drive on a regular basis, which I often forgot to do for weeks on end, partially because Time Machine feels so darn slow. (Sure, this might be less of an issue if you have your Time Machine set up on a NAS, but that can be expensive [at least on my college budget] and doesn't solve the other problems.)
* My backup still resided in the same physical location as my computer most of the time (my apartment, not the cloud). If I experience a fire or something, my data is still lost.
* It's difficult to copy files to a new computer. Sure, I can restore from a Time Machine image (and it's really nifty how Apple made that work), but in many cases, I'm on a new computer for a little while and I just want to access a few files (like a folder of code). Or, I'm reinstalling my OS or upgrading to a new machine and I might want to save my files without saving my configuration settings and the kitchen sink.
* It's impossible to keep different sets of files synchronized across different machines. I have all of my files on my main Macbook, and a few folders of documents on another computer I use for occasional debate work. I want everything to stay in sync, but I only want a few folders on my debate computer, and I certainly don't want to deal with manually backing up multiple devices.

My solution, as the title of this post implies, was Dropbox. I spent the $10/mo for 1TB of storage with [Dropbox Pro](https://www.dropbox.com/upgrade) and moved all of my core files into Dropbox: the top-level folders on my Macbook (`~/Documents`, `~/Pictures`, etc.) now live in a `/Filesystem` folder in the root of my Dropbox. Then, I created symlinks from those folders back into my user folder (`ln -s ~/Dropbox/Documents ~/Documents`, etc.) This allows me to still use my filesystem as usual, but all of my core files are backed up to Dropbox by default. I've found this setup to have a few major advantages:

* All of my files are backed up, offsite, automatically, regardless of how lazy I am. Files are automatically synced across all the computers I use.
* I can easily sync certain files to certain computers using Selective Sync, which lets me dictate which folders are synchronized from Dropbox down to each computer. Or, if I just need one file on a public computer or something, it's easy to just download it from the Dropbox website and reupload it when I'm done.
* When I need to refresh my system, it's easy to bring back my files while cleaning out the gunk- I just have to sign in to Dropbox and wait for the magic to happen.
* It's still just as easy to create physical backups as before- I just have to copy my Dropbox folder to my external HDD, which is also faster than Time Machine because it's just copying files, not diffing or doing other magic.
* As an added bonus, my files are automatically available on my iPhone, which is useful for when I need to access things on the go or quickly share things. Dropbox's app is very convenient for viewing a variety of files, and they recently announced [integration](https://blog.dropbox.com/2014/11/dropbox-microsoft-office-integrations-now-available-on-mobile/) with the Microsoft Office mobile apps.

Managing my files and keeping regular backups has been much easier and more convenient since I shifted to Dropbox as the primary home for my files. It's simplified my workflow and I highly recommend it.
