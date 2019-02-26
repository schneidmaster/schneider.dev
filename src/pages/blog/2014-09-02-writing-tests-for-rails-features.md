---
title: 'Writing Tests for Rails: Features'
date: 2014-09-02 17:59:27 Z
tags:
- development
- rails
- testing
layout: post
draft: false
category: development
---

In the [last post](https://schneider.dev/blog/writing-tests-for-rails-factories.html), I covered mocking data with FactoryGirl and writing a basic feature test using mocked data. In this article, I'll cover writing more complicated feature specs and incorporating helper methods to enhance your feature tests.

As I mentioned at the end of the previous post, our first article feature test covered the `#show` method of the articles controller but left the controller at only 47.66% test coverage. For starters, we'll add feature specs to cover the other methods of the articles controller (listing, creating, editing, and deleting articles). For completeness, we'll need to test each function under multiple contexts- when no user is logged in, when the user that owns the article is logged in (for edit/update), and when a different user is logged in.

To mock this behavior, we'll need to add a user factory to quickly mock up users. Create a file at `spec/factories/users.rb` and give it the following contents:

```ruby
FactoryGirl.define do
  factory :user do
    email { Faker::Internet.email }
    password 'password'
  end
end
```
    
Note that we're just setting every mocked user's password to 'password'- as you'll see later, this makes it much simpler to mock the process of users logging in, and we're testing the functionality of our application, not the ability of our users to select secure passwords.

We'll also need to add a line to the Article factory to let FactoryGirl know that an association exists between the User and Article models. To denote this, we simply add a line with the name of the associated model to `spec/factories/articles.rb`:

```ruby
FactoryGirl.define do
  factory :article do
    title { Faker::Lorem.word }
    text { Faker::Lorem.paragraph }
    user
  end
end
```
    
Before we start writing, we're also going to add our first helper method. As we'll see, logging in a user prior to a specific scenario is a frequent action in feature tests. As such, our tests will stay much DRYer and more readable if we add a helper method to handle logging in users. To accomplish this, create a file at `spec/support/session_helpers.rb` and give it the following contents:

```ruby
module Features
  module SessionHelpers
    def log_in(user)
      visit login_path

      fill_in 'email', with: user.email
      fill_in 'password', with: 'password'
      click_on 'Log In'
    end
  end
end
```

Then, add the following line to your `RSpec.configure` block to include the new helper method in all of your feature tests:

```ruby
config.include Features::SessionHelpers, type: :feature
```

Now, from any feature spec, we can call `log_in user` to log in a specified user.

With all that set up, we can now write tests for the rest of the functionality in the articles controller. We'll start with the new article workflow. In general, it's helpful to write out context and scenario blocks for the tests you want to write before filling in the details- that will help you think through every context that you want to test.

There's a couple of possibilities for a user creating a new article:

1. A user who is not logged in visits `/articles/new` and should be redirected to the login form
2. A user who is logged in visits `/articles/new` and fills in the information for the article, but does not give it a title and is shown a validation error
3. A user who is logged in visits `/articles/new` and fills in the information for the article, but gives it a title less than five characters in length and is shown a validation error
4. A user who is logged in visits `/articles/new`, fills in valid information for a new article, and is redirected to the new article page

To test each possibility, we'll write the following context and scenario blocks:

```ruby
describe 'new article' do
  context 'user is not logged in' do
    scenario 'redirects to login path' do
    end
  end

  context 'user is logged in' do
    before { log_in create(:user) }

    context 'with invalid fields' do
      scenario 'shows errors' do
      end
    end

    context 'with valid fields' do
      scenario 'creates the article' do
      end
    end
  end
end
```
    
Note that we're combining the possible form validation error cases under one 'shows errors' scenario- this keeps our tests short and readable, as we can simply use multiple `expect` calls to expect each distinct error to be present.

Also, this hasn't been explicitly covered yet, but a `before` block placed inside any `describe` or `context` block will be executed before each test in that block is run. In this case, we're using the `before` block to log in a user before executing the scenarios where a user is logged in. The `before` block can be written with either single-line `before { ... }` or multi-line `before do ... end` syntax.

Now that we've shelled out the tests, we'll go back through and fill in the details for each test, like so:

```ruby
describe 'new article' do
  context 'user is not logged in' do
    scenario 'redirects to login path' do
      visit new_article_path
      expect(page).not_to have_content('New article')
      expect(page).to have_content('Email')
    end
  end
  context 'user is logged in' do
    before { log_in create(:user) }

    context 'with invalid fields' do
      scenario 'shows errors' do
        visit new_article_path
        fill_in 'Text', with: Faker::Lorem.paragraph
        click_on 'Create Article'
        expect(page).to have_content("Title can't be blank")
        fill_in 'Title', with: 'Abc'
        click_on 'Create Article'
        expect(page).to have_content ('Title is too short (minimum is 5 characters)')
      end
    end

    context 'with valid fields' do
      scenario 'creates the article' do
        visit new_article_path
        fill_in 'Title', with: 'Exciting News'
        fill_in 'Text', with: 'Some news happened this week and it was splendid.'
        click_on 'Create Article'
        expect(page).to have_content('Exciting News')
        expect(page).to have_content('Some news happened this week and it was splendid.')
      end
    end
  end
end
```
    
Now, run the test suite from the terminal with the `rspec` command. You should see five green dots followed by

> 5 examples, 0 failures

Also, if you reopen the coverage report at `coverage/index.html`, you'll see that the articles controller is up to 67.65% test coverage. If you open the file, you'll see that the `#new` and `#create` methods are completely green, as we've hit all of the possible code paths in those two methods. (You'll also see that the sessions controller is now listed but only at 80%. That's because it's now being touched- with the `log_in` helper method we defined above- but we're not testing all of its code yet, such as if a user tries to log in with invalid credentials. We'll get to that later.)

