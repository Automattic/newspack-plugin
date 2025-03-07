<?php
/**
 * Shared styles for lite site templates
 *
 * @package newspack
 */

?>
<style>
	body {
		font-family: system-ui, -apple-system, sans-serif;
		line-height: 1.5;
		max-width: 41.5rem;
		margin: 2rem auto;
		padding: 0 1rem;
	}
	h1 { margin-bottom: 2rem; }
	ul { padding-left: 0; list-style: none; }
	li { margin-bottom: 1rem; }
	a { color: #000; }
	.back { display: block; margin-bottom: 2rem; }
	hr.separator {
		border: 2px solid <?php echo esc_attr( Lite_Site::get_primary_color() ); ?>;
	}
	.meta {
		color: #515151;
		margin-bottom: 2rem;
	}
	.meta .date {
		margin-top: 0.5rem;
	}
	.site-footer {
		margin-top: 2rem;
		color: #515151;
	}
</style>
