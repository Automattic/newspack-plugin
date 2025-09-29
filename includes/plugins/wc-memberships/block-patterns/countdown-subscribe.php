<?php
/**
 * Content Gate Countdown with Subscribe Button Pattern.
 *
 * @package Newspack
 */

?>
<!-- wp:group {"metadata":{"categories":["newspack-memberships"],"patternName":"newspack-memberships/countdown-subscribe","name":"Countdown with Subscribe"},"className":"is-style-border","style":{"spacing":{"padding":{"top":"0","bottom":"0"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-border" style="padding-top:0;padding-bottom:0">
<!-- wp:columns {"verticalAlignment":null} -->
<div class="wp-block-columns">
<!-- wp:column {"verticalAlignment":"center","width":"20%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:20%">
<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","orientation":"horizontal","verticalAlignment":"center","justifyContent":"left"}} -->
<div class="wp-block-group">
<!-- wp:newspack/content-gate-countdown {"textColor":"primary"} /-->

<!-- wp:paragraph {"style":{"typography":{"textTransform":"uppercase"}},"textColor":"contrast","fontSize":"small"} -->
<p class="has-contrast-color has-text-color has-small-font-size" style="text-transform:uppercase">Free articles this week</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:column -->

<!-- wp:column {"width":"60%"} -->
<div class="wp-block-column" style="flex-basis:60%">
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
