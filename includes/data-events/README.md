# Newspack Data Events

## A tool for non-blocking dispatch of data events to registered handlers.

The purpose of this tool is to unify the strategy for sending reader activity data to third-party services, focused primarily for analytics, ESPs and CRMs.

The non-blocking strategy is inspired by [TechCrunch's `wp-async-task`](https://github.com/techcrunch/wp-async-task) and uses an HTTP request to trigger the handlers.

---

## Core Actions

### `reader_registered`

When a reader registers.

#### Data

| Name       | Type      |
| ---------- | --------- |
| `user_id`  | `integer` |
| `email`    | `string`  |
| `metadata` | `array`   |

### `reader_logged_in`

When a reader authenticates.

#### Data

| Name      | Type      |
| --------- | --------- |
| `user_id` | `integer` |
| `email`   | `string`  |

### `reader_verified`

When a reader verifies their email address.

#### Data

| Name      | Type      |
| --------- | --------- |
| `user_id` | `integer` |

### `newsletter_subscribed`

When a reader subscribes to newsletter lists from Newspack Newsletters subscription.

#### Data

| Name       | Type       |
| ---------- | ---------- |
| `provider` | `string`   |
| `contact`  | `array`    |
| `lists`    | `string[]` |

### `newsletter_updated`

When a reader updates their lists subscription from Newspack Newsletters.

#### Data

| Name            | Type       |
| --------------- | ---------- |
| `provider`      | `string`   |
| `email`         | `string`   |
| `lists_added`   | `string[]` |
| `lists_removed` | `string[]` |

## Registering a new action

To dispatch an event an action must first be registered with the following:

```php
Newspack\Data_Events::register_action( 'action_name' );
```

## Dispatching

Once registered, an array with arbitrary payload can be dispatched:

```php
$data          = [ "test" => "data" ];
$use_client_id = true;
Newspack\Data_Events::dispatch( 'action_name', $data, $use_client_id );
```

The use of client ID, which is `true` by default, will send the `Reader_Activation::get_client_id();` as part of the data event payload. This client ID is pulled from the session's `newspack-cid` cookie. Most data events are expected to be user actions and third parties might make use of having an ID that groups anonymous sessions.

## Listeners

Listeners serve as a shortcut to register and dispatch an action once a WP hook is fired. Example:

```php
$hook_name   = 'woocommerce_checkout_order_processed';
$action_name = 'new_purchase';
Newspack\Data_Events::register_listener( $hook_name, $action_name );
```

By a registering a listener there's no need to register the action.

With this listener, every registered handler will receive the `new_purchase` data event.

The 3rd argument can be either a `callable`, which receives the hook's data for filtering, or a `string[]`, which should be used to map the hook's arguments for an associative array.

Example with a `callable` to process/filter the data from the WP hook:

```php
Newspack\Data_Events::register_listener(
	'woocommerce_checkout_order_processed',
	'new_purchase',
	function ( $data ) {
		// Parse data
		return $data;
	}
);
```

Example with an array of strings to map the hook's arguments:

```php
Newspack\Data_Events::register_listener(
	'newspack_newsletters_add_contact',
	'newsletter_subscribed',
	[ 'provider', 'contact', 'lists', 'result' ]
);
```

## Registering handlers

Handlers are triggered by the dispatch of an action or by a listener. Think of it as the actual connector to the third-party, whilst the action/dispatch is the directory of available data provided by Newspack.

Registering a handler:

```php
$action_name = 'my_action';
// Action handler
function my_action_handler( $timestamp, $data, $client_id ) {
	// Send data to a third-party.
}
Newspack\Data_Events::register_handler( 'my_action_handler', 'my_action' );

// Global handler, to be called on every data event
function my_global_handler( $action_name, $timestamp, $data, $client_id ) {
	// Do some global analytics.
}
Newspack\Data_Events::register_handler( 'my_global_handler' );
```

It functions similar to the registration of WP action/filter hooks but without a `priority` argument. Handlers are supposed to be independent and the order of execution doesn't matter.

Each handler caller is contained in a `try...catch` block so a fatal error caused by a handler never disrupts other handlers.
