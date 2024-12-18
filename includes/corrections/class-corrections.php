<?php
/**
 * Newspack Corrections and Clarifications
 *
 * @package Newspack
 */

namespace Newspack;

/**
 * Class to handle Corrections and Clarifications.
 */
class Corrections {
	/**
	 * Post type for corrections.
	 */
	const POST_TYPE = 'newspack_correction';

	/**
	 * Meta key for storing corrections.
	 */
	const POST_ID_META = 'newspack_correction-post-id';

	/**
	 * Meta key for corrections active postmeta.
	 */
	const CORRECTIONS_ACTIVE_META = 'newspack_corrections_active';

	/**
	 * Initializes the class.
	 */
	public static function init() {
		if ( ! self::is_enabled() ) {
			return;
		}
		add_action( 'init', [ __CLASS__, 'register_post_type' ] );
		add_action( 'init', [ __CLASS__, 'add_corrections_shortcode' ] );
		add_action( 'add_meta_boxes', [ __CLASS__, 'add_corrections_metabox' ] );
		add_action( 'save_post', [ __CLASS__, 'save_corrections_metabox' ] );
		add_filter( 'the_content', [ __CLASS__, 'output_corrections_on_post' ] );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'wp_enqueue_scripts' ] );
		add_action( 'admin_enqueue_scripts', [ __CLASS__, 'wp_enqueue_scripts' ] );
	}

	/**
	 * Checks if the feature is enabled.
	 *
	 * True when:
	 * - NEWSPACK_CORRECTIONS_ENABLED is defined and true.
	 *
	 * @return bool True if the feature is enabled, false otherwise.
	 */
	public static function is_enabled() {
		return defined( 'NEWSPACK_CORRECTIONS_ENABLED' ) && NEWSPACK_CORRECTIONS_ENABLED;
	}


	/**
	 * Enqueue scripts and styles.
	 */
	public static function wp_enqueue_scripts() {
		if ( ! is_admin() || ! isset( $_GET['post'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}
		\wp_enqueue_script(
			'newspack-corrections',
			Newspack::plugin_url() . '/dist/other-scripts/corrections.js',
			[],
			NEWSPACK_PLUGIN_VERSION,
			true
		);
		\wp_enqueue_style(
			'newspack-corrections',
			Newspack::plugin_url() . '/dist/other-scripts/corrections.css',
			[],
			NEWSPACK_PLUGIN_VERSION
		);
	}

	/**
	 * Registers the corrections post type.
	 *
	 * @return void
	 */
	public static function register_post_type() {
		$supports = [
			'author',
			'editor',
			'title',
			'revisions',
			'custom-fields',
		];

		$labels = [
			'name'                     => _x( 'Corrections', 'post type general name', 'newspack-plugin' ),
			'singular_name'            => _x( 'Correction', 'post type singular name', 'newspack-plugin' ),
			'menu_name'                => _x( 'Corrections', 'admin menu', 'newspack-plugin' ),
			'name_admin_bar'           => _x( 'Correction', 'add new on admin bar', 'newspack-plugin' ),
			'add_new'                  => _x( 'Add New', 'correction', 'newspack-plugin' ),
			'add_new_item'             => __( 'Add New Correction', 'newspack-plugin' ),
			'new_item'                 => __( 'New Correction', 'newspack-plugin' ),
			'edit_item'                => __( 'Edit Correction', 'newspack-plugin' ),
			'view_item'                => __( 'View Correction', 'newspack-plugin' ),
			'view_items'               => __( 'View Correction', 'newspack-plugin' ),
			'all_items'                => __( 'All Corrections', 'newspack-plugin' ),
			'search_items'             => __( 'Search Corrections', 'newspack-plugin' ),
			'parent_item_colon'        => __( 'Parent Correction:', 'newspack-plugin' ),
			'not_found'                => __( 'No corrections found.', 'newspack-plugin' ),
			'not_found_in_trash'       => __( 'No corrections found in Trash.', 'newspack-plugin' ),
			'archives'                 => __( 'Correction Archives', 'newspack-plugin' ),
			'attributes'               => __( 'Correction Attributes', 'newspack-plugin' ),
			'insert_into_item'         => __( 'Insert into correction', 'newspack-plugin' ),
			'uploaded_to_this_item'    => __( 'Uploaded to this correction', 'newspack-plugin' ),
			'filter_items_list'        => __( 'Filter corrections list', 'newspack-plugin' ),
			'items_list_navigation'    => __( 'Corrections list navigation', 'newspack-plugin' ),
			'items_list'               => __( 'Corrections list', 'newspack-plugin' ),
			'item_published'           => __( 'Correction published.', 'newspack-plugin' ),
			'item_published_privately' => __( 'Correction published privately.', 'newspack-plugin' ),
			'item_reverted_to_draft'   => __( 'Correction reverted to draft.', 'newspack-plugin' ),
			'item_scheduled'           => __( 'Correction scheduled.', 'newspack-plugin' ),
			'item_updated'             => __( 'Correction updated.', 'newspack-plugin' ),
			'item_link'                => __( 'Correction Link', 'newspack-plugin' ),
			'item_link_description'    => __( 'A link to a correction.', 'newspack-plugin' ),
		];

		$args = array(
			'labels'           => $labels,
			'description'      => 'Post type used to store corrections and clarifications.',
			'has_archive'      => true,
			'public'           => true,
			'public_queryable' => true,
			'query_var'        => true,
			'rewrite'          => [ 'slug' => 'correction' ],
			'show_ui'          => true,
			'show_in_rest'     => true,
			'supports'         => $supports,
			'taxonomies'       => [],
			'menu_icon'        => 'dashicons-edit',
		);
		\register_post_type( self::POST_TYPE, $args );
	}

	/**
	 * Get corrections for post.
	 *
	 * @param int $post_id The post ID.
	 *
	 * @return array The corrections.
	 */
	public static function get_corrections( $post_id ) {
		return get_posts(
			[
				'posts_per_page' => -1,
				'post_type'      => self::POST_TYPE,
				'meta_key'       => self::POST_ID_META, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_value'     => $post_id, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				'orderby'        => 'date',
				'order'          => 'DESC',
			]
		);
	}

	/**
	 * Save corrections for post.
	 *
	 * @param int   $post_id     The post ID.
	 * @param array $corrections The corrections.
	 */
	public static function save_corrections( $post_id, $corrections ) {
		foreach ( $corrections as $correction ) {
			$post_id = wp_insert_post(
				[
					'post_title'   => 'Correction for ' . get_the_title( $post_id ),
					'post_content' => $correction,
					'post_type'    => self::POST_TYPE,
					'post_status'  => 'publish',
					'meta_input'   => [
						self::POST_ID_META => $post_id,
					],
				]
			);
		}
	}

	/**
	 * Adds the corrections shortcode.
	 */
	public static function add_corrections_shortcode() {
		add_shortcode( 'corrections', [ __CLASS__, 'handle_corrections_shortcode' ] );
	}

	/**
	 * Handles the corrections shortcode.
	 *
	 * @return string The shortcode output.
	 */
	public static function handle_corrections_shortcode() {
		global $wpdb;

		$post_ids = get_posts(
			[
				'posts_per_page' => -1,
				'meta_key'       => self::CORRECTIONS_ACTIVE_META, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_value'     => 1, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				'fields'         => 'ids',
				'orderby'        => 'date',
				'order'          => 'DESC',
			]
		);

		ob_start();
		foreach ( $post_ids as $post_id ) :
			$corrections = self::get_corrections( $post_id );
			if ( empty( $corrections ) ) {
				continue;
			}

			?>
			<!-- wp:group {"className":"is-style-default correction-shortcode-item"} -->
			<div class="wp-block-group is-style-default correction-shortcode-item">
				<div class="wp-block-group__inner-container">
					<!-- wp:newspack-blocks/homepage-articles {"showExcerpt":false,"showDate":false,"showAuthor":false,"mediaPosition":"left","specificPosts":["<?php echo intval( $post_id ); ?>"],"imageScale":2,"specificMode":true} /-->

					<div class="correction-list">
						<?php foreach ( $corrections as $correction ) : ?>
							<?php $correction_heading = ! empty( $correction['date'] ) ? 'Correction on ' . gmdate( 'M j, Y', strtotime( $correction['date'] ) ) : 'Correction'; ?>
							<p>
								<span class="correction-date"><?php echo esc_html( $correction_heading ); ?><span>:</span></span>
								<?php echo esc_html( $correction['correction'] ); ?>
							</p>
						<?php endforeach; ?>
					</div>
				</div>
			</div>
			<!-- /wp:group -->
			<?php
		endforeach;
		return do_blocks( ob_get_clean() );
	}

	/**
	 * Adds the corrections metabox.
	 *
	 * @param string $post_type The post type.
	 */
	public static function add_corrections_metabox( $post_type ) {
		$valid_post_types = [ 'article_legacy', 'content_type_blog', 'post', 'press_release' ];
		if ( in_array( $post_type, $valid_post_types, true ) ) {
			add_meta_box(
				'reveal_corrections',
				'Corrections',
				[ __CLASS__, 'render_corrections_metabox' ],
				$post_type,
				'advanced',
				'high'
			);
		}
	}

	/**
	 * Renders the corrections metabox.
	 *
	 * @param \WP_Post $post The post object.
	 */
	public static function render_corrections_metabox( $post ) {
		$is_active            = (bool) get_post_meta( $post->ID, self::CORRECTIONS_ACTIVE_META, true );
		$existing_corrections = self::get_corrections( $post->ID );
		?>
		<div class="corrections-metabox-container">
			<div class="activate-corrections">
				<input type="hidden" value="0" name="<?php echo esc_attr( self::CORRECTIONS_ACTIVE_META ); ?>" />
				<input type="checkbox" value="1" name="<?php echo esc_attr( self::CORRECTIONS_ACTIVE_META ); ?>" <?php checked( $is_active ); ?> />
				Activate Corrections
			</div>
			<div class="manage-corrections">
				<div class="existing-corrections">
					<?php foreach ( $existing_corrections as $existing_correction ) : ?>
						<div class="reveal-correction">
							<p>Article Correction</p>
							<textarea name="reveal_correction[]" rows="3" cols="60">
								<?php echo esc_attr( sanitize_textarea_field( $existing_correction['correction'] ) ); ?>
							</textarea><br/>
								<p>Date: <input type="date" name="reveal_correction_date[]" value="<?php echo esc_attr( sanitize_text_field( $existing_correction['date'] ) ); ?>"></p>
							<span class="delete-correction">X</span>
						</div>
					<?php endforeach; ?>
				</div>
				<button type="button" class="add-correction">Add new correction</button>
			</div>
		</div>
		<?php
	}

	/**
	 * Saves the corrections metabox.
	 *
	 * @param int $post_id The post ID.
	 */
	public static function save_corrections_metabox( $post_id ) {
		if ( ! isset( $_POST[ self::CORRECTIONS_ACTIVE_META ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}

		$is_active        = (bool) filter_input( INPUT_POST, self::CORRECTIONS_ACTIVE_META, FILTER_SANITIZE_NUMBER_INT );
		$corrections_data = filter_input_array(
			INPUT_POST,
			[
				'correction'      => [
					'flags'  => FILTER_REQUIRE_ARRAY,
					'filter' => FILTER_SANITIZE_STRING,
				],
				'correction_date' => [
					'flags'  => FILTER_REQUIRE_ARRAY,
					'filter' => FILTER_SANITIZE_STRING,
				],
			]
		);

		$corrections = [];
		foreach ( $corrections_data['reveal_correction'] as $index => $correction_text ) {
			$corrections[] = [
				'correction' => sanitize_textarea_field( $correction_text ),
				'date'       => ! empty( $corrections_data['reveal_correction_date'][ $index ] ) ? sanitize_text_field( $corrections_data['reveal_correction_date'][ $index ] ) : gmdate( 'Y-m-d' ),
			];
		}

		self::save_corrections( $post_id, $corrections );
		update_post_meta( $post_id, self::CORRECTIONS_ACTIVE_META, true );
	}

	/**
	 * Outputs corrections on the post content.
	 *
	 * @param string $content The post content.
	 *
	 * @return string The post content with corrections.
	 */
	public static function output_corrections_on_post( $content ) {
		if ( is_admin() || ! is_single() ) {
			return $content;
		}

		$corrections_active = get_post_meta( get_the_ID(), self::CORRECTIONS_ACTIVE_META, true );
		if ( ! $corrections_active ) {
			return $content;
		}

		$corrections          = self::get_corrections( get_the_ID() );
		$has_valid_correction = false;
		foreach ( $corrections as $correction ) {
			if ( ! empty( trim( $correction['correction'] ) ) ) {
				$has_valid_correction = true;
				break;
			}
		}

		if ( ! $has_valid_correction ) {
			return $content;
		}

		ob_start();
		?>
		<!-- wp:group {"className":"correction-module","backgroundColor":"light-gray"} -->
		<div class="wp-block-group correction-module has-light-gray-background-color has-background">
			<div class="wp-block-group__inner-container">
			<?php
			foreach ( $corrections as $correction ) :
				if ( empty( trim( $correction['correction'] ) ) ) {
					continue;
				}

				$correction_heading = ! empty( $correction['date'] ) ? 'Correction on ' . gmdate( 'M j, Y', strtotime( $correction['date'] ) ) : 'Correction';
				?>
				<!-- wp:paragraph {"fontSize":"small"} -->
				<p class="has-small-font-size correction-heading"><?php echo esc_html( $correction_heading ); ?></p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"fontSize":"normal"} -->
				<p class="has-normal-font-size correction-body"><?php echo esc_html( $correction['correction'] ); ?></p>
				<!-- /wp:paragraph -->
			<?php endforeach; ?>
			</div>
		</div>
		<!-- /wp:group -->
		<?php
		$markup = do_blocks( ob_get_clean() );
		return $content . $markup;
	}
}
Corrections::init();
