<?php
/**
 * Newspack Tag Labels
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Newspack Tag Labels
 */
class Tag_Labels {

	/**
	 * Key names.
	 */
	const TAG_LABEL_META_KEY = '_np_label_enabled';
	const TAG_LABEL_FLAG_META_KEY = '_np_label_flag';


	// Helper functions for themes to get arrays of labels and flags.
	/**
	 * Given a term, check if labels are enabled for it.
	 *
	 * @param WP_Term $term Term to check.
	 *
	 * @return bool
	 */
	public static function is_tag_label( $term ) {
		if ( ! $term || ! $term->term_id ) {
			return false;
		}
		return ! empty( get_term_meta( $term->term_id, self::TAG_LABEL_META_KEY, true ) );
	}

	/**
	 * Given a term, return the flag (text) of its label and
	 * the link to the term archive.
	 *
	 * Will return null if label isn't enabled for the term.
	 *
	 * @param WP_Term $term Term to check.
	 *
	 * @return array|null As ['flag' => FLAG_NAME, 'link' => TERM_LINK].
	 */
	public static function get_tag_label_for_term( $term ) {
		if ( ! $term || ! $term->term_id || ! self::is_tag_label( $term ) ) {
			return null;
		}

		// A little fancy in case someone wants to give a tag a
		// falsy label flag.  Empty string still gets default value.
		$term_label_flag = get_term_meta( $term->term_id, self::TAG_LABEL_FLAG_META_KEY, true );
		if ( ! isset( $term_label_flag ) || '' === $term_label_flag ) {
			$term_label_flag = $term->name;
		}

		$term_label_link = get_term_link( $term->term_id );

		return [
			'flag' => $term_label_flag,
			'link' => $term_label_link,
		];
	}

	/**
	 * Given a post ID, grab array of tag labels (if any) for it.
	 *
	 * @param int $post_id Post ID.
	 *
	 * @return array Elements as ['flag' => FLAG_NAME, 'link' => TERM_LINK].
	 */
	public static function get_labels_for_post( $post_id ) {
		$post_terms = get_the_terms( $post_id, 'post_tag' );

		if ( ! $post_terms ) {
			return [];
		}

		return array_filter(
			array_map(
				function( $term ) {
					return self::get_tag_label_for_term( $term );
				},
				$post_terms
			)
		);
	}

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'post_tag_term_edit_form_top', array( __CLASS__, 'enqueue_scripts' ) );

		add_action( 'post_tag_edit_form_fields', [ __CLASS__, 'edit_term' ] );
		add_action( 'edited_post_tag', [ __CLASS__, 'save_term' ] );
	}

	/**
	 * Enqueues js script
	 *
	 * @return void
	 */
	public static function enqueue_scripts() {
		wp_enqueue_script(
			'newspack_tag_labels',
			Newspack::plugin_url() . '/dist/other-scripts/tag-labels.js',
			[ 'jquery' ],
			NEWSPACK_PLUGIN_VERSION,
			true
		);
	}

	/**
	 * Add term edit fields.
	 *
	 * Toggle to determine if the term is a label.
	 * Also, override for flag (text used on label).
	 *
	 * @param WP_Term $term The current WP_Term object.
	 */
	public static function edit_term( $term ) {
		$checkbox_id = self::TAG_LABEL_META_KEY;
		$is_label = self::is_tag_label( $term );

		$label = self::get_tag_label_for_term( $term );
		$label_flag  = $label ? $label['flag'] : $term->name;

		$input_label_flag = ( $term->name === $label_flag ) ? '' : $label_flag;
		?>
		<tr class="form-field newspack-label-enable term-<?php echo esc_attr( self::TAG_LABEL_META_KEY ); ?>-wrap">
			<th scope="row"><label for="<?php echo esc_attr( $checkbox_id ); ?>"><?php esc_html_e( 'Display as label', 'newspack-plugin' ); ?></label></th>
			<td>
				<input
					aria-describedby="<?php echo esc_attr( self::TAG_LABEL_META_KEY ); ?>-description"
					type="checkbox"
					name="<?php echo esc_attr( $checkbox_id ); ?>"
					value="true"
					<?php
						checked( $is_label, true );
					?>
				>
				<p class="description" id="<?php echo esc_attr( self::TAG_LABEL_META_KEY ); ?>-description">
					<?php echo esc_html__( 'Show this tag as a highlighted label wherever posts are displayed.', 'newspack-plugin' ); ?>
				</p>
			</td>
		</tr>
		<tr class="form-field newspack-label-setting term-<?php echo esc_attr( self::TAG_LABEL_FLAG_META_KEY ); ?>-wrap"<?php echo $is_label ? '' : ' style="display: none;"'; ?>>
			<th scope="row"><label for="<?php echo esc_attr( self::TAG_LABEL_FLAG_META_KEY ); ?>"><?php esc_html_e( 'Label text', 'newspack-plugin' ); ?></label></th>
			<td>
				<input
					aria-describedby="<?php echo esc_attr( self::TAG_LABEL_FLAG_META_KEY ); ?>-description"
					type="text"
					name="<?php echo esc_attr( self::TAG_LABEL_FLAG_META_KEY ); ?>"
					placeholder="<?php echo esc_attr( $term->name ); ?>"
					value="<?php echo esc_attr( $input_label_flag ); ?>"
					<?php
					if ( ! $is_label ) {
						echo ' disabled'; }
					?>
				>
				<p class="description" id="<?php echo esc_attr( self::TAG_LABEL_FLAG_META_KEY ); ?>-description">
					<?php echo esc_html__( 'Custom text to display instead of the tag name.', 'newspack-plugin' ); ?>
				</p>
			</td>
		</tr>
		<?php
	}

	/**
	 * Store our custom term meta when term is saved
	 *
	 * @param int $term_id Term ID.
	 */
	public static function save_term( $term_id ) {

		// See wp-admin/edit-tag-form.php for where this is set.
		check_admin_referer( 'update-tag_' . $term_id );

		if ( ! current_user_can( 'edit_term', $term_id ) ) {
			return;
		}

		// Save label data if label is enabled; otherwise kill it.
		if ( ! empty( $_POST[ self::TAG_LABEL_META_KEY ] ) ) {
			update_term_meta( $term_id, self::TAG_LABEL_META_KEY, true );

			// Save falsy values other than empty string in case someone wants a flag of '0' or something.
			if ( isset( $_POST[ self::TAG_LABEL_FLAG_META_KEY ] ) && $_POST[ self::TAG_LABEL_FLAG_META_KEY ] !== '' ) {
				update_term_meta( $term_id, self::TAG_LABEL_FLAG_META_KEY, sanitize_text_field( wp_unslash( $_POST[ self::TAG_LABEL_FLAG_META_KEY ] ) ) );
			} else {
				delete_term_meta( $term_id, self::TAG_LABEL_FLAG_META_KEY );
			}
		} else {
			delete_term_meta( $term_id, self::TAG_LABEL_META_KEY );
			delete_term_meta( $term_id, self::TAG_LABEL_FLAG_META_KEY );
		}
	}
}

Tag_Labels::init();
