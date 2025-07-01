<?php
/**
 * Foundation events remote data blocks
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

class Foundation_Events {

	public static function init() {
		add_action( 'init', [ self::class, 'register_data_blocks' ] );

		add_filter( 'query_vars', [ self::class, 'add_query_vars' ] );
		add_filter( 'remote_data_blocks_query_input_variables', [ self::class, 'add_query_vars_to_input_variables' ], 10, 2 );
	}

	public static function register_data_blocks() {
		if ( ! function_exists( 'register_remote_data_block' ) ) {
			return;
		}

		register_remote_data_block(
			[
				'title'             => 'Single Foundation Event',
				'render_query'      => [
					'query' => self::get_single_event_query(),
				],
				'patterns'          => [
					[
						'title' => 'Single event 1',
						'html'  => file_get_contents( __DIR__ . '/pattern-1.html' ),
					],
				],
				'selection_queries' => [
					[
						'display_name' => 'Select an event',
						'query'        => self::get_list_query(),
						'type'         => 'list',
					],

				],
				'overrides'         => [
					[
						'name'         => 'event_id_override',
						'display_name' => __( 'Use event ID from URL', 'newspack' ),
						'help_text'    => __( 'For use on the /event/ page', 'newspack' ),
					],
				],
			]
		);

		register_remote_data_block(
			[
				'title'        => 'Foundation Events List',
				'render_query' => [
					'query' => self::get_list_query(),
				],
				'patterns'     => [
					[
						'title' => 'Foundation Events List',
						'html'  => file_get_contents( __DIR__ . '/pattern-2.html' ),
					],
				],
			]
		);

		add_rewrite_rule( '^event/([0-9]+)/?', 'index.php?pagename=foundation-event&event_id=$matches[1]', 'top' );
	}

	public static function add_query_vars( $query_vars ) {
		$query_vars[] = 'event_id';
		return $query_vars;
	}

	public static function add_query_vars_to_input_variables( array $input_variables, array $enabled_overrides ): array {
		if ( true === in_array( 'event_id_override', $enabled_overrides, true ) ) {
			$event_id = get_query_var( 'event_id' );

			if ( ! empty( $event_id ) ) {
				$input_variables['event_id'] = $event_id;
			}
		}

		return $input_variables;
	}

	public static function get_data_source() {
		return [
			'display_name'    => 'Foundation Events',
			'endpoint'        => NEWSPACK_FOUNDATION_TEST_EVENTS_API_BASE_URL,
			'request_headers' => [
				'Content-Type' => 'application/json',
			],
		];
	}

	public static function get_event_schema() {
		return [
			'event_id'       => [
				'name' => 'Event ID',
				'type' => 'string',
			],
			'title'          => [
				'name' => 'Title',
				'type' => 'string',
			],
			'description'    => [
				'name' => 'Description',
				'type' => 'string',
			],
			'time'           => [
				'name' => 'Time',
				'type' => 'string',
			],
			'location'       => [
				'name' => 'Location',
				'type' => 'string',
			],
			'url'            => [
				'name' => 'URL',
				'type' => 'url',
			],
			'internal_url'   => [
				'name' => 'Internal URL',
				'type' => 'button_url',
			],
			'imageUrl'       => [
				'name' => 'Image',
				'type' => 'image_url',
			],
			'community_link' => [
				'name' => 'Community Link',
				'type' => 'html',
			],

		];
	}

	public static function get_list_query() {
		return [
			'data_source'         => self::get_data_source(),
			'display_name'        => 'See the list of events',
			'endpoint'            => function ( array $input_variables ): string {
				return self::get_data_source()['endpoint'];
			},
			'output_schema'       => [
				'is_collection' => true,
				'type'          => self::get_event_schema(),
			],
			// 'cache_ttl'           => -1,
			'preprocess_response' => function( mixed $response_data, array $request_details ): array {
				if ( is_array( $response_data ) && ! empty( $response_data ) ) {
					return array_map( [ self::class, 'transform_event_from_request' ], $response_data );
				}

				return [];
			},
		];
	}

	public static function get_single_event_query() {
		return [
			'data_source'         => self::get_data_source(),
			'display_name'        => 'Get a single event',
			'endpoint'            => function ( array $input_variables ): string {
				return self::get_data_source()['endpoint'] . '?oid=' . $input_variables['event_id'];
			},
			'input_schema'        => [
				'event_id' => [
					'name' => 'Event ID',
					'type' => 'string',
				],
			],
			'output_schema'       => [
				'is_collection' => false,
				'type'          => self::get_event_schema(),
			],
			// 'cache_ttl'           => -1,
			'preprocess_response' => function( mixed $response_data, array $request_details ): array {
				if ( is_array( $response_data ) && ! empty( $response_data ) ) {
					return self::transform_event_from_request( $response_data[0] );
				}

				return [];
			},
		];
	}

	public static function transform_event_from_request( $event ) {
		return [
			'event_id'       => $event['oid'],
			'title'          => $event['title'],
			'description'    => $event['description'],
			'time'           => $event['time'],
			'location'       => $event['location']['name'] . ', ' . $event['location']['address'] . ', ' . $event['location']['city'],
			'url'            => $event['url'],
			'imageUrl'       => $event['imageUrl'],
			'internal_url'   => home_url( 'event/' . $event['oid'] ),
			'community_link' => 'See event on the <a href="' . $event['url'] . '" target="_blank">Community Site</a>',
		];
	}
}

Foundation_Events::init();
