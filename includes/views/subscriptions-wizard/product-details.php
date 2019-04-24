<div class="newspack-card">
	
	<a href="<?php echo esc_url( $product->get_permalink() ); ?>"><?php echo $product->get_image( 'thumbnail' ) ?></a>
	<div class="newspack-wizard__manage-subscriptions__product-info">
		<div class="product-title"><a href="<?php echo esc_url( $product->get_permalink() ); ?>"><?php echo $product->get_name() ?></a></div>
		<div class="product-price"><?php echo $product->get_price_html() ?></div>
	</div>
	<div class="newspack-wizard__manage-subscriptions-product-actions">
		<a href="<?php echo self_admin_url( 'index.php?page=newspack-subscriptions-wizard&screen=edit_subscription&subscription=' . absint( $product->get_id() ) ); ?>">Edit</a>
	</div>
</div>