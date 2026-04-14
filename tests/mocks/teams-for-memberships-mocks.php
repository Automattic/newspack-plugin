<?php // phpcs:disable WordPress.Files.FileName.InvalidClassFileName, Squiz.Commenting.FunctionComment.Missing, Squiz.Commenting.ClassComment.Missing, Squiz.Commenting.VariableComment.Missing, Squiz.Commenting.FileComment.Missing, Generic.Files.OneObjectStructurePerFile.MultipleFound, Universal.Files.SeparateFunctionsFromOO.Mixed, WordPress.NamingConventions.PrefixAllGlobals, WordPress.NamingConventions.ValidVariableName, Squiz.Commenting.InlineComment.InvalidEndChar, PSR1.Classes.ClassDeclaration.MultipleClasses

/**
 * Stubs for exercising the happy path of
 * Newspack\Teams_For_Memberships::restore_team_meta_on_renewal in a unit test
 * environment where neither WC Subscriptions nor SkyVerge Teams is loaded.
 *
 * Behaviour is driven by these globals:
 *   $GLOBALS['teams_mock_is_renewal']      bool, returned by wcs_order_contains_renewal
 *   $GLOBALS['teams_mock_subscriptions']   WC_Subscription[] returned by wcs_get_subscriptions_for_renewal_order
 *   $GLOBALS['teams_mock_teams_for_sub']   [ sub_id => Team[] ] returned by the fake Subscriptions integration
 *   $GLOBALS['teams_mock_item_meta']       [ item_id => [ key => value ] ] spy populated by wc_update_order_item_meta
 *
 * Reset them per-test.
 *
 * @package Newspack\Tests
 */

require_once __DIR__ . '/wc-mocks.php';
require_once __DIR__ . '/teams-for-memberships-skyverge-subscriptions-mock.php';

// --- WC / WC Subscriptions helpers -------------------------------------

if ( ! function_exists( 'wcs_order_contains_renewal' ) ) {
	function wcs_order_contains_renewal( $order ) {
		return ! empty( $GLOBALS['teams_mock_is_renewal'] );
	}
}

if ( ! function_exists( 'wcs_get_subscriptions_for_renewal_order' ) ) {
	function wcs_get_subscriptions_for_renewal_order( $order ) {
		return $GLOBALS['teams_mock_subscriptions'] ?? [];
	}
}

if ( ! function_exists( 'wc_update_order_item_meta' ) ) {
	function wc_update_order_item_meta( $item_id, $key, $value ) {
		$GLOBALS['teams_mock_item_meta'][ $item_id ][ $key ] = $value;
	}
}

if ( ! function_exists( 'wc_get_order_item_meta' ) ) {
	function wc_get_order_item_meta( $item_id, $key, $single = true ) {
		return $GLOBALS['teams_mock_item_meta'][ $item_id ][ $key ] ?? '';
	}
}

// --- Order-item subclass that exposes the methods the fix needs --------

/**
 * Mock order item for Teams_For_Memberships tests.
 *
 * Subclasses the wc-mocks.php WC_Order_Item_Product (which has a truncated
 * API) so tests pass the `instanceof WC_Order_Item_Product` guard while
 * still answering get_id() / get_order().
 */
class Teams_Mock_Order_Item extends WC_Order_Item_Product {
	public $id         = 0;
	public $product_id = 0;
	public $order;
	public function __construct( $id, $product_id, $order ) {
		parent::__construct( [ 'product_id' => $product_id ] );
		$this->id         = $id;
		$this->product_id = $product_id;
		$this->order      = $order;
	}
	public function get_id() {
		return $this->id;
	}
	public function get_product_id() {
		return $this->product_id;
	}
	public function get_order() {
		return $this->order;
	}
}

/**
 * Mock WC_Subscription that only answers get_id().
 */
class Teams_Mock_Subscription {
	public $id;
	public function __construct( $id ) {
		$this->id = $id;
	}
	public function get_id() {
		return $this->id;
	}
}

/**
 * Mock SkyVerge Team that only answers get_id() and get_product_id().
 */
class Teams_Mock_Team {
	public $id;
	public $product_id;
	public function __construct( $id, $product_id ) {
		$this->id         = $id;
		$this->product_id = $product_id;
	}
	public function get_id() {
		return $this->id;
	}
	public function get_product_id() {
		return $this->product_id;
	}
}
