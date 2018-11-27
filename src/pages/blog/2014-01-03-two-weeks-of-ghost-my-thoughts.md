---
title: 'Two Weeks of Ghost: My Thoughts'
date: 2014-01-03 03:12:41 Z
tags:
- ghost
layout: post
draft: false
category: development
---

I've now been using [Ghost](http://ghost.org/) to power my blog for around two weeks (replacing my old Tumblr).  So far, I've found it to be a pretty great experience but with a few annoying glitches.

Easily, my favorite feature of Ghost is the editor.  It offers a side-by-side view of raw Markdown and a live preview of the content that Markdown renders.  It's quite well-done and beautiful to write with- it's actually given me incentive to update my blog more frequently than I used to, just because I love writing in it.

However, the editor isn't perfect.  Despite Ghost's focus on responsiveness, the editor is almost unusable on my iPhone- the bottom few lines of text are obscured by the bottom menu, and due to some sort of Javascript bug it's very difficult to place/move the cursor to actually start typing.  This is a [known issue](https://ghost.org/forum/everything-else/641-can-you-run-your-blog-from/) so hopefully it improves in the near future.

Another nice feature of Ghost is easy image uploads- if you type an empty Markdown image tag (`![]()`), Ghost will give you an image placeholder in the preview that you can click to upload an image from your computer or hotlink an image from the web.  Unfortunately, this feature is tied to another bug I've experienced- if you're running Ghost with Phusion Passenger, as I am, image uploads result in a 500 server error.  (If one of you knows how to resolve this issue, please comment on my [forum post](https://ghost.org/forum/bugs-suggestions/4123-500-server-error-on-image-uploads/) and let me know!)

Finally, Ghost has a pretty fantastic theming system.  It's quite simple to create a theme- you simply have to clone the default `casper` theme and modify a couple of [Handlebars](http://handlebarsjs.com/) templates.  I haven't gotten too in-depth with it yet, but sometime in the near future I plan to skin my blog to match my site, and I'm excited to dig into it.

Overall, Ghost is a pretty great experience and I plan to continue using it to power my blog in the future.  The editor is extremely nice and makes it easy to post regular updates.  Ghost still has a decently sized handful of annoying bugs, but it is only a 0.3 beta release- hopefully, many of these issues will be resolved as the platform grows and matures.
