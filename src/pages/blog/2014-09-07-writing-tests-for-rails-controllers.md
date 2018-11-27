---
title: 'Writing Tests for Rails: Controllers'
date: 2014-09-07 17:39:21 Z
tags:
- development
- rails
- testing
layout: post
draft: false
category: development
---

In the [previous post](https://schneid.io/blog/writing-tests-for-rails-models.html), I discussed writing model tests to enhance the coverage of your test suite. In this final post, I'll cover one other specific kind of test: controller tests.

Controller tests are similar to model tests in that while model tests test one specific method of a model, controller tests test one specific method of a controller. A controller test simply sends a request to a controller method and expects the controller to render a specific result (a response code like 200 OK, a redirection, or perhaps some specific content). In general, I don't find controller tests to be all that useful, as their functionality is usually subsumed by feature tests. However, controller tests are indispensible for testing APIs.

An API ("application program interface") is a web interface that accepts a request with parameters and either performs some action or renders a response or both. While the controllers we've used thus far have rendered HTML views, APIs typically render a data format (JSON or perhaps XML) to be consumed by another application. APIs are often used to serve data to a mobile application, a Javascript client, or another web application.

For our application, we'll create a simple API with two endpoints: one to render a JSON list of all articles and another to render a JSON list of a specific article. For starters, create a file at `app/controllers/api/v1/articles_controller.rb` and give it the following contents:

```ruby
class Api::V1::ArticlesController < ApplicationController
  def index
    render json: Article.all
  end

  def show
    render json: Article.find(params[:id])
  end
end
```
    
Then, open your `routes.rb` and add the following lines:

```ruby
namespace :api do
  namespace :v1 do
    resources :articles, only: [:index, :show]
  end
end
```
    
The functionality of this API should be pretty obvious. Start the application (`rails s`) and visit http://localhost:3000/api/v1/articles; you should see a JSON-formatted list of all of the articles in your development database (or `[]` if you don't have any articles). If you visit http://localhost:3000/api/v1/articles/ID, where ID is the database ID of an article from the list, you'll see that article object rendered as JSON. The `v1` in the path stands for "version 1"- it is generally appropriate to version APIs. The reason for this is that client applications depend on your API to behave as expected whenever they send requests to a given route. If you want to make changes to your API in the future, you might have to change or remove endpoints; versioning allows you to do that without breaking client applications that are still dependent on the old version (by just creating a new version).

Next, we'll create a controller test to test the new API. Create a file at `/spec/controllers/api/v1/articles_controller_spec.rb` and give it the following contents:

```ruby
require 'spec_helper'

describe Api::V1::ArticlesController do
  let!(:article1) { create :article, title: 'First Article' }
  let!(:article2) { create :article, title: 'Second Article' }

  describe '#index' do
    subject  { get :index }

    it 'renders a JSON list of articles' do
      expect(JSON.parse(subject.body).length).to eq(2)
      expect(JSON.parse(subject.body)[0]['title']).to eq('First Article')
      expect(JSON.parse(subject.body)[1]['title']).to eq('Second Article')
    end
  end

  describe '#show' do
    subject  { get :show, id: article1.id }

    it 'renders the first article' do
      expect(JSON.parse(subject.body)['title']).to eq('First Article')
    end
  end
end
```
    
At the top of the spec, we'll use two `let!` statements to create two example articles for the tests. Each `describe` block is used to test one particular controller method. The `subject` block is used to describe the controller action being tested (in the first case, a GET request to the controller's index; in the second case, a GET request to the controller's SHOW method with the ID of the first article). Unlike feature tests, you can use multiple HTTP verbs in controller subjects- POST, PATCH, DELETE, etc. Inside the `it` blocks, the `subject` object is the response returned by the request defined in the subject. As such, we can use `JSON.parse(subject.body)` to get access to whatever JSON is returned by the controller and ensure it is correct. 

If you run this spec with `rspec spec/controllers/api/v1/articles_controller_spec.rb`, you should see two green dots followed by 

> 2 examples, 0 failures

and if you run all of the specs with `rspec` and then open `coverage/index.html`, you should see that all files (including the new API controller) are at 100% test coverage. You can review the code for this post [here](https://github.com/schneidmaster/rspec-blog-example/commit/cc64edbd7eb5fd3bd9106c75c68ec30edf39a943).
