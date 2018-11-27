---
title: The Dock is Dead. Long Live Alfred!
date: 2014-03-10 00:05:30 Z
tags:
- development
- workflow
- alfred
layout: post
draft: false
category: productivity
---

The mighty Dock has long been one of the most recognizable features of OSX.  Too long.

At least for me, I find the dock to be an obnoxious use of screen space, taking nearly an inch out of my already-short vertical display.  Furthermore, clicking an icon on the Dock is an inefficient action, requiring you to use the trackpad and take your fingers off the keyboard.  It's even worse if you have a lot of applications open, as the dock displays them all and zooms to meet the cursor- a useful tweak, but one that makes clicking an icon even more time-consuming.  It may only be a few seconds, but over the course of the day, it adds up.

My solution?  Use the mighty [Alfred](http://www.alfredapp.com/) and kill off the Dock.

Alfred is perhaps the most useful app I have installed on my Mac.  It serves a similar purpose as Spotlight, but I've found it to be much faster and more flexible.  After installing it, I highly recommend a couple of tweaks to make it better:

1. Visit Spotlight in System Preferences and untick the box next to 'Spotlight menu keyboard shortcut'.  This frees up ⌘ Space to be used by Alfred.
2. Open up Alfred's preferences.  Under the 'General' pane, make sure Alfred is selected to open at login and set ⌘ Space as the Alfred hotkey.  
3. Under the 'Features' pane, I recommend instructing Alfred to index all of the file types; Alfred is extremely fast at finding a file when you remember the name but don't remember where it's at or don't want to navigate a pesky folder structure.  Also, click 'Applications' in the left sidebar and enable fuzzy matching for applications.  This makes it so, for example, Chrome will still come up as an option if you're speeding and type 'Chorme', something I tend to do frequently.
4. Under the 'Appearance pane', I recommend a couple of changes to make Alfred look less intrusive.  Select the 'OSX Lion' theme, and check the options to 'Hide hat on Alfred window', 'Hide prefs cog on Alfred window', and 'Hide menu bar icon'.  This makes Alfred appear very minimalist and makes it blend in nicely with the operating system, like so:

![](http://i.imgur.com/Acfiydk.png)

Next up, I recommend hiding the Spotlight icon in the menu bar- it doesn't serve any particularly useful purpose since you're no longer using Spotlight.  This can be done with the following terminal commands:

```bash
sudo chmod 600 /System/Library/CoreServices/Search.bundle/Contents/MacOS/Search
killall SystemUIServer
```
    
You'll be prompted for your system password with the first command, and the second reloads the UI so the Spotlight icon disappears.  This is completely reversible if you decide to go back later; you can unhide the Spotlight icon with these commands:

```bash
sudo chmod 755 /System/Library/CoreServices/Search.bundle/Contents/MacOS/Search
killall SystemUIServer
```
    
So now that you're fully set up on Alfred, what about that pesky Dock?  Well, as it turns out, it's very difficult to actually hide the Dock; Apple ties it together with a few other applications like Mission Control and Launchpad.  My solution is simply to make it very tiny, with the following terminal commands:

```bash
defaults write com.apple.dock tilesize -int 1
killall Dock
```
    
This sets the size of the Dock tiles to 1 pixel- it'll still show up if you hover on the bottom of the screen, but it'll only take up about a tenth of an inch and isn't really noticeable in daily use, especially if you delete all the possible icons from it.  This is also easily reversible by using the same command with a different pixel size or simply using the size slider in the Dock preference pane under System Preferences.

Replacing the Dock with Alfred has drastically improved my workflow, allowing me to keep my hands on the keyboard for much longer stretches of time and quickly switch between apps using ⌘ Space or trackpad gestures.  I highly recommend giving it a shot.  Happy coding!
