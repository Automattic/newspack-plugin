<?php

$product_id             = $product ? $product->get_id() : 0;
$product_name           = $product ? $product->get_name() : '';
$price                  = $product ? $product->get_regular_price() : '';
$price                  = $product && WC_Subscriptions_Product::is_subscription( $product ) ? WC_Subscriptions_Product::get_price( $product ) : $price;
$subscription_frequency = $product ? WC_Subscriptions_Product::get_period( $product ) : 'month';
$subscription_frequency = $subscription_frequency ?: 'once';
$choose_price           = $product ? WC_Name_Your_Price_Helpers::is_nyp( $product ) : false;
$suggested_price        = $product ? WC_Name_Your_Price_Helpers::get_suggested_price( $product ) : '';
$suggested_price        = $suggested_price ?: '';
$suggested_min_price    = $product ? WC_Name_Your_Price_Helpers::get_minimum_price( $product ) : '';
$suggested_min_price    = $suggested_min_price ?: '';
$suggested_max_price    = $product ? WC_Name_Your_Price_Helpers::get_maximum_price( $product ) : '';
$suggested_max_price    = $suggested_max_price ?: '';
$hide_min_price         = $product ? WC_Name_Your_Price_Helpers::is_minimum_hidden( $product ) : false;
$image_placeholder      = wc_placeholder_img_src( 'thumbnail' );
?>
<form method="post" action="<?php echo self_admin_url( 'admin.php?page=newspack-subscriptions-wizard' ); ?>">
	<?php wp_nonce_field( 'newspack-subscriptions-wizard-edit-subscription' ); ?>
	<input type="hidden" name="save_product_form" value="1" />
	<input type="hidden" name="id" value="<?php echo absint( $product_id ); ?>" />
	<input type="text" class="product-title" name="name" placeholder="What is this product called? e.g. Valued Donor" value="<?php echo esc_attr( $product_name ); ?>" />
	
	<div class="image-fields">
		<div class="image-preview" data-default="<?php echo esc_attr( $image_placeholder ); ?>"><?php echo $product ? $product->get_image( 'full' ) : wc_placeholder_img( 'thumbnail' ); ?></div>
		<a class="add-image" href="<?php echo esc_url( get_upload_iframe_src( 'image', $product_id ) ); ?>"><?php echo esc_html__( 'Add an image', 'newspack' ); ?></a>
		<a class="delete-image" href="#"><?php echo esc_html__( 'Remove image', 'newspack' ); ?></a>
		<input class="image-form-input" type="hidden" name="image_id" value="<?php echo ( $product ? absint( $product->get_image_id() ) : 0 ) ?>" />
	</div>
	
	<div class="price-fields">
		<input type="number" step="0.01" min="0" name="price" placeholder="Price" value="<?php echo wc_format_decimal( $price ); ?>" />
		<select name="subscription_frequency" class="subscription_frequency-input">
			<option value="month" <?php selected( 'month', $subscription_frequency ); ?> >per month</option>
			<option value="year" <?php selected( 'year', $subscription_frequency ); ?> >per year</option>
			<option value="once" <?php selected( 'once', $subscription_frequency ); ?> >once</option>
		</select>
	</div>
	
	<div class="choose_price-input-container">
		<label>
			<input type="hidden" name="choose_price" value="0" />
			<input type="checkbox" name="choose_price" class="choose_price-input" value="1" <?php checked( $choose_price ); ?> /> 
			<?php echo esc_html__( 'Name your price', 'newspack' ); ?>
		</label>
	</div>
	
	<div class="choose_price-fields">
		<div class="chose_price-fields__basic-price-info">
			<input type="number" step="0.01" min="0" name="suggested_price" placeholder="Suggested price?" value="<?php echo wc_format_decimal( $suggested_price ); ?>" />
			<select name="subscription_frequency" class="subscription_frequency-input">
				<option value="month" <?php selected( 'month', $subscription_frequency ); ?> >per month</option>
				<option value="year" <?php selected( 'year', $subscription_frequency ); ?> >per year</option>
				<option value="once" <?php selected( 'once', $subscription_frequency ); ?> >once</option>
			</select>
		</div>
		<div class="chose_price-fields__advanced-price-info">
			<input type="number" step="0.01" min="0" name="suggested_min_price" placeholder="Minimum price?" value="<?php echo wc_format_decimal( $suggested_min_price ); ?>" />
			<input type="number" step="0.01" min="0" name="suggested_max_price" placeholder="Maximum price?" value="<?php echo wc_format_decimal( $suggested_max_price ); ?>"  />
		</div>
		<div class="chose_price-fields__hide-min-price">
			<label>
				<input type="hidden" name="hide_minimum_price" value="0" />
				<input type="checkbox" name="hide_minimum_price" value="1" <?php checked( $hide_min_price ); ?> />
				<?php echo esc_html__( 'Hide minimum price', 'newspack' ); ?>
			</label>
		</div>
	</div>
	
	<input type="submit" class="newspack-wizard__cta" value="Save" />
</form>