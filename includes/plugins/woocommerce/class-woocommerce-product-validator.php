<?php
/**
 * WooCommerce Product Validator.
 *
 * @package Newspack
 */

namespace Newspack;

use WP_Error;
use WC_Product;

defined( 'ABSPATH' ) || exit;

/**
 * Validates WooCommerce products for purchasability and restrictions.
 */
class WooCommerce_Product_Validator {
	/**
	 * Validate if a product can be purchased by checking various conditions.
	 * This checks standard WooCommerce conditions and also WooCommerce Memberships restrictions.
	 *
	 * @param int|WC_Product $product Product ID or product object.
	 * @param int|null       $user_id User ID to check against (null for current user).
	 *
	 * @return array|WP_Error Array with validation results or WP_Error on failure.
	 */
	public static function validate_product_purchasability( $product, $user_id = null ) {
		// Get the product object.
		if ( ! is_a( $product, 'WC_Product' ) ) {
			$product = wc_get_product( $product );
		}

		if ( ! $product ) {
			return new WP_Error( 'invalid_product', __( 'Invalid product.', 'newspack-plugin' ) );
		}

		if ( null === $user_id ) {
			$user_id = get_current_user_id();
		}

		$product_id   = $product->get_id();
		$product_name = $product->get_name();
		$issues       = [];
		$warnings     = [];

		// Basic WooCommerce checks.
		$wc_checks = self::validate_woocommerce_conditions( $product );
		$issues    = array_merge( $issues, $wc_checks['issues'] );
		$warnings  = array_merge( $warnings, $wc_checks['warnings'] );

		// WooCommerce Memberships checks.
		if ( function_exists( 'wc_memberships' ) ) {
			$membership_checks = self::validate_membership_restrictions( $product, $user_id );
			$issues            = array_merge( $issues, $membership_checks['issues'] );
			$warnings          = array_merge( $warnings, $membership_checks['warnings'] );
		}

		// Check if product can be added to cart.
		$cart_validation = self::validate_cart_addition( $product );
		if ( ! $cart_validation['can_add'] ) {
			$issues[] = $cart_validation['reason'];
		}

		return [
			'product_id'    => $product_id,
			'product_name'  => $product_name,
			'is_valid'      => empty( $issues ),
			'is_purchasable' => $product->is_purchasable() && empty( $issues ),
			'issues'        => $issues,
			'warnings'      => $warnings,
			'checks'        => [
				'is_published'     => 'publish' === $product->get_status(),
				'is_in_stock'      => $product->is_in_stock(),
				'is_purchasable'   => $product->is_purchasable(),
				'has_price'        => '' !== $product->get_price(),
				'membership_check' => $membership_checks ?? null,
			],
		];
	}

	/**
	 * Validate basic WooCommerce conditions.
	 *
	 * @param WC_Product $product Product object.
	 *
	 * @return array Issues and warnings.
	 */
	private static function validate_woocommerce_conditions( $product ) {
		$issues   = [];
		$warnings = [];

		// Check if product is published.
		if ( 'publish' !== $product->get_status() ) {
			$issues[] = sprintf(
				/* translators: %s: product status */
				__( 'Product is not published (status: %s).', 'newspack-plugin' ),
				$product->get_status()
			);
		}

		// Check if product has a price.
		$price = $product->get_price();
		if ( '' === $price || null === $price ) {
			$issues[] = __( 'Product has no price set.', 'newspack-plugin' );
		}

		// Check stock status.
		if ( ! $product->is_in_stock() ) {
			$issues[] = __( 'Product is out of stock.', 'newspack-plugin' );
		}

		// Check if managing stock and has sufficient stock.
		if ( $product->managing_stock() && ! $product->backorders_allowed() ) {
			$stock_quantity = $product->get_stock_quantity();
			if ( $stock_quantity <= 0 ) {
				$issues[] = sprintf(
					/* translators: %d: stock quantity */
					__( 'Product has no stock available (%d in stock).', 'newspack-plugin' ),
					$stock_quantity
				);
			} elseif ( $stock_quantity < 5 ) {
				$warnings[] = sprintf(
					/* translators: %d: stock quantity */
					__( 'Low stock warning: only %d items remaining.', 'newspack-plugin' ),
					$stock_quantity
				);
			}
		}

		// Check if product is purchasable.
		if ( ! $product->is_purchasable() ) {
			$issues[] = __( 'Product is not purchasable (WooCommerce setting).', 'newspack-plugin' );
		}

		// Check catalog visibility.
		if ( 'hidden' === $product->get_catalog_visibility() ) {
			$warnings[] = __( 'Product is hidden from catalog.', 'newspack-plugin' );
		}

		return [
			'issues'   => $issues,
			'warnings' => $warnings,
		];
	}

