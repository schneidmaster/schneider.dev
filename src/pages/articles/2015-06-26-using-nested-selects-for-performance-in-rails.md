---
title: Using Nested Selects for Performance in Rails
date: 2015-06-26 16:00:00 Z
tags:
- aha
- development
- rails
- performance
layout: post
draft: false
category: development
---

Databases are **fast**, even at performing fairly complex operations. This is easy to forget in the age of ORMs and abstraction and many of us haven’t written a line of raw SQL in months.

But a solid, production-ready SQL database is mature, low-level, and thoroughly optimized for the task it’s designed to do: create, read, update, and delete a set of well-structured records.

It’s important to keep the speed of your database in the back of your mind at all times — especially for Rails developers. The convenience of the ActiveRecord ORM does not always translate into a performant result; even with eager loading and joining, it’s often easy to write an n+1 query that kills production performance. This is especially true with a complex Rails architecture, which can magnify even small mistakes in optimization.

Let’s take a relatively common case.

Suppose we have a simple blog application written in Rails. It has a Post model (with predictable attributes like title, content, and author) and a Comment model (with post_id, body, and author). Now, let’s say we want to display some recent posts in a table, and include a column for the number of comments that have been made on each post.

We might write something like this:

```erb
<!-- posts/index.html.erb -->
<table>
  <thead>
    <tr>
      <th>Post Title</th>
      <th># Comments</th>
    </tr>
  </thead>
  <tbody>
    <% @posts.each do |post| %>
      <tr>
        <td><%= link_to post.title, post %></td>
        <td><%= post.comments.count %></td>
      </tr>
    <% end %>
  </tbody>
</table>
```

Pretty straightforward. But what happens behind the scenes?

ActiveRecord will first execute a query to get the list of posts (e.g. `select * from posts;`) and then execute a subsequent query for each post to calculate how many comments it has (e.g. `select count(*) from comments where post_id = ?;`). A classic n+1 problem; we end up with an unbounded number of queries as the number of posts increases.

We can solve this problem with eager loading: `@posts.eager_load(:comments)` will instruct ActiveRecord to include the comments in the initial query and thus prevent any further queries. When it works, eager loading is a simple and elegant solution to n+1 query problems. But unfortunately, it often only actually helps in the most trivial cases.

To demonstrate this, let’s now posit that comments has an additional is_approved boolean attribute, so inappropriate comments can be removed by a moderator. Obviously, we only want to include comments that are visible in the comment count. But there is no easy way to do this in ActiveRecord without sacrificing eager loading.

Adding a new where query to the comments relation causes ActiveRecord to discard the eager loaded data and perform a new query with an appropriate WHERE clause; the n+1 problem has come roaring back. As you can imagine, this quandary only worsens as you add layers of complexity to the application.

What if we were using raw SQL to load the posts and comment counts? This problem would be easy to solve. We would write a single query, such as:

```sql
SELECT "posts".*, 
  (SELECT count(*) FROM comments 
  WHERE comments.post_id = posts.id 
  AND comments.is_approved = 1) 
  AS comments_count
  FROM "articles";
```

But unfortunately, there is not a convenient way of achieving this result built into the ActiveRecord ORM, short of running a completely custom SQL query from scratch. The exceptional convenience of the ActiveRecord paradigm has come into conflict with the expedient performance and flexibility of raw SQL.

To solve this problem at [Aha!](http://www.aha.io) (*which is product roadmap software*), we built and open-sourced a Ruby gem called [calculated_attributes](https://github.com/aha-app/calculated_attributes). The gem extends ActiveRecord to permit definition of calculated attributes on models using a bit of raw SQL in a lambda. Returning to the example above, calculated\_attributes would allow us to define a `:comments_count` attribute on the `Post` model:

```ruby
# models/post.rb
class Post < ActiveRecord::Base
  ...
  calculated :comments_count, -> { 
    "SELECT count(*) FROM comments WHERE comments.post_id = posts.id AND comments.is_approved = 1"
  }
  ...
end
```

And then reference it in the controller/view to automatically incorporate the comments count in the ActiveRecord SQL query:

```erb
<!-- posts/index.html.erb -->
<table>
  <thead>
    <tr>
      <th>Post Title</th>
      <th># Comments</th>
    </tr>
  </thead>
  <tbody>
    <% @posts.calculated(:comments_count).each do |post| %>
      <tr>
        <td><%= link_to post.title, post %></td>
        <td><%= post.comments_count %></td>
      </tr>
    <% end %>
  </tbody>
</table>
```

Presto! An elegant solution to eliminate the n+1 query problem and incorporate the flexibility of raw SQL into the ActiveRecord paradigm.

ORMs and abstractions such as ActiveRecord are incredibly useful in eliminating boilerplate code and allowing Agile development teams to rapidly implement new features. But they also allow for mounting performance problems if used carelessly.

It is important when writing Rails to think carefully about what the abstractions are doing behind the scenes and find or build in optimizations when necessary. If you want to push the limits of what is possible with Rails at at a rapidly growing SaaS company founded by two Silicon Valley veterans, check out our [careers page](http://www.aha.io/company/careers).

*This post was originally published on the [Aha! blog](http://blog.aha.io/index.php/using-nested-selects-for-performance-in-rails/).*
