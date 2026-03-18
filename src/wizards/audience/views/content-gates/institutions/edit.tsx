/**
 * Institution editor — 2-column grid matching gate editor pattern.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack, TextareaControl, CardBody } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useDispatch } from '@wordpress/data';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { envelope, globe, customPostType } from '@wordpress/icons';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { CardSettingsGroup, Grid, Router, SectionHeader, TextControl, useConfirmDialog } from '../../../../../../packages/components/src';
import { WIZARD_STORE_NAMESPACE } from '../../../../../../packages/components/src/wizard/store';
import './style.scss';

const { useHistory } = Router;

const API_PATH = '/wp/v2/np_institution';

const EMPTY_INSTITUTION: Omit< Institution, 'id' > = {
	title: { raw: '', rendered: '' },
	excerpt: { raw: '', rendered: '' },
	status: 'publish',
	meta: {
		_np_institution_email_domain: '',
		_np_institution_ip_range: '',
		_np_institution_reader_data: '',
	},
};

export default function InstitutionEdit( { match }: { match: { params: { id: string } } } ) {
	const history = useHistory();
	const { id } = match.params;
	const isNew = id === 'new';

	const { setHeaderData } = useDispatch( WIZARD_STORE_NAMESPACE );

	const [ institution, setInstitution ] = useState( EMPTY_INSTITUTION );
	const [ isLoading, setIsLoading ] = useState( ! isNew );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ isDirty, setIsDirty ] = useState( false );

	useEffect( () => {
		if ( ! isNew ) {
			setIsLoading( true );
			apiFetch< Institution >( { path: `${ API_PATH }/${ id }?context=edit` } )
				.then( setInstitution )
				.finally( () => setIsLoading( false ) );
		}
	}, [ id, isNew ] );

	const updateField = useCallback( ( field: string, value: string ) => {
		setIsDirty( true );
		setInstitution( prev => ( {
			...prev,
			[ field ]:
				typeof prev[ field as keyof typeof prev ] === 'object' ? { ...( prev[ field as keyof typeof prev ] as object ), raw: value } : value,
		} ) );
	}, [] );

	const updateMeta = useCallback( ( key: string, value: string ) => {
		setIsDirty( true );
		setInstitution( prev => ( {
			...prev,
			meta: { ...prev.meta, [ key ]: value },
		} ) );
	}, [] );

	const handleSave = useCallback( () => {
		setIsSaving( true );
		const payload = {
			title: institution.title.raw,
			excerpt: institution.excerpt.raw,
			status: 'publish',
			meta: institution.meta,
		};
		const request = isNew
			? apiFetch( { path: API_PATH, method: 'POST', data: payload } )
			: apiFetch( { path: `${ API_PATH }/${ id }`, method: 'POST', data: payload } );

		request
			.then( () => {
				setIsDirty( false );
				history.push( '/institutions' );
			} )
			.finally( () => setIsSaving( false ) );
	}, [ institution, isNew, id, history ] );

	const handleDelete = useCallback( () => {
		apiFetch( { path: `${ API_PATH }/${ id }?force=true`, method: 'DELETE' } ).then( () => {
			setIsDirty( false );
			history.push( '/institutions' );
		} );
	}, [ id, history ] );

	// Set header navigation and actions.
	useEffect( () => {
		setHeaderData( {
			backNav: '#/institutions',
			sectionName: isNew ? __( 'Add institution', 'newspack-plugin' ) : __( 'Edit institution', 'newspack-plugin' ),
		} );
	}, [ isNew, setHeaderData ] );

	// Set header save/delete actions once handlers are ready.
	useEffect( () => {
		const actions: HeaderAction[] = [
			{
				type: 'primary',
				label: __( 'Save', 'newspack-plugin' ),
				icon: null,
				action: handleSave,
				disabled: isSaving || ! institution.title.raw,
			},
		];
		if ( ! isNew ) {
			actions.push( {
				type: 'more',
				label: __( 'Delete', 'newspack-plugin' ),
				icon: null,
				action: () => requestDelete( handleDelete ),
				disabled: isSaving,
				destructive: true,
			} );
		}
		setHeaderData( { actions } );
	}, [ handleSave, handleDelete, requestDelete, institution.title.raw, isNew, isSaving, setHeaderData ] );

	const { confirmDialog: navBlockDialog } = useConfirmDialog( {
		when: isDirty && ! isSaving,
		message: __( 'You have unsaved changes that will be lost. Discard changes?', 'newspack-plugin' ),
		confirmButtonText: __( 'Discard changes', 'newspack-plugin' ),
		hideTitle: true,
	} );

	const { confirmDialog: deleteDialog, requestConfirm: requestDelete } = useConfirmDialog( {
		title: __( 'Are you sure?', 'newspack-plugin' ),
		confirmButtonText: __( 'Delete', 'newspack-plugin' ),
		isDestructive: true,
		message: __( 'This will permanently delete this institution. This action cannot be undone.', 'newspack-plugin' ),
	} );

	if ( isLoading ) {
		return null;
	}

	const name = institution.title.raw;
	const description = institution.excerpt.raw;
	const {
		_np_institution_email_domain: emailDomain,
		_np_institution_ip_range: ipRange,
		_np_institution_reader_data: readerData,
	} = institution.meta;

	return (
		<div className="newspack-institution__edit">
			{ navBlockDialog }
			{ deleteDialog }

			{ /* Section 1: Name & Description */ }
			<Grid columns={ 2 } gutter={ 32 }>
				<SectionHeader
					title={ __( 'Name & Description', 'newspack-plugin' ) }
					description={ __(
						'Identify this institution for internal reference. The name and description are not shown to readers.',
						'newspack-plugin'
					) }
				/>
				<VStack spacing={ 4 }>
					<TextControl
						label={ __( 'Name', 'newspack-plugin' ) }
						value={ name }
						onChange={ ( val: string ) => updateField( 'title', val ) }
						required
					/>
					<TextareaControl
						label={ __( 'Description', 'newspack-plugin' ) }
						value={ description }
						onChange={ ( val: string ) => updateField( 'excerpt', val ) }
					/>
				</VStack>
			</Grid>

			{ /* Section 2: Access Rules */ }
			<Grid columns={ 2 } gutter={ 32 } noMargin>
				<SectionHeader
					title={ __( 'Access Rules', 'newspack-plugin' ) }
					description={ __(
						'Define how readers from this institution are identified. Rules use OR logic — matching any rule grants access.',
						'newspack-plugin'
					) }
				/>
				<VStack spacing={ 4 }>
					<CardSettingsGroup
						title={ __( 'Email Domain', 'newspack-plugin' ) }
						description={ __( 'Match readers by verified email domain', 'newspack-plugin' ) }
						icon={ envelope }
						actionType="toggle"
						isActive={ !! emailDomain }
						onEnable={ () => updateMeta( '_np_institution_email_domain', emailDomain ? '' : ' ' ) }
					>
						{ !! emailDomain && (
							<CardBody size="small">
								<TextControl
									label={ __( 'Domains (comma-separated)', 'newspack-plugin' ) }
									value={ emailDomain.trim() }
									onChange={ ( val: string ) => updateMeta( '_np_institution_email_domain', val ) }
									placeholder="university.edu, school.org"
								/>
							</CardBody>
						) }
					</CardSettingsGroup>

					<CardSettingsGroup
						title={ __( 'IP Range', 'newspack-plugin' ) }
						description={ __( 'Match visitors by IP address or CIDR block', 'newspack-plugin' ) }
						icon={ globe }
						actionType="toggle"
						isActive={ !! ipRange }
						onEnable={ () => updateMeta( '_np_institution_ip_range', ipRange ? '' : ' ' ) }
					>
						{ !! ipRange && (
							<CardBody size="small">
								<TextControl
									label={ __( 'IPs / CIDR blocks (comma-separated)', 'newspack-plugin' ) }
									value={ ipRange.trim() }
									onChange={ ( val: string ) => updateMeta( '_np_institution_ip_range', val ) }
									placeholder="192.168.1.0/24, 10.0.0.5"
								/>
							</CardBody>
						) }
					</CardSettingsGroup>

					<CardSettingsGroup
						title={ __( 'Reader Data', 'newspack-plugin' ) }
						description={ __( 'Match readers by custom metadata', 'newspack-plugin' ) }
						icon={ customPostType }
						actionType="toggle"
						isActive={ !! readerData }
						onEnable={ () => updateMeta( '_np_institution_reader_data', readerData ? '' : ' ' ) }
					>
						{ !! readerData && (
							<CardBody size="small">
								<TextControl
									label={ __( 'Key=value pairs (semicolon-delimited)', 'newspack-plugin' ) }
									value={ readerData.trim() }
									onChange={ ( val: string ) => updateMeta( '_np_institution_reader_data', val ) }
									placeholder="org=university;role=staff"
								/>
							</CardBody>
						) }
					</CardSettingsGroup>
				</VStack>
			</Grid>
		</div>
	);
}
