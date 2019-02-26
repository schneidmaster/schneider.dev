---
title: 'Writing Tests for Rails: Models'
date: 2014-09-03 17:43:56 Z
tags:
- development
- rails
- testing
layout: post
draft: false
category: development
---

In the [previous post](https://schneider.dev/blog/writing-tests-for-rails-features.html), I finished up covering how to write comprehensive feature tests for Rails applications. Feature tests will do the trick most of the time, as they effectively simulate a user stepping through each of the possible flows through your application and thus ensure correct behavior. However, there are times when feature tests aren't targeted enough- you may see that the behavior isn't as expected, but still have to do a good deal of hunting to find where the problem lies. This becomes more and more true as your application grows; large applications often have complicated model methods for manipulating data, and as a result, tracing down errors can be difficult even when you know they exist.

The solution is writing model specs to provide extra coverage for the more complicated model methods in your application. Model specs are useful because they tell you exactly where the error lies when something breaks, rather than merely telling you what has occurred. For this tutorial, we'll add a fairly simple  method to the Article model and then write a couple of model specs to ensure that it's working correctly. 

For an example method, let's add a `#preview` method to the Article model. If the length of the article body is less than 25 characters, the `#preview` method should just display the entire body. If the length of the body is more than 25 characters, the method should display the first 25 characters, breaking at the first whole word before the 25 count is reached, and then append a '...' to the string. This type of method is ideal for a targeted model spec- difficult to comprehensively test with feature specs alone, but with a few defined output states such that a model spec can cover all of the expected cases.

First, we'll define our `#preview` method on the Article model like so:

```ruby
def preview
  if text.length <= 25
    # Return if the text is already sufficiently short
    text
  else
    # Ensure length will be <= 25 even after '...' is appended
    truncated = text[0..22]

    # Remove characters until a space is found (so we don't break a word)
    while truncated[truncated.length - 1] != ' ' && truncated.length > 0
      truncated = truncated[0..truncated.length - 2]
    end

    # Remove the space
    truncated = truncated[0..truncated.length - 2] if truncated[truncated.length - 1] == ' '

    # Append '...' and return
    truncated + '...'
  end
end
```
    
Next, let's enumerate the possible cases for this method:

1. The article's text is already less than 25 characters, and the method should return the article's text

2. The article's text is more than 25 characters and the 22nd character is in the middle of a word, so the method should truncate to 22 characters, remove the first portion of the word, and append a '...'

3. The article's text is more than 25 characters and the 22nd character is the last character of a word, so the method should truncate to 22 characters and simply append a '...'

4. The article's text is more than 25 characters and the 22nd character is a space after the end of a word, so the method should truncate to 22 characters, remove the space, and append a '...'

As with the other tests we've covered, we'll want to write one spec for each possible case. We'll start by creating the model spec file in `spec/models/article_spec.rb`.

The basic layout of a model spec is slightly different than a feature spec.  It looks something like this:

```ruby
require 'spec_helper'

describe Article do
  describe '#preview' do
    context "article's text is less than 25 characters" do
      subject { create :article, title: 'Exciting News', text: 'This is rather short.' }

      it "returns the article's entire text" do
        expect(subject.preview).to eq('This is rather short.')
      end
    end
  end
end
```
    
There's a few things to note here. The outside `describe Article` block gives rspec a model (Article) rather than a string ('Article')- this must be a valid model object from your application, and lets rspec know that this is a model test. In model tests, the subject (model with particular attributes being tested) must be defined before each test- this could be done inside the main `describe '#preview'` block, if we wanted to use a similar model instance for multiple tests of the method, but in this case, it makes sense to define the subject inside each context block since each context has a different subject. Finally, model specs use `it 'does something' do` syntax (instead of `scenario 'does something' do` syntax as in feature specs), and then expect a subject method (the method being tested) to return a correct value. Generally speaking, your `it` blocks should probably only ever be one line long- all you want to test is that the tested method returns a correct value for the given context.

Go ahead and run this model spec by running the command `rspec spec/models/article_spec.rb` from the terminal in the application directory. You should see one green dot (we limited rspec to this specific test, so the feature specs won't be run) followed by 

> 1 example, 0 failures

We'll write similar specs for the other cases we enumerated above. The spec should look something like this:

```ruby
require 'spec_helper'

describe Article do
  describe '#preview' do
    context "article's text is less than 300 characters" do
      subject { create :article, title: 'Exciting News', text: 'This is rather short.' }

      it "returns the article's entire text" do
        expect(subject.preview).to eq('This is rather short.')
      end
    end

    context "article's text is >25 characters and the 22nd character divides a word" do
      subject { create :article, title: 'Exciting News', text: 'This article is somewhat longer and "somewhat" will be split.' }

      it 'truncates the article at the last word and appends ellipsis' do
        expect(subject.preview).to eq('This article is...')
      end
    end

    context "article's text is >25 characters and the 22nd character completes a word" do
      subject { create :article, title: 'Exciting News', text: 'This article is longer so it will end after "longer"' }

      it 'truncates the article and appends ellipsis' do
        expect(subject.preview).to eq('This article is longer...')
      end
    end

    context "article's text is >25 characters and the 22nd character is a space after a word" do
      subject { create :article, title: 'Exciting News', text: 'This article is kinda long and will end at "kinda"' }

      it 'truncates the article, removes the space, and appends ellipsis' do
        expect(subject.preview).to eq('This article is kinda...')
      end
    end
  end
end
```
    
Run the complete model test suite with the same command as above- you should now see

> 4 examples, 0 failures

And if you run the entire suite with `rspec`, you should see 

> 27 examples, 0 failures

(The number "27" may vary depending on how you completed the feature specs in the last tutorial- that's the number of tests that I have based on my code.)

And that's it for writing model specs. They're fairly simple, but model specs are a great way to specifically target your test coverage, particularly as your application grows and your models increase in complexity. You can check out the code changes for this post [here](https://github.com/schneidmaster/rspec-blog-example/commit/4f445bcc9b12900559bcb2e9b4db63f5481dc08c). In the next [post](https://schneider.dev/blog/writing-tests-for-rails-controllers.html) of the series, I'll cover writing controller specs to test APIs.
