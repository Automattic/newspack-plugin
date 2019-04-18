<div>
	<span><?php echo $product->get_image( 'thumbnail' ) ?></span>
	<span><?php echo $product->get_name() ?></span>
	<span><?php echo $product->get_price_html() ?></span>
	<span>
		<a href="<?php echo self_admin_url( 'index.php?page=newspack-subscriptions-wizard&screen=edit_subscription&subscription=' . absint( $product->get_id() ) ); ?>">Edit</a>
	</span>
</div>