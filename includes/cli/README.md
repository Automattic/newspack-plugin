# Newspack CLI commands

This directory contains various WP CLI utility commands. Group related commands into their own class files, and invoke them in the `Initializer` class.

### `wp newspack setup`

Shortcut to skip the onboarding wizard for a brand-new or empty Newspack site.

#### params

- `--site=<WordPress site url>` - If passed, will use post content from the given URL to populate starter content.

### `wp newspack ras setup`

Shortcut to skip the Reader Activation onboarding wizard and automatically generate default Reader Activation prompts for Newspack Campaigns. Note that prerequisites must still be met for Reader Activation features to be fully functional.

### `wp newspack verify-reader`

Verify a reader account, allowing them to skip the account ownership verification flow.

#### params

- `--user=<user ID|user email>` The user ID or email address associated with the reader account to verify.

### `wp newspack migrate-co-authors-guest-authors`

Migrate Co-Authors Plus guest authors to regular users with the [Guest Contributor role](https://help.newspack.com/publishing-and-appearance/guest-contributors/).

#### params

- `--live` - Run the command in live mode, updating the subscriptions. Note that without this flag, the command runs in dry run mode by default.
- `--verbose` - Produce more output.
- `--user_logins=<user_login1,user_login2...>` - Comma-separated list of user logins. If provided, only WP Users with these logins will be processed.
- `--guest_author_ids=<id1,id2...>` - Comma-separated list of Guest Author IDs. If provided, only Gues Authors with these IDs will be processed.

### `wp newspack backfill-non-editing-contributors`

Backfill [Guest Contributor role](https://help.newspack.com/publishing-and-appearance/guest-contributors/). Will add this role to any Subscriber/Customer user who has any posts assigned to them.

#### params

- `--live` - Run the command in live mode, updating the users. Note that without this flag, the command runs in dry run mode by default.

### `wp newspack schedule-co-authors-author-term-backfill`

Set up a cron job to backfill any missing Co-Author plus author terms for posts. Will run incrementally at a rate of up to 250 posts per hour to minimize performance impact.

### `wp newspack esp sync`

Backfill script to resync Reader Activation contact data to the connected ESP for all customers, migrated subscriptions, or specific customers, subscriptions, or orders by ID.

#### params
- `--dry-run` - If passed, output results but do not execute the sync.
- `--active-only` - Resync users who have active subscriptions only, otherwise resync all users.
- `--migrated-subscriptions=stripe|piano-csv|strive-csv` - If passed, will only query for subscriptions that were migrated via the Newspack Subscription Migrations plugin using the Stripe/Piano CSV importers, or the legacy Stripe migrator. The Newspack Subscription Migrations plugin must be active to use this flag.
- ID flags: these flags are mutually exclusive (can only use one at a time):
  - `--subscription-ids=<id1,id2...>` - Comma-delimited list of subscription IDs. If passed, will only process those specific subscriptions.
  - `--user-ids=<id1,id2...>` - Comma-delimited list of user IDs. If passed, will only process subscriptions associated with those specific users.
  - `--order-ids=<id1,id2...>` - Comma-delimited list of order IDs. If passed, will only process subscriptions associated with those specific orders.
-
- `--batch-size` - Number of subscriptions to query/process at once.
- `--max-batches` - Max number of total batches to process.
- `--offset` - Offset value passed to the subscription query. Use in combination with `--batch-size` and `--max-batches` to be able to run multiple processes in parallel, e.g. `wp newspack woo resync --max-batches=1 --batch-size=1000 --offset=0` would sync subscriptions 0-1000, `wp newspack woo resync --max-batches=1 --batch-size=1000 --offset=1000` would sync subscriptions 1001-2000, etc.