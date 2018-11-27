---
title: Google OAuth2 and Rails
date: 2013-10-29 16:00:00 Z
tags:
- development
- oauth2
- rails
layout: post
draft: false
category: development
---

Today, I had to work my way through integrating Google OAuth2 authentication API access with my Ruby on Rails application, to lay the groundwork to incorporate Google Drive with the professor class management tools on my [senior project](http://cs.cedarville.edu/).   All of the gems I found are poorly documented, nonfunctional with Rails 4.0, or both, so I decided to whip up a quick tutorial from scratch for people trying to solve similar problems.

First, you'll need an ActiveRecord Users table in your favorite database.  The migration for mine looks like this:

```ruby
class CreateUsers < ActiveRecord::Migration
  def change
    create_table :users do |t|
      t.string :email
      t.string :first_name
      t.string :last_name
      t.string :role
      t.string :uid
      t.string :refresh_token
      t.string :access_token
      t.string :expires

      t.timestamps
    end
  end
end
```

For a quick explanation: the email, first name, last name, and role are fields used with the user model in the application.  The uid is the Google user identifier returned when the user logs in with their Google account.  The refresh\_token and access\_token are used by Google APIs.  An access\_token is granted when the user first logs in, and is included with all Google API calls for authentication, but it only lasts for an hour before expiring.  The refresh\_token is granted on the very first login and does not expire; when the access\_token expires, you can make a call with the refresh\_token to get a new one.  (You only get a refresh\_token if your app requests offline access, which mine does.  Otherwise, you only ever get an access\_token and you just have to make the user reauthenticate if their token expires.  More on that later.)

Next, you'll have to register your application with Google using the [Google APIs Console](https://code.google.com/apis/console/).  Follow that link, login with your Google account (the email address will be publicly displayed when your application requests access, so you may want to pick a support email or something), create a new application, and fill out the relevant information.  Once your application is created, click "API Access" in the left menu bar and click "Create another Client ID..."  Your application type is Web Application and your hostname is the base URL of your website.  Click "Create client ID" and it will be added to the list with a Client ID and Client Secret.

The Client ID and Client Secret are used when you're requesting access or refresh tokens.  I defined them as constants in my application_controller.rb:

```ruby
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  CLIENT_ID = '############.apps.googleusercontent.com'
  CLIENT_SECRET = 'your-secret-goes-here'

end
```

Then, you can reference them from any helper/model with ApplicationController::CLIENT\_ID, or from any controller with just CLIENT\_ID.  At this time, you will also want to define your scopes: Google-speak for the kinds of information your application is requesting access to.  You can explore all of the available scopes [here](https://developers.google.com/discovery/); my application needs access to https://www.googleapis.com/auth/userinfo.profile (user's name), https://www.googleapis.com/auth/userinfo.email (user's email address), and https://www.googleapis.com/auth/drive.readonly (read-only access to user's Google Drive files).  So I'll put those together as a space-delimited string (WHY, GOOGLE?) and set those as a constant as well:

```ruby
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  CLIENT_ID = '############.apps.googleusercontent.com'
  CLIENT_SECRET = 'your-secret-goes-here'
  CLIENT_SCOPE = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.readonly'
end
```

Next, you'll need to set up the application code.  I have mine defined in a few different places: the SessionsController (controllers/sessions\_controller.rb) manages creating sessions and interfacing with Google; the GoogleHelper (helpers/google\_helper.rb) manages Google-specific logic; and the AuthenticationHelper (helpers/authentication\_helper.rb) provides some general helper functions for managing sessions and checking user permissions.  I'll start with the routing and then move through each one.

Your routes will probably want to incorporate friendly login/logout URLs.  Mine just route /login and /logout, done by adding the following to my routes.rb:

```ruby
get '/login', to: 'sessions#new', as: 'login'
get '/oauth2callback', to: 'sessions#create'
get '/logout', to: 'sessions#destroy', as: 'logout'
```

The login path routes to the sessions#new method, which redirects to the appropriate Google URL (more on this in a bit) and prompts the user to log in or pick a Google account.  Google then redirects back to the /oauth2callback route with an authorization code, which maps to the sessions#create method where the code is exchanged for access tokens (you can read more about that [here](https://developers.google.com/accounts/docs/OAuth2WebServer)).  And the /logout maps to a simple session destroy function that just unsets a session variable.

Next up is the session controller.  The sessions#new method just needs to redirect to the Google account chooser, so the top part of the controller is pretty simple:

```ruby
class SessionsController < ApplicationController

  def new
    # Redirect to the Google URL
    redirect_to login_url.to_s
  end
end
```

The login\_url method references the GoogleHelper, which I defined as an application helper module to keep the code relatively clean.  Create a file in your helpers folder called google\_helper.rb and open it up with the following:

```ruby
module GoogleHelper

  def login_url
    redirect_uri = ApplicationController::BASEURL + 'oauth2callback'

    url = 'https://accounts.google.com/o/oauth2/auth?' +
          'scope=' + ApplicationController::CLIENT_SCOPE + '&' +
          'redirect_uri=' + redirect_uri + '&' +
          'response_type=code&' +
          'client_id=' + ApplicationController::CLIENT_ID + '&' +
          'access_type=offline'

    URI.parse(URI.encode(url.strip))
  end
end
```

Don't forget to include GoogleHelper by adding "include GoogleHelper" to your application_controller.rb!

This method pieces together the correct Google Account Chooser URL.  The redirect URL is http://yoursiteurl.com/oauth2callback (BASEURL is another constant I defined elsewhere); this is where Google will redirect with the authorization code after the user has logged into their account.  You can change the callback path if you want, by updating your routes.rb and editing the client settings in the Google APIs Console to add the new path.  The scope is your scope string from above: a space-delimited list of the scopes (APIs) your application is requesting that the user grant access to.  The response\_type tells Google that you want to get an authorization code back.  The client\_id, also from above, is the ID of your application from the Google APIs Console.  And the access\_type is offline, indicating that you want a refresh\_token that you can use to generate access_tokens even when the user hasn't logged in recently.  You can omit the access\_type parameter if you don't need offline access.  Google's documentation of the format of the authentication URL is available [here](https://developers.google.com/accounts/docs/OAuth2WebServer#formingtheurl).

So, back over to the sessions_controller.  The sessions#new method just redirects the user to the Google account chooser URL that we just generated.  From there, the user logs into their Google account and approves the access, and Google redirects back to your redirect URI (/oauth2callback by default) with a code parameter (/oauth2callback/?code=thisisacode).  Your routes.rb will then route /oauth2callback to the sessions#create method, so we'll go there next:

```ruby
  def create

    # Get user tokens from GoogleHelper
    user_tokens = get_tokens(params[:code])
```

Ack!  The sessions#create method has to get refresh and access tokens from Google, so we can actually access information (user's name, email, etc.) and create the user.  I again separated out the code to get tokens into the GoogleHelper module, so we'll go over there now.

To get the refresh and access tokens from Google, you'll have to submit a particular post request including your client ID, client secret, the authorization code that Google just sent you, and a few other things.  The refresh and access tokens will be returned as a JSON array by Google.  Here's what the method looks like:

```ruby
def get_tokens(code)

  params['code'] = code
  params['client_id'] = ApplicationController::CLIENT_ID
  params['client_secret'] = ApplicationController::CLIENT_SECRET
  params['redirect_uri'] = ApplicationController::BASEURL + 'oauth2callback'
  params['grant_type'] = 'authorization_code'
```

This piece of the method initializes the params array: the set of POST params that you'll be sending in your call.  The code is the authorization code that Google returned and you passed in to the method.  The client ID and client secret are the constants you initialized above, retrieved from the Google APIs Console when you registered your application.  The redirect URI is the same URI as before; I have no idea why it's required for this request, since Google obviously returns a JSON array rather than redirecting you somewhere, but it is, so hey, keep the Google gods happy.  Finally, the grant_type parameter needs to be authorization\_code, to let Google know that you're requesting tokens using an authorization code.

Before you start the next part, stop for a second and include the URI, HTTP, and HTTPS libraries in your application, by adding the following code to the top of your config/application.rb under the require 'rails/all' line:

```ruby
require 'uri'
require 'net/http'
require 'net/https'
```

You'll also need to include the JSON gem, if it's not already installed, by adding the following to your Gemfile:

```ruby
gem 'json'
```

Done?  Mmkay, let's look at the next lines of code:

```ruby
# Initialize HTTP library
url = URI.parse('https://accounts.google.com')
http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_NONE # You should use VERIFY_PEER in production
```

This line initializes the HTTP library around the base URL we'll be sending the token request to, and tells the library to use SSL.  As the comment says, you can turn off verification for development but you should set it to VERIFY_PEER in production or else you'll be susceptible to man-in-the-middle attacks (read [this](http://www.rubyinside.com/how-to-cure-nethttps-risky-default-https-behavior-4010.html) for more info).

```ruby
# Make request for tokens
request = Net::HTTP::Post.new('/o/oauth2/token')
request.set_form_data(params)
response = http.request(request)
```

This sets the rest of the request URL, adds the parameters you defined above, and executes the request.

```ruby
  JSON.parse(response.body)
end
```

Finally, this parses the JSON that Google returns and returns the parsed JSON as a hash.  If you want further reading, Google's documentation of this step of the process is available [here](https://developers.google.com/accounts/docs/OAuth2WebServer#handlingtheresponse).  Back over to the SessionsController!

```ruby
def create

  # Get user tokens from GoogleHelper
  user_tokens = get_tokens(params[:code])
```

You've now defined the GoogleHelper code such that user\_tokens is the hash of tokens returned from Google, so you now have the access\_token and refresh\_token that you need to access the Google APIs.  Next, you'll want to get the user's real name and email so you can add/update them to the database:

```ruby
  # Get the username from Google
  user_info = call_api('/oauth2/v2/userinfo', user_tokens['access_token'])
```

Again, I've chosen to factor out the call\_api method to my GoogleHelper module.  It accepts the path to the API and a valid access\_token as parameters and returns a parsed hash of the API response: in this case, the user's information.  Let's jump over to the GoogleHelper again to see that implementation:

```ruby
def call_api(path, access_token)

  # Initialize HTTP library
  url = URI.parse('https://www.googleapis.com')
  http = Net::HTTP.new(url.host, url.port)
  http.use_ssl = true
  http.verify_mode = OpenSSL::SSL::VERIFY_NONE # You should use VERIFY_PEER in production
```

This initializes the HTTP library.  Again, see the SSL verification caveat above.

```ruby
  # Make request to API
  request = Net::HTTP::Get.new(path)
  request['Authorization'] = 'Bearer ' + access_token
  response = http.request(request)
```

This sets up the actual request.  The path comes from the method parameter passed in from the controller.  You'll notice that we've set the request['Authorization'] header to be 'Bearer ouraccesstoken'- this is the Google-recommended way to authenticate API requests (see [here](https://developers.google.com/accounts/docs/OAuth2WebServer#callinganapi) for further reading).  Also, notice that this is a GET request rather than the POST request we used to post the authorization code and get access tokens.

```ruby
  JSON.parse(response.body)

end
```

And finally, we parse the JSON array of user information that Google returns to the request, and return the parsed hash.  Back to the SessionsController!

```ruby
def create

  # Get user tokens from GoogleHelper
  user_tokens = get_tokens(params[:code])

  # Get the username from Google
  user_info = call_auth_api(user_tokens['access_token'])
```

So we now have the user's basic information from the GoogleHelper method, so it's time to create the user!  We have two possibilities- either the user has never logged in before, or they've already logged in once.  To figure out which, we try a lookup:

```ruby
  user = User.where(:uid => user_info['id']).first
```

If the user doesn't exist, the user variable will be nil, so we can create the user and log them in by saving their user ID to the session:

```ruby
  # Create the user if they don't exist
  if(user == nil)
    user = User.create(:email => user_info['email'],
     :first_name => user_info['given_name'], :last_name => user_info['family_name'], :role => 'User', :uid => user_info['id'], :refresh_token => user_tokens['refresh_token'], :access_token => user_tokens['access_token'], :expires => user_tokens['expires_in'])
        session[:user_id] = user.id
```

Note that Google lists the user's first name as given\_name and their last name as family\_name; presumably, this is to avoid weird discrepancies with non-English countries where the family name is the "first name."

If the user does exist (e.g. they've already logged in to your webapp at least once), the user variable will contain the user.  If this is the case, you can just update their tokens (and log them in as above):

```ruby
  else
    user.refresh_token = user_tokens['refresh_token']
    user.access_token = user_tokens['access_token']
    user.expires = user_tokens['expires']
    user.save

    session[:user_id] = user.id
  end
```

Finally, you'll want to redirect the user to whatever landing page you want them to see after logging in.  For my application, if they try to access locked-down functionality while not signed in, the app saves the URL to the session and redirects them there; if not, it just redirects them to the home page:

```ruby
  # Redirect home
  redirect_to session[:redirect_to] ||= root_path

end
```

Congrats! You've now authenticated a user, saved their access tokens, and logged them in!  To finish off the SessionsController, you'll need to create the sessions#destroy method to match your routes.rb and log out the user when they visit /logout:

```ruby
def destroy
  session[:user_id] = nil
  redirect_to root_path
end
```

Next up, I've defined an AuthenticationHelper in /helpers/authentication\_helper.rb to simplify some operations to determine whether a user is signed in:

```ruby
module AuthenticationHelper
  def signed_in?
    !session[:user_id].nil?
  end

  def current_user
    @current_user ||= User.find(session[:user_id])
  end

  def ensure_admin_signed_in
    # Redirect to the Google Account chooser if they're not logged in
    if !signed_in?
      session[:redirect_to] = request.url
      redirect_to new_session_path

    # Redirect to the homepage if they don't have permission to do what they're doing
    elsif User.find(session[:user_id]).role != "Administrator"
      redirect_to root_path
    end
  end
end
```

The first method checks to see whether a user is signed in.  The second gives you access to the model of the currently signed-in user.  The third checks to see whether the currently signed-in user has the role Administrator; if they're not signed in, it redirects them to the account chooser after saving the redirect URL, and if they're signed in but lack permissions, it just dumps them out to the home page.

Finally, if your application has offline access enabled, you'll want a couple of methods to see if an access_token has expired and to get a new access token if it has.  Predictably, I've defined these in the GoogleHelper as well.

First, here's the method to check if an access\_token is expired:

```ruby
def valid_token?(access_token)

  path = '/oauth2/v1/tokeninfo'

  # Initialize HTTP library
  url = URI.parse('https://www.googleapis.com')
  http = Net::HTTP.new(url.host, url.port)
  http.use_ssl = true
  http.verify_mode = OpenSSL::SSL::VERIFY_NONE # You should use VERIFY_PEER in production

  # Make request to API
  request = Net::HTTP::Get.new(path)
  request['Authorization'] = 'Bearer ' + access_token
  response = http.request(request)

  result = JSON.parse(response.body)

  if(result['error'] != nil && result['error'] == 'invalid_token')
    false
  else
    true
  end
end
```

This method is similar to the userinfo method defined above: it sets the path to the correct API, initializes the HTTP library, sets up the request with the access_token in the header, and executes the request.  Google returns {"error": "invalid\_token"} if the token is expired, and a list of information otherwise (see [this](http://stackoverflow.com/a/11879764/2514383) for more details).

And second, here's the method to get a new access token if the old one has expired:

```ruby
def refresh_token(user_id)

  user = User.find(user_id)

  params['refresh_token'] = user.refresh_token
  params['client_id'] = ApplicationController::CLIENT_ID
  params['client_secret'] = ApplicationController::CLIENT_SECRET
  params['grant_type'] = 'refresh_token'

  # Initialize HTTP library
  url = URI.parse('https://accounts.google.com')
  http = Net::HTTP.new(url.host, url.port)
  http.use_ssl = true
  http.verify_mode = OpenSSL::SSL::VERIFY_NONE # You should use VERIFY_PEER in production

  # Make request for tokens
  request = Net::HTTP::Post.new('/o/oauth2/token')
  request.set_form_data(params)
  response = http.request(request)

  # Parse the response
  user_tokens = JSON.parse(response.body)

  # Save the new access_token to the user 
  user.access_token = user_tokens['access_token']
  user.expires = user_tokens['expires_in']
  user.save

  # Return the new access_token
  user_tokens['access_token']

end
```

This method is similar to the get\_tokens method defined above, with a few key differences.  It takes as a parameter the user\_id of the user with the expired access token, and looks up that user in the database to get their refresh\_token.  It uses a grant\_type of refresh\_token, to indicate to Google that a refresh\_token is being sent rather than an authorization\_code.  And finally, it saves the response access\_token back to the user before returning it.

To access other Google APIs, you can reuse the call\_api GoogleHelper method defined above, and just pass in the path to the API you need; it's generalized so you'll always get a hash of parsed data returned.  Annoyingly enough, I've yet to find a good centralized list of Google API paths, but a Google search will usually turn up the one you need.  Note that my call_api method is set to always send a GET request, as that's all my application needs.  If you need to send a POST request (used if you have to update the user's information, add a file to their Drive, etc.) then you'll have to define another api method that uses Net::HTTP::Post instead of Net::HTTP::Get.

And that's it!  If you've made it all the way here, then you've successfully implemented Google authentication and API access in your Rails app.  If you have issues, see a bug, or want to say nice things about me, feel free to leave a comment!    I've pasted my complete SessionsController, GoogleHelper, and AuthenticationHelper below for reference.

***SessionsController***
```ruby
class SessionsController < ApplicationController

  def new
    # Redirect to the Google URL
    redirect_to login_url.to_s
  end

  def create

    # Get user tokens from GoogleHelper
    user_tokens = get_tokens(params[:code])

    # Get the username from Google
    user_info = call_auth_api('/oauth2/v2/userinfo', user_tokens['access_token'])

    # Get the user, if they exist
    user = User.where(:uid => user_info['id']).first

    # Create the user if they don't exist
    if(user == nil)
      user = User.create(:email => user_info['email'], :first_name => user_info['given_name'], :last_name => user_info['family_name'], :role => 'User', :uid => user_info['id'], :refresh_token => user_tokens['refresh_token'], :access_token => user_tokens['access_token'], :expires => user_tokens['expires'])
      session[:user_id] = user.id

    # Else update their info and save
    else
      user.refresh_token = user_tokens['refresh_token']
      user.access_token = user_tokens['access_token']
      user.expires = user_tokens['expires_in']
      user.save

      session[:user_id] = user.id
    end

    # Redirect home
    redirect_to session[:redirect_to] ||= root_path
  end

  def destroy
    session[:user_id] = nil
    redirect_to root_path
  end

end
```

***GoogleHelper***
```ruby
module GoogleHelper

  def login_url
    redirect_uri = ApplicationController::BASEURL + 'oauth2callback'

    url = 'https://accounts.google.com/o/oauth2/auth?' +
          'scope=' + ApplicationController::CLIENT_SCOPE + '&' +
          'redirect_uri=' + redirect_uri + '&' +
          'response_type=code&' +
          'client_id=' + ApplicationController::CLIENT_ID + '&' +
          'access_type=offline'

    URI.parse(URI.encode(url.strip))
  end

  def get_tokens(code)

    params['code'] = code
    params['client_id'] = ApplicationController::CLIENT_ID
    params['client_secret'] = ApplicationController::CLIENT_SECRET
    params['redirect_uri'] = ApplicationController::BASEURL + 'oauth2callback'
    params['grant_type'] = 'authorization_code'

    # Initialize HTTP library
    url = URI.parse('https://accounts.google.com')
    http = Net::HTTP.new(url.host, url.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE # You should use VERIFY_PEER in production

    # Make request for tokens
    request = Net::HTTP::Post.new('/o/oauth2/token')
    request.set_form_data(params)
    response = http.request(request)

    JSON.parse(response.body)

  end

  def refresh_token(user_id)

    user = User.find(user_id)

    params['refresh_token'] = user.refresh_token
    params['client_id'] = ApplicationController::CLIENT_ID
    params['client_secret'] = ApplicationController::CLIENT_SECRET
    params['grant_type'] = 'refresh_token'

    # Initialize HTTP library
    url = URI.parse('https://accounts.google.com')
    http = Net::HTTP.new(url.host, url.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE # You should use VERIFY_PEER in production

    # Make request for tokens
    request = Net::HTTP::Post.new('/o/oauth2/token')
    request.set_form_data(params)
    response = http.request(request)

    # Parse the response
    user_tokens = JSON.parse(response.body)

    # Save the new access_token to the user
    user.access_token = user_tokens['access_token']
    user.expires = user_tokens['expires_in']
    user.save

    # Return the new access_token
    user_tokens['access_token']

  end

  def valid_token?(access_token)

    path = '/oauth2/v1/tokeninfo'

    # Initialize HTTP library
    url = URI.parse('https://www.googleapis.com')
    http = Net::HTTP.new(url.host, url.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE # You should use VERIFY_PEER in production

    # Make request to API
    request = Net::HTTP::Get.new(path)
    request['Authorization'] = 'Bearer ' + access_token
    response = http.request(request)

    result = JSON.parse(response.body)

    if(result['error'] != nil && result['error'] == 'invalid_token')
      false
    else
      true
    end

  end

  def call_api(path, access_token)

    # Initialize HTTP library
    url = URI.parse('https://www.googleapis.com')
    http = Net::HTTP.new(url.host, url.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE # You should use VERIFY_PEER in production

    # Make request to API
    request = Net::HTTP::Get.new(path)
    request['Authorization'] = 'Bearer ' + access_token
    response = http.request(request)

    JSON.parse(response.body)

  end

end
```

***AuthenticationHelper***
```ruby
module AuthenticationHelper
  def signed_in?
    !session[:user_id].nil?
  end

  def current_user
    @current_user ||= User.find(session[:user_id])
  end

  def ensure_admin_signed_in
    # Redirect to the Google Account chooser if they're not logged in
    if !signed_in?
      session[:redirect_to] = request.url
      redirect_to new_session_path

    # Redirect to the homepage if they don't have permission to do what they're doing
    elsif User.find(session[:user_id]).role != "Administrator"
      redirect_to root_path
    end
  end
end
```
