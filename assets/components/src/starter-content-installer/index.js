/**
 * Starter Content Installer
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Button, ProgressBar } from '../';

/**
 * Starter Content Installer
 */
const StarterContentInstaller = ( {
	onComplete = () => null,
	initButton,
	inProgress,
	postCount = 6,
} ) => {
	const [ requestStack, setRequestStack ] = useState( [] );
	const [ progress, setProgress ] = useState( 0 );

	useEffect( () => {
		if ( ! progress ) {
			return;
		}
		const endpoint = requestStack[ progress ];
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-setup-wizard/starter-content/' + endpoint,
			method: 'POST',
		} ).then( () => {
			if ( progress < requestStack.length ) {
				setProgress( progress + 1 );
			} else {
				onComplete();
			}
		} );
	}, [ progress, requestStack ] );

	const install = () => {
		const stack = [ 'categories' ];
		for ( let x = 0; x < postCount; x++ ) {
			stack.push( `post/${ x }` );
		}
		stack.push( 'homepage' );
		stack.push( 'theme' );
		setRequestStack( stack );
		setProgress( 1 );
	};

	if ( ! progress ) {
		return (
			<Button isPrimary onClick={ () => install() }>
				{ __( 'Install', 'newspack' ) }
			</Button>
		);
	}

	return <ProgressBar completed={ progress } total={ requestStack.length } displayFraction />;
};

export default StarterContentInstaller;
