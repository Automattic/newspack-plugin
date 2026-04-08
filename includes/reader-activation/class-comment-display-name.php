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
		\add_filter( 'preprocess_comment', [ __CLASS__, 'validate_display_name' ] );
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
	 * Validate the display name field before a comment is saved.
	 *
	 * @param array $commentdata Comment data.
	 * @return array Comment data, unchanged.
	 */
	public static function validate_display_name( $commentdata ) {
		if ( ! self::should_prompt() ) {
			return $commentdata;
		}

		$display_name = isset( $_POST['comment_display_name'] ) ? \sanitize_text_field( \wp_unslash( $_POST['comment_display_name'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing

		if ( empty( $display_name ) ) {
			\wp_die(
				esc_html__( 'Please enter a display name.', 'newspack-plugin' ),
				esc_html__( 'Comment Submission Failure', 'newspack-plugin' ),
				[ 'back_link' => true ]
			);
		}

		$user  = \wp_get_current_user();
		$email = $user->user_email;
		if (
			Reader_Activation::generate_user_nicename( $email ) === $display_name ||
			Reader_Activation::strip_email_domain( $email ) === $display_name
		) {
			\wp_die(
				esc_html__( 'Please choose a display name that is not derived from your email address.', 'newspack-plugin' ),
				esc_html__( 'Comment Submission Failure', 'newspack-plugin' ),
				[ 'back_link' => true ]
			);
		}

		return $commentdata;
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
