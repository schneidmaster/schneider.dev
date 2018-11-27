---
title: Wiring Associations in SailsJS
date: 2013-12-26 02:08:39 Z
tags:
- development
- nodejs
- sailsjs
layout: post
draft: false
category: development
---

Today, I rewrote a prototyped Rails API into SailsJS, to take advantage of the dramatic speed boost of server-side Javascript.  Waterline, the ORM used by Sails, currently does not support joins or associations (although they are [coming soon](https://github.com/balderdashy/sails/issues/124#issuecomment-21690561)), so manual solutions are required for the time being.  This gave me a few headaches, but wasn't too difficult or complicated once I figured it out.

One issue that I ran into quite early deals with the way Javascript (and, by extension, Sails) handles function calls.  Unlike most other languages, the majority of Javascript calls are non-blocking; that is, the following code:

```javascript
var array = Array();
someExistingArrayOfThings.forEach(function(thing) {
	array.push(thing);
});
return array;
```
    
will happily steam along and return an empty array, without waiting for the `forEach` loop to finish and populate it.  What this means for your Sails applications is that you must make judicious use of callbacks to ensure that data has been loaded before you try to use or return it.

With that in mind, I had to handle two primary use cases in my code: a one-to-many association and a many-to-many association.  Sails allows you to add custom instance methods to your models, with the following simple syntax:

```javascript
module.exports = {

  attributes: {
    firstName: 'string',
    lastName: 'string',

    // Define a custom instance method
    fullName: function() {
      return this.firstName + ' ' + this.lastName;
    }
  }
}

// Then use it in your query results like:
User.findOne(1).done(function(err, user) {
  // use the instance method
  var name = user.fullName();
});
```

When your instance method needs to make its own database query though, as with a join, you need to include a callback to be run once the query has completed.  So, if you have a parent model called `Parent` that has a one-to-many relationship with `Child` models, your instance method might look like this:

```javascript
module.exports = {

  attributes: {

    // insert your attributes, etc. here

    // Define a custom instance method
    children: function(callback) {
      Child.findByParentId(this.id).done(function(err, children) {
        callback(children);
      });
    }
  }
}
```
    
The function accepts a callback function parameter, loads all `Child` instances with a `parent_id` matching the current instance, and then triggers the callback function with the resulting `Child` objects.  To trigger this function, then, your code might look like this:

```javascript
/**
 * Action blueprints:
 *    `/parent/:id`
 */
show: function(req, res) {
  // Load the parent from the database
  Parent.findOne(req.param('id').done(function(err, parent) {

    // Handle any database errors
    if(err) {
      return res.json({
        result: 'error',
        msg: 'database error'
      });
    }

    // Handle case where parent is not found
    else if(!parent) {
      return res.json({
        result: 'error',
        msg: 'parent not found'
      });
    }

    // Load the parent's children
    else {
      parent.children(function(children) {

        // Set the children on the parent object
        parent.children = children;

        // Render the parent object (will include the children)
        return res.json({
          result: 'success',
          parent: parent
        });
      });
    }
  });
}
```
    
Notice that the callback anonymous function is not triggered by the model instance method until the children database load is complete; that way, in the controller, the JSON is not rendered until the parent's children have been loaded.

The second, similar case is a many-to-many relationship.  For example, let's say we have a many-to-many between `Restaurant` models and `Manager` models, as well as a `RestaurantsManagers` join table.  The model instance method for the `Restaurant` model would then look something like this:

```javascript
managers: function(callback) {
  var managers = Array();

	  // Find all RestaurantsManagers join records with this Restaurant id      RestaurantsManagers.findByRestaurantId(this.id).done(function(err, restaurants_managers) {

      // If there are no records, just return the empty array
      if(restaurants_managers.length == 0) {
        callback(managers);
      }

      // Else load each manager
      else {

      	// Counter to determine when all managers loaded
        var numManagersLoaded = 0;

        restaurants_managers.forEach(function(restaurant_manager) {

        // Load the manager record Manager.findOne(restaurant_manager.manager_id).done(function(err, manager) {

          // Push it onto the array
          managers.push(manager);

          // Increment the counter
          numManagersLoaded++;

          // If all managers have been loaded, trigger the callback
          if(numManagersLoaded == restaurants_managers.length) {
            callback(managers);
          }
        });
      });
    }
  });
},
```
    
 Again, notice how we use callbacks to make sure that the array of `Manager` models isn't returned until all of the managers have been loaded from the database.  Your controller code will then be practically identical to the last example:
 
```javascript
/**
* Action blueprints:
*    `/restaurant/:id`
*/
  show: function(req, res) {
    
    // Load the restaurant from the database
    Restaurant.findOne(req.param('id').done(function(err, restaurant) {

    // Handle any database errors
    if(err) {
      return res.json({
        result: 'error',
        msg: 'database error'
      });
    }

    // Handle case where restaurant is not found
    else if(!restaurant) {
      return res.json({
        result: 'error',
        msg: 'restaurant not found'
      });
    }

    // Load the restaurant's managers
    else {
      restaurant.managers(function(managers) {

        // Set the managers on the restaurant object
        restaurant.managers = managers;

        // Render the restaurant object (will include the managers)
        return res.json({
          result: 'success',
          restaurant: restaurant
        });
      });
    }
  });    
}
```

There's no replacement for solid join/association support, and hopefully Waterline will have it available soon.  In the meantime, though, hopefully this tutorial will help you understand how to manually wire up joins and associations in your SailsJS apps.
