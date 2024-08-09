/* global newspack_plugin_info, jQuery */

/**
 * Internal dependencies.
 */
import './plugins-screen.scss';

const getCreateButton =
	targetEl =>
		( text, hrefOrCallback, isPrimary = false ) => {
			const buttonEl = document.createElement( 'a' );
			if ( typeof hrefOrCallback === 'string' ) {
				buttonEl.setAttribute( 'href', hrefOrCallback );
			} else if ( typeof hrefOrCallback === 'function' ) {
				buttonEl.onclick = hrefOrCallback;
			} else {
				return;
			}
			buttonEl.setAttribute( 'target', '_blank' );
			buttonEl.classList.add( `button-${ isPrimary ? 'primary' : 'secondary' }` );
			buttonEl.innerText = text;
			targetEl.appendChild( buttonEl );
			return buttonEl;
		};

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
		const modalHeadingEl = document.createElement( 'h1' );
		const modalPEl = document.createElement( 'p' );
		const modalButtonsWrapperEl = document.createElement( 'div' );
		const modalCloseEl = document.createElement( 'button' );
		const createButton = getCreateButton( modalButtonsWrapperEl );

		const closeModal = () => {
			modalEl.classList.add( 'newspack-plugin-info-modal--hidden' );
		};

		modalEl.classList.add( 'newspack-plugin-info-modal' );
		modalHeadingEl.innerText = wp.i18n.__( 'Plugin review required', 'newspack-plugin' );
		modalPEl.innerText = wp.i18n.__(
			'Please submit a plugin for review by the Newspack Team before installing it on your website. If you plan to install an approved plugin, feel free to close this message.',
			'newspack-plugin'
		);
		modalCloseEl.innerHTML =
			'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>';
		modalCloseEl.onclick = closeModal;

		createButton(
			wp.i18n.__( 'Plugin Review Form', 'newspack-plugin' ),
			newspack_plugin_info.plugin_review_link,
			true
		);
		createButton(
			wp.i18n.__( 'Approved Plugins List', 'newspack-plugin' ),
			newspack_plugin_info.approved_plugins_list_link
		);
		createButton( wp.i18n.__( 'Close this message', 'newspack-plugin' ), closeModal );

		modalEl.appendChild( modalContentEl );
		modalContentEl.appendChild( modalHeadingEl );
		modalContentEl.appendChild( modalPEl );
		modalContentEl.appendChild( modalCloseEl );
		modalContentEl.appendChild( modalButtonsWrapperEl );
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
