---
title: How I Convinced Our CTO to Switch From CoffeeScript to ES6
date: 2017-09-07 06:52:12
tags:
- development
- frontend
- es6
- coffeescript
layout: post
draft: false
category: development
---

Aha! is a Rails monolith. Although we have embraced front end technologies, such as webpack and React, Rails is the glue that holds everything together. And like many Rails monoliths, CoffeeScript made up the bulk of our front end code. It was the obvious choice for us [when Aha! launched](https://www.aha.io/company/history) in 2013 -- back when Rails 3 was stable and ES6 still lived in arcane specification documents.

But times change and technologies change. Fast forward to 2017 and ES6 has exploded and become (at minimum) the *lingua franca* for modern JavaScript development. Meanwhile, CoffeeScript began to fade out and its ecosystem stagnated -- many of its companion tools have been deprecated or abandoned.

I still have a fond place in my heart for CoffeeScript. I have been writing it for years and it was a godsend in the world of pre-ES6 JavaScript. I am also convinced that ES6 lifted many of its best features directly out of CoffeeScript’s playbook. But honoring reality is essential to any engineering organization that wants to grow and expand, and the reality is that ES6 is on the rise and CoffeeScript is fading towards obscurity.

[Our team at Aha!](https://www.aha.io/company/about) had several discussions about when it would be right to switch from CoffeeScript to ES6. While some of our developers were excited to make the change, our CTO was cautious. And rightly so -- it is his job to be cautious.

Our existing code is fully functional and we have never had a feature that simply could not be written in CoffeeScript. Besides, all of our developers know how to write CoffeeScript. So there were some questions that kept popping up during our discussion.

What if ES6 hurts our productivity? What if the toolchain is not as stable? What if another language is the new hotness a few years after we make the switch, only to be left behind again? The JavaScript world is notoriously fickle and these were valid concerns that needed to be overcome.

But despite my fondness for CoffeeScript, it was clear to me that the time to change had arrived. To address our concerns and make the case for switching, I needed to lay out a full summary of ES6, how it compares to CoffeeScript, and the benefits and costs associated with making the change. I ended my summary with a proposal for how our team at Aha! might incrementally switch while minimizing risk in the process. Ultimately, I was successful. I presented the document at a team meeting and our CTO was on board with making the move.

I know that we are not the only ones to face this dilemma. This is why I adapted the summary I created for our team into a technical blog post. Hopefully, it is useful from the perspective of a Rails team seeking to keep up with front end best practices.

Of course, this post is not all-encompassing -- ES6 is enormous and I wanted to focus on a particular set of factors that were most relevant for our team. Nevertheless, I hope it is useful for other folks in similar situations.

This post is laid out into four main sections:

1. Language features
2. Tooling
3. Direction
4. Approaching the switch

### 1. Language features

Nearly every major CoffeeScript feature has an ES6 analog. ES6 undeniably borrowed heavily from CoffeeScript’s language features and syntax. The two tend to feel very similar to me, as someone who learned CoffeeScript and then learned ES6. Yes, there are differences. No, I do not think it is a hard switch to make.

#### Var declaration
CoffeeScript does not require you to declare your variables. Just like Ruby, it implicitly declares them when they are used.

**CoffeeScript**

```coffeescript
myVar = 'already here'
```

ES6 requires you to declare variables. A little more verbose, but nice because eslint can warn you when you are using an undeclared variable and catch your bugs (more on that later).

ES6 has two variable declarations: `let` and `const`. `let` is a variable you might want to reassign later, `const` cannot be reassigned. Currently, they are both transpiled to `var`, but once browsers catch up, there will be a performance boost for using `const`. Using `const` can also simplify the mental effort of programming. Since you know that variable will never be reassigned, you can rely on its value without having to hunt for mutations.

**ES6**

```javascript
let myMutableVar = 'something';
myMutableVar = 'something else';

const myImmutableVar = 'something';
// this will error at eslint and/or transpilation
myImmutableVar = 'something else';
```

#### Destructuring

**CoffeeScript**

```coffeescript
{a, b} = { a: 'something', b: 'something else' }
```

**ES6**

```javascript
let { a, b } = { a: 'something', b: 'something else' };
```

#### Dynamic object keys

**CoffeeScript**

```coffeescript
dynamicProperty = 'foo'
obj = {"#{dynamicProperty}": 'bar'}
```

**ES6**

```javascript
let dynamicProperty = 'foo';
let obj = { [dynamicProperty]: 'bar' };
```

#### String interpolation

**CoffeeScript**

```coffeescript
myInterpolatedString = "this string has a #{var}"
```

**ES6**

```javascript
const myInterpolatedString = `this string has a ${var}`;
```

#### Anonymous functions

**CoffeeScript**

```coffeescript
$('.mything').on 'click', (e) ->
  e.preventDefault()
```

**ES6**

```javascript
$('.mything').on('click', (e) => {
  e.preventDefault();
});
```

#### Default function arguments

**CoffeeScript**

```coffeescript
myFunc = (a = 'a') ->
  a
```

**ES6**

```javascript
const myFunc = (a = 'a') => {
  return a;
}
```

#### Classes

Class examples shown here were taken from this excellent post introducing ES6 class structure to developers with a CoffeeScript background.

**CoffeeScript**

```coffeescript
class Animal
  constructor: (@numberOfLegs) ->

  toString: ->
    "I am an animal with #{@numberOfLegs} legs"

class Monkey extends Animal
   constructor: (@numberOfBananas) ->
     super(2)

   toString: ->
     superString = super.toString()
       .replace(/an animal/, 'a monkey')
     "#{superString} and #{@numberOfLegs} bananas"
```

**ES6**

```javascript
class Animal {
  constructor(numberOfLegs) {
    this.numberOfLegs = numberOfLegs
  }
  toString() {
    return `I am an animal with ${this.numberOfLegs} legs`
  }
}

class Monkey extends Animal {
  constructor(bananas) {
    super(2)
    this.bananas = bananas
  }
  toString() {
    let superString = super.toString()
      .replace(/an animal/, 'a monkey')
    return `${superString} and ${this.bananas} bananas`
  }
}
```

Bonus: ES6 classes have getters and setters.

```javascript
class BananaStore {
  constructor(bananas) {
    this._bananas = bananas;
  }
  get bananas() {
    return this._bananas.filter( banana => banana.isRipe )
  }
  set bananas(bananas) {
    if (bananas.length > 100) {
      throw `Wow ${bananas.length} is a lot of bananas!`
    }
    this._bananas = bananas
  }
}
```

#### Significant white space

CoffeeScript has it; ES6 does not. I have come to the conclusion that significant white space is very bad for code readability (and thus productivity).

For example, this code snippet in CoffeeScript:

```coffeescript
myArrayOfItems.forEach (item) =>
  newItemAttr = if item.foo then 'foo' else 'bar'
  
  item.attrs.forEach (attr) =>
    if attr.isHeader
      attr.set
        value: newItemAttr
        style: 'header'
    else
      attr.set
        value: newItemAttr
        style: 'body'
    
    attr.updated = true
```

Note that as the code grows, it becomes harder and harder to see what is on which line, and what is in which loop. Compare to the same code in ES6:

```javascript
myArrayOfItems.forEach((item) => {
  const newItemAttr = item.foo ? 'foo' : 'bar';
  item.attrs.forEach((attr) => {
    if (attr.isHeader) {
      attr.set({
        value: newItemAttr,
        style: 'header',
      });
    } else {
      attr.set({
        value: newItemAttr,
        style: 'body',
      });
    }
    attr.updated = true;
  });
});
```

It is much easier to follow in ES6, in my opinion. On top of that, the consistency of the code is considerably improved.

If your team is anything like ours, you have some folks who write CoffeeScript like JavaScript (with parentheses, braces, and semicolons -- even though punctuation is optional) and other folks who write CoffeeScript like python (without such punctuation). These inconsistencies create bugs, such as when you are trying to match the significant white space of an existing file and write bugs because you are not used to it. They also hurt readability and productivity because it is more difficult to comprehend inconsistent code.

#### Summary

ES6 is as good as CoffeeScript. There is nothing in CoffeeScript that you cannot express just as easily in ES6. There is no clear benefit to remaining in CoffeeScript, other than familiarity.

Classes are a little more full-featured in ES6. `const`/`let` are nice for reducing bugs because you can catch undefined/undeclared variables at build time instead of them erroring at runtime. And they will someday provide a bit of a performance boost. In my opinion, CoffeeScript’s significant white space hurts both readability and productivity.

Conversely, CoffeeScript syntax is more similar to Ruby, other than significant white space and a few other differences. And there is always a benefit to familiarity with the language you already use.

### 2. Tooling

Tooling is an area where I think ES6 clearly pulls ahead. Most of the CoffeeScript toolchain is aging or deprecated; ES6 tools are in much more active development and have already lapped CoffeeScript in significant functionality.

CoffeeScript:

* [CoffeeScript](https://github.com/jashkenas/coffeescript) -- The language/transpiler itself has some ongoing development, but it has been slow for the past few years.
* [Coffee-React](https://github.com/jsdf/coffee-react) -- Every package that I am aware of that transpiles CJSX (JSX + CoffeeScript) relies on Coffee-React under the hood, but Coffee-React has been deprecated since October 2016. CoffeeScript 2 promises to provide native JSX support, but it has not yet been released and it remains to be seen whether CoffeeScript 2 will be stable and fully compatible with existing toolchains. The [official documentation](http://coffeescript.org/v2/#jsx) already warns that regular `<` and `>` operators may confuse the compiler, which strikes me as a red flag.
* [CoffeeLint](https://github.com/clutchski/coffeelint) -- CoffeeScript linter, presented for comparison with ESLint. It does not really provide any bug-catching functionality. It mostly just provides guidelines on spacing and things like that. It is fairly actively developed, but it does not support CJSX. (There is a plugin to support CJSX, but it has not been updated since 2015.)

ES6:

* [Babel](https://github.com/babel/babel) -- The ES6 transpiler is under active development. They have a nice preset system for opt-in language features -- the baseline configuration compiles basic ES6 and they have preset plugins for new language features as they come out (e.g. ES7 and beyond). This means your team will be able to take advantage of new functionality to improve code over time as JavaScript develops.
* [Babel React preset](https://babeljs.io/docs/plugins/preset-react/) -- JSX in ES6 is compiled using a Babel preset (plugin). It is under active development and officially supported by Facebook, so there is no risk of losing pace with React itself.
* [ESLint](https://github.com/eslint/eslint) (ES6 linter) -- You can opt in or out of various lints, similar to how RuboCop works for Ruby, and it can be extended with plugins, such as React. It can also catch things like undefined variables that could actually be causing bugs.

### 3. Direction

The front end development community has overwhelmingly chosen ES6 over CoffeeScript. To illustrate, here is a graph showing the number of downloads per week for `babel-loader` vs. `coffee-loader`. Presumably, everyone using ES6 with webpack is using `babel-loader` and vice versa. I originally compared `babel` to `coffeescript`, which was even more overwhelming, but I decided that was an unfair comparison since they’re more of a one-time download.

![downloads per week babel-loader vs coffee-loader](https://s3-us-west-1.amazonaws.com/k1w1-aha-blog/uploads-v2/2017/09/downloads-per-week-coffee-babel.png)

The image above also very much tracks with my observations -- from the articles I read and new packages I see. If I were the benevolent dictator of front end development, free to crown a winner with no input from others, I likely would have chosen CoffeeScript. It was far ahead of its time and I still prefer many of its idioms to the equivalent versions borrowed by ES6. But it is clear to me that it has lost.

Given that ES6 has clearly pulled ahead, there are several benefits to aligning with the larger community. First and foremost, adopting a more widely used language means you continue to benefit from supported, quality open-source projects, as partially outlined above in the “tooling” section. Major players such as Facebook have fully jumped behind ES6, meaning that tools like Babel will remain robust and innovative into the future.

Second, there is an onboarding benefit. Especially if you are are hiring front end focused devs -- they are much more likely to know ES6 as opposed to CoffeeScript, since ES6 has become the dominant language. So sticking with CoffeeScript becomes more and more of a tax on your new developers to learn a somewhat unfamiliar syntax.

Finally, there is a recruiting benefit. I do not really have a way to prove this with data, but I firmly believe that using CoffeeScript and broadcasting it in your job postings turns away candidates, especially expert front end candidates. From my perspective, CoffeeScript positions you as an older Rails shop with some front end candy tacked on -- not a cutting-edge shop using the latest front end technology.

### 4. Approaching the switch

How should you go about making the switch? In my opinion, the best thing to do is to transition gradually.

Rewriting your entire codebase is an enormous project. It can slow down the pace of new features and create endless merge conflicts. With webpack (and even with Sprockets), it is fairly trivial to have CoffeeScript and ES6 code side-by-side in the same codebase.

For our team at Aha!, we decided to start with decreeing that all new development should happen in ES6, and continue by converting existing CoffeeScript code as it is convenient, such as when the file is modified or when there’s momentum to do so.

[Depercolator](https://www.npmjs.com/package/depercolator) is a great tool that we have used with a lot of success. It fully converts both CoffeeScript and CJSX, and it outputs code that ESLint is happy with so you get to start with a clean build. Once your CoffeeScript is gone, you can quietly disable the CoffeeScript portions of your configuration and enjoy your new codebase.

As outlined in this post, ES6 offers a number of advantages and a much more robust toolchain and community. At Aha!, we’re very happy with our choice to move to ES6. We are confident that it will allow us to keep delivering quality front end components and features to our customers for years to come.

I hope that this post helps your team navigate your own transition. Or maybe you want to help us write beautiful front end code in ES6 and React? [We are always hiring](http://www.aha.io/company/careers/) skilled front end and Rails developers.

*This post was originally published on the [Aha! blog](https://blog.aha.io/coffescript-to-es6/).*
