<?php
/**
 * Newspack News Revenue Hub feature management.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Handles Salesforce functionality.
 */
class NRH {
	/**
	 * Add hooks.
	 */
	public static function init() {
		add_filter( 'newspack_donation_checkout_url', [ __CLASS__, 'redirect_to_nrh_checkout' ], 10, 3 );
		add_filter( 'allowed_redirect_hosts', [ __CLASS__, 'allow_redirect_to_nrh' ] );
		add_filter( 'newspack_blocks_donate_block_html', [ __CLASS__, 'handle_custom_campaign_id' ] );
		add_filter( 'googlesitekit_gtag_opt', [ __CLASS__, 'googlesitekit_gtag_opt' ], 11 );
		add_filter( 'googlesitekit_amp_gtag_opt', [ __CLASS__, 'googlesitekit_amp_gtag_opt' ], 11 );
		add_filter( 'newspack_blocks_donate_block_html', [ __CLASS__, 'render_nrh_donate_block' ], 10, 2 );
	}

	/**
	 * Redirect to the NRH checkout page when the donation form is submitted if possible.
	 *
	 * @param string $checkout_url URL of checkout page.
	 * @param float  $donation_value Amount of donation.
	 * @param string $donation_frequency 'month', 'year', or 'once'.
	 * @return string Modified $checkout_url.
	 */
	public static function redirect_to_nrh_checkout( $checkout_url, $donation_value, $donation_frequency ) {
		// Mapping of Newspack -> NRH donation frequencies.
		$donation_frequencies = [
			'month' => 'monthly',
			'year'  => 'yearly',
			'once'  => 'once',
		];

		$nrh_config = get_option( NEWSPACK_NRH_CONFIG );

		$organization_id = wp_strip_all_tags( $nrh_config['nrh_organization_id'] );
		$salesforce_id   = wp_strip_all_tags( $nrh_config['nrh_salesforce_campaign_id'] );
		$custom_campaign = filter_input( INPUT_GET, 'campaign', FILTER_SANITIZE_STRING );
		if ( $custom_campaign ) {
			$salesforce_id = wp_strip_all_tags( $custom_campaign );
		}
		$donation_value     = floatval( $donation_value );
		$donation_frequency = isset( $donation_frequencies[ $donation_frequency ] ) ? $donation_frequencies[ $donation_frequency ] : false;

		if ( empty( $organization_id ) || empty( $donation_value ) || empty( $donation_frequency ) ) {
			return $checkout_url;
		}

		// Remove donations from the cart since the customer won't be checking out on site.
		Donations::remove_donations_from_cart();

		// One-time donations go to 'donateform' and recurring donations go to 'memberform'.
		if ( 'once' == $donation_frequency ) {
			$url = sprintf(
				'https://checkout.fundjournalism.org/donateform?amount=%.1f&org_id=%s',
				$donation_value,
				$organization_id
			);
		} else {
			$url = sprintf(
				'https://checkout.fundjournalism.org/memberform?amount=%.1f&installmentPeriod=%s&org_id=%s',
				$donation_value,
				$donation_frequency,
				$organization_id
			);
		}

		if ( ! empty( $salesforce_id ) ) {
			$url .= '&campaign=' . esc_attr( $salesforce_id );
		}

		return $url;
	}

	/**
	 * Add the NRH checkout URL as an allowed redirect target.
	 *
	 * @param array $hosts Array of allowed hosts.
	 * @return array Modified $hosts.
	 */
	public static function allow_redirect_to_nrh( $hosts ) {
		$hosts[] = 'checkout.fundjournalism.org';
		return $hosts;
	}

