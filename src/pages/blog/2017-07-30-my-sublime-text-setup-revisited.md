---
title: My Sublime Text Setup Revisited
date: 2017-07-30 06:52:12
tags:
- development
- workflow
- sublime
layout: post
draft: false
category: development
---

Three and a half years ago (wow, time flies) I wrote a [blog post](https://schneid.io/blog/my-sublime-text-setup.html) detailing my Sublime Text configuration. Over that time, I've tried out a handful of new offerings (Atom and VS Code among others) but I've never found an editor to match the speed, stability, and ultimately productivity of Sublime. I was recently going to link my old post to a coworker but realized it's now pretty hopelessly out of date, so I decided to write a new post about my Sublime Text setup. I hope it helps you get started on my favorite text editor.

### Basics

Technically, there are two active versions of Sublime Text (2 and 3); ST2 is "stable" while ST3 is "beta." Realistically, though, ST2 has not been updated since July 2013, while ST3 is updated at least every few months and is stable enough for everyday use. It offers a number of performance and stability improvements, and many packages now only support ST3; I definitely recommend going that route.

ST3 offers an unlimited "evaluation period" (aka it's free but gives you a nag to buy it every so often). The full license costs $70 -- not cheap but honestly it's probably the best $70 I've ever spent on development tools.

Almost undisputedly, the first thing you should install after installing ST itself is [Package Control](https://packagecontrol.io/). Package Control is a plugin for installing and upgrading other plugins (aka packages); it makes this experience buttery smooth and features an online directory for discovering new packages.

There's two other packages I'd file under "basics": [Themr](https://packagecontrol.io/packages/Themr) and [Schemr](https://packagecontrol.io/packages/Themr). Sublime Text can be customized with both themes (which change the appearance of the editor itself) and color schemes (which are a suite of text colors for syntax highlighting). While themes/schemes are installed via Package Control itself, Themr and Schemr make it simple to list installed themes/schemes, preview new ones, set favorites, and more.

### Settings

Before getting into plugins, I figured I'd start by mentioning a few useful settings. You can open your settings file with `⌘+,`.

* `binary_file_patterns` - a list of patterns to exclude from search. It's helpful to add any folders for `dist` or built output in your projects.
* `ensure_newline_at_eof_on_save` - when `true`, ensures when you save that the file always has an empty newline at the end.
* `tab_size` - the number of spaces to consider equivalent to 1 tab (I use 2).
* `translate_tabs_to_spaces` - when `true`, automatically translate tabs to spaces, nice to help keeping tabs from sneaking in.

The Sublime settings view gives a side-by-side with the default settings and your current personal settings, with comments to detail what each option does. It's worth a quick read-through to further personalize to your liking.

### Appearance

Sublime is nicely themeable and there's a number of quality options on Package Control. Personally, I use the `Reverse Gravity` theme from the [Gravity](https://packagecontrol.io/packages/Theme%20-%20Gravity) package and the `GitHub` color scheme from the [GitHub Color Theme](https://packagecontrol.io/packages/Github%20Color%20Theme) package. I also use the [Hack](https://github.com/chrissimpkins/Hack) typeface (to customize the font, you just install the font on your system and fill in its name in your settings file).

All together, my setup looks like this:

![Sublime Setup](http://i.imgur.com/gPrE56o.png)

### Functionality

Plugins that extend the basic functionality of Sublime Text.

- [SFTP](https://packagecontrol.io/packages/SFTP) - SFTP client/plugin for Sublime Text.  Supports remote server browsing, save on upload, sync up/down, and more.  Free to try; $30 for a license.

- [Sidebar Enhancements](https://packagecontrol.io/packages/SideBarEnhancements) - A number of enhancements (context menus, etc) to the default sidebar.

- [SublimeGit](https://packagecontrol.io/packages/SublimeGit) - Integrates a number of Git features smoothly into Sublime Text: diffs, status, commits, etc.  Free to try; €10 (~$14) for a license.

- [SyncedSidebar](https://packagecontrol.io/packages/SyncedSideBar) - Small plugin that keeps the sidebar position (open folders, scrolling, etc.) in sync with the currently open file.

### Syntax Highlighting

Sublime Text includes highlighting for a number of different languages out of the box, but I've found a few additional syntax highlighting packages to be useful for specific frameworks and templates.

- [Babel](https://packagecontrol.io/packages/Babel) - Syntax highlighting for ES6 (JavaScript).

- [Color Highlighter](https://packagecontrol.io/packages/Color%20Highlighter) - Highlights CSS colors, hexs, etc in your code.

- [CJSX](https://packagecontrol.io/packages/CJSX%20Syntax) - Syntax highlighting for CoffeeScript + JSX (CJSX).

- [Less](https://github.com/danro/LESS-sublime) - Syntax highlighting for Less.js files (a CSS extension language).

Those are just a few I use, but you can find syntax highlighting packages for pretty much any language.

### Writing Code

- [AlignTab](https://packagecontrol.io/packages/AlignTab) - flexible and powerful plugin to help align code as you write.

- [All Autocomplete](https://packagecontrol.io/packages/All%20Autocomplete) - extends the default autocomplete to find matches in all open files.

- [AutoFileName](https://packagecontrol.io/packages/AutoFileName) - extends the default autocomplete to match filenames in the current project.

- [CodeFormatter](https://packagecontrol.io/packages/CodeFormatter) - plugin to help format HTML, CSS, SCSS, JSON, and more.

- [DocBlockr](https://github.com/spadgos/sublime-jsdocs) - Plugin to simplify writing documentation comments in a number of languages. Initiate a function comment with `/**` and `return`, and DocBlockr will open up and template out a documentation block for you.

- [Emmett](https://github.com/sergeche/emmet-sublime) - Very useful plugin that provides a number of shortcuts for writing HTML. Drastically increases your HTML coding speed once you're used to the syntax. 

