/**
 * Content Gates edit component.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { AUDIENCE_CONTENT_GATES_WIZARD_SLUG } from '../consts';
import { CardSettingsGroup, Divider, Grid, Notice, SectionHeader, TextControl } from '../../../../../../packages/components/src';
import { WIZARD_STORE_NAMESPACE } from '../../../../../../packages/components/src/wizard/store';
import { useWizardData } from '../../../../../../packages/components/src/wizard/store/utils';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';
import { account, currency, content, settings } from '../../../../../../packages/icons';
import ContentRules from './content-rules';
import Registration from './registration';
import CustomAccess from './custom-access';
import { getGateStatus, getGateStatusBadgeLevel } from '../utils';
import './style.scss';

type ContentGateEditProps = {
	history: { push: ( path: string ) => void };
	match: { params: { id: string; type: string } };
	updateGatesData: ( gates: Gate[] ) => void;
};

const DEFAULT_GATE: Gate = {
	id: 0,
	title: '',
	priority: 0,
	status: 'publish',
	content_rules: [ { slug: 'post_types', value: [ 'post' ] } ],
	registration: { active: false, metering: { enabled: false, count: 1, period: 'month' }, require_verification: false, gate_layout_id: 0 },
	custom_access: { active: false, metering: { enabled: false, count: 1, period: 'month' }, gate_layout_id: 0, access_rules: [] },
};

const getContentTypeFromRules = ( rules: GateContentRule[] ): 'all' | 'custom' | undefined => {
	if ( rules.length === 0 ) {
		return undefined;
	}
	if ( rules.length !== 1 ) {
		return 'custom';
	}
	const [ rule ] = rules;
	if ( rule.slug !== 'post_types' || ! Array.isArray( rule.value ) ) {
		return 'custom';
	}
	if ( rule.value.length !== 1 || rule.value[ 0 ] !== 'post' ) {
		return 'custom';
	}
	return 'all';
};

const Edit = ( { history, match, updateGatesData }: ContentGateEditProps ) => {
	const { id: _id, type } = match.params;
	const id = _id ? parseInt( _id ) : 0;
	const { gates = [] as Gate[] } = useWizardData( AUDIENCE_CONTENT_GATES_WIZARD_SLUG ) as WizardData;
	const { wizardApiFetch, isFetching, errorMessage, resetError } = useWizardApiFetch( AUDIENCE_CONTENT_GATES_WIZARD_SLUG );
	const { setHeaderSection, setHeaderActions } = useDispatch( WIZARD_STORE_NAMESPACE );
	const [ gate, setGate ] = useState< Gate >( gates.find( g => g.id === id ) || DEFAULT_GATE ); // eslint-disable-line @typescript-eslint/no-unused-vars
	const [ title, setTitle ] = useState< string >( gate.title );
	const [ isRenaming, setIsRenaming ] = useState< boolean >( false );
	const [ contentRules, setContentRules ] = useState< GateContentRule[] >( gate.content_rules );
	const [ registration, setRegistration ] = useState< Registration >( gate.registration );
	const [ customAccess, setCustomAccess ] = useState< CustomAccess >( gate.custom_access );
	const [ contentType, setContentType ] = useState< 'all' | 'custom' | undefined >( type as 'all' | 'custom' | undefined );
	const [ status, setStatus ] = useState< GateStatus >( gate.status );

	const isNew = _id === 'new' || ! id;

	const handleCreate = () => {
		if ( isFetching ) {
			return;
		}
		resetError();
		const _gate = {
			...gate,
			title,
			status: 'draft',
			content_rules: contentRules,
			registration,
			custom_access: customAccess,
		};
		wizardApiFetch< Gate >(
			{
				path: `/newspack/v1/wizard/${ AUDIENCE_CONTENT_GATES_WIZARD_SLUG }`,
				method: 'POST',
				data: { gate: _gate },
			},
			{
				onSuccess( data ) {
					updateGatesData( [ ...gates, { ...data } ] );
					history.push( `/edit/${ data.id }` );
				},
			}
		);
	};

	const handleSave = useCallback( () => {
		if ( isFetching ) {
			return;
		}
		resetError();
		const _gate = {
			...gate,
			title,
			content_rules: contentRules,
			registration,
			custom_access: customAccess,
			status,
		};
		wizardApiFetch< Gate >(
			{
				path: `/newspack/v1/wizard/${ AUDIENCE_CONTENT_GATES_WIZARD_SLUG }/${ gate.id }`,
				method: 'POST',
				data: { gate: _gate },
			},
			{
				onSuccess( data: Gate ) {
					updateGatesData( gates.map( g => ( g.id === data.id ? data : g ) ) );
					setIsRenaming( false );
				},
			}
		);
	}, [ gate, contentRules, registration, customAccess, status, title ] );

	const handleStatusChange = ( _status: GateStatus ) => {
		setStatus( _status );
	};

	const handleDelete = ( gateId: number ) => {
		// eslint-disable-next-line no-alert
		if ( ! confirm( __( 'Are you sure you want to permanently delete this content gate?', 'newspack-plugin' ) ) ) {
			return;
		}
		resetError();
		wizardApiFetch(
			{
				path: `/newspack/v1/wizard/${ AUDIENCE_CONTENT_GATES_WIZARD_SLUG }/${ gateId }`,
				method: 'DELETE',
			},
			{
				onSuccess() {
					const newGates = gates.filter( g => g.id !== gateId );
					updateGatesData( newGates );
					history.push( `/content-gates` );
				},
			}
		);
	};

	// Set header actions.
	const actions = useMemo( () => {
		const _actions = [
			{
				type: 'primary',
				label: __( 'Save', 'newspack-plugin' ),
				action: isNew ? handleCreate : handleSave,
				disabled: isFetching || ! title || ! contentRules.length || ( ! registration.active && ! customAccess.active ),
			},
		];
		if ( ! isNew ) {
			if ( ! isRenaming ) {
				_actions.push( {
					type: 'more',
					label: __( 'Rename', 'newspack-plugin' ),
					action: () => setIsRenaming( true ),
					disabled: isFetching,
				} );
			}
			if ( gate.status !== 'publish' ) {
				_actions.push( {
					type: 'more',
					label: __( 'Activate', 'newspack-plugin' ),
					action: () => handleStatusChange( 'publish' ),
					disabled: isFetching,
				} );
			} else {
				_actions.push( {
					type: 'more',
					label: __( 'Deactivate', 'newspack-plugin' ),
					action: () => handleStatusChange( 'draft' ),
					disabled: isFetching,
				} );
			}
			_actions.push( {
				type: 'more',
				label: __( 'Delete', 'newspack-plugin' ),
				action: () => handleDelete( gate.id ),
				disabled: isFetching,
				destructive: true,
			} );
		}
		return _actions;
	}, [ contentRules, customAccess, isFetching, isRenaming, registration, title ] );

	// Load gate data.
	useEffect( () => {
		if ( isNew ) {
			return;
		}
		const matchedGate = gates.find( g => g.id === id );
		if ( ! matchedGate ) {
			return;
		}
		setGate( matchedGate );
		setTitle( matchedGate.title );
		setContentRules( matchedGate.content_rules );
		setRegistration( matchedGate.registration );
		setCustomAccess( matchedGate.custom_access );
		setStatus( matchedGate.status );
		setContentType( getContentTypeFromRules( matchedGate.content_rules ) );
		setHeaderSection( isNew ? __( 'Add new', 'newspack-plugin' ) : __( 'Edit', 'newspack-plugin' ) );
	}, [ gates, id, isNew ] );

	// Update header actions.
	useEffect( () => {
		setHeaderActions( actions );
	}, [ actions, setHeaderActions ] );

	// Update content rules.
	useEffect( () => {
		setContentRules( contentType === 'all' ? DEFAULT_GATE.content_rules : contentRules );
	}, [ contentType ] );

	// Update gate status.
	useEffect( () => {
		if ( status !== gate.status ) {
			handleSave();
		}
	}, [ status ] );

	return (
		<div className="newspack-content-gate__edit">
			{ errorMessage && <Notice isError noticeText={ errorMessage } /> }
			<SectionHeader
				backNav="#/content-gates"
				heading={ 1 }
				title={ isNew ? __( 'Add new content gate', 'newspack-plugin' ) : title || __( 'Untitled content gate', 'newspack-plugin' ) }
				badge={ isNew ? undefined : getGateStatus( gate.status ) }
				badgeLevel={ isNew ? undefined : getGateStatusBadgeLevel( gate.status ) }
			/>
			{ ( isNew || isRenaming ) && (
				<>
					<Grid columns={ 2 } gutter={ 32 }>
						<SectionHeader
							heading={ 2 }
							title={ __( 'What should we call this gate?', 'newspack-plugin' ) }
							description={ __( 'Choose a name to help you find this gate later. It won’t be shown to readers.', 'newspack-plugin' ) }
						/>
						<TextControl
							label={ __( 'Content gate name', 'newspack-plugin' ) }
							placeholder={ __( 'e.g. Premium Articles', 'newspack-plugin' ) }
							value={ title }
							onChange={ setTitle }
							hideLabelFromVision
							__next40pxDefaultSize
						/>
					</Grid>
					<Divider alignment="full-width" />
				</>
			) }
			<Grid columns={ 2 } gutter={ 32 }>
				<SectionHeader
					heading={ 2 }
					title={ __( 'What would you like to restrict?', 'newspack-plugin' ) }
					description={ __( 'Choose whether to restrict all posts or select specific content.', 'newspack-plugin' ) }
				/>
				<VStack style={ { gap: 0 } }>
					<CardSettingsGroup
						actionType="chevron"
						title={ __( 'Restrict all posts', 'newspack-plugin' ) }
						description={ __( 'All posts on your site will require access.', 'newspack-plugin' ) }
						icon={ content }
						isActive={ contentType === 'all' }
						onEnable={ () => setContentType( 'all' ) }
					/>
					<CardSettingsGroup
						actionType="chevron"
						title={ __( 'Choose specific content', 'newspack-plugin' ) }
						description={ __( 'Select which content to restrict using custom rules.', 'newspack-plugin' ) }
						icon={ settings }
						isActive={ contentType === 'custom' }
						onEnable={ () => setContentType( 'custom' ) }
					>
						<ContentRules rules={ contentRules } onChange={ setContentRules } />
					</CardSettingsGroup>
				</VStack>
			</Grid>
			<Divider alignment="full-width" />
			<Grid columns={ 2 } gutter={ 32 }>
				<SectionHeader
					heading={ 2 }
					title={ __( 'What’s required to access this content?', 'newspack-plugin' ) }
					description={ __(
						'Choose how readers can unlock this content. Enable registered access, paid access, or both. Each option can include metering to give readers limited free access before the restriction applies.',
						'newspack-plugin'
					) }
				/>
				<VStack style={ { gap: 0 } }>
					<CardSettingsGroup
						actionType="toggle"
						title={ __( 'Registered Access', 'newspack-plugin' ) }
						description={ __( 'Readers must log in to view this content.', 'newspack-plugin' ) }
						icon={ account }
						isActive={ registration?.active }
						onEnable={ () => setRegistration( { ...registration, active: ! registration.active } ) }
					>
						<Registration gateId={ gate.id } registration={ registration } onChange={ setRegistration } />
					</CardSettingsGroup>
					<CardSettingsGroup
						actionType="toggle"
						title={ __( 'Paid Access', 'newspack-plugin' ) }
						description={ __( 'Set conditions like subscriptions, domain, and more.', 'newspack-plugin' ) }
						icon={ currency }
						isActive={ customAccess?.active }
						onEnable={ () => setCustomAccess( { ...customAccess, active: ! customAccess.active } ) }
					>
						<CustomAccess gateId={ gate.id } customAccess={ customAccess } onChange={ setCustomAccess } />
					</CardSettingsGroup>
				</VStack>
			</Grid>
		</div>
	);
};
export default Edit;