	/**
	 * Add a hidden campaign input when a custom campaign is present in the GET request.
	 *
	 * @param string $html The donate form html.
	 * @return string modified $html.
	 */
	public static function handle_custom_campaign_id( $html ) {
		// Don't add a global campaign ID if there is already a campaign ID.
		if ( stripos( $html, "name='campaign'" ) || stripos( $html, 'name="campaign"' ) ) {
			return $html;
		}

		$custom_campaign = filter_input( INPUT_GET, 'campaign', FILTER_SANITIZE_STRING );
		if ( ! $custom_campaign ) {
			return $html;
		}

		$custom_campaign = '<input type="hidden" name="campaign" value="' . esc_attr( $custom_campaign ) . '"/>';
		$html            = str_replace( '</form>', $custom_campaign . '</form>', $html );
		return $html;
	}

	/**
	 * Add cross-domain tracking for News Revenue Hub checkout, on AMP pages.
	 *
	 * @param array $gtag_opt gtag config options.
	 */
	public static function googlesitekit_gtag_opt( $gtag_opt ) {
		if ( ! isset( $gtag_opt['linker'] ) ) {
			$gtag_opt['linker'] = [];
		}
		if ( ! isset( $gtag_opt['linker']['domains'] ) ) {
			$gtag_opt['linker']['domains'] = [];
		}
		$gtag_opt['linker']['domains'][]      = self::get_clean_site_url();
		$gtag_opt['linker']['domains'][]      = 'checkout.fundjournalism.org';
		$gtag_opt['linker']['decorate_forms'] = true;
		return $gtag_opt;
	}

	/**
	 * Add cross-domain tracking for News Revenue Hub checkout, on AMP pages.
	 *
	 * @param array $gtag_amp_opt gtag config options for AMP.
	 */
	public static function googlesitekit_amp_gtag_opt( $gtag_amp_opt ) {

		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return $gtag_amp_opt; // If Site Kit isn't installed, bail early.
		}

		$context          = new \Google\Site_Kit\Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$analytics        = new \Google\Site_Kit\Modules\Analytics( $context );
		$ga_property_code = $analytics->get_data( 'property-id' );

		if ( ! isset( $gtag_amp_opt['vars']['config'][ $ga_property_code ]['linker'] ) ) {
			$gtag_amp_opt['vars']['config'][ $ga_property_code ]['linker'] = [];
		}
		if ( ! isset( $gtag_amp_opt['vars']['config'][ $ga_property_code ]['linker']['domains'] ) ) {
			$gtag_amp_opt['vars']['config'][ $ga_property_code ]['linker']['domains'] = [];
		}

