---
title: Implementing search on a static site with Netlify functions
date: 2020-06-02 16:00:00 Z
tags:
  - gatsby
  - react
  - netlify
layout: post
draft: false
category: development
---

Recently, our team at Aha! has been working on migrating our public marketing website from a traditional Rails app to a [Gatsby](https://www.gatsbyjs.org) application hosted on [Netlify](https://www.netlify.com). Gatsby (and static sites in general) offer a large number of benefits: they are highly secure, easy to scale, and blazing fast. But these benefits come with tradeoffs; it's more difficult to perform some tasks that come very easily with a server.

One of the more common tasks complicated by a static site architecture is search. Search is a solved problem for traditional webserver applications. You can implement search with a basic SQL LIKE query, a more advanced Postgres [text search](https://www.postgresql.org/docs/12/textsearch.html), or even a dedicated search index like Elasticsearch. With a static site, there is no database or standalone index to query. For simple workloads, you can implement a local in-browser search index such as [gatsby-plugin-elasticlunr-search](https://www.gatsbyjs.org/packages/@gatsby-contrib/gatsby-plugin-elasticlunr-search). But this solution scales very poorly once you reach a few MB in search data because you have to keep a giant search index in browser memory, which hogs RAM and can drastically slow down your build. You can also outsource search to a third-party service like [Algolia](https://www.algolia.com), but at a literal cost in dollars and a metaphorical cost in architectural complexity. Reliance on a third party also undercuts one of the primary benefits of a static site architecture — you are once again dependent on a server's uptime rather than simply serving static HTML from CDNs around the globe.

Netlify, a popular service for hosting static sites, is well aware that some problems simply lend themselves better to a server. Their answer to this is [Netlify functions](https://www.netlify.com/products/functions) — serverless functions that you can write in JavaScript and are then automatically hosted as API endpoints when you deploy to Netlify. Netlify functions offer a happy middle ground for many traditionally server-dependent tasks. They are integrated into the same hosting platform so you don't introduce more dependencies, they are stateless and simple to reason about, and they don't rely on the uptime of any particular server. Under the hood, Netlify functions are simply a wrapper around AWS Lambda functions. These characteristics led us to wonder — could we leverage Netlify functions to implement a search index?

The answer, as it turns out, is yes! Netlify functions can be dynamically generated during the build process, which means we can hydrate a function with a search index at build time and then make AJAX requests to perform searches. We've [open-sourced](https://github.com/aha-app/netlify-flexsearch) an npm package, `@aha-app/netlify-flexsearch`, to simplify the process of creating a dynamic search index using Netlify functions. Our package implements the search index with [FlexSearch](https://github.com/nextapps-de/flexsearch), a fast and flexible JavaScript full text search engine.

Our package has two logical components — one piece helps to generate a Netlify function with the search index at build time, and the other piece helps to simplify the process of querying the generated index from the client.

The build helper, `createSearchIndex`, accepts a name for the index and a dataset; it interpolates the dataset into a template function and writes the output to the configured Netlify functions folder. You can even create multiple distinctly-named indexes if you have several distinct datasets. When deployed on Netlify, the resulting function (named with the pattern `search${indexName}`) will accept HTTP GET requests with a search term parameter and return the matching data.

The client helper is actually two helpers — a React hook and a generic asynchronous function. If you're using Gatsby or another React-based static site generator, you can use the `useSearch` hook to easily hook up your component to query the generated search index. If you're not using React, you can use the `search` function to query the search index directly and integrate with your framework however it best fits.

We've seen great results thus far from this search architecture. Our search indexes are not especially small (the largest is just shy of 5MB) but the search functions are still quite performant, returning results in about 200ms. At the same time, our build got significantly faster and its RAM usage dropped drastically because we were able to eliminate the in-browser search index that we were previously building. 

While it's been great for us, this solution may not be ideal for every workload. Netlify functions are limited to 1024MB of RAM out of the box, so if your search index is at or near that limit, you may have to purchase an enterprise plan to increase the available RAM or consider an alternate solution. We also have not tested performance with extremely large datasets; it may be the case that a search index with hundreds of MB of data will become unacceptably slow even if it fits under the Netlify RAM limit. But for medium-sized workloads such as ours, offloading our search index to a Netlify function struck a Goldilocks balance of performance, stability, and convenience. We think that other Netlify users could also benefit from this approach to search, and thus open-sourced our [package](https://www.npmjs.com/package/@aha-app/netlify-flexsearch) in the hope that others will find it useful.

_Originally published on the [Aha! engineering blog](https://www.aha.io/engineering/articles/implementing-search-static-site-netlify-functions)._
