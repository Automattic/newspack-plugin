<?php
/**
 * Enhancements and improvements to third-party plugins for AMP compatibility.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Tweaks third-party plugins for better AMP compatibility.
 * When possible it's preferred to contribute AMP fixes downstream to the actual plugin.
 */
class AMP_Enhancements {

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {

		// Add AMP-compatibility to MC4WP: Mailchimp for WordPress plugin.
		add_filter( 'mc4wp_form_content', [ __CLASS__, 'mc4wp_add_amp_templates' ], 10, 2 );
		add_filter( 'mc4wp_form_element_attributes', [ __CLASS__, 'mc4wp_add_amp_request' ] );
		add_action( 'rest_api_init', [ __CLASS__, 'mc4wp_add_form_endpoint' ] );
	}

	/**
	 * Add AMP templates for submit/success/error to MC4WP forms.
	 *
	 * @param string     $content The form content.
	 * @param MC4WP_Form $form The form object.
	 * @return string    Modified $content.
	 */
	public static function mc4wp_add_amp_templates( $content, $form ) {
		if ( ! function_exists( 'is_amp_endpoint' ) || ! is_amp_endpoint() ) {
			return $content;
		}

		ob_start();
		?>
		<div submitting>
			<template type="amp-mustache">
				<?php echo esc_html__( 'Submitting...', 'newspack' ); ?>
			</template>
		</div>
		<div submit-success>
			<template type="amp-mustache">
				<?php echo esc_html( $form->get_message( 'subscribed' ) ); ?>
			</template>
		</div>
		<div submit-error>
			<template type="amp-mustache">
				{{message}}
			</template>
		</div>
		<?php
		$content .= ob_get_clean();

		return $content;
	}

	/**
	 * Add 'action-xhr' to MC4WP forms.
	 *
	 * @param array $attributes Key-Value pairs of attributes output on form.
	 * @return array Modified $attributes.
	 */
	public static function mc4wp_add_amp_request( $attributes ) {
		if ( function_exists( 'is_amp_endpoint' ) && is_amp_endpoint() ) {
			$attributes['action-xhr'] = get_rest_url( null, 'mc4wp/v1/form' );
		}

		return $attributes;
	}

	/**
	 * Register and process an endpoint for handling the mc4wp form.
	 * A listener checks every request for the form submit, so we just need to fetch the listener and get its status.
	 */
	public static function mc4wp_add_form_endpoint() {
		register_rest_route( 
			'mc4wp/v1', 
			'/form', 
			[
				'methods'  => 'POST',
				'callback' => function( $request ) {
					if ( ! function_exists( 'mc4wp_get_submitted_form' ) ) {
						return new \WP_Error(
							'forbidden',
							esc_html__( 'You cannot use this resource.' ),
							[
								'status' => 403,
							]
						);
					};

					$form = mc4wp_get_submitted_form();
					if ( ! $form ) {
						return new \WP_Error(
							'not_found',
							esc_html__( 'Resource does not exist.' ),
							[
								'status' => 404,
							]
						);
					}

					if ( $form->has_errors() ) {
						$message_key = $form->errors[0];
						$message     = $form->get_message( $message_key );
						return new \WP_Error( $message_key, $message );
					}

					return new \WP_REST_Response( true, 200 );
				},
			] 
		);
	}
}
AMP_Enhancements::init();
