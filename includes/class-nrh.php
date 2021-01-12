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
}
NRH::init();
