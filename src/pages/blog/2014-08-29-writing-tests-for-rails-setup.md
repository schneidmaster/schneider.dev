---
title: 'Writing Tests for Rails: Setup'
date: 2014-08-29 16:54:38 Z
tags:
- development
- rails
- testing
layout: post
draft: false
category: development
---

In the [last post](https://schneider.dev/blog/writing-tests-for-rails-introduction.html), I introduced this blog series on writing effective tests for Rails and briefly reviewed the test stack we'll be using. In this post, I'll cover how to set up your test environment and write your first feature test.

For the duration of this series, I've created a sample Rails application that I'll be modifying as I go along to give you a sense for how testing looks in a hands-on sense. The example code is available on my GitHub [here](https://github.com/schneidmaster/rspec-blog-example/). As a base for the examples, I followed the Rails [Getting Started tutorial](http://guides.rubyonrails.org/getting_started.html) to create a basic blog app. I also added a basic user/password authentication system, which you can review [here](https://github.com/schneidmaster/rspec-blog-example/commit/f4717564bf59fd8b375c21828c97ff4a2a0405f8). I'll be linking to other specific commits throughout the series as I make changes.

For starters, you'll want to add some gems to your `Gemfile`:

```ruby
group :test do
  gem 'capybara', '~> 2.3.0'
  gem 'capybara-screenshot', '~> 0.3.19'
  gem 'poltergeist', '~> 1.5.0'
  gem 'rspec-rails', '~> 2.14.1'
  gem 'simplecov', '~> 0.8.2'
end
```

Run `bundle install` to install the new test gems.

Next, generate a basic rspec configuration setup by running `rails g rspec:install`. This will create three things: an `.rspec` file to hold general rspec configuration options (this is not important for now), a `spec/` directory to contain your tests, and a `spec/spec_helper.rb` file. 

Open up `spec_helper`; we're going to make a couple of changes so we'll be set up to use Capybara. At the top of the file, add the following lines under the existing requires:

```ruby
require 'capybara/rspec'
require 'capybara-screenshot/rspec'
require 'capybara/poltergeist'
require 'simplecov'
```    

Before the start of the `RSpec.configure` block, add the following lines to tell SimpleCov to generate a coverage report whenever your tests are executed:

```ruby
# Generate coverage report
SimpleCov.start
```

Then, at the end of the configuration block, add the following lines to configure Capybara to use poltergeist:

```ruby
# Set up Capybara
Capybara.register_driver :poltergeist do |app|
  Capybara::Poltergeist::Driver.new(app)
end
Capybara.javascript_driver = :poltergeist
Capybara.server_port = 5000
```
    
Now it's time to write our first test! All of your tests will be contained in folders inside the `spec/` directory. If you run the `rspec` command from your application's root directory with no parameters, rspec will automatically find and run all tests in your `spec` directory. You can also instruct `rspec` to execute a specific test or folder of tests, by running something like `rspec spec/features/my_feature_spec.rb`.

Our first test will be a very simple feature test, to test that the app correctly welcomes the user when they first visit. Create a file called `spec/features/welcome_feature_spec.rb` and give it the following content:

```ruby
require 'spec_helper'

feature 'Welcome' do
  scenario 'welcomes the user' do
    visit root_path
    expect(page).to have_content('Hello, Rails!')
  end
end
```
    
As mentioned previously, Capybara will simulate a user interacting with your application and then expect particular behavior from the application. In this case, the "user" visits the root path of the application and expects the page to have the content "Hello, Rails!" All of the route helpers are available in rspec feature tests, so we could visit any of the named paths output by `rake routes`, or just visit a string path (like `visit '/'`).

The `expect` call is the most basic component of any rspec test. The entire purpose of feature testing is to perform user actions and then expect the application to behave correctly in response. Later, we'll write feature tests for more complex behavior (for example, a user visits the root path, clicks "Sign In", and registers for an account). You can also use `expect(page).not_to have_content('something')` to ensure that undesirable content is not present (this could be useful, for example, after you expect an object to have been deleted). A number of other, more complex matchers are available, but outside the scope of this tutorial; you can read further documentation and examples [here](https://www.relishapp.com/rspec/rspec-expectations/docs/built-in-matchers).

Now let's run the test. In the terminal, navigate to the root directory of your application and run the `rspec` command. You should see one green dot followed by

> 1 example, 0 failures

Congrats! Your first test successfully passed. If you navigate to the `coverage/` folder that's been created in your application root directory and open the `index.html` file, you'll see the coverage report automatically generated for your application. Note that the coverage report only includes files touched by your tests- since only `ApplicationController` and `WelcomeController` were loaded by this simple test, they're the only ones currently included in the report. Once we start testing the other features of the application, the coverage report will be a useful tool to make sure your tests aren't missing any lines of code. (If you use git, you will probably also want to add `coverage/` to your `.gitignore` to keep from polluting the repository.)

That's it for this tutorial. You can see all of the code for these changes [here](https://github.com/schneidmaster/rspec-blog-example/commit/a1ab88dc0f926db88bf3b15446f6c41b11fe2cac). In the [next post](https://schneider.dev/blog/writing-tests-for-rails-factories.html), I'll cover creating test data with factories as well as some more complicated feature specs for the other controllers.
