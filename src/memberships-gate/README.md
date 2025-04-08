# Memberships and Content Gate Analytics

If your Newspack site is connected to a GA4 account, then reader interactions with content gate elements will fire analytics events that can help you track activity originating from content gates.

When coupled with analytics events fired by modal checkout interactions, these events can be used to measure and analyze reader registrations and conversion rates originating from content gate interactions.

## Events tracked

### Event name

All events fired by content gate interactions will have an event name of **`np_gate_interaction`**.

### Default parameters

These parameters are added to all `np_gate_interaction` events:

| Name                          | Type     | Obs                                                                                                                                                                                                              |
|-------------------------------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `gate_post_id`                | `int`    | The post ID of the content gate.                                                                                                                                                                                 |
| `action`                      | `string` | `seen` when a content gate becomes visible in the viewport, `form_submission` or `form_submission_success` for form interactions, or `dimsissed` when a modal overlay is dismissed.                              |
| `action_type`                 | `string` | `registration` for new reader registrations, `signin` when signing into an existing account, `donation` for donations, and `checkout_button` for non-donation checkouts. Not applicable when `action` is `seen`. |
| `gate_has_checkout_button`    | `string` | `yes` if the content gate is showing a Checkout Button block, otherwise `no`.                                                                                                                                    |
| `gate_has_donation_block`     | `string` | `yes` if the content gate is showing a Donation block, otherwise `no`.                                                                                                                                           |
| `gate_has_registration_block` | `string` | `yes` if the content gate is showing a Registration block, otherwise `no`.                                                                                                                                       |
| `referrer`                    | `string` | The URL path of the article being viewed.                                                                                                                                                                        |
| `author`                      | `string` | The author(s) associated with the article being viewed.                                                                                                                                                          |
| `is_logged_in`                | `string` | `yes` if the user was already logged in when first interacting with the content gate, otherwise `no`.                                                                                                             |
| `is_reader`                   | `string` | `yes` if the logged-in user is a reader account, otherwise `no`.                                                                                                                                                 |
| `is_newsletter_subscriber`    | `string` | `yes` if the logged-in user is a known newsletter subscriber, otherwise `no`.                                                                                                                                    |
| `is_donor`                    | `string` | `yes` if the logged-in user is a known donor, otherwise `no`.                                                                                                                                                    |
| `is_subscriber`               | `string` | `yes` if the logged-in user is a known paid membership subscriber, otherwise `no`.                                                                                                                               |
| `email_hash`                  | `string` | An anonymized hash representing the user's email address. This lets you identify actions taken by a single user without exposing their identity.                                                                 |
| `ga_session_id`               | `int`    | An ID representing a single session as defined by Google Analytics. This lets you identify actions taken during a single session. More info: https://support.google.com/analytics/answer/9191807                  |

### Donation paramters

These parameters are added to `np_gate_interaction` events when the `action_type` is `donation`.

| Name                 | Type     | Obs                                                                    |
|----------------------|----------|------------------------------------------------------------------------|
| `donation_amount`    | `float`   | The amount of the donation.                                            |
| `donation_currency ` | `string` | The currency of the donation.                                          |
| `donation_frequency` | `string` | The recurrence of the donation, or `once` for non-recurring donations. |

### Paid membership parameters

These parameters are added to `np_gate_interaction` events when the `action_type` is `checkout_button`.

| Name                 | Type     | Obs                                                                    |
|----------------------|----------|------------------------------------------------------------------------|
| `currency`                 | `string`   | The currency of the transaction.                                                                                                                                                    |
| `price`                    | `float`     | The amount of the transaction.                                                                                                                                                      |
| `product_id`               | `int`      | The product ID of the transaction.                                                                                                                                                  |
| `product_price_summary`    | `string`   | The full name of the product and its price, as shown to the reader.                                                                                                                 |
| `product_type`             | `string`   | `membership` if the product is subscription tied to paid membership, `subscription` if a recurring transaction not tied to membership, or `product` if a non-recurring transaction. |
| `recurrence`               | `string`   | The recurrence of the transaction. Not applicable if `product_type` is `product`.                                                                                                   |
| `variation_id`             | `int`      | If the transaction involves a (variable product)[https://woocommerce.com/document/variable-product/], the ID of the variation.                                                      |

## Tracking conversions

Interacting with a Donation or Checkout Button block from inside a content gate will start a modal checkout flow. Modal checkout fires its own analytics events with a **`np_modal_checkout_interaction`** event name. However, these events share certain event parameters that can help you tie these to `np_gate_interaction` events in order to track conversion rates:

* `gate_post_id` - If the modal checkout originated from a content gate, this will be the gate ID, matching the parameter from `np_gate_interaction` events.
* `action_type` - This will be `donation` or `checkout_button`, matching the `action_type` parameter from `np_gate_interaction` events.
* `amount` - This will match the `donation_amount` or `price` parameters from `np_gate_interaction` events.
& `product_id` and `variation_id` - These will match the same parameters from `np_gate_interaction` events with an `action_type` of `checkout_button`. For `donation` events, `product_id` should allow you to cross-reference the `donation_frequency` value with the product ID in your WooCommerce store.