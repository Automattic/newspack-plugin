<?php
/**
 * Google Ad Manager data model
 *
 * @package Newspack\API
 */

namespace Newspack\Model\GoogleAdManager;

defined( 'ABSPATH' ) || exit;

const POST_TYPE = 'newspack_ad_codes';

function register_post_type() {

	\register_post_type(
		POST_TYPE,
		[
			'public' => false,
			'publicly_queryable' => true,
		]
	);

}
\add_action( 'init', __NAMESPACE__ . '\\register_post_type'  );