Next, we'll write feature specs for the article edit/update methods. There is one extra possible case for this flow, since we only allow users to edit an article that they created. Let's list the possible cases again:

1. A user who is not logged in visits `/articles/1/edit` and should be redirected to the login form
2. A user who is logged in but does not own the article with ID 1 visits `/articles/1/edit` and is redirected to the home page with an error message
3. A user who is logged in and owns the article with ID 1 visits `/articles/1/edit` and fills in updated information for the article, but does not give it a title and is shown a validation error
4. A user who is logged in and owns the article with ID 1 visits `/articles/1/edit` and fills in updated information for the article, but gives it a title less than five characters in length and is shown a validation error
5. A user who is logged in and owns the article with ID 1 visits `/articles/1/edit` and fills in updated information for the article, and is redirected to the updated article page

As before, we'll shell out the context and scenario blocks before filling in the details:

```ruby
describe 'edit article' do
  let!(:owner) { create :user }
  let!(:article) { create :article, title: 'Exciting News', user: owner }

  context 'user is not logged in' do
    scenario 'redirects to login path' do
    end
  end

  context 'non-article owner is logged in' do
    before { log_in create(:user) }

    scenario 'shows error message' do
    end
  end

  context 'article owner is logged in' do
    before { log_in owner }

    context 'with invalid fields' do
      scenario 'shows errors' do
      end
    end

    context 'with valid fields' do
      scenario 'updates the article' do
      end
    end
  end
end
```
    
For this block, we need to create the article to be edited as well as the article owner, so we add a few `let!` statements at the top. We'll want to explicitly set an attribute of the article (the title) so we can make sure the actual update process works correctly. We also have an additional context block for the case where a user is logged in who does not own the article. Next, we'll fill in the details of the tests with something like this:

```ruby
describe 'edit article' do
  let!(:owner) { create :user }
  let!(:article) { create :article, title: 'Exciting News', user: owner }
  context 'user is not logged in' do
    scenario 'redirects to login path' do
      visit edit_article_path(article)
      expect(page).not_to have_content('Edit article')
      expect(page).to have_content('Email')
    end
  end
  context 'non-article owner is logged in' do
    before { log_in create(:user) }

    scenario 'shows error message' do
      visit edit_article_path(article)
      expect(page).not_to have_content('Edit article')
      expect(page).to have_content('You may not access that article.')
    end
  end
  context 'article owner is logged in' do
    before { log_in owner }

    context 'with invalid fields' do
      scenario 'shows errors' do
        visit edit_article_path(article)
        fill_in 'Title', with: ''
        click_on 'Update Article'
        expect(page).to have_content("Title can't be blank")
        fill_in 'Title', with: 'Abc'
        click_on 'Update Article'
        expect(page).to have_content ('Title is too short (minimum is 5 characters)')
      end
    end

    context 'with valid fields' do
      scenario 'updates the article' do
        visit edit_article_path(article)
        fill_in 'Title', with: 'Stupendous News'
        click_on 'Update Article'
        expect(page).to have_content('Stupendous News')
        expect(page).not_to have_content('Exciting News')
      end
    end
  end
end
```
    
