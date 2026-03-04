<?php
/**
 * Custom template to manage group subscription members.
 * IMPORTANT: This template is supported only in My Account UI v1 and is not a standard WooCommerce Subscriptions template.
 *
 * @author   Newspack
 * @category WooCommerce Subscriptions/Templates
 * @package  Newspack
 */

namespace Newspack;

use Newspack\WooCommerce_Subscriptions;
use Newspack\Newspack_UI_Icons;

defined( 'ABSPATH' ) || exit;

\do_action( 'newspack_woocommerce_before_subscription_header', $subscription, $actions );
$members              = Group_Subscription::get_members( $subscription );
$managers_and_members = array_merge( Group_Subscription::get_managers( $subscription ), $members );
$member_limit         = Group_Subscription_Settings::get_subscription_settings( $subscription )['limit'];
$is_at_limit          = count( $members ) + count( Group_Subscription_Invite::get_invites( $subscription, false ) ) >= $member_limit;
?>
<header class="newspack-my-account__subscription--header">
	<?php
	$product_id = WooCommerce_Subscriptions::get_subscription_product_id( $subscription );
	if ( $product_id ) {
		$product = \wc_get_product( $product_id );
		if ( $product ) :
			$status = $subscription->get_status(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			?>
		<div class="newspack-my-account__subscription--title">
			<a href="<?php echo esc_url( \wc_get_account_endpoint_url( 'view-subscription/' . $subscription->get_id() ) ); ?>" class="newspack-my-account__subscription--back-link newspack-ui__button newspack-ui__button--ghost newspack-ui__button--icon newspack-ui__button--small" title="<?php esc_attr_e( 'Back to subscription', 'newspack-plugin' ); ?>">
				<?php Newspack_UI_Icons::print_svg( 'chevronLeft' ); ?>
			</a>
			<h2 class="newspack-ui__font--m">
				<?php
				echo \esc_html(
					sprintf(
						// translators: %s: The product name.
						__( '%s / Manage members', 'newspack-plugin' ),
						$product->get_name()
					)
				);
				?>
			</h2>
			<?php
			if ( ! $subscription->has_status( 'active' ) ) :
				$classes = [ 'newspack-ui__badge' ];
				if ( $subscription->has_status( [ 'cancelled', 'expired' ] ) ) {
					$classes[] = 'newspack-ui__badge--error';
				} elseif ( $subscription->has_status( [ 'on-hold', 'pending', 'processing' ] ) ) {
					$classes[] = 'newspack-ui__badge--warning';
				} else {
					$classes[] = 'newspack-ui__badge--secondary';
				}
				?>
				<span class="<?php echo \esc_attr( implode( ' ', $classes ) ); ?>">
					<?php echo esc_html( \wcs_get_subscription_status_name( $status ) ); ?>
				</span>
			<?php endif; ?>
		</div>
			<?php
		endif;
	}
	?>
	<div class="newspack-my-account__subscription__actions">
		<div class="newspack-my-account__subscription__actions-container">
			<button class="newspack-ui__button newspack-ui__button--secondary newspack-ui__button--small newspack-my-account__subscription--invite-member">
				<?php Newspack_UI_Icons::print_svg( 'plus' ); ?>
				<?php esc_html_e( 'Invite member', 'newspack-plugin' ); ?>
			</button>
		</div>
		<?php \do_action( 'newspack_woocommerce_after_subscription_actions', $subscription, $actions ); ?>
	</div>
</header>

<div class="newspack-my-account__group_subscription__content" data-active-tab="members">
	<p class="newspack-my-account__group_subscription__tabs">
		<a href="#" data-tab="members" class="newspack-my-account__group_subscription__tabs--members">
			<?php
			echo wp_kses_post(
				sprintf(
					// translators: %d: The number of members.
					__( 'Members (<span class="newspack-group-subscription--members-count">%d</span>)', 'newspack-plugin' ),
					count( $managers_and_members )
				)
			);
			?>
		</a>
		|
		<a href="#" data-tab="invites" class="newspack-my-account__group_subscription__tabs--invites">
			<?php
			echo wp_kses_post(
				sprintf(
					// translators: %d: The number of members.
					__( 'Invitations (<span class="newspack-group-subscription--invitations-count">%d</span>)', 'newspack-plugin' ),
					count( Group_Subscription_Invite::get_invites( $subscription ) )
				)
			);
			?>
		</a>
	</p>
	<table class="shop_table newspack-my-account__group_subscription__members">
		<thead>
			<tr>
				<th><?php esc_html_e( 'Name', 'newspack-plugin' ); ?></th>
				<th><?php esc_html_e( 'Email', 'newspack-plugin' ); ?></th>
				<th><?php esc_html_e( 'Role', 'newspack-plugin' ); ?></th>
				<th class="newspack-my-account__group_subscription__members__actions">&nbsp;</th>
			</tr>
		</thead>
		<tbody>
		<?php
		if ( empty( $managers_and_members ) ) :
			?>
			<tr>
				<td colspan="4"><?php esc_html_e( 'No members found.', 'newspack-plugin' ); ?></td>
			</tr>
			<?php
		endif;
		foreach ( $managers_and_members as $user_id ) :
			$is_manager  = Group_Subscription::user_is_manager( $user_id, $subscription );
			$user        = get_user_by( 'id', $user_id );
			$is_owner    = $user_id === $subscription->get_user_id();
			$member_role = $is_manager ? __( 'Manager', 'newspack-plugin' ) : __( 'Member', 'newspack-plugin' );
			if ( $is_owner ) {
				$member_role = __( 'Owner', 'newspack-plugin' );
			}
			?>
			<tr>
				<td>
					<?php echo esc_html( $user->display_name ); ?>
					<?php if ( $is_owner ) : ?>
						<?php esc_html_e( ' (you)', 'newspack-plugin' ); ?>
					<?php endif; ?>
				</td>
				<td><a href="mailto:<?php echo esc_attr( sanitize_email( $user->user_email ) ); ?>"><?php echo esc_html( sanitize_email( $user->user_email ) ); ?></a></td>
				<td><?php echo esc_html( $member_role ); ?></td>
				<td class="newspack-my-account__group_subscription__members__actions <?php echo esc_attr( $is_manager ? 'newspack-my-account__group_subscription__members__actions--manager' : '' ); ?>">
					<?php if ( ! $is_manager ) : ?>
					<div class="newspack-ui__dropdown">
						<button class="newspack-ui__button newspack-ui__button--ghost newspack-ui__button--small newspack-ui__dropdown__toggle newspack-ui__button--icon">
							<?php Newspack_UI_Icons::print_svg( 'more' ); ?>
							<span class="screen-reader-text"><?php \esc_html_e( 'More', 'newspack-plugin' ); ?></span>
						</button>
							<div class="newspack-ui__dropdown__content">
								<ul>
									<li><a class="newspack-ui__button newspack-ui__button--ghost newspack-ui__button--destructive" href="#"><?php \esc_html_e( 'Remove member', 'newspack-plugin' ); ?></a></li>
								</ul>
							</div>
					</div>
					<?php endif; ?>
				</td>
			</tr>
		<?php endforeach; ?>
		</tbody>
	</table>

	<table class="shop_table newspack-my-account__group_subscription__invites">
		<thead>
			<tr>
				<th><?php esc_html_e( 'Sent to', 'newspack-plugin' ); ?></th>
				<th><?php esc_html_e( 'Status', 'newspack-plugin' ); ?></th>
				<th>&nbsp;</th>
			</tr>
		</thead>
		<tbody>
		<?php
		foreach ( Group_Subscription_Invite::get_invites( $subscription ) as $key => $invite ) :
			?>
			<tr>
				<td><a href="mailto:<?php echo esc_attr( sanitize_email( $invite['email'] ) ); ?>"><?php echo esc_html( sanitize_email( $invite['email'] ) ); ?></a></td>
				<td><?php echo esc_html( Group_Subscription_Invite::is_invite_expired( $invite ) ? __( 'Expired', 'newspack-plugin' ) : __( 'Pending', 'newspack-plugin' ) ); ?></td>
			<td class="newspack-my-account__group_subscription__invites__actions <?php echo esc_attr( $is_manager ? 'newspack-my-account__group_subscription__invites__actions--manager' : '' ); ?>">
					<div class="newspack-ui__dropdown">
						<button class="newspack-ui__button newspack-ui__button--ghost newspack-ui__button--small newspack-ui__dropdown__toggle newspack-ui__button--icon">
							<?php Newspack_UI_Icons::print_svg( 'more' ); ?>
							<span class="screen-reader-text"><?php \esc_html_e( 'More', 'newspack-plugin' ); ?></span>
						</button>
						<div class="newspack-ui__dropdown__content">
							<ul>
								<li>
									<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
										<input type="hidden" name="action" value="newspack_group_subscription_invite">
										<input type="hidden" name="subscription_id" value="<?php echo esc_attr( $subscription->get_id() ); ?>">
										<input type="hidden" name="newspack-group-subscription-invite-email" value="<?php echo esc_attr( sanitize_email( $invite['email'] ) ); ?>">
										<?php wp_nonce_field( Group_Subscription_MyAccount::INVITE_NONCE_ACTION ); ?>
										<button type="submit" class="newspack-ui__button newspack-ui__button--ghost"><?php \esc_html_e( 'Resend', 'newspack-plugin' ); ?></button>
									</form>
								</li>
								<li>
									<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
										<input type="hidden" name="action" value="newspack_group_subscription_cancel_invite">
										<input type="hidden" name="subscription_id" value="<?php echo esc_attr( $subscription->get_id() ); ?>">
										<input type="hidden" name="email" value="<?php echo esc_attr( sanitize_email( $invite['email'] ) ); ?>">
										<?php wp_nonce_field( Group_Subscription_MyAccount::CANCEL_INVITE_NONCE_ACTION ); ?>
										<button type="submit" class="newspack-ui__button newspack-ui__button--ghost newspack-ui__button--destructive"><?php \esc_html_e( 'Cancel', 'newspack-plugin' ); ?></button>
									</form>
								</li>
							</ul>
						</div>
					</div>
				</td>
			</tr>
		<?php endforeach; ?>
		</tbody>
	</table>

	<!-- .newspack-ui__modal -->
	<div id="newspack-my-account__group_subscription--invite-member" class="newspack-ui__modal-container">
		<div class="newspack-ui__modal-container__overlay"></div>
		<div class="newspack-ui__modal newspack-ui__modal--small">
				<header class="newspack-ui__modal__header">
					<h2>Invite a group member</h2>

					<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close">
						<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
						<?php Newspack_UI_Icons::print_svg( 'close' ); ?>
					</button>
				</header>

				<section class="newspack-ui__modal__content">
					<form name="newspack-group-subscription-invite-member" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
						<input type="hidden" name="action" value="newspack_group_subscription_invite">
						<input type="hidden" name="subscription_id" value="<?php echo esc_attr( $subscription->get_id() ); ?>">
						<?php wp_nonce_field( Group_Subscription_MyAccount::INVITE_NONCE_ACTION ); ?>
						<?php if ( $is_at_limit ) : ?>
							<p>
								<?php esc_html_e( 'You have reached the member limit for this group subscription. Please remove some members or cancel pending invitations before inviting more group members.', 'newspack-plugin' ); ?>
							</p>
						<?php else : ?>
							<p><?php esc_html_e( 'Enter an email address to invite a new member to this group subscription.', 'newspack-plugin' ); ?></p>
							<p>
								<input type="email" placeholder="Recipient’s email address" name="newspack-group-subscription-invite-email" id="newspack-group-subscription-invite-email" required>
							</p>

							<button class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--wide"><?php esc_html_e( 'Invite', 'newspack-plugin' ); ?></button>
							<button class="newspack-ui__button newspack-ui__button--secondary newspack-ui__button--wide newspack-ui__modal__close"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></button>
						<?php endif; ?>
					</form>
				</section>
			</div><!-- .newspack-ui__modal__small -->
	</div> <!-- .newspack-ui__modal-container -->
</div>
