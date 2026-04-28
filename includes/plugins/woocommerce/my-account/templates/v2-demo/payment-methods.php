<?php
/**
 * My Account v2 prototype — Payment methods endpoint.
 *
 * Matches WC core's `myaccount/payment-methods.php` structure and class
 * names: same `<table class="woocommerce-MyAccount-paymentMethods shop_table
 * shop_table_responsive account-payment-methods-table">` wrapper, same
 * column / row classes, same per-cell `data-title` for responsive collapse.
 * Saved cards are pulled from the fake-data slice instead of
 * `wc_get_customer_saved_methods_list()`.
 *
 * Two intentional deviations from WC core's exact output:
 *  - Action buttons (Make default / Delete / Add payment method) carry
 *    `data-action` + `data-payment-method-id` so the v2-demo JS dispatcher
 *    (src/my-account/v2-demo/payment-methods.js) can intercept clicks and
 *    surface a snackbar — no real mutations, no AJAX.
 *  - The default row gets an inline `__badge--secondary "Default"` span
 *    next to the brand name. WC core relies on the `default-payment-method`
 *    row class alone (invisible without theme CSS); the inline indicator
 *    keeps the demo readable on any theme.
 *
 * Per brief §3 / §10 Phase 6: preserve WC core's layout / behaviour with
 * fake data; no new design.
 *
 * @package Newspack
 * @var array $args Template args; expected to contain `data` => fake-data array.
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

$data            = isset( $args['data'] ) ? $args['data'] : [];
$payment_methods = isset( $data['payment_methods'] ) ? $data['payment_methods'] : [];
$has_methods     = ! empty( $payment_methods );
$columns         = \wc_get_account_payment_methods_columns();

// Match WC core's two action hooks that bracket the table — third-party
// integrations (Stripe, Subscriptions) hook these to inject UI before/after
// the saved cards. Keeping them fires any production wiring on a real site;
// the demo's fake data is unaffected because we don't read $has_methods
// upstream.
\do_action( 'woocommerce_before_account_payment_methods', $has_methods );
?>

<?php if ( $has_methods ) : ?>

	<table class="woocommerce-MyAccount-paymentMethods shop_table shop_table_responsive account-payment-methods-table">
		<thead>
			<tr>
				<?php foreach ( $columns as $column_id => $column_name ) : ?>
					<th class="woocommerce-PaymentMethod woocommerce-PaymentMethod--<?php echo \esc_attr( $column_id ); ?> payment-method-<?php echo \esc_attr( $column_id ); ?>"><span class="nobr"><?php echo \esc_html( $column_name ); ?></span></th>
				<?php endforeach; ?>
			</tr>
		</thead>
		<tbody>
		<?php foreach ( $payment_methods as $payment_method_type => $methods ) : ?>
			<?php foreach ( $methods as $payment_method_index => $method ) : ?>
				<?php
				$payment_method_id   = (string) $payment_method_type . '-' . (int) $payment_method_index;
				$is_default          = ! empty( $method['is_default'] );
				$payment_method_brand = isset( $method['method']['brand'] ) ? (string) $method['method']['brand'] : '';
				$payment_method_last4 = isset( $method['method']['last4'] ) ? (string) $method['method']['last4'] : '';
				$payment_method_exp   = isset( $method['expires'] ) ? (string) $method['expires'] : '';
				$payment_method_actions = isset( $method['actions'] ) && is_array( $method['actions'] ) ? $method['actions'] : [];
				// Mirror v1's payment-information badge logic: parse `MM/YY`
				// via `date_parse_from_format` so malformed values (e.g.
				// `02/ab`) report parse errors instead of silently casting to
				// year 20 and tripping the comparison. Only mark expired when
				// the parse succeeded and the month is in the past.
				$is_expired = false;
				if ( '' !== $payment_method_exp ) {
					$parsed_exp = date_parse_from_format( 'n/y', $payment_method_exp );
					if (
						is_array( $parsed_exp )
						&& empty( $parsed_exp['errors'] )
						&& ! empty( $parsed_exp['year'] )
						&& ! empty( $parsed_exp['month'] )
					) {
						$exp_year  = (int) $parsed_exp['year'];
						$exp_month = (int) $parsed_exp['month'];
						$now_year  = (int) gmdate( 'Y' );
						$now_month = (int) gmdate( 'm' );
						if ( $exp_year < $now_year || ( $exp_year === $now_year && $exp_month < $now_month ) ) {
							$is_expired = true;
						}
					}
				}
				?>
				<tr class="payment-method<?php echo $is_default ? ' default-payment-method' : ''; ?>" data-payment-method-id="<?php echo \esc_attr( $payment_method_id ); ?>">
					<?php foreach ( $columns as $column_id => $column_name ) : ?>
						<td class="woocommerce-PaymentMethod woocommerce-PaymentMethod--<?php echo \esc_attr( $column_id ); ?> payment-method-<?php echo \esc_attr( $column_id ); ?>" data-title="<?php echo \esc_attr( $column_name ); ?>">
							<?php
							if ( 'method' === $column_id ) {
								if ( '' !== $payment_method_last4 ) {
									printf(
										/* translators: 1: credit card type 2: last 4 digits */
										\esc_html__( '%1$s ending in %2$s', 'newspack-plugin' ),
										\esc_html( \wc_get_credit_card_type_label( $payment_method_brand ) ),
										\esc_html( $payment_method_last4 )
									);
								} else {
									echo \esc_html( \wc_get_credit_card_type_label( $payment_method_brand ) );
								}
								if ( $is_expired ) {
									// Inline Expired badge — mirrors v1's
									// `payment-information.php` pattern (same
									// `__badge--secondary` variant). Surfaces
									// under `?v2-demo=expired-payment`.
									echo ' <span class="newspack-ui__badge newspack-ui__badge--secondary">' . \esc_html__( 'Expired', 'newspack-plugin' ) . '</span>';
								}
								if ( $is_default ) {
									// Inline default indicator. WC core relies on
									// the `default-payment-method` row class alone,
									// which is invisible without theme CSS — adding
									// a small uppercase tag here makes the demo
									// readable on any theme. Same `--secondary`
									// badge variant the v1 payment-information
									// template uses for the same surface.
									echo ' <span class="newspack-ui__badge newspack-ui__badge--secondary">' . \esc_html__( 'Default', 'newspack-plugin' ) . '</span>';
								}
							} elseif ( 'expires' === $column_id ) {
								echo \esc_html( $payment_method_exp );
							} elseif ( 'actions' === $column_id ) {
								foreach ( $payment_method_actions as $action_key => $action_data ) {
									$action_classes = trim( 'button ' . \sanitize_html_class( $action_key ) );
									$action_slug    = 'default' === $action_key ? 'set-default-payment-method' : 'delete-payment-method';
									printf(
										'<a href="%1$s" class="%2$s" data-action="%3$s" data-payment-method-id="%4$s">%5$s</a>&nbsp;',
										\esc_url( isset( $action_data['url'] ) ? (string) $action_data['url'] : '#' ),
										\esc_attr( $action_classes ),
										\esc_attr( $action_slug ),
										\esc_attr( $payment_method_id ),
										\esc_html( isset( $action_data['name'] ) ? (string) $action_data['name'] : '' )
									);
								}
							}
							?>
						</td>
					<?php endforeach; ?>
				</tr>
			<?php endforeach; ?>
		<?php endforeach; ?>
		</tbody>
	</table>

<?php else : ?>

	<?php \wc_print_notice( \esc_html__( 'No saved methods found.', 'newspack-plugin' ), 'notice' ); ?>

<?php endif; ?>

<?php \do_action( 'woocommerce_after_account_payment_methods', $has_methods ); ?>

<a class="button" href="<?php echo \esc_url( \wc_get_endpoint_url( 'add-payment-method' ) ); ?>" data-action="add-payment-method"><?php \esc_html_e( 'Add payment method', 'newspack-plugin' ); ?></a>
