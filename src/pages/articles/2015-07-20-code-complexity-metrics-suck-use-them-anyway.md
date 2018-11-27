---
title: Code complexity metrics suck — use them anyway
date: 2015-07-20 16:00:00 Z
tags:
- aha
- development
layout: post
draft: false
category: development
---

I love contributing meaningful code to the open-source community; I do it every chance that I get. A few years back, I authored my first major [open source project](https://github.com/schneidmaster/gitreports.com) — a Rails application for developers to set up an anonymous bug report page. The bug reports generated GitHub issues on the relevant project.

I refactored and improved my code over subsequent months — including placing the methods that integrate with the GitHub API in a service class executed asynchronously by Sidekiq. This ensured a quick response for users rather than waiting for round-trip latency to GitHub.

I used this project as an excuse to test out any and all new SaaS developer platforms that caught my fancy. It allowed me to expand my awareness of the scope of available tools while also selecting the best options to improve my project.
One of the solutions I tried was a SaaS service to automatically evaluate code complexity and identify complex methods or classes that require improvement. Most of my application was evaluated just fine right off the bat. It is a fairly simple application with few complex methods.

However, the GitHub service class I described above drew the ire of the code complexity analyzer. It contained a [method](https://github.com/schneidmaster/gitreports.com/blob/master/app/services/github_service.rb#L14) that — while readable — was necessarily complex. When a user refreshed their repositories from GitHub, it had to fetch all user repositories and all organization repositories. It also removed any outdated user or organization repositories.

I spent several hours trying to refactor the method to please the code complexity gods. I broke out sub-methods, shortened lines of code, and simplified logic. At some point, I realized that although my method was becoming programmatically simpler, it ended up far more difficult for a human to comprehend.

The problem with code complexity metrics is that they apply a static benchmark to a dynamic problem. Sometimes, methods have to do complex things — that is the nature of code in the real world.

But developers are not always helped by endlessly refactoring complex methods into smaller and smaller sub-methods. Such refactoring can cause easily understandable code to become obtusely nested.
In the end, I took the easy way out and simply excluded my GitHub service class from the complexity metrics. I reached a point where I realized that further subdividing my methods was only obscuring my code.

But upon reflection, I realized that using complexity metrics served an important (if less than perfect) purpose. It forced me to think critically and make intentional decisions about complex areas of my code. And these new ways of thinking ultimately improved the project as the whole.

I ended up excluding the GitHub service. Even so, the class ended up in far better shape after I spent time addressing the complexity concerns raised by automated testing. And having a constant nagging reminder about code complexity made me think about the quality of each new commit I pushed.

There is a human element to evaluating code quality that will never be removed. After all, it is really only human input that matters; machines don’t care about the quality of the code they execute.
In that sense, code complexity metrics fail. They try to apply machine logic to what is at its core a human problem.

But code complexity metrics also bring out the best in human developers: conscientious attention towards creating code that is readable for their fellow humans — and hopefully pleases the machine overlords as well. The importance of such attention cannot be overstated as projects grow and new developers must understand what has been written before them.

Code complexity metrics suck. Use them anyway.

*This post was originally published on the [Aha! blog](http://blog.aha.io/index.php/code-complexity-metrics-suck-use-them-anyway/).*
