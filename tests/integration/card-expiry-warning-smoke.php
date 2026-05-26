<?php
/**
 * Card Expiry Warning — Integration Smoke Test.
 *
 * Usage: wp eval-file tests/integration/card-expiry-warning-smoke.php
 *
 * Requires WooCommerce, WooCommerce Subscriptions, and Newspack Newsletters
 * to be active on the site.
 *
 * Creates temporary fixtures, runs 7 scenarios, and cleans up after itself.
 *
 * Scenarios:
 *  1. Cron scheduled
 *  2. Happy-path send (token → subscription → email)
 *  3. Idempotency (no duplicate send)
 *  4. clear_sent_flag() handler clears meta (called directly; the full
 *     woocommerce_subscription_payment_method_updated action triggers
 *     third-party hooks like WCS PayPal that fatal on a minimal fixture)
 *  5. New card triggers new send
 *  6. Unattached card does not trigger email
 *  7. Cleanup
 *
 * @package Newspack\Tests
 */

use Newspack\Card_Expiry_Warning;
use Newspack\Emails;
use Newspack\Reader_Activation;

// ── Globals ──────────────────────────────────────────────────────────
// wp eval-file runs via eval(), so file-scope vars are local to the eval
// context. Named functions use `global` which references $GLOBALS. Declare
// these as global so both scopes see the same variables.
global $passed, $total, $mails, $cleanup;
$passed  = 0;
$total   = 7;
$mails   = [];
$cleanup = []; // Closures executed in reverse order during cleanup.

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Record a passing scenario.
 *
 * @param string $label Description.
 */
function smoke_pass( string $label ): void {
	global $passed;
	++$passed;
	WP_CLI::log( "  PASS: $label" );
}

/**
 * Record a failing scenario.
 *
 * @param string $label  Description.
 * @param string $detail Optional extra info.
 */
function smoke_fail( string $label, string $detail = '' ): void {
	WP_CLI::log( "  FAIL: $label" . ( $detail ? " -- $detail" : '' ) );
}

// ── Prerequisites ────────────────────────────────────────────────────
WP_CLI::log( '' );
WP_CLI::log( '== Card Expiry Warning -- Smoke Test ==' );
WP_CLI::log( '' );

$prereqs = [
	'WC_Payment_Token_CC'           => 'WooCommerce (WC_Payment_Token_CC)',
	'WC_Payment_Tokens'             => 'WooCommerce (WC_Payment_Tokens)',
	'WCS_Payment_Tokens'            => 'WooCommerce Subscriptions (WCS_Payment_Tokens)',
	'Newspack\\Card_Expiry_Warning' => 'Newspack Card_Expiry_Warning',
	'Newspack\\Emails'              => 'Newspack Emails',
	'Newspack_Newsletters'          => 'Newspack Newsletters',
];
foreach ( $prereqs as $class => $label ) {
	if ( ! class_exists( $class ) ) {
		WP_CLI::error( "Prerequisite not met: $label ($class). Aborting." );
	}
}
if ( ! function_exists( 'wcs_create_subscription' ) ) {
	WP_CLI::error( 'wcs_create_subscription() not available. Aborting.' );
}

// Card_Expiry_Warning::init() only registers the email config when
// WooCommerce_Subscriptions::is_enabled() returns true, which in turn
// requires Reader Activation to be enabled. Without this, scan_expiring_cards()
// silently captures 0 emails and the test gives a misleading failure.
if ( ! Reader_Activation::is_enabled() ) {
	WP_CLI::error( 'Reader Activation is not enabled. Aborting.' );
}
WP_CLI::log( 'Prerequisites OK.' );

// ── Intercept wp_mail via pre_wp_mail ────────────────────────────────
// Returning non-null from pre_wp_mail short-circuits wp_mail() without
// actually sending. We capture the args and return true ("sent OK").
add_filter(
	'pre_wp_mail',
	function ( $null, $atts ) use ( &$mails ) {
		$mails[] = $atts;
		return true;
	},
	10,
	2
);

// ── Widen scan window for reliable expiry detection ──────────────────
// A CC token "expires" at the end of its expiry month. The scan query
// finds tokens whose LAST_DAY(expiry) falls in [today, today + N days].
// End-of-current-month is at most ~30 days away, so a 32-day window
// guarantees the token is within range regardless of when the test runs.
add_filter(
	'newspack_card_expiry_warning_days',
	function () {
		return 32;
	},
	99
);