	/**
	 * Validate WooCommerce Memberships restrictions.
	 *
	 * @param WC_Product $product Product object.
	 * @param int        $user_id User ID to check against.
	 *
	 * @return array Issues and warnings.
	 */
	private static function validate_membership_restrictions( $product, $user_id ) {
		$issues      = [];
		$warnings    = [];
		$product_id  = $product->get_id();
		$parent_id   = $product->is_type( 'variation' ) ? $product->get_parent_id() : $product_id;

		// Check viewing restrictions.
		if ( function_exists( 'wc_memberships_is_product_viewing_restricted' ) ) {
			$is_viewing_restricted = wc_memberships_is_product_viewing_restricted( $product_id );
			if ( ! $is_viewing_restricted && $parent_id !== $product_id ) {
				$is_viewing_restricted = wc_memberships_is_product_viewing_restricted( $parent_id );
			}

			if ( $is_viewing_restricted ) {
				$can_view = false;
				if ( $user_id ) {
					$can_view = current_user_can( 'wc_memberships_view_restricted_product', $product_id ) ||
								current_user_can( 'wc_memberships_view_delayed_product', $product_id );
				}

				if ( ! $can_view ) {
					$issues[] = __( 'Product viewing is restricted by membership rules.', 'newspack-plugin' );
				}
			}
		}

		// Check purchasing restrictions.
		if ( function_exists( 'wc_memberships_is_product_purchasing_restricted' ) ) {
			$is_purchasing_restricted = wc_memberships_is_product_purchasing_restricted( $product_id );
			if ( ! $is_purchasing_restricted && $parent_id !== $product_id ) {
				$is_purchasing_restricted = wc_memberships_is_product_purchasing_restricted( $parent_id );
			}

			if ( $is_purchasing_restricted ) {
				$can_purchase = false;
				if ( $user_id ) {
					$can_purchase = current_user_can( 'wc_memberships_purchase_restricted_product', $product_id ) ||
									current_user_can( 'wc_memberships_purchase_delayed_product', $product_id );
				}

				if ( ! $can_purchase ) {
					$issues[] = __( 'Product purchasing is restricted by membership rules.', 'newspack-plugin' );

					// Get the membership plans that restrict this product.
					if ( function_exists( 'wc_memberships' ) && method_exists( wc_memberships(), 'get_rules_instance' ) ) {
						$rules      = wc_memberships()->get_rules_instance()->get_product_restriction_rules( $parent_id );
						$plan_names = [];

						foreach ( $rules as $rule ) {
							if ( 'purchase' === $rule->get_access_type() ) {
								$plan = wc_memberships_get_membership_plan( $rule->get_membership_plan_id() );
								if ( $plan ) {
									$plan_names[] = $plan->get_name();
								}
							}
						}

						if ( ! empty( $plan_names ) ) {
							$warnings[] = sprintf(
								/* translators: %s: list of membership plan names */
								__( 'Restricted by membership plans: %s', 'newspack-plugin' ),
								implode( ', ', array_unique( $plan_names ) )
							);
						}
					}
				}
			}
		}

		// Check if product is forced public.
		if ( function_exists( 'wc_memberships' ) && method_exists( wc_memberships(), 'get_restrictions_instance' ) ) {
			$is_public = wc_memberships()->get_restrictions_instance()->is_product_public( $parent_id );
			if ( $is_public ) {
				$warnings[] = __( 'Product is forced public (overrides membership restrictions).', 'newspack-plugin' );
			}
		}

		return [
			'issues'   => $issues,
			'warnings' => $warnings,
		];
	}

	/**
	 * Validate if product can be added to cart.
	 *
	 * @param WC_Product $product Product object.
	 *
	 * @return array Validation result.
	 */
	private static function validate_cart_addition( $product ) {
		// Simulate adding to cart to check for any restrictions.
		$can_add = true;
		$reason  = '';

		// Check if product passes validation (this triggers various hooks).
		$passed_validation = apply_filters( 'woocommerce_add_to_cart_validation', true, $product->get_id(), 1 );

		if ( ! $passed_validation ) {
			$can_add = false;
			$reason  = __( 'Product fails add to cart validation (may be restricted).', 'newspack-plugin' );
		}

		return [
			'can_add' => $can_add,
			'reason'  => $reason,
		];
	}
}
