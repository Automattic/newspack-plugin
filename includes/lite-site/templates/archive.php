<?php
/**
 * Template for the lite site archive page
 *
 * @package newspack
 */

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
		<a href="<?php echo esc_url( home_url() ); ?>" >View full site</a>
	</header>
	<h1><?php bloginfo( 'name' ); ?></h1>
	<hr class="separator">
	<ul>
	<?php
	$recent_posts = get_posts(
		array(
			'posts_per_page' => 20,
			'post_status'    => 'publish',
		)
	);

	foreach ( $recent_posts as $current_post ) {
		printf(
			'<li><a href="/text/%d">%s</a></li>',
			esc_attr( $current_post->ID ),
			esc_html( $current_post->post_title )
		);
	}
	?>
	</ul>
</body>
</html>
