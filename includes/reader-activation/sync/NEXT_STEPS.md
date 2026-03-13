# Next Steps: Contact Metadata Refactor

## 1. Replace `get_contact_from_customer` / `get_contact_from_order` calls in `ContactSync`

In `class-contact-sync.php`, replace all calls to `Sync\WooCommerce::get_contact_from_customer()` and `Sync\WooCommerce::get_contact_from_order()` with `Sync\Metadata::get_contact_with_metadata()`, passing whatever parameter we already have (user ID, WC_Customer, or WC_Order).

Affected lines:
- `scheduled_sync()` (line ~381): `Sync\WooCommerce::get_contact_from_customer( new \WC_Customer( $user_id ) )` → `Sync\Metadata::get_contact_with_metadata( $user_id )`
- `get_contact_data()` (line ~422): `Sync\WooCommerce::get_contact_from_customer( $customer )` → `Sync\Metadata::get_contact_with_metadata( $customer )`
- `sync_contact()` (line ~452): `Sync\WooCommerce::get_contact_from_order( $order )` / `self::get_contact_data( $user_id )` → `Sync\Metadata::get_contact_with_metadata( $is_order ? $order : $user_id )`

## 2. Remove `normalize_contact_data` call from `sync()`

In `ContactSync::sync()` (line ~140), remove the call to `Sync\Metadata::normalize_contact_data( $contact )`. Normalization is no longer needed because each Contact_Metadata class is responsible for returning properly keyed metadata.

## 3. Implement `get_metadata()` in `Legacy_Basic`

In `contact-metadata/class-legacy-basic.php`:

- Build a mock contact array (with `email` and `metadata` keys) that the legacy code expects.
- Call `Sync\WooCommerce::get_contact_from_customer()` to populate metadata the legacy way.
- Call `Legacy_Metadata::normalize_contact_data()` on the result.
- Return the normalized metadata.

This way, the legacy path still goes through the same WooCommerce and normalization logic, but it's encapsulated inside the `Legacy_Basic` class.

## 4. `Legacy_Payment::get_metadata()` — no implementation needed

The `Legacy_Payment` class does not need to return metadata from `get_metadata()`. Add a comment explaining that `Legacy_Basic` already takes care of populating all legacy fields (both basic and payment), since `WooCommerce::get_contact_from_customer()` returns the full set. `Legacy_Payment` exists only so its fields appear in the UI field selection via `get_fields()`.
