---
title: Deploying a Ghost Blog on Ubuntu with Capistrano
date: 2015-05-01 21:54:45 Z
tags:
- development
- workflow
- ghost
- capistrano
layout: post
draft: false
category: development
---

I recently set up a deploy script for a Ghost blog using Capistrano, to an Ubuntu server with Phusion Passenger. I had to figure out a few tricks along the way so I thought I'd post a walkthrough for others solving the same problem. Note that this tutorial is for developers who want to modify the core Ghost code in some way - if you're just trying to figure out how to install Ghost, check out [their directions](https://github.com/TryGhost/Ghost#quick-start-install).

On your local machine, you will need to have git, ruby, and bundler installed. If you're looking for this tutorial then you hopefully already know how to do that. You will also need a terminal - I don't know what people are using on Windows these days but something like cygwin. If you're on Mac or Linux then you're already fine.

On the server, you'll need to install some things to set up. For starters, I recommend following the steps in [this tutorial](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-14-04) and [this one](https://www.digitalocean.com/community/tutorials/additional-recommended-steps-for-new-ubuntu-14-04-servers) to implement some basic security measures on your server. Then, you'll have to SSH into your server and install MySQL (or preferred database), Node.js, git, and Phusion Passenger.

For MySQL, git, and nginx:

```bash
sudo apt-get install mysql-server git nginx
```

I strongly recommend you set a root password for MySQL when prompted during the installation process.

For Node.js, we will add the PPA from NodeSource and then install:

```bash
# Add PPA. For increased security, open the link and 
# copy-paste the script into a new .sh file on your server
curl -sL https://deb.nodesource.com/setup | sudo bash -
sudo apt-get install nodejs build-essential
```

You will also need to install grunt globally for Ghost to use in building assets:

```bash
npm install -g grunt-cli
```
    
You will also need to symlink node, npm, and grunt to `/usr/local/bin` so Capistrano can find them, as Capistrano runs all commands in your local environment:

```bash
ln -s ~/.nvm/versions/node/v0.12.2/bin/node /usr/local/bin/node
ln -s ~/.nvm/versions/node/v0.12.2/bin/npm /usr/local/bin/npm
ln -s ~/.nvm/versions/node/v0.12.2/bin/grunt /usr/local/bin/grunt
```
    
(Make sure you replace the node version with the correct version of node should it change.)

For Passenger, follow the steps outlined [here](https://www.phusionpassenger.com/documentation/Users%20guide%20Nginx.html#install_on_debian_ubuntu) in sections 2.3.1 to 2.3.3 (the directions change a little based on your Ubuntu version so I'm not duplicating them here). That link also has the rest of the Passenger docs if you have trouble installing it.

Finally, we'll create a database for Ghost to use. First, execute

```bash
mysql -u root -p
```
    
and log in with the root password you set earlier. Then, run the following commands in the MySQL prompt - make sure you take note of whatever password you set.

```bash
create database ghost_db;
create user ghost_user identified by 'SOME_LONG_PASSWORD';
grant all privileges on ghost_db.* to ghost_user;
```

Next, we'll configure your server. First, choose where you want to deploy your code: I like `/srv/www/site` but tradition dictates `/var/www/site`. Whatever you want to do, make sure that your user owns the directory (so Capistrano can deploy files).

`cd` to the deploy directory and create a folder for your server logs:

```bash
cd /srv/www/site # or whatever you chose
mkdir logs
```

Then, create the shared Capistrano substructure - files that Capistrano will persist across deployments. Create a `shared/` folder; inside that, create `content/`, `data/`, and `config.js`.

```bash
mkdir shared
cd shared
mkdir content
mkdir data
touch config.js
```

Put your Ghost configuration inside that `config.js` file - [here](https://gist.github.com/schneidmaster/824f0291c2b091bef0f7) is a template to follow. Ghost recommends (and I agree) that you use [Mailgun](https://mailgun.com) to send Ghost emails - it's only used for notification emails so it'll almost certainly be free unless you're running a huge blog, and either way Mailgun is very affordable and much more stable than sending mail yourself.

Finally, we'll set up nginx to work with Passenger and serve your blog. Run these to create a new configuration file:

```bash
cd /etc/nginx/sites-available
cp default yoursite.conf
```
    
Open up `yoursite.conf` and add the configuration using [this template](https://gist.github.com/schneidmaster/5b80bbaffa4a079af7fd).

Link your configuration to the enabled sites directory so nginx can find it. We'll also remove the default configuration so nginx doesn't get confused.

```bash
sudo ln -s /etc/nginx/sites-available/yoursite.conf /etc/nginx/sites-enabled/yoursite.conf
sudo rm /etc/nginx/sites-enabled/default
```

Great! Your server is all set up. Next, let's go back to your local machine.

Open the terminal and navigate to wherever you want your local Ghost blog to live. Run 

```bash
git clone git@github.com:TryGhost/Ghost.git
```
    
to pull the Ghost repo. The Ghost repo has two branches: master and stable. You want stable - that way your blog is appropriately versioned with Ghost releases and you aren't dealing with broken bleeding-edge code. Grab the stable branch with

```bash
git checkout --track origin/stable
```
    
You'll then want to make your own version of the stable branch. This is so you can easily make whatever edits you want to make while still following the Ghost release path - `master` and `stable` stay pristine, and you make local changes on a new branch and merge in `stable` whenever there's an upgrade. So do this:

```bash
git checkout -b stable-local
```
    
That will create a new `stable-local` branch where you can make your changes. Later on, to merge in any new releases of Ghost, just run 

```bash
git checkout stable
git pull
git checkout stable-local
git merge stable
```
    
and fix any conflicts.

At this point, you're good to install Ghost dependencies (check the [Ghost dev guide](https://github.com/TryGhost/Ghost#developer-install-from-git)) and make whatever changes you want.

...okay, you're ready to deploy? Great. 

First, navigate to the root directory of the Ghost code. Create a new empty file called `Gemfile`. Give it these contents:

```ruby
source 'https://rubygems.org'
gem 'capistrano', '~> 3.4.0'
```
    
Run these to install the Capistrano gem and initialize a Capistrano configuration for your Ghost blog:

```bash
bundle
cap install
```
    
This will create a bunch of Capistrano config files. You can delete the `lib/capistrano/tasks` folder if you want, we won't use it. Leave `lib/capistrano` though.

Now, let's set up the Capistrano configuration and tweak it for Ghost.

The biggest hangup that Ghost and Capistrano have is that Ghost relies on git submodules (that's how it checks out Casper - a separate repository that contains the default Ghost theme) while Capistrano doesn't play nicely with submodules. To fix this, we need to set up a custom Capistrano strategy to handle checking out submodules after deployment. Create a new file at `lib/capistrano/submodule_strategy.rb` and give it these contents:

```ruby
require 'capistrano/scm'
require 'capistrano/git'
class Capistrano::Git < Capistrano::SCM
  module SubmoduleStrategy
    include DefaultStrategy

    def release
      context.execute :rm, '-rf', release_path
      git :clone, '--branch', fetch(:branch),
                  '--recursive',
                  '--no-hardlinks',
      repo_path, release_path
    end
  end
end
```

Next, open up the newly created `Capfile` and give it these contents:

```ruby
# Load DSL and set up stages
require 'capistrano/setup'

# Include default deployment tasks
require 'capistrano/deploy'

# Use custom strategy to support submodules
require './lib/capistrano/submodule_strategy.rb'
```
    
Next, we'll set up the deployment. Open `config/deploy/deploy.rb` and give it these contents:

```ruby
# config valid only for current version of Capistrano
lock '3.4.0'

set :application, 'yoursite.com'
set :repo_url, 'git@github.com:YourAccount/YourAppName.git'

# Default branch is :master
set :branch, 'stable-local'

# Default deploy_to directory is /var/www/my_app_name
set :deploy_to, '/srv/www/yourappname'

# Use custom strategy to update submodules
set :git_strategy, Capistrano::Git::SubmoduleStrategy

# Default value for :linked_files is []
set :linked_files, fetch(:linked_files, []).push('config.js')

# Default value for linked_dirs is []
set :linked_dirs, fetch(:linked_dirs, []).push('content/files', 'content/images')

namespace :deploy do
  after :finished, :update do
    on roles(:app) do
      with fetch(:git_environmental_variables) do
        within release_path do
          execute :npm, 'install'
          execute :grunt, 'init'
          execute :grunt, 'prod'
        end
      end
    end
  end
    
  after :update, :restart do
    on roles(:app) do
      execute :mkdir, '-p', release_path.join('tmp')
      execute :touch, release_path.join('tmp/restart.txt')
    end
  end
end
```
    
Brief explanation of some of this:

* The `:repo_url` directive tells Capistrano where to check out your code for deployment. You have to have your code hosted on a remote repository like GitHub or GitLab to be checked out by Capistrano.
* The `:branch` directive tells Capistrano which branch to deploy - we use the `stable-local` branch we created earlier for this purpose.
* The `:deploy_to` directive tells Capistrano which directory to deploy to on your server. I like putting my production code in `/srv/www` rather than `/var/www` but if you don't like that you can change the path to whatever floats your boat.
* The `:git_strategy` directive tells Capistrano to use the custom git strategy we defined above - which is just a tweaked extension of the built-in git strategy.
* The `:linked_files` directive tells Capistrano to link the `config.js` file from the shared directory (more on this later) - that way your configuration doesn't get overwritten on deployments.
* The `:linked_dirs` directive does the same thing for uploaded files and images.
* The `after :finished, :update` block handles installing Ghost dependencies and compiling assets after the deployment is finished.
* The `after :update, :restart` block restarts Passenger by touching `tmp/restart.txt`.

Save this. Finally, we'll tell Capistrano how to find your server. Open up `config/deploy/production.rb` and give it the following contents:

```ruby
server 'server_ip', user: 'server_user', roles: %w(app)
```
    
Replace `server_ip` with the IP address of your server and replace `server_user` with whatever username you use to SSH into the server. (You should have set up key-based authentication in the server security tutorials at the top so you won't need a password.)

Sweet, almost done! Now just run `cap production deploy` from the root directory of the Ghost app. Capistrano should create the rest of its directory structure, deploy your code, install Ghost dependencies, compile assets, and link your shared directories. Almost like magic.

One last thing. SSH into your server one more time and run `sudo service nginx restart` - we need to reload the configuration changes we made up above but that can't happen until after the first deployment because some of the folders don't exist yet. You should get a confirmation message from nginx and then you can visit your site in the browser to set up Ghost!

You can do some other pretty neat things with Capistrano - check out [the docs](http://capistranorb.com/) for further reading. Happy coding!