Note that we can access the article created in the `let!` block at the top of the suite using the named local variable. `visit edit_article_path(article)` references the article object created in `let!(:article) ...`.

Run the suite again with the `rspec` command. You should now see 9 green dots followed by

> 9 examples, 0 failures

And if we reopen the coverage report, we see that the articles controller is now at 91.18% test coverage- we're just missing a test case for the `#destroy` method.

The cases for the destroy flow will be very similar to those for the edit/update flow. The only tricky part is getting Capybara to submit a request using a method other than HTTP GET. In the above tests, we've been able to simply call `visit edit_article_path(article)` to test the redirect cases when a user is not logged in or the article owner is not logged in. However, that doesn't work for the destroy flow because Rails expects the destroy request to be sent using a HTTP DELETE.

I've found that the simplest way to handle this is simply to set up another helper method in `session_helpers` as follows:

```ruby
def delete_request(path)
  page.driver.submit :delete, path, {}
end
```
    
Then, you can simply use `delete_request path` instead of `visit path` in your feature tests. Keep in mind that Rails expects the DELETE request to be sent to the article path- so the calls in your feature specs will likely look like `delete_request article_path(article)`. In the future, it may also help you to set up a similar method for `post_request` or any other non-GET methods you need to test as you're writing your own apps and tests.

I'll explicitly walk through you through one more set of tests- creating a feature spec to test the login/logout flow. After that, I'll leave the rest of the basic feature tests (getting the articles controller, comments controller, and users controller to 100% coverage) as an exercise to check your understanding thus far in how to write complete feature specs. I've also finished writing the feature suite and [committed](https://github.com/schneidmaster/rspec-blog-example/commit/b59f0eef5ded4db363029f70e39c906146cb3533) the complete set of tests to GitHub, so you can check to see how yours compare.

The only tricky thing about writing the feature spec for the login/logout flow is that the sessions controller doesn't exactly have the same kind of CRUD methods with model operations like the other controllers. There are two flows to test here: the login flow and the logout flow.

The login flow has two cases:

1. A user visits the login page, enters a valid email and password, and is logged in
2. A user visits the login page, enters invalid credentials, and is shown an error

While the logout flow has just one case:

1. A user clicks the "Logout" link and is logged out

To test this flow, we'll create a file at `spec/features/auth_feature_spec.rb`. We'll shell out the test cases as follows:

```ruby
feature 'Auth' do
  describe 'login' do
    let!(:user) { create :user }

    context 'user fills in invalid credentials' do
      scenario 'shows error' do
      end
    end

    context 'user fills in valid username and password' do
      scenario 'logs in the user' do
      end
    end
  end
  describe 'logout' do
    let!(:user) { create :user }

    before { log_in user }

    context 'user clicks logout link' do
      scenario 'logs out the user' do
      end
    end
  end
end
```
    
And fill in the details:

```ruby
feature 'Auth' do
  describe 'login' do
    let!(:user) { create :user }

    context 'user fills in invalid credentials' do
      scenario 'shows error' do
        visit login_path
        fill_in 'email', with: user.email
        fill_in 'password', with: 'notpassword'
        click_on 'Log In'
        expect(page).to have_content('Invalid credentials; please try again')
      end
    end
    context 'user fills in valid username and password' do
      scenario 'logs in the user' do
        visit login_path
        fill_in 'email', with: user.email
        fill_in 'password', with: 'password'
        click_on 'Log In'
        expect(page).to have_content('Logged in!')
      end
    end
  end

  describe 'logout' do
    let!(:user) { create :user }
    before { log_in user }
    context 'user clicks logout link' do
      scenario 'logs out the user' do
        click_on 'Sign Out'
        expect(page).to have_content('Sign In')
        expect(page).not_to have_content('Sign Out')
      end
    end
  end
end
```
    
And that's it for this tutorial. Try your hand at writing feature specs for the rest of the articles controller, comments controller, and users controller, and check your code against my full suite [here](https://github.com/schneidmaster/rspec-blog-example/commit/b59f0eef5ded4db363029f70e39c906146cb3533). In the [next post](https://schneider.dev/blog/writing-tests-for-rails-models.html), I'll cover writing model tests to specifically target complicated model methods.
