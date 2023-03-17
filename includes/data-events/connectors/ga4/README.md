# GA4 connector

This connector listens to some events of the Data API and sends them to Google Analytics 4

## Setting up

For now, the credentials must be manually added to the database. You will need your measurement ID and an API secret.

* api_secret - Required. An API SECRET generated in the Google Analytics UI. To create a new secret, navigate to:
    Admin > Data Streams > choose your stream > Measurement Protocol > Create
* measurement_id - Required. The measurement ID associated with a stream. Found in the Google Analytics UI under:
    Admin > Data Streams > choose your stream > Measurement ID

Store this info in the database:
```
wp option set ga4_measurement_id "G-XXXXXXXXXX"
wp option set ga4_api_secret YYYYYYYYYYYYYYYYYYY
```

This is still experimental, so you'll need to add this to wp-config:
`define( 'NEWSPACK_EXPERIMENTAL_GA4_EVENTS', true );`

## Events being tracked

### Default parameters:

These parameters are added to all events:

* `ga_session_id`: The GA Session ID, retrieved from the cookie
* `logged_in`: Whether the user is logged in when the event got fired
* `is_reader`: Whether the user is a RAS reader

Note: All paramaters are strings

### reader_logged_in

When a user logs in

No additional parameters

### reader_registered

When a user registers through RAS

Additional parameters:

* `registration_method`
* `newspack_popup_id`: If the action was triggered from inside a popup, the popup id.
* `referer`

### donation_new

When a NEW donation is completed with success

Additional parameters:

* `amount`
* `currency`
* `recurrence`
* `platform`
* `referer`
* `popup_id`: If the action was triggered from inside a popup, the popup id.
* `range`: The range of the donation amount: `under-20`, `20-50`, `51-100`, `101-200`, `201-500` or `over-500`.


### donation_subscription_cancelled

When a subscription is cancelled.

Additional parameters:

* `amount`
* `currency`
* `recurrence`
* `platform`
* `range`: The range of the donation amount: `under-20`, `20-50`, `51-100`, `101-200`, `201-500` or `over-500`.

### newsletter_subscribed



Additional parameters:

* `newsletters_subscription_method`
* `newspack_popup_id`: If the action was triggered from inside a popup, the popup id.
* `referer`
* `lists`: comma separated list of the list IDs the readers subscribed to (note: truncated at 100 characters)
* `registration_method`: If the newsletter subscription was triggered by a registration form

### campaign_interaction

Additional parameters:

* All default parameters from the `campaign_interaction` event (`campaign_id`, `campaign_frequency`, `action`, `action_type`, etc.)
* `campaign_has_donation_block`: If the donation block was present, the value will be 1
* `campaign_has_registration_block`: If the registration block was present, the value will be 1
* `campaign_has_newsletters_subscription_block`: If the newsletters_subscription block was present, the value will be 1
* All parameters inside the `interaction_data` value.
