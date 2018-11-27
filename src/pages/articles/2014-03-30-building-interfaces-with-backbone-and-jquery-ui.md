---
title: Building Interfaces with Backbone and jQuery UI
date: 2014-03-30 03:37:09 Z
tags:
- development
- backbone
- jqueryui
layout: post
draft: false
category: development
---

For my senior design project, I recently had to build a fairly complex client-side interface for professors to create and modify a course plan.  The professors wanted to have drag-and-drop functionality so they could, for example, quickly drag a particular lecture/quiz/homework to a different date on the schedule when they needed something to change.  

I'd worked a bit with Backbone previously, and it seemed like an obvious choice given the layers of data I'd need to work with.  For drag-and-drop functionality, I found jQuery UI would work nicely, as it exposes droppable and draggable methods that make it easy to create draggable elements and "lander" elements to collect them.  However, I had to hammer out a number of implementation details, so I decided to create a tutorial for other people handling the same problem.

First, the tech stack:

* Ruby on Rails on the server side
* [underscore.js](http://underscorejs.org/), a JavaScript library that provides a handful of convenient programming helpers
* [Backbone.js](http://backbonejs.org/)
* [backbone.stickit](http://nytimes.github.io/backbone.stickit/) - a Backbone extension to bind Backbone collection elements to view inputs
* [backbone.collectionView](http://rotundasoftware.github.io/backbone.collectionView/) - a Backbone extension to make it easy to render a Backbone collection as a list
* [jQuery](http://jquery.com/)
* [jQuery UI](https://jqueryui.com/)

Within the structure of Rails, I find it pleasant to create a handful of folders underneath `assets/javascripts`: `/models`, `/collections`, `/collectionViews`, `/views`, and `/libs`.  The first four are for different kinds of Backbone elements, and the last is for the libraries themselves.  Make sure you're including your libraries in the correct order (whether in `application.js` or just in your HTML): Backbone has to come before stickit and collectionView, and jQuery has to come before jQuery UI.

For this tutorial, we'll be building a page for professors to create a course plan.  This works by presenting a list of "days" on the left-hand side of the page, a list of "topics" on the right-hand side of the page, and letting the user drag "topics" onto "days" (so, for example, the "Lecture 1" topic might go on Day 1).

First, we'll construct some simple HTML to frame the content.  It looks something like this:

```erb
<div class="row">
  <div class="large-6 columns">
    <h1>Course Plan</h1>
  </div>
</div>
<div class="row">
  <div class="large-6 columns">
    <ul id="lesson-plan-container" class="collection-list"></ul>
  </div>
  <div class="large-6 columns">
    <div id="topics">
   	  <h2>Topics</h2>
   	  <ul id="topic-list-container"></ul>
   	</div>
  </div>
</div>
<br>

<div class="row">
  <div class="large-6 columns">
    <%= link_to "Save Course Plan", "#", :id => "save-course-plan", :class => "button secondary" %>
   </div>
</div>
```

The `<div class="row">` and `<div class="large-6 columns">` elements are just styling (from the excellent [Zurb Foundation](foundation.zurb.com)) and aren't especially relevant.  The important elements are `<ul id="lesson-plan-container" class="collection-list">` and `<ul id="topic-list-container"></ul>`- these will be filled with Lesson Plans and Topics, respectively, by the javascript code.  The last block is just a save button; more on that later as well.

We next need to set up models for the data.  Create a file under the `/models` directory called `model.topic.js` (or whatever your naming convention is); it should look like this:

```javascript
// Extend the Model with defaults
Topic = Backbone.Model.extend({
  defaults: {
    id: 0,
  	title: 'New Topic',
  	topic_type: 'Misc',
  	description: 'Topic Description'
  }
});
Topic.bind("remove", function() {
  this.destroy();
});
```
    
The model is pretty simple but does two important things.  It sets up default values for when a new Topic is added, and it includes binding so the model self-destroys when it is removed from the view.  The Lesson Plan model looks pretty similar:

```javascript
// Extend the Model with defaults
LessonPlan = Backbone.Model.extend({
  defaults: {
    id: 0,
    topics: []
  }
});
```
    
The `topics` attribute will hold an array of topics attached to the Lesson Plan model.

Next up, we have collections:

```javascript
// Extend the Collection
Topics = Backbone.Collection.extend({
  model: Topic,
  url: "/topics/" + coursename
});

TopicsCollection = new Topics();
TopicsCollection.fetch();
```

The URL tells the collection where to query to get a JSON list of Topic models.  We then instantiate a new instance of the collection and call `fetch()` which triggers an AJAX call to get the topic list from the server and load it into the collection.

The Lesson Plan collection is a bit more complex:

```javascript
// Extend the Collection
LessonPlans = Backbone.Collection.extend({
  model: LessonPlan,
  url: window.location.pathname,
  save: function() {
    var collection = this;
    options = {
      success: function(model, resp, xhr) {
        collection.reset(model);
      }
    };
    return Backbone.sync('update', this, options);
  }
});

LessonPlansCollection = new LessonPlans();
LessonPlansCollection.fetch();
```
    
The model and URL are similar to the Topic collection. In my case, the Lesson Plan list is served from the same URL as the HTML page (with Rails logic to determine the response based on the request content-type). The `save` function defines how the collection gets saved back to the server- when `LessonPlansCollection.save()` is called, the collection will make a HTTP `put` request containing the updated JSON list of topics to be saved.

Third, we define the views, starting with `view.topic.js`:

```javascript
// Extend the View
TopicView = Backbone.View.extend({

  template: _.template( "<div id='<%= ident %>' class='topic'><%= title %><% if(files.length > 0) { %><img src='/assets/icons/document.png' class='topic-file-icon' /><% } %></div>" ),

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    // Make topics draggable
    $(".topic").draggable({
      start: function(e, ui) {
        $(ui.helper).addClass("ui-draggable-topic");
      },
      cursorAt: {
        top: 5,
        left: 5
      },
      helper: 'clone',
      scroll: false,
      tolerance: 'pointer',
      revert: true,             
    });
  }
});
```

There's a few things going on here.  First, the template leverages underscore.js to rapidly render Topic models as HTML.  The template itself follows simple syntax- `<%= variable %>` to insert a variable, and a few more complex directives like `<% if(condition == true) { %> <% } %>` that we won't use here.  Second, we define a `render` function to instruct Backbone on how to turn a Topic model into HTML.  `this.$el.html()` inserts HTML into the Topic's DOM element, `this.template()` calls the template to render the argument, and `this.model.toJSON()` provides the Topic model as a JSON object to be rendered by the template.  After we insert the HTML, we also add some jQuery UI code to make the topic draggable.  A brief review of the parameters:

* `start` function attaches a particular CSS class to the Topic `<div>` when it starts dragging, which we use with CSS to make sure the Topic stays white with a nice border
* `cursorAt` tells jQuery UI to make sure the cursor stays 5x5 pixels away from the top-left corner of the draggging `<div>`- a nice polishing touch
* `helper: 'clone'` tells jQuery UI to make a clone of the `<div>` when it starts dragging.  This was necessary in my particular case because the Topics are held in an `overflow:scroll` fixed-position list.  Without the clone helper, the dragging `<div>` disappears when it's dragged out of its container div; the clone helper makes a copy of it so it is visible across the entire page.  If your interface isn't inside such a `<div>`, this is unnecessary.
* `scroll: false` tells jQuery UI to not scroll the page when the `<div>` is dragged off of it (which worked better with my application flow but is up to your preference)
* `tolerance: 'pointer'` tells jQuery UI to highlight the landing point when the cursor has been dragged inside it.  Other options are more or less tolerant- for example, one option requires the entire dragging `<div>` to be inside the landing `<div>` before it will register
* `revert: true` tells jQuery UI to put the dragging `<div>` back in its original position when it's released
* `revertDuration: 0` tells jQuery UI to make the revert instantaneous.  Larger numbers (in seconds) will cause the dragging `<div>` to slide back to its original location.

These are just a few of the options available with the fantastic jQuery UI droppable library; others are in the [docs](http://jqueryui.com/draggable/).

Next up is the Lesson Plan view, which is again a little more complex:

```javascript
// Extend the View
var LessonPlanView = Backbone.View.extend({

  template: _.template( "<div class='lesson-plan'><b><%= name %></b><div class='lesson-plan-topics'></div></div>" ),

  render: function() {
    this.$el.html(this.template(this.model.toJSON()));

    if(this.model.get("topics") != null) {
      var topicList = "";
      this.model.get("topics").forEach(function(topic_id) {
        var topic = TopicsCollection.get(topic_id);
        topicList += "<div rel='" + topic_id + "'>" + topic.get("title") + "<span class='topiclist-x'>X</span></div>";
      });
      this.$el.find(".lesson-plan-topics").html(topicList);
    }

    $(".topiclist-x").off("click");
    $(".topiclist-x").on("click", function() {

      var topics = LessonPlansCollection.get($(this).parent().parent().parent().parent().parent().attr("data-model-cid")).get("topics");
      var topicToDrop = parseInt($(this).parent().attr("rel"));
      topics.splice(topics.indexOf(topicToDrop), 1);

      LessonPlanCollectionView.render();
    });

    // Make topics droppable
    $( "#lesson-plan-container>li" ).droppable({
      accept: ".topic",`drop`
      drop: function(event, ui) {

        var lesson_plan = LessonPlansCollection.get($(event.target).attr("data-model-cid"));
        var topic = parseInt($(ui.draggable).attr("id"));

        // Add topic to the lesson plan
        if(lesson_plan.get("topics").indexOf(topic) == -1) {
          lesson_plan.set("topics", lesson_plan.get("topics").concat(topic));
        }

        LessonPlanCollectionView.render();
      }
    });
  }
});
```
    
The template is similar to the previous view.  The render function renders the template and then uses jQuery logic to insert the array of topics that are held by the Lesson Plan (there may be a pure underscore way to handle this, but I was too lazy to figure it out :) ).  The next block of code binds a click event to the `.topiclist-x` class so when the 'x' at the corner of the topic is clicked, the logic removes that Topic model from the Lesson Plan's collection and rerenders it.  The third block of code makes the Lesson Plan div elements `draggable` so the topics can be dropped onto them.  Another rundown of the attributes:

* `accept: '.topic'` tells the `<div>` to accept `.topic` divs (doesn't matter much for this use case but if you're dragging multiple types of things around this is useful)
* `drop` defines the code that is executed when a Topic is dropped onto the Lesson Plan `<div>`.  The function retrieves the correct Lesson Plan object from the collection, finds the ID of the dragged topic (which is set as its HTML `id` in the rendering logic), and concatenates the topic ID to the Lesson Plan's list of topics if it's not already there (to prevent duplicate topics on the same Lesson Plan).  Finally, the logic rerenders the CollectionView to display the updated topic; as we'll see in a moment, rendering the CollectionView causes each object in the Collection to be rerendered, so the topic shows up in the list on the Lesson Plan `<div>`.

Finally, we define collectionViews for Topics and LessonPlans.  collectionView is provided by the `backbone.collectionView` library and presents an easy way to render a collection into a list- it also provides some sorting/dragging options that we're not using in this example but may be useful elsewhere.  The Topic collectionView looks like such:

```javascript
// Create the CollectionView
TopicCollectionView = new Backbone.CollectionView({
  el: $("#topic-list-container"),

  collection: TopicsCollection,
  modelView: TopicView,
  selectable: false
});
```

and the Lesson Plan collectionView looks like such:

```javascript
// Create the CollectionView
LessonPlanCollectionView = new Backbone.CollectionView({
  el: $("#lesson-plan-container"),

  collection: LessonPlansCollection,
  modelView: LessonPlanView,
  selectable: false
});
```
    
Both are pretty simple- they just render each model in the provided collection and insert the resulting HTML in the given container `<div>`.

That's just about it.  We add one more jQuery binding:

```javascript
$("a#save-course-plan").click(function() {
  event.preventDefault();
  LessonPlanCollectionView.collection.save();
  alert("Course plan saved!");
});
```
            
which serves only to call the collection's `save()` function when the save button is clicked.  The server-side code is fairly trivial- it just accepts a list of JSON objects and saves it to the database.

And that's that!  You now have a simple Backbone interface that leverages jQuery UI's drag-and-drop functionality to create a clean, useful UI.  Happy coding!
