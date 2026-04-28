<?php
/**
 * My Account v2 prototype — Newsletters endpoint.
 *
 * Renders the grouped newsletter list (Featured / Technology / Subscriber-only)
 * plus the bottom "Unsubscribe from all" row. Built entirely from newspack-ui
 * primitives (see brief §2.1 + §6).
 *
 * @package Newspack
 * @var array $args Template args; expected to contain `data` => fake-data array.
 */

defined( 'ABSPATH' ) || exit;

$data    = isset( $args['data'] ) ? $args['data'] : [];
$reader  = isset( $data['reader'] ) ? $data['reader'] : [];
$payload = isset( $data['newsletters'] ) ? $data['newsletters'] : [];

$sections             = isset( $payload['sections'] ) ? $payload['sections'] : [];
$unsubscribe_from_all = isset( $payload['unsubscribe_from_all'] ) ? $payload['unsubscribe_from_all'] : [];
$reader_email         = isset( $reader['email'] ) ? (string) $reader['email'] : '';
?>
<div
	class="newspack-my-account__v2-demo-newsletters newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-9"
	data-newspack-my-account-v2-demo="newsletters"
	data-reader-email="<?php echo esc_attr( $reader_email ); ?>"
>
	<?php foreach ( $sections as $section ) : ?>
		<section class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-5" data-section-id="<?php echo esc_attr( $section['id'] ); ?>">
			<header class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-1">
				<h2 class="newspack-ui__font--l newspack-ui__font--bold newspack-ui__spacing-top--0 newspack-ui__spacing-bottom--0">
					<?php echo esc_html( $section['label'] ); ?>
				</h2>
				<?php if ( ! empty( $section['description'] ) ) : ?>
					<p class="newspack-ui__color--neutral-60 newspack-ui__spacing-top--0 newspack-ui__spacing-bottom--0">
						<?php echo esc_html( $section['description'] ); ?>
					</p>
				<?php endif; ?>
			</header>
			<div class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-5" role="list">
				<?php
				$total = count( $section['lists'] );
				foreach ( $section['lists'] as $index => $list ) {
					\load_template(
						__DIR__ . '/partials/newsletters-row.php',
						false,
						[ 'list' => $list ]
					);
					// Hairline separator between rows. <hr> is styled by
					// newspack-ui's _dividers.scss as a 1px line; vertical
					// stack zeroes its default margins so __stack--gap-5
					// alone controls spacing. No scoped CSS needed.
					if ( $index < $total - 1 ) {
						echo '<hr aria-hidden="true" />';
					}
				}
				?>
			</div>
		</section>
	<?php endforeach; ?>

	<?php if ( ! empty( $unsubscribe_from_all['enabled'] ) ) : ?>
		<section
			class="newspack-my-account__v2-demo-newsletters__unsubscribe-all newspack-ui__stack newspack-ui__stack--horizontal newspack-ui__stack--gap-5 newspack-ui__stack--align-center newspack-ui__stack--justify-between"
			data-section-id="unsubscribe-all"
		>
			<div class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-1">
				<h2 class="newspack-ui__font--l newspack-ui__font--bold newspack-ui__spacing-top--0 newspack-ui__spacing-bottom--0">
					<?php echo esc_html( $unsubscribe_from_all['title'] ); ?>
				</h2>
				<p class="newspack-ui__color--neutral-60 newspack-ui__spacing-top--0 newspack-ui__spacing-bottom--0">
					<?php echo esc_html( $unsubscribe_from_all['description'] ); ?>
				</p>
			</div>
			<button
				type="button"
				class="newspack-ui__button newspack-ui__button--secondary"
				data-action="unsubscribe-from-all"
			>
				<?php echo esc_html( $unsubscribe_from_all['label'] ); ?>
			</button>
		</section>
	<?php endif; ?>
</div>
