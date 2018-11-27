---
title: Digital Ocean vs. Linode
date: 2014-01-08 02:37:27 Z
tags:
- development
- vps
- review
layout: post
draft: false
category: development
---

After two years as a [Linode](http://linode.com) customer, I've just finished switching and migrating the sites/apps I manage over to [Digital Ocean](https://www.digitalocean.com/).  While both services provide fantastic offerings and I'd recommend either, I found Digital Ocean to be more modern and flexible, with better features for the cost.  I decided to write up a brief rundown of the differences and how I made my decision.

#### Where Linode Wins

Linode has earned and maintained my trust over the past two years, while Digital Ocean is relatively new.  I can definitely say this: Linode has rock-solid uptime and performance, and I never had any complaints in that regard.  Linode has also done a pretty good job of increasing the specs of their offerings (possibly in response to Digital Ocean and other VPS upstarts); in April, they functionally [doubled](https://blog.linode.com/2013/04/09/linode-nextgen-ram-upgrade/) the RAM and disk space of each plan tier at the same price.

#### Why Digital Ocean Rocks

- **Price** **-** Digital Ocean's VPS offerings are essentially half the cost of the equivalent Linode.  The most basic Linode plan offers 1GB RAM, 8 CPU, 48GB storage, and 2TB transfer for $20/mo; the comparable Digital Ocean tier offers 1GB RAM, 1 CPU, 30GB storage, and 2TB transfer for $10/mo.  The CPU difference may be relevant for some applications, but for my use cases, it doesn't make a noticeable difference.  Additionally, Digital Ocean offers a basic $5/mo plan, which I find ideal when I need to spin up a quick dev server for a temporary project.  Finally, all of Digital Ocean's servers run on SSDs, which can seriously decrease read/write times for database-intensive applications and APIs.
- **Billing** **-** Linode bills on a flat monthly basis.  Digital Ocean actually bills on an hourly basis, capped at the monthly rate.  This is ideal because I like to spin up a fresh environment for apps I'm developing and beta testing, to keep the environment consistent with what's out in the wild; with Digital Ocean, I easily can create and kill VPSs ("droplets" in the Digital Ocean vernacular) without having to pay the full monthly rate for each one- that kind of flexibility is both rare and awesome.
- **Development and Management** **-** Digital Ocean offers some seriously awesome management features for developing with droplets.  You can spin up a new droplet in 55 seconds, and install either a clean version of a Linux server distro (Ubuntu, CentOS, Debian, Arch, Fedora) or a prebuilt distro containing an application, from full stacks like LAMP and Rails to development tools like GitLab and Docker to blogging applications like [Ghost](https://ghost.org/) and Wordpress.  You can also take an image or backup of an existing droplet and use it to spin up a new droplet, making it easy to clone droplets or environments.
- **Look and Feel** **-** Digital Ocean and Linode offer similar management panels for managing instances, but I find Digital Ocean's to be much more modern and appealing.  The design is clean and easy to navigate.
![Screenshot](/content/images/2014/Jan/DigitalOcean_Control_Panel.png)
- **API** **-** Digital Ocean offers a full-featured API that provides all of the functionality of the control panel- creating, resizing, and deleting droplets, managing images and snapshots, and more.  This API has been used by a handful of fairly awesome 3rd-party management apps; I'm particularly fond of [DigitalOcean Manager](https://itunes.apple.com/app/digitalocean-manager/id633128302) for the iPhone.

To conclude, while Linode is a solid VPS provider, Digital Ocean really kicks VPS service up to the next level, with a modern interface, a wide and useful set of features, and rock-bottom competitive prices.  I plan to host my projects on Digital Ocean in the future and would definitely recommend it to anyone in the VPS market.
