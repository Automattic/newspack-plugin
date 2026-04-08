<?php
/**
 * Comment Display Name — requires readers with auto-generated display names
 * to choose a proper display name before commenting.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

use Newspack\Reader_Activation;

defined( 'ABSPATH' ) || exit;

/**
 * Comment Display Name class.
 */
final class Comment_Display_Name {

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		\add_action( 'comment_form_logged_in_after', [ __CLASS__, 'render_display_name_field' ] );
	}

	/**
	 * Whether the current user should be prompted for a display name.
	 *
	 * @return bool
	 */
	private static function should_prompt() {
		if ( ! \is_user_logged_in() ) {
			return false;
		}
		$user = \wp_get_current_user();
		if ( ! Reader_Activation::is_user_reader( $user ) ) {
			return false;
		}
		return Reader_Activation::reader_has_generic_display_name( $user->ID );
	}

	/**
	 * Render the display name field in the comment form.
	 */
	public static function render_display_name_field() {
		if ( ! self::should_prompt() ) {
			return;
		}
		?>
		<p class="comment-form-display-name">
			<label for="comment_display_name">
				<?php esc_html_e( 'Display name (shown publicly)', 'newspack-plugin' ); ?>
				<span class="required" aria-hidden="true">*</span>
			</label>
			<input id="comment_display_name" name="comment_display_name" type="text" required="required" />
		</p>
		<?php
	}
}
