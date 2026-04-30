<?php
/**
 * My Account v2 prototype — single newsletter row.
 *
 * Square thumbnail (full image) + name + frequency badge + optional
 * SUBSCRIBER-ONLY badge + description + Sign up / Unsubscribe button.
 * Pure newspack-ui composition — see brief §6 for the mapping table.
 *
 * @package Newspack
 * @var array $args Template args; expected to contain `list` => array.
 */

defined( 'ABSPATH' ) || exit;

$list = isset( $args['list'] ) ? $args['list'] : [];
if ( empty( $list ) || empty( $list['id'] ) ) {
	return;
}

$list_id         = (string) $list['id'];
$name            = isset( $list['name'] ) ? (string) $list['name'] : '';
$description     = isset( $list['description'] ) ? (string) $list['description'] : '';
$frequency       = isset( $list['frequency'] ) ? (string) $list['frequency'] : '';
$subscriber_only = ! empty( $list['subscriber_only'] );
$subscribed      = ! empty( $list['subscribed'] );
// Stable but distinct fake image per slug. Brief §3 specifies picsum.photos.
// Request 144×144 (2× the 72px display size) so the image is retina-sharp.
$thumbnail = isset( $list['thumbnail'] ) ? (string) $list['thumbnail'] : sprintf( 'https://picsum.photos/seed/%s/144/144', \rawurlencode( $list_id ) );

$button_classes = $subscribed
	? 'newspack-ui__button newspack-ui__button--secondary'
	: 'newspack-ui__button newspack-ui__button--primary';
$button_label   = $subscribed
	? __( 'Unsubscribe', 'newspack-plugin' )
	: __( 'Sign up', 'newspack-plugin' );
$button_action  = $subscribed ? 'unsubscribe' : 'subscribe';
?>
<div
	class="newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--gap-5 newspack-ui__stack--align-center newspack-ui__stack--justify-between"
	data-list-id="<?php echo esc_attr( $list_id ); ?>"
	data-subscribed="<?php echo $subscribed ? 'true' : 'false'; ?>"
>
	<div class="newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--gap-5 newspack-ui__stack--align-center">
		<img
			src="<?php echo esc_url( $thumbnail ); ?>"
			width="72"
			height="72"
			alt=""
			loading="lazy"
			decoding="async"
		/>
		<div class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-1">
			<div class="newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--gap-1 newspack-ui__stack--align-center newspack-ui__stack--wrap">
				<span class="newspack-ui__font--s newspack-ui__font--bold"><?php echo esc_html( $name ); ?></span>
				<?php if ( $frequency ) : ?>
					<span class="newspack-ui__badge newspack-ui__badge--outline" data-role="frequency">
						<?php echo esc_html( $frequency ); ?>
					</span>
				<?php endif; ?>
				<?php if ( $subscriber_only ) : ?>
					<span class="newspack-ui__badge newspack-ui__badge--secondary" data-role="subscriber-only">
						<?php esc_html_e( 'Subscriber-only', 'newspack-plugin' ); ?>
					</span>
				<?php endif; ?>
			</div>
			<p class="newspack-ui__font--xs newspack-ui__color--neutral-60 newspack-ui__spacing-top--0 newspack-ui__spacing-bottom--0">
				<?php echo esc_html( $description ); ?>
			</p>
		</div>
	</div>
	<button
		type="button"
		class="<?php echo esc_attr( $button_classes ); ?>"
		data-action="<?php echo esc_attr( $button_action ); ?>"
		data-list-name="<?php echo esc_attr( $name ); ?>"
		data-label-subscribe="<?php esc_attr_e( 'Sign up', 'newspack-plugin' ); ?>"
		data-label-unsubscribe="<?php esc_attr_e( 'Unsubscribe', 'newspack-plugin' ); ?>"
	>
		<span><?php echo esc_html( $button_label ); ?></span>
	</button>
</div>
