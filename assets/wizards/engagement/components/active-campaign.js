/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Notice, SectionHeader, SelectControl } from '../../../components/src';

export default function ActiveCampaign( { value, onChange } ) {
	const [ inFlight, setInFlight ] = useState( false );
	const [ lists, setLists ] = useState( [] );
	const [ error, setError ] = useState( false );
	const fetchLists = () => {
		setError( false );
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/newsletters/lists',
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
					noticeText={ error?.message || __( 'Something went wrong.', 'newspack' ) }
					isError
				/>
			) }
			<SectionHeader
				title={ __( 'ActiveCampaign', 'newspack' ) }
				description={ __( 'Settings for the ActiveCampaign integration.', 'newspack' ) }
			/>
			<SelectControl
				label={ __( 'Master List', 'newspack' ) }
				help={ __( 'Choose a list to which all registered readers will be added.', 'newspack' ) }
				disabled={ inFlight }
				value={ value.masterList }
				onChange={ handleChange( 'masterList' ) }
				options={ [
					{ value: '', label: __( 'None', 'newspack' ) },
					...lists.map( list => ( { label: list.name, value: list.id } ) ),
				] }
			/>
		</>
	);
}
