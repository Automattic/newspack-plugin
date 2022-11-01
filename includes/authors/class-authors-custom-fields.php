<?php
/**
 * Newspack Authors Custom Fields functionality.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Newspack Authors Custom Fields class.
 */
final class Authors_Custom_Fields {
	/**
	 * Initialize hooks.
	 */
	public static function init() {
		\add_action( 'edit_user_profile', [ __CLASS__, 'edit_user_profile' ] );
		\add_action( 'edit_user_profile_update', [ __CLASS__, 'edit_user_profile_update' ] );
	}

	/**
	 * Save custom fields.
	 *
	 * @param int $user_id User ID.
	 */
	public static function edit_user_profile_update( $user_id ) {
		foreach ( self::get_custom_fields() as $field ) {
			if ( isset( $_POST[ $field['name'] ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
				\update_user_meta( $user_id, $field['name'], sanitize_text_field( $_POST[ $field['name'] ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
			}
		}
	}

	/**
	 * Get custom profile fields list.
	 */
	public static function get_custom_fields() {
		$default_fields = [
			[
				'name'  => 'newspack_job_title',
				'label' => __( 'Job Title', 'newspack' ),
			],
			[
				'name'  => 'newspack_role',
				'label' => __( 'Role', 'newspack' ),
			],
			[
				'name'  => 'newspack_employer',
				'label' => __( 'Employer/Organization', 'newspack' ),
			],
			[
				'name'  => 'newspack_phone_number',
				'label' => __( 'Phone number', 'newspack' ),
			],
		];
		return apply_filters( 'newspack_authors_custom_fields', $default_fields );
	}

	/**
	 * Add user profile fields.
	 *
	 * @param WP_User $user The current WP_User object.
	 */
	public static function edit_user_profile( $user ) {
		?>
		<div class="newspack-author-custom-fields">
			<h2><?php echo esc_html__( 'Additional user profile fields', 'newspack' ); ?></h2>
			<p><?php echo esc_html__( 'These fields will be displayed by Newspack.', 'newspack' ); ?></p>
			<table class="form-table" role="presentation">
				<?php foreach ( self::get_custom_fields() as $field ) : ?>
					<tr class="user-<?php echo esc_attr( $field['name'] ); ?>-wrap">
						<th>
							<label for="<?php echo esc_attr( $field['name'] ); ?>"><?php echo esc_html( $field['label'] ); ?></label>
						</th>
						<td>
							<input
								type="text"
								name="<?php echo esc_attr( $field['name'] ); ?>"
								id="<?php echo esc_attr( $field['name'] ); ?>"
								value="<?php echo esc_attr( \get_user_meta( $user->ID, $field['name'], true ) ); ?>"
								class="regular-text"
							/>
						</td>
					</tr>
				<?php endforeach; ?>
			</table>
		</div>
		<?php
	}
}
Authors_Custom_Fields::init();