// ── Create test user ─────────────────────────────────────────────────
$rand    = wp_rand( 10000, 99999 );
$user_id = wp_insert_user(
	[
		'user_login' => "smoke_cew_$rand",
		'user_email' => "smoke-cew-$rand@example.test",
		'user_pass'  => wp_generate_password(),
		'first_name' => 'Smoke',
		'last_name'  => 'Tester',
		'role'       => 'subscriber',
	]
);
if ( is_wp_error( $user_id ) ) {
	WP_CLI::error( 'Could not create test user: ' . $user_id->get_error_message() );
}
$cleanup[] = function () use ( $user_id ) {
	wp_delete_user( $user_id );
};
WP_CLI::log( "  Created user #$user_id." );

// ── Create CC token 1 (expires end of current month) ─────────────────
$expiry_month = (int) gmdate( 'n' );
$expiry_year  = (int) gmdate( 'Y' );

$token1 = new WC_Payment_Token_CC();
$token1->set_gateway_id( 'stripe' );
$token1->set_token( 'pm_smoke_' . $rand . '_a' );
$token1->set_last4( '4242' );
$token1->set_expiry_month( str_pad( $expiry_month, 2, '0', STR_PAD_LEFT ) );
$token1->set_expiry_year( (string) $expiry_year );
$token1->set_card_type( 'visa' );
$token1->set_user_id( $user_id );
$token1->save();
$cleanup[] = function () use ( $token1 ) {
	$token1->delete( true );
};
WP_CLI::log( "  Created token #{$token1->get_id()} (last4=4242, exp=$expiry_month/$expiry_year)." );

// ── Create WC Subscription linked to token 1 ────────────────────────
$subscription = wcs_create_subscription(
	[
		'customer_id'      => $user_id,
		'status'           => 'active',
		'billing_period'   => 'month',
		'billing_interval' => 1,
	]
);
if ( is_wp_error( $subscription ) ) {
	WP_CLI::error( 'Could not create subscription: ' . $subscription->get_error_message() );
}
$sub_id = $subscription->get_id();

$subscription->set_billing_email( "smoke-cew-$rand@example.test" );
$subscription->set_billing_first_name( 'Smoke' );
$subscription->set_payment_method( 'stripe' );

// Mark as automatic renewal — wcs_create_subscription() defaults to
// manual, and get_subscriptions_from_token() excludes manual-renewal subs.
$subscription->set_requires_manual_renewal( false );

// Store token string in gateway-specific meta so
// WCS_Payment_Tokens::get_subscriptions_from_token() can match it
// (key-less meta_query on the raw token string).
$subscription->update_meta_data( '_stripe_source_id', $token1->get_token() );

// Set a future next-payment date.
$subscription->update_dates(
	[ 'next_payment' => gmdate( 'Y-m-d H:i:s', time() + 20 * DAY_IN_SECONDS ) ]
);
$subscription->save();

$cleanup[] = function () use ( $sub_id ) {
	wp_delete_post( $sub_id, true );
};
WP_CLI::log( "  Created subscription #$sub_id." );


// ══════════════════════════════════════════════════════════════════════
// SCENARIO 1: Cron scheduled
// ══════════════════════════════════════════════════════════════════════
WP_CLI::log( '' );
WP_CLI::log( '1. Cron scheduled' );

Card_Expiry_Warning::schedule_cron();

if ( wp_next_scheduled( Card_Expiry_Warning::CRON_HOOK ) ) {
	smoke_pass( 'Cron event is scheduled.' );
} else {
	smoke_fail( 'Cron event was not scheduled.' );
}


// ══════════════════════════════════════════════════════════════════════
// SCENARIO 2: Happy-path send
// ══════════════════════════════════════════════════════════════════════
WP_CLI::log( '' );
WP_CLI::log( '2. Happy-path send' );

$mails = [];
Card_Expiry_Warning::scan_expiring_cards();

