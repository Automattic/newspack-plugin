<?php
/**
 * Co-Authors Plus integration class.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * This class creates a new capability and adds it to all roles that have the edit_posts capability
 *
 * Then it filters the capability used by Co-Authors Plus to determine which users can be assigned as co-authors.
 */
class Coauthor_User_Cap {

	/**
	 * Custom capability name.
	 */
	const ASSIGNABLE_TO_POSTS_CAPABILITY_NAME = 'edit_cap_posts';

	/**
	 * Option name to mark the version of the settings. If the implementation details
	 * change, the expected option value should be updated to trigger a reset of the settings.
	 */
	const SETTINGS_VERSION_OPTION_NAME = 'newspack_coauthors_plus_settings_version';

	/**
	 * Initializes the class.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'coauthors_edit_author_cap', [ __CLASS__, 'coauthors_edit_author_cap' ] );
		add_action( 'admin_init', [ __CLASS__, 'setup_custom_capability' ] );
		add_action( 'newspack_before_delete_account', [ __CLASS__, 'before_delete_account' ] );

		add_action( 'edit_user_profile', [ __CLASS__, 'edit_user_profile' ] );
		add_action( 'edit_user_profile_update', [ __CLASS__, 'edit_user_profile_update' ] );

		add_filter( 'views_users', [ __CLASS__, 'add_custom_role_filter' ] );
		add_filter( 'users_list_table_query_args', [ __CLASS__, 'filter_users_table' ] );
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
	 * Add custom capability to the roles that should be allowed to author posts.
	 */
	public static function setup_custom_capability() {
		$current_settings_version = '1';
		if ( \get_option( self::SETTINGS_VERSION_OPTION_NAME ) === $current_settings_version ) {
			return;
		}

		$wp_roles = wp_roles();
		foreach ( $wp_roles->roles as $role_name => $role ) {
			$role = $wp_roles->get_role( $role_name );
			if ( $role->has_cap( 'edit_posts' ) || $role_name === Guest_Author_Role::CONTRIBUTOR_NO_EDIT_ROLE_NAME ) {
				$role->add_cap( self::ASSIGNABLE_TO_POSTS_CAPABILITY_NAME );
			}
		}

		\update_option( self::SETTINGS_VERSION_OPTION_NAME, $current_settings_version );
	}

	/**
	 * Prevents the Delete Account email to be sent and display an error message to the user
	 *
	 * @param int $user_id The user ID trying to delete the account.
	 * @return void
	 */
	public static function before_delete_account( $user_id ) {
		if ( user_can( $user_id, self::ASSIGNABLE_TO_POSTS_CAPABILITY_NAME ) ) {
			\wp_safe_redirect(
				\add_query_arg(
					[
						'message'  => __( 'It looks like you are an author on this site. Please contact a site adminstrator to get your account deactivated.', 'newspack-plugin' ),
						'is_error' => true,
					],
					\remove_query_arg( WooCommerce_My_Account::DELETE_ACCOUNT_URL_PARAM )
				)
			);
			exit;
		}
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
			$user->add_cap( self::ASSIGNABLE_TO_POSTS_CAPABILITY_NAME );
		} else {
			$user->remove_cap( self::ASSIGNABLE_TO_POSTS_CAPABILITY_NAME );
		}
	}

	/**
	 * Add user profile fields.
	 *
	 * @param WP_User $user The current WP_User object.
	 */
	public static function edit_user_profile( $user ) {
		$current_status = user_can( $user->ID, self::ASSIGNABLE_TO_POSTS_CAPABILITY_NAME );
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

	/**
	 * Gets a list of roles that have the edit_posts cap
	 *
	 * @return array
	 */
	private static function get_roles_with_edit_posts() {
		$wp_roles = wp_roles();
		$excluded_roles = [];
		foreach ( $wp_roles->roles as $role_name => $role ) {
			$role = $wp_roles->get_role( $role_name );
			if ( $role->has_cap( 'edit_posts' ) ) {
				$excluded_roles[] = $role_name;
			}
		}
		return $excluded_roles;
	}

	/**
	 * Add custom role filter.
	 *
	 * @param array $views The user views.
	 */
	public static function add_custom_role_filter( $views ) {

		$count_users = ! wp_is_large_user_count();
		$count_label = '';
		$current = ! empty( $_REQUEST['has_cap_edit_posts'] ); //phpcs:ignore WordPress.Security.NonceVerification.Recommended

		if ( $count_users ) {
			$users = new \WP_User_Query(
				[
					'fields'       => 'ID',
					'capability'   => self::ASSIGNABLE_TO_POSTS_CAPABILITY_NAME,
					'role__not_in' => self::get_roles_with_edit_posts(),
				]
			);
			$count = $users->get_total();
			$count_label = sprintf( '<span class="count">(%s)</span>', $count );
		}

		$views[ self::ASSIGNABLE_TO_POSTS_CAPABILITY_NAME ] = sprintf(
			'<a %s href="%s">%s %s</a>',
			$current ? ' class="current"' : '',
			esc_url(
				add_query_arg(
					[
						'has_cap_edit_posts' => 1,
						'role'               => null,
					]
				)
			),
			__( 'Non Editing Contributors', 'newspack-plugin' ),
			$count_label
		);

		return $views;
	}

	/**
	 * Filters the users table
	 *
	 * @param array $args The User Query args.
	 * @return array
	 */
	public static function filter_users_table( $args ) {

		if ( ! empty( $_REQUEST['has_cap_edit_posts'] ) ) { //phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$args['capability'] = self::ASSIGNABLE_TO_POSTS_CAPABILITY_NAME;
			$args['role__not_in'] = self::get_roles_with_edit_posts();
		}

		return $args;
	}
}

Coauthor_User_Cap::init();
