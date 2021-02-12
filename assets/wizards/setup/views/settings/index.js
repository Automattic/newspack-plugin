/**
 * WordPress dependencies
 */
import { Fragment, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import {
	SelectControl,
	TextControl,
	ImageUpload,
	withWizardScreen,
	hooks,
} from '../../../../components/src';

const pageTitleTemplate = document.title.replace( newspack_aux_data.site_title, '__SITE_TITLE__' );

/**
 * Settings Setup Screen.
 */
const Settings = ( { setError, wizardApiFetch, renderPrimaryButton } ) => {
	const [ { currencies = [], countries = [], wpseoFields = [] }, setOptions ] = useState( {} );
	const [ profileData, updateProfileData, isLoading ] = hooks.useObjectState( {} );

	useEffect( () => {
		wizardApiFetch( { path: '/newspack/v1/profile/', method: 'GET' } )
			.then( response => {
				setOptions( {
					currencies: response.currencies,
					countries: response.countries,
					wpseoFields: response.wpseo_fields,
				} );
				updateProfileData( response.profile, { skipCallback: true } );
			} )
			.catch( setError );
	}, [] );

	const updateProfile = () =>
		apiFetch( {
			path: '/newspack/v1/profile/',
			method: 'POST',
			data: { profile: profileData },
		} );

	useEffect( () => {
		if ( typeof profileData.site_title === 'string' ) {
			document.title = pageTitleTemplate.replace( '__SITE_TITLE__', profileData.site_title );
		}
	}, [ profileData.site_title ] );

	const renderSetting = ( { options, label, key, type, placeholder, className } ) => {
		if ( options ) {
			return (
				<SelectControl
					disabled={ isLoading }
					label={ label }
					value={ profileData[ key ] }
					onChange={ updateProfileData( key ) }
					options={ options }
					className={ className }
				/>
			);
		}
		if ( type === 'image' ) {
			return (
				<ImageUpload
					label={ label }
					style={ { width: '160px', height: '136px' } }
					className={ classnames(
						'ba flex br2 b--light-gray items-center justify-around flex-column',
						className
					) }
					image={ profileData[ key ] }
					onChange={ updateProfileData( key ) }
				/>
			);
		}
		return (
			<TextControl
				disabled={ isLoading }
				label={ label }
				value={ profileData[ key ] || '' }
				onChange={ updateProfileData( key ) }
				placeholder={ placeholder }
				className={ className }
			/>
		);
	};

	return (
		<Fragment>
			<h2>{ __( 'Site profile', 'newspack' ) }</h2>
			<span>{ __( 'Add and manage the basic information', 'newspack' ) }</span>
			<div className="cf">
				<div className="fl w-100 w-20-l">
					{ renderSetting( { key: 'site_icon', label: __( 'Site Icon' ), type: 'image' } ) }
				</div>
				<div className="fl w-100 w-50-l pr4-l pl3-l">
					{ renderSetting( { key: 'site_title', label: __( 'Site Title' ) } ) }
					{ renderSetting( { key: 'tagline', label: __( 'Tagline' ) } ) }
				</div>
				<div className="fl w-100 w-30-l">
					{ renderSetting( {
						options: countries,
						key: 'country',
						label: __( 'Where is your business based?' ),
					} ) }
					{ renderSetting( { options: currencies, key: 'currency', label: __( 'Currency' ) } ) }
				</div>
			</div>
			<h2>{ __( 'Social accounts', 'newspack' ) }</h2>
			<span>{ __( 'Allow visitors to quickly access your social profiles', 'newspack' ) }</span>
			<div className="cf">
				{ wpseoFields.map( ( seoField, i ) => (
					<span className="fl w-100 w-third-l" key={ seoField.key }>
						{ renderSetting( {
							...seoField,
							className: classnames( ( i + 1 ) % 3 === 2 && 'ph3-l' ),
						} ) }
					</span>
				) ) }
			</div>
			<div className="newspack-buttons-card">
				{ renderPrimaryButton( { onClick: updateProfile } ) }
			</div>
		</Fragment>
	);
};

export default withWizardScreen( Settings, { hidePrimaryButton: true } );
