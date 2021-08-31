/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { SelectControl, Notice, Waiting } from '../../../../components/src';

const NewslettersSettings = ( { listId, onChange } ) => {
	const [ newslettersLists, setNewsletterLists ] = useState( false );

	useEffect( () => {
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/newsletters/lists',
		} )
			.then( setNewsletterLists )
			.catch( error => {
				setNewsletterLists( { error } );
			} );
	}, [] );

	if ( newslettersLists === false ) {
		return <Waiting />;
	}
	if ( newslettersLists.error ) {
		return <Notice isError noticeText={ newslettersLists.error.message } />;
	}
	return (
		<>
			<Notice
				noticeText={
					<span>
						{ __( 'You can configure Newsletters in', 'newspack' ) }{' '}
						<a href="/wp-admin/admin.php?page=newspack-engagement-wizard#/newsletters">
							{ __( 'Enagement Wizard', 'newspack' ) }
						</a>
						.
					</span>
				}
			/>
			<SelectControl
				value={ listId }
				label={ __( 'Chosen list', 'newspack' ) }
				options={ [
					{ value: '', label: __( '-- Choose a list --', 'newspack' ) },
					...newslettersLists.map( item => ( { value: item.id, label: item.name } ) ),
				] }
				onChange={ onChange }
			/>
		</>
	);
};

export default NewslettersSettings;
