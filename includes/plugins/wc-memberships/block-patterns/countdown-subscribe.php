<?php
/**
 * Content Gate Countdown with Subscribe Button Pattern.
 *
 * @package Newspack
 */

?>
<!-- wp:group {"className":"is-style-border","layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-border">
<!-- wp:columns {"verticalAlignment":null} -->
<div class="wp-block-columns">
<!-- wp:column {"verticalAlignment":"center","width":"20%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:20%">
<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","orientation":"horizontal","verticalAlignment":"center","justifyContent":"left"}} -->
<div class="wp-block-group">
<!-- wp:newspack/content-gate-countdown {"textColor":"primary"} /-->

<!-- wp:paragraph {"style":{"typography":{"textTransform":"uppercase"}},"textColor":"secondary-variation"} -->
<p class="has-secondary-variation-color has-text-color" style="text-transform:uppercase">Free articles this week</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:column -->

<!-- wp:column {"width":"50%"} -->
<div class="wp-block-column" style="flex-basis:50%">
<!-- wp:heading {"textAlign":"center","level":4} -->
<h4 class="wp-block-heading has-text-align-center" id="h-get-unlimited-access">Get unlimited access.</h4>
<!-- /wp:heading -->

<!-- wp:newspack-blocks/checkout-button {"text":"Subscribe","backgroundColor":"primary","textColor":"secondary","align":"center"} /-->
</div>
<!-- /wp:column -->

<!-- wp:column {"width":"20%"} -->
<div class="wp-block-column" style="flex-basis:20%"></div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->
