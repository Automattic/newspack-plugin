/**
 * Starter Content Installer
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';
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
	postCount = newspack_aux_data.is_e2e ? 12 : 40,
} ) => {
	const [ progress, setProgress ] = useState( 0 );
	const [ total, setTotal ] = useState( 0 );
	const increment = () => {
		setProgress( progress + 1 );
		if ( progress > total ) {
			onComplete();
		}
	};
	const install = () => {
		// there are 12 categories in starter content, this will result in one post in each for e2e
		setProgress( 1 );
		setTotal( postCount + 3 );

		apiFetch( {
			path: `/newspack/v1/wizard/newspack-setup-wizard/starter-content/categories`,
			method: 'post',
		} ).then( increment );

		const postsPromises = [];
		for ( let x = 0; x < postCount; x++ ) {
			postsPromises.push(
				apiFetch( {
					path: `/newspack/v1/wizard/newspack-setup-wizard/starter-content/post/${ x }`,
					method: 'post',
				} )
					.then( increment )
					.catch( increment )
			);
		}

		Promise.all( postsPromises );

		apiFetch( {
			path: `/newspack/v1/wizard/newspack-setup-wizard/starter-content/homepage`,
			method: 'post',
		} ).then( increment );

		apiFetch( {
			path: `/newspack/v1/wizard/newspack-setup-wizard/starter-content/theme`,
			method: 'post',
		} ).then( increment );
	};
	return progress ? (
		<ProgressBar completed={ progress } total={ total } displayFraction />
	) : (
		<Button isPrimary onClick={ () => install() }>
			{ __( 'Install', 'newspack' ) }
		</Button>
	);
};

export default StarterContentInstaller;