$s2_ok = true;
if ( count( $mails ) !== 1 ) {
	smoke_fail( 'Expected exactly 1 email, got ' . count( $mails ) . '.' );
	if ( count( $mails ) === 0 ) {
		// Debug: check prerequisites.
		if ( ! Emails::can_send_email( 'card-expiry-warning' ) ) {
			WP_CLI::log( '    (Debug: Emails::can_send_email returned false.)' );
		}
	}
	$s2_ok = false;
} else {
	$mail = $mails[0];

	// Check recipient.
	if ( $mail['to'] !== "smoke-cew-$rand@example.test" ) {
		smoke_fail( "Wrong recipient: expected smoke-cew-$rand@example.test, got {$mail['to']}." );
		$s2_ok = false;
	}

	// Check body contains last-4 and expiry.
	$body = $mail['message'] ?? '';
	if ( false === strpos( $body, '4242' ) ) {
		smoke_fail( 'Email body missing card last-4 "4242".' );
		$s2_ok = false;
	}
	// Use the token's own accessors for the padded month format.
	$expiry_str = $token1->get_expiry_month() . '/' . $token1->get_expiry_year();
	if ( false === strpos( $body, $expiry_str ) ) {
		smoke_fail( "Email body missing expiry \"$expiry_str\"." );
		$s2_ok = false;
	}

	// Check idempotency meta.
	$subscription  = wcs_get_subscription( $sub_id );
	$meta_val      = $subscription->get_meta( '_newspack_card_expiry_warning_sent', true );
	$expected_meta = $token1->get_id() . ':' . $token1->get_expiry_month() . '/' . $token1->get_expiry_year();
	if ( $meta_val !== $expected_meta ) {
		smoke_fail( "Idempotency meta mismatch: expected '$expected_meta', got '$meta_val'." );
		$s2_ok = false;
	}
}

if ( $s2_ok ) {
	smoke_pass( 'Correct recipient, body tokens, and idempotency meta.' );
}


// ══════════════════════════════════════════════════════════════════════
// SCENARIO 3: Idempotency — re-running scan sends nothing
// ══════════════════════════════════════════════════════════════════════
WP_CLI::log( '' );
WP_CLI::log( '3. Idempotency (no duplicate send)' );

$mails = [];
Card_Expiry_Warning::scan_expiring_cards();

if ( 0 === count( $mails ) ) {
	$subscription  = wcs_get_subscription( $sub_id );
	$meta_val      = $subscription->get_meta( '_newspack_card_expiry_warning_sent', true );
	$expected_meta = $token1->get_id() . ':' . $token1->get_expiry_month() . '/' . $token1->get_expiry_year();

	if ( $meta_val === $expected_meta ) {
		smoke_pass( 'No duplicate email; meta unchanged.' );
	} else {
		smoke_fail( "Meta changed unexpectedly to '$meta_val'." );
	}
} else {
	smoke_fail( 'Duplicate email sent (' . count( $mails ) . ' captured).' );
}


// ══════════════════════════════════════════════════════════════════════
// SCENARIO 4: clear_sent_flag() handler clears idempotency meta
// ══════════════════════════════════════════════════════════════════════
WP_CLI::log( '' );
WP_CLI::log( '4. clear_sent_flag() handler clears meta' );

// Call clear_sent_flag() directly rather than firing the full
// woocommerce_subscription_payment_method_updated action. That action
// triggers third-party hooks (WCS PayPal, etc.) that fatal with our
// minimal test fixture.
$subscription = wcs_get_subscription( $sub_id );
Card_Expiry_Warning::clear_sent_flag( $subscription );

$subscription = wcs_get_subscription( $sub_id );
$meta_val     = $subscription->get_meta( '_newspack_card_expiry_warning_sent', true );

if ( empty( $meta_val ) ) {
	smoke_pass( 'Idempotency meta cleared.' );
} else {
	smoke_fail( "Meta should be empty after clear, got '$meta_val'." );
}


// ══════════════════════════════════════════════════════════════════════
// SCENARIO 5: New card in window triggers a new send
// ══════════════════════════════════════════════════════════════════════
WP_CLI::log( '' );
WP_CLI::log( '5. New card triggers new send' );

$token2 = new WC_Payment_Token_CC();
$token2->set_gateway_id( 'stripe' );
$token2->set_token( 'pm_smoke_' . $rand . '_b' );
$token2->set_last4( '1234' );
$token2->set_expiry_month( str_pad( $expiry_month, 2, '0', STR_PAD_LEFT ) );
$token2->set_expiry_year( (string) $expiry_year );
$token2->set_card_type( 'mastercard' );
$token2->set_user_id( $user_id );
$token2->save();
$cleanup[] = function () use ( $token2 ) {
	$token2->delete( true );
};
WP_CLI::log( "  Created token #{$token2->get_id()} (last4=1234)." );

// Point subscription at the new token.
$subscription = wcs_get_subscription( $sub_id );
$subscription->update_meta_data( '_stripe_source_id', $token2->get_token() );
$subscription->save();

$mails = [];
Card_Expiry_Warning::scan_expiring_cards();

