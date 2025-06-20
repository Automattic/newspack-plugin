<?php
/**
 * Template for the lite site archive page
 *
 * @package newspack
 */

namespace Newspack;

?>
<!DOCTYPE html>
<html lang="<?php bloginfo( 'language' ); ?>">
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title><?php bloginfo( 'name' ); ?></title>
	<?php require __DIR__ . '/lite-site-styles.php'; ?>
</head>
<body>
	<header class="back">
		<a href="<?php echo esc_url( home_url() ); ?>" ><?php esc_html_e( 'View full site', 'newspack-plugin' ); ?></a>
	</header>
	<h1><?php bloginfo( 'name' ); ?></h1>
	<hr class="separator">
	<ul>
	<?php
	$query_args = [
		'posts_per_page' => Lite_Site::get_number_of_posts(),
		'post_status'    => 'publish',
	];

	$categories = Lite_Site::get_categories();
	if ( ! empty( $categories ) ) {
		$query_args['category__in'] = $categories;
	}

	// Render sticky posts prominently at the top.
	$sticky_post_ids_option = get_option( 'sticky_posts' );
	$sticky_post_ids        = [];
	if ( ! empty( $sticky_post_ids_option ) ) {
		$sticky_post_ids = array_values( $sticky_post_ids_option );
		$sticky_posts    = get_posts(
			[
				'post__in' => $sticky_post_ids,
			]
		);
		foreach ( $sticky_posts as $sticky_post ) {
			printf(
				'<li><h3><a href="/%s/%d">%s</a></h3></li>',
				esc_attr( Lite_Site::get_url_base() ),
				esc_attr( $sticky_post->ID ),
				esc_html( $sticky_post->post_title )
			);
		}
	}

	$recent_posts = get_posts( $query_args );
	foreach ( $recent_posts as $current_post ) {
		if ( ! in_array( $current_post->ID, $sticky_post_ids ) ) {
			printf(
				'<li><a href="/%s/%d">%s</a></li>',
				esc_attr( Lite_Site::get_url_base() ),
				esc_attr( $current_post->ID ),
				esc_html( $current_post->post_title )
			);
		}
	}
	?>
	</ul>
	<?php
	$footer_html = Lite_Site::get_footer_html();
	if ( ! empty( $footer_html ) ) :
		?>
		<hr class="separator">
		<footer class="site-footer">
			<?php echo wp_kses_post( $footer_html ); ?>
		</footer>
	<?php endif; ?>
</body>
</html>
