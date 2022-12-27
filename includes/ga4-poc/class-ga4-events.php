<?php

namespace Newspack;

class GA4_Events {

	public static function init() {

		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_scripts' ) );
		Data_Events::register_action( 'click_body' );

	}

	public static function enqueue_scripts() {
		wp_enqueue_script(
			'newspack_ga4_poc',
			Newspack::plugin_url() . '/includes/ga4-poc/poc.js',
			[ 'jquery' ],
			NEWSPACK_PLUGIN_VERSION,
			true
		);
		wp_localize_script(
			'newspack_ga4_poc',
			'newspack_ga4_poc',
			[
				'ajax_url'  => admin_url( 'admin-ajax.php' ),
				'poc_nonce' => wp_create_nonce( 'newspack_ga4_poc_nonce' ),
			]
		);
	}
}

GA4_Events::init();
