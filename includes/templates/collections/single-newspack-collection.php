<?php
/**
 * The template for displaying single Collections
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package Newspack\Collections
 */

use Newspack\Collections\Query_Helper;
use Newspack\Collections\Template_Helper;

get_header();
?>

<section id="primary" class="content-area">

	<main id="main" class="site-main">

		<?php
		while ( have_posts() ) :
			the_post();
			$collection_id = get_the_ID();

			/**
			 * Fires at the start of the single collection template.
			 *
			 * @param WP_Post $post The collection post.
			 */
			do_action( 'newspack_collections_single_start', $post );
			?>

			<!-- Intro Section -->
			<div class="collection-intro">

				<!-- Cover Card -->
				<div class="collection-intro__card">
					<?php echo wp_kses_post( Template_Helper::render_image( $post, false ) ); ?>
				</div>

				<!-- Content -->
				<div class="collection-intro__content">
					<div class="collection-intro__content__meta">
						<h1><?php the_title(); ?></h1>
						<?php echo wp_kses_post( Template_Helper::render_meta_text( $collection_id, 1 ) ); ?>
					</div>

					<?php
					/**
					 * Fires after the collection meta in the intro section.
					 *
					 * @param int $collection_id The collection post ID.
					 */
					do_action( 'newspack_collections_single_after_meta', $collection_id );
					?>

					<div class="collection-intro__content__description">
						<?php the_content(); ?>
					</div>

					<?php
					$ctas = Query_Helper::get_ctas( $collection_id );
					if ( $ctas ) :
						?>
						<div class="collection-buttons">
							<?php foreach ( $ctas as $cta ) : ?>
								<?php echo wp_kses_post( Template_Helper::render_cta( $cta ) ); ?>
							<?php endforeach; ?>
						</div>
					<?php endif; ?>
				</div>
			</div>

			<?php
			/**
			 * Fires after the collection intro section.
			 *
			 * @param int $collection_id The collection post ID.
			 */
			do_action( 'newspack_collections_single_after_intro', $collection_id );
			?>

			<hr class="has-light-gray-background-color has-background is-style-wide"/>

			<?php
			// Get posts in this collection organized by sections.
			$collection_posts = Query_Helper::get_collection_posts( $collection_id );

			if ( $collection_posts ) :
				foreach ( $collection_posts as $section_slug => $post_ids ) :
					/**
					 * Filters the post IDs in a section before rendering.
					 *
					 * @param array  $post_ids      The post IDs in this section.
					 * @param string $section_slug  The section slug.
					 * @param int    $collection_id The collection post ID.
					 */
					$post_ids = apply_filters( 'newspack_collections_single_section_posts', $post_ids, $section_slug, $collection_id );

					if ( empty( $post_ids ) ) {
						continue;
					}

					$is_cover     = Query_Helper::COVER_SECTION === $section_slug;
					$section_name = $is_cover
						? ( count( $post_ids ) > 1 ? __( 'Cover Stories', 'newspack' ) : __( 'Cover Story', 'newspack' ) )
						: Query_Helper::get_section_name( $section_slug );
					$show_image   = ! $is_cover;
					$columns      = $is_cover ? 1 : 2;
					$type_scale   = $is_cover ? 5 : 3;
					?>
					<div class="collection-section <?php echo esc_attr( $is_cover ? 'is-cover-section' : '' ); ?>">
						<?php echo wp_kses_post( Template_Helper::render_articles( $post_ids, $section_name, $show_image, $columns, $type_scale ) ); ?>
					</div>
					<?php
				endforeach;
			endif;

			// Get recent collections (excluding current).
			$recent_collections = Query_Helper::get_recent( [ $collection_id ], 6 );

			if ( $recent_collections ) :
				?>
				<hr class="has-light-gray-background-color has-background is-style-wide"/>

				<!-- Recent Collections Section -->
				<div class="collections-recent">
					<div class="collections-recent__header">
						<h2><?php esc_html_e( 'Recent', 'newspack' ); ?></h2>
						<p class="has-medium-gray-color has-text-color has-link-color has-small-font-size">
							<?php echo wp_kses_post( Template_Helper::render_see_all_link() ); ?>
						</p>
					</div>

					<div class="collections-recent__grid">
						<?php foreach ( $recent_collections as $collection ) : ?>
							<div class="collection-item">
								<?php echo wp_kses_post( Template_Helper::render_image( $collection ) ); ?>

								<div class="collection-content">
									<h3 class="has-normal-font-size">
										<a href="<?php echo esc_url( get_permalink( $collection->ID ) ); ?>">
											<?php echo esc_html( get_the_title( $collection->ID ) ); ?>
										</a>
									</h3>

									<?php echo wp_kses_post( Template_Helper::render_meta_text( $collection->ID ) ); ?>
								</div>
							</div>
						<?php endforeach; ?>
					</div>
				</div> <!-- .collections-recent -->
			<?php endif; ?>

			<?php
			/**
			 * Fires at the end of the single collection template.
			 *
			 * @param WP_Post $post The collection post.
			 */
			do_action( 'newspack_collections_single_end', $post );
		endwhile;
		?>

	</main><!-- #main -->

</section><!-- #primary -->

<?php
get_footer();