		$gtag_amp_opt['vars']['config'][ $ga_property_code ]['linker']['domains'][]      = self::get_clean_site_url();
		$gtag_amp_opt['vars']['config'][ $ga_property_code ]['linker']['domains'][]      = 'checkout.fundjournalism.org';
		$gtag_amp_opt['vars']['config'][ $ga_property_code ]['linker']['decorate_forms'] = true;
		return $gtag_amp_opt;
	}

	/**
	 * Get the site URL with protocol removed.
	 */
	public static function get_clean_site_url() {
		$protocols = [ 'http://', 'https://' ];
		return str_replace( $protocols, '', get_bloginfo( 'wpurl' ) );
	}

	/**
	 * Rewrite Donate block for News Revenue Hub submission.
	 *
	 * @param string $html The donate form html.
	 * @param array  $attributes Block attributes.
	 *
	 * @return string modified $html.
	 */
	public static function render_nrh_donate_block( $html, $attributes ) {
			$settings = array_merge( Donations::get_donation_settings(), $attributes );

			$frequencies = [
				'once'  => __( 'One-time', 'newspack-blocks' ),
				'month' => __( 'Monthly', 'newspack-blocks' ),
				'year'  => __( 'Annually', 'newspack-blocks' ),
			];

			$selected_frequency = isset( $attributes['defaultFrequency'] ) ? $attributes['defaultFrequency'] : 'month';
			$suggested_amounts  = $settings['suggestedAmounts'];

			$campaign = isset( $attributes['campaign'] ) ? $attributes['campaign'] : false;

			$uid = wp_rand( 10000, 99999 ); // Unique identifier to prevent labels colliding with other instances of Donate block.

			$button_text = $attributes['buttonText'];

			$nrh_config = get_option( NEWSPACK_NRH_CONFIG );

			$organization_id = wp_strip_all_tags( $nrh_config['nrh_organization_id'] );

			$form_open = sprintf(
				'<form method="GET" action="https://checkout.fundjournalism.org/donateform"><input type="hidden" name="org_id" value="%s" />',
				esc_attr( $organization_id )
			);

			$allowed_tags = [
				'form'  => [
					'method' => [],
					'action' => [],
				],
				'input' => [
					'type'  => [],
					'name'  => [],
					'value' => [],
				],
			];

			ob_start();

			/**
			 * For AMP-compatibility, the donation forms are implemented as pure HTML forms (no JS).
			 * Each frequency and tier option is a radio input, styled to look like a button.
			 * As the radio inputs are checked/unchecked, fields are hidden/displayed using only CSS.
			 */
			if ( ! $settings['tiered'] ) :

				?>
				<div class='wp-block-newspack-blocks-donate wpbnbd untiered'>
					<?php echo wp_kses( $form_open, $allowed_tags ); ?>
						<div class='wp-block-newspack-blocks-donate__options'>
							<?php foreach ( $frequencies as $frequency_slug => $frequency_name ) : ?>
								<?php
									$amount           = 'year' === $frequency_slug || 'once' === $frequency_slug ? 12 * $settings['suggestedAmountUntiered'] : $settings['suggestedAmountUntiered'];
									$formatted_amount = number_format( $amount, floatval( $amount ) - intval( $amount ) ? 2 : 0 );
								?>

								<div class='wp-block-newspack-blocks-donate__frequency frequency'>
									<input
										type='radio'
										value='<?php echo esc_attr( $frequency_slug ); ?>'
										id='newspack-donate-<?php echo esc_attr( $frequency_slug . '-' . $uid ); ?>'
										name='donation_frequency'
										<?php checked( $selected_frequency, $frequency_slug ); ?>
									/>
									<label
										for='newspack-donate-<?php echo esc_attr( $frequency_slug . '-' . $uid ); ?>'
										class='donation-frequency-label freq-label'
									>
										<?php echo esc_html( $frequency_name ); ?>
									</label>
									<div class='input-container'>
										<label
											class='donate-label'
											for='newspack-<?php echo esc_attr( $frequency_slug . '-' . $uid ); ?>-untiered-input'
										>
											<?php echo esc_html__( 'Donation amount', 'newspack-blocks' ); ?>
										</label>
										<div class='wp-block-newspack-blocks-donate__money-input money-input'>
											<span class='currency'>
												<?php echo esc_html( $settings['currencySymbol'] ); ?>
											</span>
											<input
												type='number'
												name='donation_value_<?php echo esc_attr( $frequency_slug ); ?>_untiered'
												value='<?php echo esc_attr( $formatted_amount ); ?>'
												id='newspack-<?php echo esc_attr( $frequency_slug . '-' . $uid ); ?>-untiered-input'
											/>
										</div>
									</div>
								</div>
							<?php endforeach; ?>
						</div>
						<p class='wp-block-newspack-blocks-donate__thanks thanks'>
							<?php echo esc_html__( 'Your contribution is appreciated.', 'newspack-blocks' ); ?>
						</p>
						<button type='submit'>
							<?php echo wp_kses_post( $button_text ); ?>
						</button>
						<?php if ( $campaign ) : ?>
							<input type='hidden' name='campaign' value='<?php echo esc_attr( $campaign ); ?>' />
						<?php endif; ?>
					</form>
				</div>
				<?php

		else :

			?>
			<div class='wp-block-newspack-blocks-donate wpbnbd tiered'>
				<?php echo wp_kses( $form_open, $allowed_tags ); ?>
					<div class='wp-block-newspack-blocks-donate__options'>
						<div class='wp-block-newspack-blocks-donate__frequencies frequencies'>
							<?php foreach ( $frequencies as $frequency_slug => $frequency_name ) : ?>

								<div class='wp-block-newspack-blocks-donate__frequency frequency'>
									<input
										type='radio'
										value='<?php echo esc_attr( $frequency_slug ); ?>'
										id='newspack-donate-<?php echo esc_attr( $frequency_slug . '-' . $uid ); ?>'
										name='donation_frequency'
										<?php checked( $selected_frequency, $frequency_slug ); ?>
									/>
									<label
										for='newspack-donate-<?php echo esc_attr( $frequency_slug . '-' . $uid ); ?>'
										class='donation-frequency-label freq-label'
									>
										<?php echo esc_html( $frequency_name ); ?>
									</label>

									<div class='wp-block-newspack-blocks-donate__tiers tiers'>
										<?php foreach ( $suggested_amounts as $index => $suggested_amount ) : ?>
											<div class='wp-block-newspack-blocks-donate__tier'>
												<?php
													$amount           = 'year' === $frequency_slug || 'once' === $frequency_slug ? 12 * $suggested_amount : $suggested_amount;
													$formatted_amount = $settings['currencySymbol'] . number_format( $amount, floatval( $amount ) - intval( $amount ) ? 2 : 0 );
												?>
												<input
													type='radio'
													name='donation_value_<?php echo esc_attr( $frequency_slug ); ?>'
													value='<?php echo esc_attr( $amount ); ?>'
													id='newspack-tier-<?php echo esc_attr( $frequency_slug . '-' . $uid ); ?>-<?php echo (int) $index; ?>'
													<?php checked( 1, $index ); ?>
												/>
												<label
													class='tier-select-label tier-label'
													for='newspack-tier-<?php echo esc_attr( $frequency_slug . '-' . $uid ); ?>-<?php echo (int) $index; ?>'
												>
													<?php echo esc_html( $formatted_amount ); ?>
												</label>
											</div>
										<?php endforeach; ?>

										<div class='wp-block-newspack-blocks-donate__tier'>
											<?php $amount = 'year' === $frequency_slug || 'once' === $frequency_slug ? 12 * $suggested_amounts[1] : $suggested_amounts[1]; ?>
											<input
												type='radio'
												class='other-input'
												name='donation_value_<?php echo esc_attr( $frequency_slug ); ?>'
												value='other'
												id='newspack-tier-<?php echo esc_attr( $frequency_slug . '-' . $uid ); ?>-other'
											/>
											<label
												class='tier-select-label tier-label'
												for='newspack-tier-<?php echo esc_attr( $frequency_slug . '-' . $uid ); ?>-other'
											>
												<?php echo esc_html__( 'Other', 'newspack-blocks' ); ?>
											</label>
											<label
												class='other-donate-label odl'
												for='newspack-tier-<?php echo esc_attr( $frequency_slug . '-' . $uid ); ?>-other-input'
											>
												<?php echo esc_html__( 'Donation amount', 'newspack-blocks' ); ?>
											</label>
											<div class='wp-block-newspack-blocks-donate__money-input money-input'>
												<span class='currency'>
													<?php echo esc_html( $settings['currencySymbol'] ); ?>
												</span>
												<input
													type='number'
													name='donation_value_<?php echo esc_attr( $frequency_slug ); ?>_other'
													value='<?php echo esc_attr( $amount ); ?>'
													id='newspack-tier-<?php echo esc_attr( $frequency_slug . '-' . $uid ); ?>-other-input'
												/>
											</div>
										</div>

									</div>
								</div>
							<?php endforeach; ?>
						</div>
					</div>
					<p class='wp-block-newspack-blocks-donate__thanks thanks'>
						<?php echo esc_html__( 'Your contribution is appreciated.', 'newspack-blocks' ); ?>
					</p>
					<button type='submit'>
						<?php echo wp_kses_post( $button_text ); ?>
					</button>
					<?php if ( $campaign ) : ?>
						<input type='hidden' name='campaign' value='<?php echo esc_attr( $campaign ); ?>' />
					<?php endif; ?>
				</form>
			</div>
			<?php
		endif;

		return ob_get_clean();
	}
}
NRH::init();
