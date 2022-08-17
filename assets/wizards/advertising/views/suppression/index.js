/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Fragment, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	Card,
	Button,
	CategoryAutocomplete,
	SectionHeader,
	Waiting,
	withWizardScreen,
} from '../../../../components/src';

const Suppression = () => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ config, setConfig ] = useState( false );
	const fetchConfig = () => {
		apiFetch( { path: '/newspack-ads/v1/suppression' } ).then( setConfig );
	};
	const updateConfig = () => {
		setInFlight( true );
		apiFetch( {
			path: '/newspack-ads/v1/suppression',
			method: 'POST',
			data: { config },
		} )
			.then( setConfig )
			.finally( () => {
				setInFlight( false );
			} );
	};
	useEffect( fetchConfig, [] );
	if ( config === false ) {
		return <Waiting />;
	}
	console.log( config );
	return (
		<>
			<SectionHeader
				title={ __( 'Tag Archive Pages', 'newspack' ) }
				description={ __(
					'Suppress ads on automatically generated pages displaying a list of posts with a tag.',
					'newspack'
				) }
			/>
			<CategoryAutocomplete
				disabled={ config.tag_archive_pages === true }
				value={ config.specific_tag_archive_pages.map( v => parseInt( v ) ) }
				onChange={ selected => {
					setConfig( {
						...config,
						specific_tag_archive_pages: selected.map( item => item.id ),
					} );
				} }
				label={ __( 'Specific tags archive pages', 'newspack ' ) }
				taxonomy="tags"
			/>
			<ToggleControl
				disabled={ config === false }
				checked={ config?.tag_archive_pages }
				onChange={ tag_archive_pages => {
					setConfig( { ...config, tag_archive_pages } );
				} }
				label={ __( 'All tag archive pages', 'newspack' ) }
			/>
			<SectionHeader
				title={ __( 'Category Archive Pages', 'newspack' ) }
				description={ __(
					'Suppress ads on automatically generated pages displaying a list of posts of a category.',
					'newspack'
				) }
			/>
			<CategoryAutocomplete
				disabled={ config.category_archive_pages === true }
				value={ config.specific_category_archive_pages.map( v => parseInt( v ) ) }
				onChange={ selected => {
					setConfig( {
						...config,
						specific_category_archive_pages: selected.map( item => item.id ),
					} );
				} }
				label={ __( 'Specific category archive pages', 'newspack ' ) }
			/>
			<ToggleControl
				disabled={ config === false }
				checked={ config?.category_archive_pages }
				onChange={ category_archive_pages => {
					setConfig( { ...config, category_archive_pages } );
				} }
				label={ __( 'All category archive pages', 'newspack' ) }
			/>
			<SectionHeader
				title={ __( 'Author Archive Pages', 'newspack' ) }
				description={ __(
					'Suppress ads on automatically generated pages displaying a list of posts by an author.',
					'newspack'
				) }
			/>
			<ToggleControl
				disabled={ config === false }
				checked={ config?.author_archive_pages }
				onChange={ author_archive_pages => {
					setConfig( { ...config, author_archive_pages } );
				} }
				label={ __( 'Suppress ads on author archive pages', 'newspack' ) }
			/>{ ' ' }
			<Card buttonsCard noBorder className="justify-end">
				<Button isPrimary disabled={ inFlight } onClick={ updateConfig }>
					{ __( 'Save', 'newspack' ) }
				</Button>
			</Card>
		</>
	);
};

export default withWizardScreen( Suppression );
