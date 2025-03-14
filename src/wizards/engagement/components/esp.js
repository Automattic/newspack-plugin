/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Notice, SectionHeader, SelectControl } from '../../../components/src';

export default function ESP( { title, value, onChange } ) {
	const [ inFlight, setInFlight ] = useState( false );
	const [ lists, setLists ] = useState( [] );
	const [ error, setError ] = useState( false );
	const fetchLists = () => {
		setError( false );
		setInFlight( true );
		apiFetch( {
			path: '/newspack-newsletters/v1/lists',
		} )
			.then( setLists )
			.catch( setError )
			.finally( () => setInFlight( false ) );
	};
	useEffect( fetchLists, [] );
	const handleChange = key => val => onChange && onChange( key, val );
	return (
		<>
			{ error && (
				<Notice
					noticeText={ error?.message || __( 'Something went wrong.', 'newspack-plugin' ) }
					isError
				/>
			) }
			<SectionHeader
				title={ sprintf( /** Translators: %s is the email service provider title */ __( '%s settings', 'newspack-plugin' ), title ) }
				description={ sprintf( /** Translators: %s is the email service provider title */ __( 'Settings for the %s integration.', 'newspack-plugin' ), title ) }
			/>
			{ value.masterList === '' && (
				<Notice
					noticeText={ sprintf(
						// Translators: %s is the email service provider title
						__(
							'No Master List selected. You will not be able to send reader activity data to %s.',
							'newspack-plugin'
						),
						title
					) }
					isError
				/>
			)}
			<SelectControl
				label={ __( 'Master List', 'newspack-plugin' ) }
				help={ __(
					'Choose a list to which all registered readers will be added.',
					'newspack-plugin'
				) }
				disabled={ inFlight }
				value={ value.masterList }
				onChange={ handleChange( 'masterList' ) }
				options={ [
					{ value: '', label: __( 'None', 'newspack-plugin' ) },
					...lists.map( list => ( { label: list.name, value: list.id } ) ),
				] }
			/>
		</>
	);
}
