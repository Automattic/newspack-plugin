/**
 * Content Gates edit component.
 */

/**
 * WordPress dependencies.
 */
import { __, sprintf } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CardSettingsGroup, Divider, Grid, SectionHeader, TextControl } from '../../../../../../packages/components/src';
import { WIZARD_STORE_NAMESPACE } from '../../../../../../packages/components/src/wizard/store';
import { account, currency, content, settings } from '../../../../../../packages/icons';
import ContentRules from './content-rules';
import Registration from './registration';
import CustomAccess from './custom-access';
import './style.scss';

type ContentGateEditProps = {
	gate?: Gate;
	match: { params: { id: string; type: string } };
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

const Edit = ( { match }: ContentGateEditProps ) => {
	const { id, type } = match.params;
	const [ gate, setGate ] = useState< Gate >( DEFAULT_GATE ); // eslint-disable-line @typescript-eslint/no-unused-vars
	const [ title, setTitle ] = useState< string >( gate.title );
	const [ contentRules, setContentRules ] = useState< GateContentRule[] >( gate.content_rules );
	const [ registration, setRegistration ] = useState< Registration >( gate.registration );
	const [ customAccess, setCustomAccess ] = useState< CustomAccess >( gate.custom_access );
	const [ contentType, setContentType ] = useState< 'all' | 'custom' | undefined >( type as 'all' | 'custom' | undefined );
	const { setHeaderSection } = useDispatch( WIZARD_STORE_NAMESPACE );

	const isNew = id === 'new';

	useEffect( () => {
		setHeaderSection( isNew ? __( 'Add new', 'newspack-plugin' ) : __( 'Edit', 'newspack-plugin' ) );
	}, [ isNew, setHeaderSection ] );

	// Update gate settings.
	useEffect( () => {
		setGate( {
			...gate,
			title,
			content_rules: contentType === 'all' ? DEFAULT_GATE.content_rules : contentRules,
			registration,
			custom_access: customAccess,
		} );
	}, [ contentRules, contentType, registration, customAccess, title ] );

	return (
		<div className="newspack-content-gate__edit">
			<SectionHeader
				backNav="#/content-gates"
				heading={ 1 }
				title={ sprintf(
					/* translators: %s is Add new or Edit. */
					__( '%s content gate', 'newspack-plugin' ),
					isNew ? __( 'Add new', 'newspack-plugin' ) : __( 'Edit', 'newspack-plugin' )
				) }
			/>
			{ isNew && (
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
			) }
			<Divider alignment="full-width" />
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
