---
title: 'Writing Tests for Rails: Continuous Integration'
date: 2015-08-23 04:47:50 Z
tags:
- development
- rails
- testing
layout: post
draft: false
category: development
---

Around this time last year, I wrote a series of posts on writing tests for Rails apps using rspec and Capybara, beginning with [the introduction](https://schneid.io/blog/writing-tests-for-rails-introduction.html) and concluding with [writing controller tests](https://schneid.io/blog/writing-tests-for-rails-controllers.html). I have decided to reopen the series to cover another set of important topics: using continuous integration and code complexity metrics. In this post, I'll cover how to set up continuous integration and test coverage reporting for your project.

Continuous integration (CI) is used in tandem with source control (in this case, GitHub) to ensure that your tests are not broken by each pull request, branch, and new commit. It is typically accomplished by using an external service to automatically run your tests on each new push and update GitHub with the results of the tests; the GitHub API allows CI services to set the branch status based on whether tests are in progress, passed or failed, so it's easy to see whether the tests are still satisfied before merging a PR. Popular CI services include [Travis CI](https://travis-ci.org/), [CircleCI](https://circleci.com/), and [Codeship](https://codeship.com/); all are free for open source projects and offer similar features and levels of integration. CircleCI is my favorite so I will be using it for this post.

The first step is simply to log in to your chosen CI provider; the ones mentioned above use GitHub OAuth which also provides them with access to your GitHub projects. CircleCI will immediately prompt you to build your first project and then begin building it, using sensible defaults that "just work" for many Rails/rspec projects, including the example project that we've been building. If you need to customize environment variables, test commands, or other settings, you can do so by either visiting the project settings in the CircleCI interface or by creating a `circle.yml` file in the root of your project; documentation for configuring CircleCI can be found [here](https://circleci.com/docs/configuration).

After the initial CircleCI build completes, visit the branches page of your GitHub repository (located [here](https://github.com/schneidmaster/rspec-blog-example/branches) for the rspec-blog-example application). You should see a green checkmark next to the master branch, and hovering over it will display a tooltip indicating that your tests passed in CircleCI. As you add more branches, each one will automatically be built and its status updated on GitHub; this status is also shown inline on any pull requests to the repository.

It is customary to add a build badge to your project's README file to indicate your project's build status to those who are browsing it for the first time or determining whether to depend on your code. A build badge is simply a small hotlinked image that indicates whether your tests are passing or failing. You can obtain one for your project in the project settings of any major CI provider; for an example, see the [homepage](https://github.com/schneidmaster/rspec-blog-example/) of the rspec-blog-example project.

You may have noticed that the rspec-blog-example project already has two badges: build status and test coverage percentage. It is also often appropriate to indicate your test coverage status in a badge in your project's README, so viewers can see how well-tested your project is and potentially contribute to writing tests if this is a weakness. Two major services that allow reporting on coverage status are [Coveralls](https://coveralls.io) and [CodeClimate](https://codeclimate.com/). We will be using CodeClimate for this tutorial as it also sets up nicely for a discussion of code complexity metrics, which will take place in the next post. To begin, simply log in to your chosen coverage service with GitHub and select the option to add a new open source project.

We will next need to augment the project's test setup to report code coverage to CodeClimate after the tests are run using CircleCI. First, add the CodeClimate reporter gem to the test group of the `Gemfile` and bundle:

```ruby
group :test do
  ...
  gem 'codeclimate-test-reporter', require: false
  ...
end
```

Next, add the following line to the top of `spec/spec-helper.rb`:
```ruby
require 'codeclimate-test-reporter'
```

Also, update the code to start Simplecov with the following:
```ruby
SimpleCov.formatter = CodeClimate::TestReporter::Formatter if ENV['CIRCLE_ARTIFACTS']
Simplecov.start 'rails'
```

This instructs Simplecov to use the CodeClimate formatter to report coverage data to CodeClimate if the CIRCLE\_ARTIFACTS environment variable exists; this variable is only present when the tests are being run by CircleCI. It also directs Simplecov to use the built-in Rails profile, which prevents Simplecov from analyzing gem directories and other non-project code when run by CircleCI.

You will need to set the CodeClimate repo token as a CircleCI environment variable so it can be used by the CodeClimate gem. To get this token, click "Set Up Test Coverage" on your project's page in CodeClimate; the ensuing screen will show the token. Then, visit the project settings in CircleCI, click to the "Environment variables" tab, and create a new environment variable; fill in CODECLIMATE\_REPO\_TOKEN as name and the token you just got from CodeClimate as the value. The next time you push your project, test coverage data will automatically be sent to CodeClimate. (This step can be similarly completed in the project settings for other major CI providers.)

Finally, you can retrieve the badge from CodeClimate to display in your project's README. Click the coverage badge from the project page in CodeClimate and you will be taken to a page providing you with embed codes in various formats; select the Markdown one and paste the provided badge into your README under the CircleCI badge. Again, you can see an example on the [homepage](https://github.com/schneidmaster/rspec-blog-example/) for the rspec-blog-example project.

You should now have a baseline understanding of how to use CI to improve the quality of your open-source projects on GitHub. You can review the code changes for this post in [this commit](https://github.com/schneidmaster/rspec-blog-example/commit/d985d8cbe578d563730c2f8dd897198a45e71810) on GitHub, and also feel free to check out the [CircleCI project page](https://circleci.com/gh/schneidmaster/rspec-blog-example) and [CodeClimate project page](https://codeclimate.com/github/schneidmaster/rspec-blog-example) for the rspec-blog-example project. In the next post, I'll cover how to use more advanced code complexity metrics along with continuous integration to improve your project's code quality on the whole, beyond what tests alone can cover.
