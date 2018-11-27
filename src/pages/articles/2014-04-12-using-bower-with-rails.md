---
title: Using Bower with Rails
date: 2014-04-12 16:57:47 Z
tags:
- development
- rails
- bower
layout: post
draft: false
category: development
---

[Bower](http://bower.io/), the open-source frontend package manager developed by Twitter, is quickly gaining the affections of the NodeJS community (among others) as an extremely convenient way to manage frontend library dependencies without having to manually download and maintain lists of files.  

However,  Bower isn't really gaining as much steam in the Rails community. I think this is a shame- it's largely personal preference, but my frontend assets before Bower were a weird mix of packaged gems (sometimes out-of-date) and manually downloaded files in my `assets/` folder.  Bower is useful because it allows for coherent and concise management of exactly one concern- making sure that correctly versioned frontend libraries are automatically installed.

Integrating Bower with Rails was a good bit easier than I'd expected. As a dependency, you need to make sure that bower is installed on your system.  If it's not, install NodeJS, npm, and then bower- there are plenty of instructions for each of these steps online.

I started by removing frontend gems from my `Gemfile` (jQuery, Foundation, etc.).  I then installed the fantastic [bower-rails](https://github.com/42dev/bower-rails) gem, which does a lot of the heavy lifting in providing Bower support.  bower-rails provides two methods of configuration: a standard `bower.json` file or a `Bowerfile`.  The former solution is used in most other bower installations; it's just a json file describing which dependencies are required.  The latter solution is unique to bower-rails and lets you list dependencies in Ruby syntax; examples are included in the bower-rails documentation if that's your preference.  Running `rails g bower_rails:initialize json` after you bundle will create a sample `bower.json`, as well as an initializer (more on this later).

I next set up my `bower.json` with my dependencies, ending with something like this:

```json
{
  "vendor": {
    "name": "bower-rails generated vendor assets",
    "dependencies": {
      "jquery": "1.10.2",
      "jquery-ujs": "*",
      "jquery-ui": "1.10.3",
      "foundation": "5.0.2",
      "responsive-tables": "git://github.com/zurb/responsive-tables.git",
      "zurb5-multiselect": "git://github.com/icyz/zurbfoundation5-multiselect.git",
      "backbone": "1.1.0",
      "backbone.stickit": "0.7.0",
      "backbone.collectionView": "0.8.1",
      "fileDownload": "git://github.com/johnculviner/jquery.fileDownload.git",
      "fullcalendar": "1.6.4",
      "jtree": "git://github.com/r043v/jTree.git",
      "markdown": "0.5.0",
      "modernizr": "2.7.2",
      "moment": "2.5.1",
      "Noisy": "*",
      "underscore": "1.6.0"
    },
    "resolutions": {
      "jquery": "1.10.2"
    }
  }
}
```
    
bower-rails requires the "vendor" root element to determine where assets should be installed- the other option is "lib".  Under that element, the "name" is required to keep bower happy but is not especially important.  The "dependencies" are the list of dependencies you're installing.  The parameter after the dependency name can be a number of things: a version number if the dependency is in the Bower package registry (which is searchable [here](http://bower.io/search/)), a git repository, or an absolute filepath, among others.  This is quite convenient because you can install essentially any dependency found on the Internet, without needing it to have a defined bower package.  You can also use a "\*" to instruct Bower to install the latest version of the dependency- with `jquery-ujs`, this is mandatory because the package annoyingly has no versions.

The final element, "resolutions", lets you pre-resolve package dependencies that are required by other packages.  In this case, jQuery is required by a few other packages in my list.  You can actually leave this section out if you're not sure about interdependencies; Bower will automatically find and resolve them, and give you an option to "save" (add) resolutions to your `bower.json`.

After completing and saving your `bower.json`, you can install bower dependencies by running `rake bower:install`.  Your dependencies are installed by default to `vendor/assets/bower_components/` (or `lib/` if that's what you specified in `bower.json`).  You'll also want to register the `bower_components/` folder as an asset location by adding the following to your `config/application.rb`:

```ruby
  config.assets.paths << Rails.root.join('vendor', 'assets', 'bower_components')
```
    
You can then include assets in your `application.js` as follows (providing the path to the "main" Javascript file from the vendor that you want to include):

```javascript
/*
 * Vendor dependencies
 */
//= require modernizr/modernizr

//= require jquery/jquery
//= require jquery-ujs/src/rails

//= require foundation/js/foundation
//= require responsive-tables/responsive-tables
//= require zurb5-multiselect/zmultiselect/zurb5-multiselect

//= require underscore/underscore

//= require backbone/backbone
//= require backbone.collectionView/dist/backbone.collectionView
//= require backbone.stickit/backbone.stickit

//= require fileDownload/src/Scripts/jquery.fileDownload
//= require fullcalendar/fullcalendar
//= require jtree/jtree
//= require markdown/lib/markdown
//= require moment/moment
//= require Noisy/jquery/jquery.noisy
```
    
Similarly, you can include Bower CSS files in your application.css like so:

```css
*= require responsive-tables/responsive-tables
*= require fullcalendar/fullcalendar
*= require jquery-ui/themes/smoothness/jquery-ui
*= require jtree/jtree
*= require zurb5-multiselect/zmultiselect/zurb5-multiselect
```
     
Finally, if you ran the bower-rails installation command earlier, you will have a file generated in `config/initializers/bower_rails.rb`.  If you enable the `resolve_before_precompile` option, bower-rails will make sure all dependencies are installed before your assets are precompiled, ensuring any updates are reflected automatically in production.  With this option enabled, your initializer should look something like this:

```ruby
BowerRails.configure do |bower_rails|
  bower_rails.resolve_before_precompile = true
end
```
    
And that's it.  If used correctly, Bower is a fantastic tool that can greatly simplify management of frontend dependencies and get rid of the inconsistencies in Rails.  Happy coding!