$s5_ok = true;
if ( count( $mails ) < 1 ) {
	smoke_fail( 'No email sent for the new token.' );
	$s5_ok = false;
} else {
	$mail = $mails[ count( $mails ) - 1 ];
	$body = $mail['message'] ?? '';

	if ( false === strpos( $body, '1234' ) ) {
		smoke_fail( 'Email body missing new card last-4 "1234".' );
		$s5_ok = false;
	}

	$subscription  = wcs_get_subscription( $sub_id );
	$meta_val      = $subscription->get_meta( '_newspack_card_expiry_warning_sent', true );
	$expected_meta = $token2->get_id() . ':' . $token2->get_expiry_month() . '/' . $token2->get_expiry_year();
	if ( $meta_val !== $expected_meta ) {
		smoke_fail( "Meta should reflect token2: expected '$expected_meta', got '$meta_val'." );
		$s5_ok = false;
	}
}

if ( $s5_ok ) {
	smoke_pass( 'New card triggered email with correct last-4 and updated meta.' );
}


// ══════════════════════════════════════════════════════════════════════
// SCENARIO 6: Unattached card does NOT trigger an email
// ══════════════════════════════════════════════════════════════════════
WP_CLI::log( '' );
WP_CLI::log( '6. Unattached card does not trigger email' );

// Create a separate user + token with no subscription.
$orphan_user_id = wp_insert_user(
	[
		'user_login' => "smoke_cew_orphan_$rand",
		'user_email' => "smoke-orphan-$rand@example.test",
		'user_pass'  => wp_generate_password(),
		'role'       => 'subscriber',
	]
);
if ( is_wp_error( $orphan_user_id ) ) {
	WP_CLI::error( 'Could not create orphan user: ' . $orphan_user_id->get_error_message() );
}
$cleanup[] = function () use ( $orphan_user_id ) {
	wp_delete_user( $orphan_user_id );
};

$token3 = new WC_Payment_Token_CC();
$token3->set_gateway_id( 'stripe' );
$token3->set_token( 'pm_smoke_' . $rand . '_c' );
$token3->set_last4( '9999' );
$token3->set_expiry_month( str_pad( $expiry_month, 2, '0', STR_PAD_LEFT ) );
$token3->set_expiry_year( (string) $expiry_year );
$token3->set_card_type( 'amex' );
$token3->set_user_id( $orphan_user_id );
$token3->save();
$cleanup[] = function () use ( $token3 ) {
	$token3->delete( true );
};
WP_CLI::log( "  Created orphan token #{$token3->get_id()} (last4=9999, no subscription)." );

// Token2's subscription already has the idempotency flag from scenario 5,
// so no email for that. Token1 is no longer on the subscription (replaced
// by token2). Token3 has no subscription at all.
$mails = [];
Card_Expiry_Warning::scan_expiring_cards();

if ( 0 === count( $mails ) ) {
	smoke_pass( 'No email sent for unattached card.' );
} else {
	$orphan_hit = false;
	foreach ( $mails as $mail_item ) {
		if ( false !== strpos( $mail_item['to'], 'orphan' ) ) {
			$orphan_hit = true;
		}
	}
	if ( $orphan_hit ) {
		smoke_fail( 'Email was sent to orphan user with no subscription.' );
	} else {
		smoke_fail( count( $mails ) . ' unexpected email(s) sent (not to orphan user).' );
	}
}


// ══════════════════════════════════════════════════════════════════════
// SCENARIO 7: Cleanup
// ══════════════════════════════════════════════════════════════════════
WP_CLI::log( '' );
WP_CLI::log( '7. Cleanup' );

$clean_ok = true;
foreach ( array_reverse( $cleanup ) as $fn ) {
	try {
		$fn();
	} catch ( \Throwable $e ) {
		WP_CLI::log( '    Cleanup error: ' . $e->getMessage() );
		$clean_ok = false;
	}
}

// Remove filters added by this script.
remove_all_filters( 'pre_wp_mail' );
remove_all_filters( 'newspack_card_expiry_warning_days' );

// Unschedule cron (may have been scheduled before the test too).
wp_clear_scheduled_hook( Card_Expiry_Warning::CRON_HOOK );

if ( $clean_ok ) {
	smoke_pass( 'All fixtures cleaned up.' );
} else {
	smoke_fail( 'Some cleanup steps failed (see above).' );
}


// ── Summary ──────────────────────────────────────────────────────────
WP_CLI::log( '' );
WP_CLI::log( "== $passed/$total PASSED ==" );
WP_CLI::log( '' );

exit( $passed === $total ? 0 : 1 );
