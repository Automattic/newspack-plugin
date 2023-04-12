<?php
/**
 * Memberships Donation Wall Pattern.
 *
 * @package Newspack
 */

$donate_settings = [
	'className'           => 'is-style-default',
	'manual'              => true,
	'amounts'             => [
		'once'  => [ 9, 20, 90, 20 ],
		'month' => [ 7, 15, 30, 15 ],
		'year'  => [ 84, 180, 360, 180 ],
	],
	'disabledFrequencies' => [
		'once'  => true,
		'month' => false,
		'year'  => false,
	],
	'minimumDonation'     => 5,
	'layoutOption'        => 'tiers',
];
?>
<!-- wp:group -->
<div class="wp-block-group">
	<!-- wp:heading -->
	<h2 class="wp-block-heading"><?php _e( 'Become a member to continue reading', 'newspack' ); ?></h2>
	<!-- /wp:heading -->
	<!-- wp:newspack-blocks/donate <?php echo wp_json_encode( $donate_settings ); ?> /-->
</div>
<!-- /wp:group -->
