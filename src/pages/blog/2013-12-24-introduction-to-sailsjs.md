---
title: Introduction to SailsJS
date: 2013-12-24 02:55:10 Z
tags:
- development
- nodejs
- sailsjs
layout: post
draft: false
category: development
---

Over the past few days, I've started working on rewriting one of the web applications I manage using [SailsJS](http://sailsjs.org/), a NodeJS MVC framework that's built on top of Express and is intended to mimic Rails MVC patterning and functionality.  Part of Sails' unique appeal is that it provides fantastic out-of-the-box support for data-driven applications: a RESTful JSON API is automatically generated for each model, saving time writing backend code for single-page apps in Backbone, Angular, and the like.  Sails also provides automatic Socket.io support for realtime apps, making it a good choice for chatrooms, multiplayer games, and the like.

Sails is a fairly new framework (as with everything on Node); tutorials exist but are fairly few and far between.  The [documentation](http://sailsjs.org/#!documentation) is actually pretty fantastic; it's probably my favorite documentation of any framework I've encountered, including Rails.  Sails was my first experience writing server-side Javascript but I was able to hit the ground running pretty quickly.  One of the more useful general tutorials that I found was [Working with Data in Sails.js](http://net.tutsplus.com/tutorials/javascript-ajax/working-with-data-in-sails-js/) on nettuts+; it describes how to create a complete simple chat application using Sails and Backbone and provides a good example of a complete Sails application to give you a sense of how everything fits together.

To manage things like authentication and access control, Sails uses special classes called *policies*.  Again, the [documentation](http://sailsjs.org/#!documentation/policies) is quite sufficient, but policies essentially function like strategies in other frameworks.  You define a particular function (like `isAuthenticated` or `isAdmin`) in a file of the same name in the `api/Policies` folder, and then link that policy to a route or set of routes in the `config/policies` config file.  [This tutorial](http://jethrokuan.github.io/2013/12/19/Using-Passport-With-Sails-JS.html) by Jethro Kuan elaborates on how to integrate Sails with Passport.js using policies if you're so inclined.

Sails provides automatic asset compilation and linking, much the same as Rails does.  To enable this, you simply place your assets inside a `linker` subdirectory of the `assets` folder and ensure that `Gruntfile.js` contains the desired location (further documentation [here](http://sailsjs.org/#!documentation/assets)).  Coming from Rails (and being a [Foundation](foundation.zurb.com/) aficionado), SASS is my preferred CSS precompiler.  Sails doesn't quite include SASS support out-of-the-box, but it's pretty easy to add by modifying the Gruntfile; [this tutorial](http://rok3.me/programming/using-sass-sails-js/) lays out the steps required.  As with Rails, you can modify the production Gruntfile to combine and minify CSS (SASS) and Javascript assets down to one file, to save bandwidth and HTTP calls in the deployed application.  Additionally, it's possible to integrate and autolink bower assets (like the Foundation framework).  To do this, create a `.bowerrc` file in the project root directory, with the following contents:

```json
{
  "directory": "assets/linker/bower_components"
}
```

After creating this file, assets installed with bower will be placed in the `bower_components` folder, and autolinked since they're in a subdirectory of the linker folder.

Conveniently, Sails is database-agnostic; it uses a library called Waterline as a database ORM layer, meaning that your models look the same regardless of which database option you choose.  A number of popular databases are already supported: PostgreSQL, MySQL, and MongoDB have community adapters, and you can also store data in memory (useful for testing) or directly on disk.  With Waterline, database table creation and migration is automatic; you just define the appropriate attributes and validations in your [model](http://sailsjs.org/#!documentation/models), and the underlying SQL table is automatically generated when Sails is run.

Overall, I enjoyed my first experience with NodeJS and Sails, and I plan to use it again in the future.  Sails is definitely written with API usage in mind (rather than being a full-featured, comfortable backend framework like Rails), but it was definitely capable and leverages the blazing-fast power of server-side Javascript, unlike the frequently sluggish Rails.  Sails is under steady development and appears to have a bright future.
