/* global newspack_plugin_info, jQuery */

/**
 * Internal dependencies.
 */
import './plugins-screen.scss';

/**
 * Extra zazz for the WP Admin Plugins page.
 *
 * @see Admin_Plugins_Screen::enqueue_scripts_and_styles().
 */
( function ( $ ) {
	// Display a modal when adding a new plugin.
	if (
		newspack_plugin_info.screen === 'plugin-install.php' &&
		newspack_plugin_info.plugin_review_link
	) {
		const modalEl = document.createElement( 'div' );
		const modalContentEl = document.createElement( 'div' );
		const modalMessageEl = document.createElement( 'div' );
		const modalHeadingEl = document.createElement( 'h1' );
		const modalPEl = document.createElement( 'p' );
		const modalLinkEl = document.createElement( 'a' );
		const modalCloseWrapperEl = document.createElement( 'div' );
		const modalCloseEl = document.createElement( 'button' );

		modalEl.classList.add( 'newspack-plugin-info-modal' );
		modalHeadingEl.innerText = wp.i18n.__( 'Before installing a new plugin', 'newspack' );
		modalPEl.innerText = wp.i18n.__( 'Please fill out this form:', 'newspack' );
		modalCloseEl.innerText = wp.i18n.__( 'Close', 'newspack' );
		modalCloseEl.onclick = () => {
			modalEl.classList.add( 'newspack-plugin-info-modal--hidden' );
		};
		modalLinkEl.setAttribute( 'href', newspack_plugin_info.plugin_review_link );
		modalLinkEl.setAttribute( 'target', '_blank' );
		modalLinkEl.innerText = wp.i18n.__( 'Plugin review form', 'newspack' );

		modalEl.appendChild( modalContentEl );
		modalMessageEl.appendChild( modalHeadingEl );
		modalMessageEl.appendChild( modalPEl );
		modalMessageEl.appendChild( modalLinkEl );
		modalContentEl.appendChild( modalMessageEl );
		modalCloseWrapperEl.appendChild( modalCloseEl );
		modalContentEl.appendChild( modalCloseWrapperEl );
		document.body.appendChild( modalEl );
	}

	// Add a 'newspack_plugin' class to managed plugins.
	if ( newspack_plugin_info.screen === 'plugins.php' ) {
		newspack_plugin_info.plugins.forEach( function ( plugin_slug ) {
			const $row = $( 'tr[data-slug="' + plugin_slug + '"]' );
			if ( $row.length ) {
				$row.addClass( 'newspack-plugin' );
			}

			if ( ! newspack_plugin_info.installed_plugins.includes( plugin_slug ) ) {
				$row.addClass( 'uninstalled' );
			}
		} );
	}
} )( jQuery );
