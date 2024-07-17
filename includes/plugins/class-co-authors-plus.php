<?php
/**
 * Co_Authors_Plus integration class.
 * https://wordpress.org/plugins/co-authors-plus
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class Co_Authors_Plus {
	/**
	 * Custom capability name.
	 */
	const ASSIGNABLE_TO_POSTS_CAPABILITY_NAME = 'edit_cap_posts';

	/**
	 * Custom role name for users who are assignable as post authors but aren't allowed to edit posts.
	 */
	const CONTRIBUTOR_NO_EDIT_ROLE_NAME = 'contributor_no_edit';

	/**
	 * Option name to mark the version of the settings. If the implementation details
	 * change, the expected option value should be updated to trigger a reset of the settings.
	 */
	const SETTINGS_VERSION_OPTION_NAME = 'newspack_coauthors_plus_settings_version';

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_filter( 'coauthors_edit_author_cap', [ __CLASS__, 'coauthors_edit_author_cap' ] );
		add_action( 'admin_init', [ __CLASS__, 'setup_custom_role_and_capability' ] );
		add_action( 'template_redirect', [ __CLASS__, 'prevent_myaccount_update' ] );
		add_action( 'edit_user_profile', [ __CLASS__, 'edit_user_profile' ] );
		add_action( 'wp_update_user', [ __CLASS__, 'edit_user_profile_update' ] );
	}

	/**
	 * Override the capability required to assign a user as a co-author.
	 *
	 * @param string $edit_cap Capability required for a user to be assigned as a co-author.
	 */
	public static function coauthors_edit_author_cap( $edit_cap ) {
		return self::ASSIGNABLE_TO_POSTS_CAPABILITY_NAME;
	}

	/**
	 * Prevent users from updating their account details in My Account, if they have the custom role.
	 */
	public static function prevent_myaccount_update() {
		$action = filter_input( INPUT_POST, 'action', FILTER_SANITIZE_FULL_SPECIAL_CHARS );
		if ( empty( $action ) || 'save_account_details' !== $action ) {
			return;
		}

		$user_id = \get_current_user_id();
		if ( $user_id <= 0 ) {
			return;
		}
		$user = \get_user_by( 'id', $user_id );

		$is_contributor_no_edit = in_array( self::CONTRIBUTOR_NO_EDIT_ROLE_NAME, $user->roles );
		if ( $is_contributor_no_edit ) {
			if ( function_exists( 'wc_add_notice' ) ) {
				/* translators: %s is the custom role name. */
				\wc_add_notice( sprintf( __( 'Can\'t update details of a "%s" user.', 'newspack-plugin' ), self::CONTRIBUTOR_NO_EDIT_ROLE_NAME ), 'error' );
			}
			return;
		}
	}

	/**
	 * Create the custom role and then add custom capability.
	 */
	public static function setup_custom_role_and_capability() {
		$current_settings_version = '1';
		if ( \get_option( self::SETTINGS_VERSION_OPTION_NAME ) === $current_settings_version ) {
			return;
		}

		// Create the custom role if it doesn't exist.
		if ( get_role( self::CONTRIBUTOR_NO_EDIT_ROLE_NAME ) === null ) {
			add_role( // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.custom_role_add_role
				self::CONTRIBUTOR_NO_EDIT_ROLE_NAME,
				__( 'Non-Editing Contributor', 'newspack-plugin' ),
				[
					self::ASSIGNABLE_TO_POSTS_CAPABILITY_NAME => true,
				]
			);
		}

		$wp_roles = wp_roles();
		foreach ( $wp_roles->roles as $role_name => $role ) {
			$role = $wp_roles->get_role( $role_name );
			if ( $role->has_cap( 'edit_posts' ) || $role_name === self::CONTRIBUTOR_NO_EDIT_ROLE_NAME ) {
				$role->add_cap( self::ASSIGNABLE_TO_POSTS_CAPABILITY_NAME );
			}
		}

		\update_option( self::SETTINGS_VERSION_OPTION_NAME, $current_settings_version );
	}

	/**
	 * Save custom fields.
	 *
	 * @param int $user_id User ID.
	 */
	public static function edit_user_profile_update( $user_id ) {
		if ( empty( $_POST['_wpnonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce'] ) ), 'update-user_' . $user_id ) ) {
			return;
		}

		if ( ! current_user_can( 'edit_user', $user_id ) ) {
			return false;
		}

		$user = get_userdata( $user_id );
		if ( ! empty( $_POST['newspack_cap_custom_cap_option'] ) ) {
			$user->add_role( self::CONTRIBUTOR_NO_EDIT_ROLE_NAME );
		} else {
			$user->remove_role( self::CONTRIBUTOR_NO_EDIT_ROLE_NAME );
		}
	}

	/**
	 * Add user profile fields.
	 *
	 * @param WP_User $user The current WP_User object.
	 */
	public static function edit_user_profile( $user ) {
		$current_status = user_can( $user->ID, self::CONTRIBUTOR_NO_EDIT_ROLE_NAME );
		?>
		<div class="newspack-plugin-cap-options">

			<h2><?php echo esc_html__( 'Co-Authors Plus Options', 'newspack-plugin' ); ?></h2>

			<table class="form-table" role="presentation">
				<tr class="user-newspack_cap_custom_cap_option-wrap">
					<th scope="row">
						<?php esc_html_e( 'Enable as coauthor', 'newspack-plugin' ); ?>
					</th>
					<td>
						<label for="newspack_cap_custom_cap_option">
							<input type="checkbox" name="newspack_cap_custom_cap_option" id="newspack_cap_custom_cap_option" value="1" <?php checked( $current_status ); ?> />
							<?php esc_html_e( 'Allow this user to be assigned as a co-author of a post.', 'newspack-plugin' ); ?>
						</label>
						<p class="description">
						<?php
							esc_html_e( 'If this option is checked, this user will be able to be assigned as a co-author of a post even if they are not allowed to edit posts. For users with edit access, this option has no effect.', 'newspack-plugin' );
						?>
						</p>
					</td>
				</tr>
			</table>
		</div>
		<?php
	}
}
Co_Authors_Plus::init();
