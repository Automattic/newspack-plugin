<?php
/**
 * Template part for the Collection intro section.
 *
 * @package Newspack\Collections
 */

use Newspack\Collections\Query_Helper;
use Newspack\Collections\Template_Helper;

$collection       = ( $args['collection'] ?? null ); // Allow overriding the collection post object by passing it as an argument.
$collection       = $collection instanceof WP_Post ? $collection : get_post( $collection ); // The collection argument could be either post object or post ID.
$is_latest        = ( $args['is_latest'] ?? false );
$collection_title = get_the_title( $collection );
$permalink        = match ( true ) { // Allow overriding the permalink by passing it as a string or a boolean argument.
	is_string( $args['permalink'] ?? null )  => $args['permalink'],               // If the argument is a string, use it as the permalink.
	( $args['permalink'] ?? false ) === true => get_the_permalink( $collection ), // If a `true` boolean, use the collection permalink.
	default                                  => false,                            // If not provided (or if a falsey value), don't use a permalink.
};

/**
 * Fires before the collection intro section.
 *
 * @param WP_Post $collection The collection post.
 */
do_action( 'newspack_collections_intro_before', $collection );

echo wp_kses_post( Template_Helper::render_collections_intro( $collection ) );

/**
 * Fires after the collection intro section.
 *
 * @param WP_Post $collection The collection post.
 */
do_action( 'newspack_collections_intro_after', $collection );
