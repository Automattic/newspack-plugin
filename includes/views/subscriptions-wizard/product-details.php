<div class="newspack-card">
	
	<a href="<?php echo esc_url( $product->get_permalink() ); ?>"><?php echo $product->get_image( 'thumbnail' ) ?></a>
	<div class="newspack-wizard__manage-subscriptions__product-info">
		<div class="product-title"><a href="<?php echo esc_url( $product->get_permalink() ); ?>"><?php echo $product->get_name() ?></a></div>
		<div class="product-price"><?php echo $product->get_price_html() ?></div>
	</div>
	<div class="newspack-wizard__manage-subscriptions-product-actions">
		<a class="edit-subscription" href="<?php echo self_admin_url( 'index.php?page=newspack-subscriptions-wizard&screen=edit_subscription&subscription=' . absint( $product->get_id() ) ); ?>"><?php echo esc_html__( 'Edit', 'newspack' ); ?></a>
		<a class="delete-subscription" data-subscription="<?php echo esc_attr( $product->get_name() ); ?>" href="<?php echo wp_nonce_url( 'index.php?page=newspack-subscriptions-wizard&screen=manage_subscriptions&action=delete&subscription=' . absint( $product->get_id() ), 'newspack-delete-subscription_' . $product->get_id(), 'delete_subscription_nonce' ); ?>"><?php echo esc_html__( 'Delete', 'newspack' ); ?></a>
	</div>
</div>
