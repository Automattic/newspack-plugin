/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ThemeSelection } from '../../../site-design/views/theme-selection';
import { withWizardScreen, hooks } from '../../../../components/src';

const Design = ( { wizardApiFetch, setError } ) => {
	const [ selected, updateSelected ] = hooks.useObjectState( { theme: null } );
	useEffect( () => {
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-setup-wizard/theme',
		} )
			.then( updateSelected )
			.catch( setError );
	}, [] );

	const updateTheme = theme => {
		const params = {
			path: '/newspack/v1/wizard/newspack-setup-wizard/theme/' + theme,
			method: 'POST',
		};
		wizardApiFetch( params )
			.then( updateSelected )
			.catch( setError );
	};

	return <ThemeSelection updateTheme={ updateTheme } theme={ selected.theme } />;
};

export default withWizardScreen( Design );
