---
title: Riding on Jekyll
date: 2015-05-08 02:47:52 Z
tags:
- jekyll
- capistrano
layout: post
draft: false
category: development
---

I recently refreshed my personal site/blog. I've been meaning to try out [Jekyll](http://jekyllrb.com), a static site/blog generator, and so I decided I might as well give it a try. This post is about getting a Jekyll blog/site running with Capistrano, a tagging system, and a generator for new posts. You can check out all of the code for my site [on Github](https://github.com/schneidmaster/schneider.dev).

First, you'll need to install Jekyll globally:

```bash
gem install jekyll
```

I decided to use a Jekyll theme rather than the stock site or designing something from scratch. There's a pretty great directory over at [jekyllthemes.org](http://jekyllthemes.org/); I ended up selecting [Pixyll](https://github.com/johnotander/pixyll), so my codebase started out with a clone of that repository.

I used Photoshop to create an icon for my blog and exported it to the various sizes baked into Pixyll. I also wanted my blog to live in a `/blog/` subdirectory, so I added these options to `_config.yml`:

```yaml
permalink:     '/blog/:title.html'
paginate_path: '/blog/page:num/'
```

I also messed around with the navigation and created a page for my projects. Pages on Jekyll are created in `pagename/index.html` while the navigation, post footer, and other partials are located in `_includes`.

Now for the interesting parts. I loosely followed [this guide](http://charliepark.org/tags-in-jekyll/) to add tags to my Jekyll blog. Following the tutorial's advice, I created `_plugins/tag_gen.rb` with [these contents](https://github.com/schneidmaster/schneider.dev/blob/master/_plugins/_tag_gen.rb), and `_layouts/tag_index.html` with [these contents](https://github.com/schneidmaster/schneider.dev/blob/master/_layouts/tag_index.html). I also had to add `tag_dir: '/blog/tag'` to `_config.yml` to match my `/blog/` subdirectory, and had to add the tags to the beginning of `_includes/post_footer.html` so they'd be printed after each post:

```html
{% raw
<hr>
<i>Tagged:</i>
{% for tag in page.tags
  <li class="inline archive_list">
    <a class="tag_list_link" href="/blog/tag/{{ tag }}">{{ tag }}</a>
    {% if forloop.index > 0 and forloop.rindex > 1
      |
    {% endif
  </li>
{% endfor
{% endraw
```

Sweet! Now, adding tags to the top of each post's metadata causes them to be generated and linked at the bottom of the post, like this:

    ---
    ...other metadata...
    tags:
    - jekyll
    ---

Next, I worked out how to deploy with Capistrano. I ended up deciding to build the blog locally (to ensure a consistent build with what I was seeing in development) and then just copy the static HTML up to my server - that's one of the benefits of a statically generated site. I created a `Gemfile` with the following gems and bundled:

```ruby
source 'https://rubygems.org'

gem 'capistrano'
gem 'capistrano-scm-copy'
gem 'jekyll'
```

Then, I ran `cap install` and set up my Capistrano deployment.

###### Capfile
```ruby
# Load DSL and set up stages
require 'capistrano/setup'

# Include default deployment tasks
require 'capistrano/deploy'
```

###### config/deploy.rb
```ruby
set :application, 'schneider.dev'
set :include_dir, '_site'
set :scm, :copy

set :deploy_to, '/srv/www/schneider.dev'

namespace :deploy do
  before :deploy, :update_jekyll do
    on roles(:app) do
      %x(rm -rf _site/* && jekyll build)
    end
  end

  after :deploy, :move_site do
    on roles(:app) do
      within release_path do
        execute :mv, '_site/* .'
        execute :rmdir, '_site'
      end
    end
  end
end
```

###### config/deploy/production.rb
```ruby
server '192.xxx.xxx.xxx', user: 'myuser', roles: %w{app}
```

The deployment just rebuilds the site and copies it from `_site` up to the root of the release path. Easy as punch and deploys in a few seconds.

So far, I've had a pretty solid experience setting up my site and blog with Jekyll. I hope this post is helpful to others following the same path.
