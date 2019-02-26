---
title: 'Writing Tests for Rails: Factories'
date: 2014-08-31 21:05:37 Z
tags:
- development
- rails
- testing
layout: post
draft: false
category: development
---

In the [last post](https://schneider.dev/blog/writing-tests-for-rails-setup.html), I covered setting up the rspec test environment and writing your first basic feature test. In this post, I'll cover using factories to mock data and write a simple feature test using that mocked data. 

First, you'll need to add a few gems to the test group of your `Gemfile`: DatabaseCleaner, FactoryGirl, and Faker. (I briefly covered what each of these gems does in the [first post](https://schneider.dev/blog/writing-tests-for-rails-introduction.html) of the series, and you'll see more later in this tutorial.) The test group of your gemfile should look like this:

```ruby
group :test do
  gem 'capybara', '~> 2.3.0'
  gem 'capybara-screenshot', '~> 0.3.19'
  gem 'database_cleaner', '~> 1.3.0'
  gem 'factory_girl_rails', '~> 4.4.1'
  gem 'faker', '~> 1.3.0'
  gem 'poltergeist', '~> 1.5.0'
  gem 'rspec-rails', '~> 2.14.1'
  gem 'simplecov', '~> 0.8.2'
end
```
    
Run `bundle` to update your gems.

The first thing we'll configure is DatabaseCleaner. DatabaseCleaner empties out your database after each test, to make sure that test data created by one spec doesn't mess with the success/failure of any other specs. This makes it much easier to debug failing tests- you always know that the database only has data created by the individual test, and thus you can isolate the problem much more quickly. Set up DatabaseCleaner by adding the following lines to the `RSpec.configure` block of `spec_helper`:

```ruby
config.before(:suite) do
  DatabaseCleaner.clean_with :truncation
end

config.before(:each) do
  DatabaseCleaner.strategy = :transaction
  DatabaseCleaner.start
end

config.after(:each) do
  DatabaseCleaner.clean
end
```
    
The first block tells DatabaseCleaner to truncate the test database before running the test suite (i.e. all of your tests). The second block tells DatabaseCleaner to start itemizing all database changes before each spec as a transaction, and the third block tells DatabaseCleaner to clean out all of the changes in the transaction after each test.

Next, we'll set up factories for all of the models in the blog application. Factories (created with FactoryGirl) set up fake test data for all of the relevant fields in a model, so you can (for example) set up a test article in your tests with a simple `create(:article)` rather than `Article.create(title: 'Title', body...`. For starters, add the line `config.include FactoryGirl::Syntax::Methods` to the `RSpec.configure` block of `spec_helper`- that just includes the FactoryGirl helper methods in all of your tests.

Next, create a `factories/` folder underneath your `spec/` folder. We'll create the Article factory first. Create a new file at `spec/factories/articles.rb` and give it the following contents:

```ruby
FactoryGirl.define do
  factory :article do
    title { Faker::Lorem.word }
    text { Faker::Lorem.paragraph }
  end
end
```

Each line in the factory corresponds to an attribute of the Article class. The block argument tells FactoryGirl how to fake data for the attribute (by invoking the appropriate Faker function to generate fake test data). Faker offers a wide variety of methods for generating specific types of data; the documentation is pretty easy to reference and is available [here](http://rubydoc.info/github/stympy/faker/master/frames). The `{ ... }` around the Faker call is important, as it tells FactoryGirl to reevaluate the Faker invocation on every creation. If you don't wrap the Faker call in braces, it will only be evaluated once meaning that all of your mocked objects will have the same data. (This can be useful, obviously, if you want a particular attribute to always be the same- for example, if our application was more advanced and had an `is_published` boolean attribute on articles, you might want to mock that in a factory with the line `is_published true`.) FactoryGirl has a large number of additional options for mocking data, setting up assocations, and more; you can read the expanded documentation [here](https://github.com/thoughtbot/factory_girl).

Next up, we'll create a simple Article feature spec to show off our new factory. For starters, create a new file at `spec/features/article_feature_spec.rb` and give it the following contents:

```ruby
require 'spec_helper'

feature 'Article' do
  describe 'show article' do
    let!(:article) { create :article, title: 'Writing Tests for Rails' }

    scenario 'shows the article' do
      visit articles_path
      click_on 'Show'
      expect(page).to have_content('Writing Tests for Rails')
    end
  end
end
```
    
The `let!` block is evaluated by rspec before each test within the `describe` block that contains it, so an article is created and then the scenario is executed. We could have left the block's contents as `create :article` but then the article's name and contents would both have been random data from Faker so we wouldn't really know how to test whether the article was correctly displayed. So instead, we override the `title` attribute with something specific ("Writing Tests for Rails"). Then, we visit the `articles_path` (page with the list of articles), click on the "Show" link, and expect the page to display the title of the article that FactoryGirl created. Run the test suite with the `rspec` command and you should see two green dots followed by

> 2 examples, 0 failures

If you open up `coverage/index.html` now, you'll see that the ArticlesController now appears in the list of files. Unfortunately, it's only at 47.06% coverage so far, since we've only written a feature test for one of its methods (`#show`). If you click on the file in the coverage report list, SimpleCov will display the file and highlight the "hit" (tested) lines in green and the "missed" (untested) lines in red. Not to worry, though; we'll write more tests for the rest of ArticlesController later on.

And that's it for this post. You can view the changes made during this tutorial on GitHub [here](https://github.com/schneidmaster/rspec-blog-example/commit/6fe141348d42f80d5769f8ef5a6d6d646129453f). In the [next article](https://schneider.dev/blog/writing-tests-for-rails-features.html), I'll cover how to write more complicated feature tests (also incorporating mocked data) and use helper methods to enhance your rspec tests. 
