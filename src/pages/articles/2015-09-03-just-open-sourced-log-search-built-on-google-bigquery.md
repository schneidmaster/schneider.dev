---
title: 'Just Open Sourced: Log Search Built on Google BigQuery'
date: 2015-09-03 16:00:00 Z
tags:
- aha
- development
- bigdata
layout: post
draft: false
category: development
---

Maintaining useful application logs is an challenging problem, especially when dealing with tens of gigabytes of new data every day. When trying to trace down an error or determine when a regression was introduced, having comprehensive and verbose logs can save hours of frustration. But when trying to provision a server or scale a database, accounting for gigabytes upon gigabytes of logs is a nightmare.

Nearly every operations engineer can remember groggily waking up to an alert that the server has crashed because the disk is full – a problem often exacerbated by verbose logging.

It is easy to take the stance that “just log everything” is the correct philosophy for production-scale applications. Some of the most impactful bugs and problems are introduced precisely because they only happen on certain edge cases and are tricky to reproduce. When that happens, often the only way to find and fix the problem is to have a thorough postmortem of exactly what went wrong.

But this presents a technical challenge: how do you handle terabytes of logs without huge cost or even more infrastructure to maintain? More to the point, how can you keep that much data sufficiently searchable so that it is useful when a problem arises?

It turns out that a remarkably elegant but relatively untapped solution exists. When you need help working with gargantuan amounts of data, one company in particular has gotten it down to an exact science: Google.

Google offers a service called [BigQuery](https://cloud.google.com/bigquery/), billed as a fast, economical and fully managed data warehouse for large-scale data analytics. BigQuery allows you to store almost unlimited data in a highly optimized columnar storage system. BigQuery then allows you to query that data using a SQL-like query syntax, and it is astoundingly fast, querying on the order of terabytes of data in just a few seconds.

It is also extremely affordable and priced in a way that is ideal for a log search use case. Importing data via batch uploads is free; you simply upload our logs via an automated job at the end of each day. If you want your logs to be searchable in real time, you can use the streaming data option, which costs a bit more but lets you constantly stream data into BigQuery from your application. Storage is also quite cheap – charged at $0.020/GB per month; this is good because it allows you to keep large quantities of logs even if they are never actually needed. Finally, querying data is charged at a [tiered rate](https://cloud.google.com/bigquery/pricing#queries) – it is the most expensive operation, but still affordable because queries are relatively rare in comparison to the volume of data being stored. Overall, the pricing model is beneficial for log searching because you only incur considerable charges for the fraction of your logs that you actually need to search.

However, there is a companion problem. You have your data in BigQuery, but how do you efficiently access and search it? Fortunately, BigQuery exposes a robust API for searching as well as importing data. And today, Aha! is open sourcing [big_query_log_viewer](https://github.com/aha-app/bigquery-log-viewer), the Rails engine that we wrote to empower you to query and drill into your logs.

We built the engine using some of our favorite technologies: CoffeeScript and React. It provides a tabbed interface to let you perform many related searches without losing track of past results. Logs may be searched based upon a term (such as a user’s email address, account ID, or other identifying information) as well as a particular date range (which lets you narrow down the offending logs while also saving money on query costs).

The engine also allows you to drill further into your logs, expanding the context of any particular search result to see what happened around it. We account for multi-instance deployments by limiting such expansions to log messages that came from the same server as the source log, to ensure that you’re seeing exactly what you need to diagnose the problem.

Google BigQuery and the companion search engine is invaluable for allowing you to log everything you need to track down issues and stay responsive to requests and needs. If you want to help us push the limits of technology to provide a superior product management experience for our customers, check out our [careers page](http://www.aha.io/company/careers).

*This post was originally published on the [Aha! blog](http://blog.aha.io/index.php/just-open-sourced-log-search-built-on-google-bigquery/).*
