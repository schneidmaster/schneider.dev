---
title: "Elixir, Phoenix, Absinthe, GraphQL, React, and Apollo: a followup"
date: 2019-07-18 16:00:00 Z
tags:
  - elixir
  - phoenix
  - graphql
  - javascript
  - react
layout: post
draft: false
category: development
---

A few months ago, I published a [blog post](/blog/elixir-phoenix-absinthe-graphql-react-apollo-absurdly-deep-dive) about my experience building a simple social media web application with Elixir, Phoenix, Absinthe, GraphQL, React, and Apollo. The post got fairly popular, but I hadn't done too much with the application since then; it was in a good state and I was happy with what I had built. Last weekend, though, I decided to fiddle around with it some more, and ended up making a handful of improvements based on new developments and things I've learned since I first built it. This post will specifically focus on three improvements: loading data with Dataloader, DRYing up the models with a macro, and using the new Apollo hooks beta on the client side. As a reminder, the code is available on [GitHub](https://github.com/schneidmaster/socializer) and a live demo is available [here](https://socializer-demo.herokuapp.com).

### Dataloader

When I submitted my original post to Hacker News, one of the co-authors of Absinthe [commented](https://news.ycombinator.com/item?id=19715514) and suggested that I look into Dataloader for hooking up Absinthe to my Ecto models, as it's now their recommended approach (I used `Absinthe.Ecto` which is now deprecated). The migration was pretty simple, and the code is slightly cleaner; I didn't see any enormous benefit, but I can understand why Dataloader would be nice for a more complex application, especially if I needed to serve data from multiple sources. You can see the specific changes I made in [this commit](https://github.com/schneidmaster/socializer/commit/ff0925d7ea8749a4a5304d730084e8e819ad3b33).

To start, I had to create a data source for my Ecto repository:

```elixir
# lib/socializer_web/data.ex
defmodule SocializerWeb.Data do
  import Ecto.Query

  def data() do
    Dataloader.Ecto.new(Socializer.Repo, query: &query/2)
  end

  def query(queryable, params) do
    case Map.get(params, :order_by) do
      nil -> queryable
      order_by -> from record in queryable, order_by: ^order_by
    end
  end
end
```

The data source exposes two methods, `data` and `query`. `data` provides Dataloader with a data object (in this case an instance of `Dataloader.Ecto`, though you can use a key-value store, Redis, or other soures). `query` lets you specify how to query the object you've given. In my case, I want to use an `order_by` option when configuring particular associations (which you'll see in a bit), so I wrote a case block to handle that.

I then had to update my `*_types.ex` schema files to use Dataloader to resolve associations. Here's a simple example for the user object:

```
# lib/socializer_web/schema/user_types.ex
defmodule SocializerWeb.Schema.UserTypes do
  use Absinthe.Schema.Notation

  import Absinthe.Resolution.Helpers, only: [dataloader: 1]

  alias SocializerWeb.{Data, Resolvers}

  @desc "A user of the site"
  object :user do
    field :id, :id
    field :name, :string
    field :email, :string
    field :token, :string

    field :gravatar_md5, :string do
      resolve(fn user, _, _ ->
        {:ok, :crypto.hash(:md5, user.email) |> Base.encode16(case: :lower)}
      end)
    end

    field :posts, list_of(:post), resolve: dataloader(Data)
  end

  # ...
end
```

Other than the import, the only change is the `field :posts` line, where I tell Absinthe to resolve the field with Dataloader. Pretty straightforward and not a big change from what I had before.

A slightly more complex example is posts; posts have a comments field where the comments need to be sorted in ascending order by ID (this is where I need my `order_by` option from above). Here, the code looks like this:

```elixir
# lib/socializer_web/schema/post_types.ex
defmodule SocializerWeb.Schema.PostTypes do
  use Absinthe.Schema.Notation

  import Absinthe.Resolution.Helpers, only: [dataloader: 1, dataloader: 3]

  alias SocializerWeb.{Data, Resolvers}

  @desc "A post on the site"
  object :post do
    field :id, :id
    field :body, :string
    field :inserted_at, :naive_datetime

    field :user, :user, resolve: dataloader(Data)

    field :comments, list_of(:comment),
      resolve: dataloader(Data, :comments, args: %{order_by: :id})
  end

  # ...
end
```

For the comments field, I include `args: %{order_by: :id}`; these args are given to the `query` function in my `Data` model where I use them to appropriately sort the association. This is a bit cleaner than what I had before for the field:

```elixir
field :comments, list_of(:comment) do
  resolve(
    assoc(:comments, fn comments_query, _args, _context ->
      comments_query |> order_by(asc: :id)
    end)
  )
end
```

A little more explicit, perhaps, but nice to have generic arguments that I can resolve myself in a single location.

As you can see, the migration was pretty simple, and while I didn't see a huge benefit in my particular project, I can definitely understand how Dataloader is more flexible and extensible, especially if I needed to introduce new sources of data in the future.

### Macros

A caveat for this section -- I'm not entirely sure that the macro I wrote is a "best practice" in Elixir. The official [docs](https://elixir-lang.org/getting-started/meta/macros.html) include a stern warning:

> Macros should only be used as a last resort. Remember that explicit is better than implicit. Clear code is better than concise code.

My code is certainly less explicit with the macro I wrote, and its conciseness might come at a tradeoff with clarity. But at any rate, I wanted to learn how macros work and my ruby instincts drive me to DRY up code whenever possible, so here we are.

I found that a lot of my models had CRUD logic that was the same or very similar across all of them. Several had a `find` method which accepted an ID and returned the record; several had a `find_by` to look up a record by conditions other than the ID; a few had a `create` to simplify inserting a new record via a map of attributes, and all of them had a `changeset/1` which was simply a shorthand to invoke `changeset/2` with an empty instance of the model struct. So I extracted these methods to a macro that looks like this:

```elixir
# lib/socializer/model.ex
defmodule Socializer.Model do
  alias Socializer.Repo

  defmacro __using__(_) do
    quote do
      use Ecto.Schema
      import Ecto.Changeset
      import Ecto.Query

      def find(id) do
        Repo.get(__MODULE__, id)
      end

      def find_by(conds) do
        Repo.get_by(__MODULE__, conds)
      end

      def create(attrs) do
        attrs
        |> changeset()
        |> Repo.insert()
      end

      def changeset(attrs) do
        __MODULE__.__struct__()
        |> changeset(attrs)
      end
    end
  end
end
```

The `__using__` macro name is an Elixir convention -- when you call `use SomeModule`, Elixir will require in the module code and then invoke the `__using__` macro defined on it. In the mental model I developed, the `quote` block is similar to the `included` block in an ActiveRecord concern; it applies the imports and defines the methods as if they were directly defined in the module that's using this module. This also means I can still invoke `__MODULE__` and it will resolve to `Socializer.Post` or `Socializer.User` or whatever (not the shared `Socializer.Model`). I also moved my common `use`s and `import`s here as they were in pretty much every model -- again, possibly in violation of Elixir best practices (since it magically makes other methods available) but it felt good.

Finally, in each of my Ecto models, I removed the extracted methods and added a `use Socializer.Model` at the top -- now all of my models automatically have `find`, `find_by`, etc. available without me having to write boilerplate for each one.

### Apollo hooks beta

Apollo has released a [beta module](https://www.npmjs.com/package/@apollo/react-hooks) that provides hooks for queries, mutations, and subscriptions (instead of the components with render functions offered by the current stable release). I felt that migrating to hooks greatly simplified my code, but this was definitely the lion's share of the work I did on improvements to my application; you can see the changes in [this commit range](https://github.com/schneidmaster/socializer/compare/35d354c83297cb7df1cb8da64d6a170acbadae65...25c4907e5b7102cd68c0113a8d8a0ca0bd45b679).

The interface to Apollo's hooks is very intuitive; I didn't really have any problems getting it to work correctly, I just had a lot of components to migrate. I also upgraded a few other packages, and updated my tests to use `@testing-library/react` instead of `react-testing-library` (the package recently moved under the common namespace). One thing I found extremely satisfying -- other than swapping out package names, I only had to change about five lines in my entire test suite. It felt like a resounding validation of the promise of react-testing-library (er, @testing-library/react) -- if you only test the interface to your component and religiously avoid the implementation details, refactors become much simpler because they don't require you to also rewrite your tests.

To start with, let's look at a query migration -- specifically in the [Conversation.js](https://github.com/schneidmaster/socializer/compare/35d354c83297cb7df1cb8da64d6a170acbadae65...25c4907e5b7102cd68c0113a8d8a0ca0bd45b679#diff-5705c89c56efbf7a06bbb82e036b1e4b) component, which is responsible for rendering a chat conversation. Prior to the migration, the component looked something like this:

```javascript
// client/src/components/Conversation.js
import React from "react";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import produce from "immer";
import { ErrorMessage, Loading, MessageThread, NewMessage } from "components";
import { Subscriber } from "containers";
import "./Conversation.css";

export const GET_CONVERSATION = gql`
  query GetConversation($id: String!) {
    conversation(id: $id) {
      id
      title
      messages {
        id
        body
        user {
          id
          name
          gravatarMd5
        }
      }
    }
  }
`;

export const MESSAGES_SUBSCRIPTION = gql`
  subscription onMessageCreated($conversationId: String!) {
    messageCreated(conversationId: $conversationId) {
      id
      body
      user {
        id
        name
        gravatarMd5
      }
    }
  }
`;

const Conversation = ({
  match: {
    params: { id },
  },
}) => {
  return (
    <Query query={GET_CONVERSATION} variables={{ id }}>
      {({ client, loading, error, data, subscribeToMore }) => {
        if (loading) return <Loading />;
        if (error) return <ErrorMessage message={error.message} />;
        return (
          <Subscriber
            subscribeToNew={() =>
              subscribeToMore({
                document: MESSAGES_SUBSCRIPTION,
                variables: { conversationId: id },
                updateQuery: (prev, { subscriptionData }) => {
                  if (!subscriptionData.data) return prev;
                  const newMessage = subscriptionData.data.messageCreated;

                  // Check that we don't already have the
                  // message stored.
                  if (
                    prev.conversation.messages.find(
                      (message) => message.id === newMessage.id,
                    )
                  ) {
                    return prev;
                  }

                  return produce(prev, (next) => {
                    next.conversation.messages.push(newMessage);
                  });
                },
              })
            }
          >
            <div className="chat-layout d-flex flex-column pb-4">
              <div className="chat-content d-flex flex-column">
                <h5>{data.conversation.title}</h5>
                <hr />
                <MessageThread messages={data.conversation.messages} />
              </div>

              <NewMessage conversationId={id} />
            </div>
          </Subscriber>
        );
      }}
    </Query>
  );
};

export default Conversation;
```

Not too bad, but in a world where hooks exist, that kind of nesting feels a bit painful. Here's the same code expressed using hooks:

```javascript
// client/src/components/Conversation.js
import React, { useCallback } from "react";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";
import produce from "immer";
import { ErrorMessage, Loading, MessageThread, NewMessage } from "components";
import { Subscriber } from "containers";
import "./Conversation.css";

export const GET_CONVERSATION = gql`
  query GetConversation($id: String!) {
    conversation(id: $id) {
      id
      title
      messages {
        id
        body
        user {
          id
          name
          gravatarMd5
        }
      }
    }
  }
`;

export const MESSAGES_SUBSCRIPTION = gql`
  subscription onMessageCreated($conversationId: String!) {
    messageCreated(conversationId: $conversationId) {
      id
      body
      user {
        id
        name
        gravatarMd5
      }
    }
  }
`;

const Conversation = ({
  match: {
    params: { id },
  },
}) => {
  const { loading, error, data, subscribeToMore } = useQuery(GET_CONVERSATION, {
    variables: { id },
  });
  const subscribeToNew = useCallback(
    () =>
      subscribeToMore({
        document: MESSAGES_SUBSCRIPTION,
        variables: { conversationId: id },
        updateQuery: (prev, { subscriptionData }) => {
          if (!subscriptionData.data) return prev;
          const newMessage = subscriptionData.data.messageCreated;

          // Check that we don't already have the
          // message stored.
          if (
            prev.conversation.messages.find(
              (message) => message.id === newMessage.id,
            )
          ) {
            return prev;
          }

          return produce(prev, (next) => {
            next.conversation.messages.push(newMessage);
          });
        },
      }),
    [id],
  );

  if (loading) {
    return <Loading />;
  } else if (error) {
    return <ErrorMessage message={error.message} />;
  } else {
    return (
      <Subscriber subscribeToNew={subscribeToNew}>
        <div className="chat-layout d-flex flex-column pb-4">
          <div className="chat-content d-flex flex-column">
            <h5>{data.conversation.title}</h5>
            <hr />
            <MessageThread messages={data.conversation.messages} />
          </div>

          <NewMessage conversationId={id} />
        </div>
      </Subscriber>
    );
  }
};

export default Conversation;
```

The `useQuery` hook accepts a GraphQL query argument and returns the same set of variables previously given to the render function by the `Query` component. This implementation feels much nicer to me -- I'm able to flatten out the hierarchy and separate the subscription function rather than having it embedded in the render logic.

Let's also look at a mutation example -- [NewMessage.js](https://github.com/schneidmaster/socializer/compare/35d354c83297cb7df1cb8da64d6a170acbadae65...25c4907e5b7102cd68c0113a8d8a0ca0bd45b679#diff-957e9db87de18ff3e88fae7b30b2c832), which renders the new message input on the chat screen. Previously, the code looked like this:

```javascript
// client/src/components/NewMessage.js
import React, { useState } from "react";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import { Card, Form } from "react-bootstrap";
import "./NewMessage.css";

export const CREATE_MESSAGE = gql`
  mutation CreateMessage($conversationId: String!, $body: String!) {
    createMessage(conversationId: $conversationId, body: $body) {
      id
    }
  }
`;

const NewMessage = ({ conversationId }) => {
  const [body, setBody] = useState("");

  return (
    <Mutation mutation={CREATE_MESSAGE} onCompleted={() => setBody("")}>
      {(submit, { data, loading, error }) => {
        return (
          <Card className="new-message mt-2">
            <Card.Body>
              <Form
                data-testid="new-message"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit({
                    variables: { body, conversationId },
                  });
                }}
              >
                <Form.Group>
                  <Form.Control
                    rows="3"
                    placeholder="What's on your mind?"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        );
      }}
    </Mutation>
  );
};

export default NewMessage;
```

Again, not too bad, but the `Mutation` component creates unnecessary nesting, and the control logic (like clearing the input on submit) is blended with the render logic. Here's the same component using hooks:

```javascript
// client/src/components/NewMessage.js

import React, { useState } from "react";
import { useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import { Card, Form } from "react-bootstrap";
import "./NewMessage.css";

export const CREATE_MESSAGE = gql`
  mutation CreateMessage($conversationId: String!, $body: String!) {
    createMessage(conversationId: $conversationId, body: $body) {
      id
    }
  }
`;

const NewMessage = ({ conversationId }) => {
  const [body, setBody] = useState("");

  const [submit] = useMutation(CREATE_MESSAGE, {
    onCompleted: () => setBody(""),
  });

  return (
    <Card className="new-message mt-2">
      <Card.Body>
        <Form
          data-testid="new-message"
          onSubmit={(e) => {
            e.preventDefault();
            submit({
              variables: { body, conversationId },
            });
          }}
        >
          <Form.Group>
            <Form.Control
              rows="3"
              placeholder="What's on your mind?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default NewMessage;
```

Pretty intuitive, but with similar benefits to what we saw when migrating the `Query` -- the entire component remains flatter, and the control logic is better separated from the rendering logic. I also really like the hook interface that Apollo decided on; it's very intuitive and maps cleanly to the old component-based API.

### Conclusion

It was fun to come back and revisit my project a few months later. I enjoyed learnig a bit more about writing macros in Elixir, and I can also see how Dataloader provides a nice generic interface for GraphQL data sources. It's not much better than `Absinthe.Ecto` in isolation, but it offers more flexibility and extensibility as the application scales over time. My favorite improvement was definitely the migration to Apollo's hooks library on the client side. It made the code significantly cleaner, and I found the hooks-based API to be simple and intuitive coming from the component API. Finally, I was thrilled with the performance of my test suite -- other than renaming packages, I had to make virtually no changes to my test suite, despite significantly refactoring how data is loaded throughout my application.
