/* eslint-disable @wordpress/no-unsafe-wp-apis */

/* globals newspack_editor_data */

/**
 * Block editor extensions for any Newspack custom post type.
 */

/**
 * WordPress dependencies
 */
import {
	__experimentalMainDashboardButton as MainDashboardButton,
	__experimentalFullscreenModeClose as FullscreenModeClose,
} from '@wordpress/edit-post';
import { registerPlugin } from '@wordpress/plugins';

const { editor_wizard: editorWizard = false } = newspack_editor_data || {};

// If the current post type has a custom wizard page, relink the full-screen close button to that page.
if ( editorWizard ) {
	registerPlugin( 'main-dashboard-button-replace', {
		render: () => (
			<MainDashboardButton>
				<FullscreenModeClose href={ editorWizard } />
			</MainDashboardButton>
		),
	} );
}
