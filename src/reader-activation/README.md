# Reader Registration & Login Analytics

If your Newspack site is connected to a GA4 account, then reader registrations and logins will fire analytics events indicating these interactions.

## Events tracked

### `reader_registered`

This event will be fired when a reader registers for a new account via the Registration block, Newsletter Subscription Form block, or Sign In modal. Contains the following parameters:

| Name                  | Type     | Obs                                                                                            |
|-----------------------|----------|------------------------------------------------------------------------------------------------|
| `registration_method` | `string` | The flow the reader used to register.                                                           |
| `popup_id`            | `int`    | If the registration originated from a Newspack Campaigns prompt, the numeric ID of the prompt. |
| `referrer`            | `string` | The URL path of the page the reader registered from.                                           |

### `reader_logged_in`

This event will be fired when a reader logs into an existing account via the auth modal.

| Name           | Type     | Obs                                                 |
|----------------|----------|-----------------------------------------------------|
| `login_method` | `string` | Currently only `auth-form`.                         |
| `referrer`     | `string` | The URL path of the page the reader logged in from. |
