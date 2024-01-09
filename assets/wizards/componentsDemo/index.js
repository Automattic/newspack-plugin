import '../../shared/js/public-path';

/* eslint-disable jsx-a11y/anchor-is-valid */

/**
 * Components Demo
 */

/**
 * WordPress dependencies.
 */
import { Component, Fragment, render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { audio, home, plus, reusableBlock, typography } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import {
	ActionCard,
	AutocompleteWithSuggestions,
	Button,
	ButtonCard,
	Card,
	ColorPicker,
	Footer,
	Grid,
	Handoff,
	ImageUpload,
	Modal,
	NewspackIcon,
	Notice,
	PluginInstaller,
	PluginSettings,
	PluginToggle,
	ProgressBar,
	SelectControl,
	Waiting,
	WebPreview,
} from '../../components/src';

class ComponentsDemo extends Component {
	/**
	 * constructor. Demo of how the parent interacts with the components, and controls their values.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			selectedPostForAutocompleteWithSuggestions: [],
			selectedPostsForAutocompleteWithSuggestionsMultiSelect: [],
			image: null,
			selectValue1: '2nd',
			selectValue2: '',
			selectValue3: '',
			selectValues: [],
			modalShown: false,
			color1: '#3366ff',
		};
	}

	/**
	 * Render the example stub.
	 */
	render() {
		const {
			selectedPostForAutocompleteWithSuggestions,
			selectedPostsForAutocompleteWithSuggestionsMultiSelect,
			selectValue1,
			selectValue2,
			selectValue3,
			modalShown,
			actionCardToggleChecked,
			color1,
		} = this.state;

		return (
			<Fragment>
				{ newspack_aux_data.is_debug_mode && <Notice debugMode /> }
				<div className="newspack-wizard__header">
					<div className="newspack-wizard__header__inner">
						<div className="newspack-wizard__title">
							<Button
								isLink
								href={ newspack_urls.dashboard }
								label={ __( 'Return to Dashboard', 'newspack' ) }
								showTooltip={ true }
								icon={ home }
								iconSize={ 36 }
							>
								<NewspackIcon size={ 36 } />
							</Button>
							<div>
								<h2>{ __( 'Components Demo', 'newspack' ) }</h2>
								<span>
									{ __( 'Simple components used for composing the UI of Newspack', 'newspack' ) }
								</span>
							</div>
						</div>
					</div>
				</div>
				<div className="newspack-wizard newspack-wizard__content">
					<Card>
						<h2>{ __( 'Autocomplete with Suggestions (single-select)', 'newspack' ) }</h2>
						<AutocompleteWithSuggestions
							label={ __( 'Search for a post', 'newspack' ) }
							help={ __(
								'Begin typing post title, click autocomplete result to select.',
								'newspack'
							) }
							onChange={ items =>
								this.setState( { selectedPostForAutocompleteWithSuggestions: items } )
							}
							selectedItems={ selectedPostForAutocompleteWithSuggestions }
						/>

						<hr />

						<h2>{ __( 'Autocomplete with Suggestions (multi-select)', 'newspack' ) }</h2>
						<AutocompleteWithSuggestions
							hideHelp
							multiSelect
							label={ __( 'Search widgets', 'newspack' ) }
							help={ __(
								'Begin typing post title, click autocomplete result to select.',
								'newspack'
							) }
							onChange={ items =>
								this.setState( { selectedPostsForAutocompleteWithSuggestionsMultiSelect: items } )
							}
							postTypes={ [
								{ slug: 'page', label: 'Pages' },
								{ slug: 'post', label: 'Posts' },
							] }
							postTypeLabel={ 'widget' }
							postTypeLabelPlural={ 'widgets' }
							selectedItems={ selectedPostsForAutocompleteWithSuggestionsMultiSelect }
						/>
					</Card>
					<Card>
						<h2>{ __( 'Plugin toggles', 'newspack' ) }</h2>
						<PluginToggle
							plugins={ {
								woocommerce: {
									shouldRefreshAfterUpdate: true,
								},
								'fb-instant-articles': {
									actionText: __( 'Configure Instant Articles' ),
									href: '/wp-admin/admin.php?page=newspack',
								},
							} }
						/>
					</Card>
					<Card>
						<h2>{ __( 'Web Previews', 'newspack' ) }</h2>
						<Card buttonsCard noBorder className="items-center">
							<WebPreview
								url="//newspack.com/"
								label={ __( 'Preview Newspack Blog', 'newspack' ) }
								variant="primary"
							/>
							<WebPreview
								url="//newspack.com/"
								renderButton={ ( { showPreview } ) => (
									<a href="#" onClick={ showPreview }>
										{ __( 'Preview Newspack Blog', 'newspack' ) }
									</a>
								) }
							/>
						</Card>
					</Card>
					<Card>
						<h2>{ __( 'Waiting', 'newspack' ) }</h2>
						<Card buttonsCard noBorder>
							<Grid columns={ 1 } gutter={ 16 } className="w-100">
								<Waiting />
								<div className="flex items-center">
									<Waiting isLeft />
									{ __( 'Spinner on the left', 'newspack' ) }
								</div>
								<div className="flex items-center">
									<Waiting isRight />
									{ __( 'Spinner on the right', 'newspack' ) }
								</div>
								<Waiting isCenter />
							</Grid>
						</Card>
					</Card>
					<Card>
						<h2>{ __( 'Color picker', 'newspack' ) }</h2>
						<ColorPicker
							label={ __( 'Color Picker', 'newspack' ) }
							color={ color1 }
							onChange={ color => this.setState( { color1: color } ) }
						/>
					</Card>
					<Card>
						<h2>{ __( 'Handoff Buttons', 'newspack' ) }</h2>
						<Card buttonsCard noBorder>
							<Handoff
								modalTitle={ __( 'Manage AMP', 'newspack' ) }
								modalBody={ __(
									'Click to go to the AMP dashboard. There will be a notification bar at the top with a link to return to Newspack.',
									'newspack'
								) }
								plugin="amp"
								isTertiary
							/>
							<Handoff plugin="jetpack" />
							<Handoff plugin="google-site-kit" />
							<Handoff plugin="woocommerce" />
							<Handoff
								plugin="wordpress-seo"
								isPrimary
								editLink="/wp-admin/admin.php?page=wpseo_dashboard#top#features"
							>
								{ __( 'Specific Yoast Page', 'newspack' ) }
							</Handoff>
						</Card>
					</Card>
					<Card>
						<h2>{ __( 'Modal', 'newspack' ) }</h2>
						<Card buttonsCard noBorder>
							<Button isPrimary onClick={ () => this.setState( { modalShown: true } ) }>
								{ __( 'Open modal', 'newspack' ) }
							</Button>
						</Card>
						{ modalShown && (
							<Modal
								title={ __( 'This is the modal title', 'newspack' ) }
								onRequestClose={ () => this.setState( { modalShown: false } ) }
							>
								<p>
									{ __(
										'Based on industry research, we advise to test the modal component, and continuing this sentence so we can see how the text wraps is one good way of doing that.',
										'newspack'
									) }
								</p>
								<Card buttonsCard noBorder className="justify-end">
									<Button isPrimary onClick={ () => this.setState( { modalShown: false } ) }>
										{ __( 'Dismiss', 'newspack' ) }
									</Button>
									<Button isSecondary onClick={ () => this.setState( { modalShown: false } ) }>
										{ __( 'Also dismiss', 'newspack' ) }
									</Button>
								</Card>
							</Modal>
						) }
					</Card>
					<Card>
						<h2>{ __( 'Notice', 'newspack' ) }</h2>
						<Notice noticeText={ __( 'This is an info notice.', 'newspack' ) } />
						<Notice noticeText={ __( 'This is an error notice.', 'newspack' ) } isError />
						<Notice noticeText={ __( 'This is a help notice.', 'newspack' ) } isHelp />
						<Notice noticeText={ __( 'This is a success notice.', 'newspack' ) } isSuccess />
						<Notice noticeText={ __( 'This is a warning notice.', 'newspack' ) } isWarning />
					</Card>
					<Card>
						<h2>{ __( 'Plugin installer', 'newspack' ) }</h2>
						<PluginInstaller
							plugins={ [ 'woocommerce', 'wordpress-seo' ] }
							canUninstall
							onStatus={ ( { complete, pluginInfo } ) => {
								console.log(
									complete
										? 'All plugins installed successfully'
										: 'Plugin installation incomplete',
									pluginInfo
								);
							} }
						/>
					</Card>
					<Card>
						<h2>{ __( 'Plugin installer (small)', 'newspack' ) }</h2>
						<PluginInstaller
							plugins={ [ 'woocommerce', 'wordpress-seo' ] }
							isSmall
							canUninstall
							onStatus={ ( { complete, pluginInfo } ) => {
								console.log(
									complete
										? 'All plugins installed successfully'
										: 'Plugin installation incomplete',
									pluginInfo
								);
							} }
						/>
					</Card>
					<ActionCard
						title={ __( 'Example One', 'newspack' ) }
						description={ __( 'Has an action button.', 'newspack' ) }
						actionText={ __( 'Install', 'newspack' ) }
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
					/>
					<ActionCard
						title={ __( 'Example Two', 'newspack' ) }
						description={ __( 'Has action button and secondary button.', 'newspack' ) }
						actionText={ __( 'Edit', 'newspack' ) }
						secondaryActionText={ __( 'Delete', 'newspack' ) }
						secondaryDestructive
						onClick={ () => {
							console.log( 'Edit clicked' );
						} }
						onSecondaryActionClick={ () => {
							console.log( 'Delete clicked' );
						} }
					/>
					<ActionCard
						title={ __( 'Example Three', 'newspack' ) }
						description={ __( 'Waiting/in-progress state, no action button.', 'newspack' ) }
						actionText={ __( 'Installing…', 'newspack' ) }
						isWaiting
					/>
					<ActionCard
						title={ __( 'Example Four', 'newspack' ) }
						description={ __( 'Error notification', 'newspack' ) }
						actionText={ __( 'Install', 'newspack' ) }
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
						notification={
							<Fragment>
								Plugin cannot be installed <a href="#">Retry</a> | <a href="#">Documentation</a>
							</Fragment>
						}
						notificationLevel="error"
					/>
					<ActionCard
						title={ __( 'Example Five', 'newspack' ) }
						description={ __( 'Warning notification, action button', 'newspack' ) }
						notification={
							<Fragment>
								There is a new version available. <a href="#">View details</a> or{ ' ' }
								<a href="#">update now</a>
							</Fragment>
						}
						notificationLevel="warning"
					/>
					<ActionCard
						title={ __( 'Example Six', 'newspack' ) }
						description={ __( 'Static text, no button', 'newspack' ) }
						actionText={ __( 'Active', 'newspack' ) }
					/>
					<ActionCard
						title={ __( 'Example Seven', 'newspack' ) }
						description={ __( 'Static text, secondary action button.', 'newspack' ) }
						actionText={ __( 'Active', 'newspack' ) }
						secondaryActionText={ __( 'Delete', 'newspack' ) }
						secondaryDestructive
						onSecondaryActionClick={ () => {
							console.log( 'Delete clicked' );
						} }
					/>
					<ActionCard
						title={ __( 'Example Eight', 'newspack' ) }
						description={ __( 'Image with link and action button.', 'newspack' ) }
						actionText={ __( 'Configure', 'newspack' ) }
						onClick={ () => {
							console.log( 'Configure clicked' );
						} }
						image="https://i0.wp.com/newspack.com/wp-content/uploads/2020/06/pexels-photo-3183150.jpeg"
						imageLink="https://newspack.com"
					/>
					<ActionCard
						title={ __( 'Example Nine', 'newspack' ) }
						description={ __( 'Action Card with Toggle Control.', 'newspack' ) }
						actionText={ actionCardToggleChecked && __( 'Configure', 'newspack' ) }
						onClick={ () => {
							console.log( 'Configure clicked' );
						} }
						toggleOnChange={ checked => this.setState( { actionCardToggleChecked: checked } ) }
						toggleChecked={ actionCardToggleChecked }
					/>
					<ActionCard
						badge={ __( 'Premium', 'newspack' ) }
						title={ __( 'Example Ten', 'newspack' ) }
						description={ __( 'An example of an action card with a badge.', 'newspack' ) }
						actionText={ __( 'Install', 'newspack' ) }
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
					/>
					<ActionCard
						isSmall
						title={ __( 'Example Eleven', 'newspack' ) }
						description={ __( 'An example of a small action card.', 'newspack' ) }
						actionText={ __( 'Installing', 'newspack' ) }
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
					/>
					<ActionCard
						title={ __( 'Example Twelve', 'newspack' ) }
						description={ __( 'Action card with an unchecked checkbox.', 'newspack' ) }
						actionText={ __( 'Configure', 'newspack' ) }
						onClick={ () => {
							console.log( 'Configure' );
						} }
						checkbox="unchecked"
					/>
					<ActionCard
						title={ __( 'Example Thirteen', 'newspack' ) }
						description={ __( 'Action card with a checked checkbox.', 'newspack' ) }
						secondaryActionText={ __( 'Disconnect', 'newspack' ) }
						onSecondaryActionClick={ () => {
							console.log( 'Disconnect' );
						} }
						checkbox="checked"
					/>
					<ActionCard
						badge={ [ __( 'Premium', 'newspack' ), __( 'Archived', 'newspack' ) ] }
						title={ __( 'Example Fourteen', 'newspack' ) }
						description={ __( 'An example of an action card with two badges.', 'newspack' ) }
						actionText={ __( 'Install', 'newspack' ) }
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
					/>
					<ActionCard
						title={ __( 'Handoff', 'newspack' ) }
						description={ __( 'An example of an action card with Handoff.', 'newspack' ) }
						actionText={ __( 'Configure', 'newspack' ) }
						handoff="jetpack"
					/>
					<ActionCard
						title={ __( 'Handoff', 'newspack' ) }
						description={ __(
							' An example of an action card with Handoff and EditLink.',
							'newspack'
						) }
						actionText={ __( 'Configure', 'newspack' ) }
						handoff="jetpack"
						editLink="admin.php?page=jetpack#/settings"
					/>
					<ActionCard
						expandable
						title={ __( 'Expandable', 'newspack' ) }
						description={ __(
							' An example of an action card with expandable inner content.',
							'newspack'
						) }
					>
						<p>{ __( 'Some inner content to display when the card is expanded.', 'newspack' ) }</p>
					</ActionCard>
					<Card>
						<h2>{ __( 'Image Uploader', 'newspack' ) }</h2>
						<ImageUpload
							image={ this.state.image }
							onChange={ image => {
								this.setState( { image } );
								console.log( 'Image:' );
								console.log( image );
							} }
						/>
					</Card>
					<Card>
						<h2>{ __( 'Progress bar', 'newspack' ) }</h2>
						<ProgressBar completed="2" total="3" />
						<ProgressBar completed="2" total="5" label={ __( 'Progress made', 'newspack' ) } />
						<ProgressBar completed="0" total="5" displayFraction />
						<ProgressBar
							completed="3"
							total="8"
							label={ __( 'Progress made', 'newspack' ) }
							displayFraction
						/>
					</Card>
					<Card>
						<h2>{ __( 'Select dropdowns', 'newspack' ) }</h2>
						<Grid columns={ 1 } gutter={ 16 }>
							<SelectControl
								label={ __( 'Label for Select with a preselection', 'newspack' ) }
								value={ selectValue1 }
								options={ [
									{ value: null, label: __( '- Select -', 'newspack' ), disabled: true },
									{ value: '1st', label: __( 'First', 'newspack' ) },
									{ value: '2nd', label: __( 'Second', 'newspack' ) },
									{ value: '3rd', label: __( 'Third', 'newspack' ) },
								] }
								onChange={ value => this.setState( { selectValue1: value } ) }
							/>
							<SelectControl
								label={ __( 'Label for Select with no preselection', 'newspack' ) }
								value={ selectValue2 }
								options={ [
									{ value: null, label: __( '- Select -', 'newspack' ), disabled: true },
									{ value: '1st', label: __( 'First', 'newspack' ) },
									{ value: '2nd', label: __( 'Second', 'newspack' ) },
									{ value: '3rd', label: __( 'Third', 'newspack' ) },
								] }
								onChange={ value => this.setState( { selectValue2: value } ) }
							/>
							<SelectControl
								label={ __( 'Label for disabled Select', 'newspack' ) }
								disabled
								options={ [
									{ value: null, label: __( '- Select -', 'newspack' ), disabled: true },
									{ value: '1st', label: __( 'First', 'newspack' ) },
									{ value: '2nd', label: __( 'Second', 'newspack' ) },
									{ value: '3rd', label: __( 'Third', 'newspack' ) },
								] }
							/>
							<SelectControl
								label={ __( 'Small', 'newspack' ) }
								value={ selectValue3 }
								isSmall
								options={ [
									{ value: null, label: __( '- Select -', 'newspack' ), disabled: true },
									{ value: '1st', label: __( 'First', 'newspack' ) },
									{ value: '2nd', label: __( 'Second', 'newspack' ) },
									{ value: '3rd', label: __( 'Third', 'newspack' ) },
								] }
								onChange={ value => this.setState( { selectValue3: value } ) }
							/>
							<SelectControl
								multiple
								label={ __( 'Multi-select', 'newspack' ) }
								value={ this.state.selectValues }
								options={ [
									{ value: '1st', label: __( 'First', 'newspack' ) },
									{ value: '2nd', label: __( 'Second', 'newspack' ) },
									{ value: '3rd', label: __( 'Third', 'newspack' ) },
									{ value: '4th', label: __( 'Fourth', 'newspack' ) },
									{ value: '5th', label: __( 'Fifth', 'newspack' ) },
									{ value: '6th', label: __( 'Sixth', 'newspack' ) },
									{ value: '7th', label: __( 'Seventh', 'newspack' ) },
								] }
								onChange={ selectValues => this.setState( { selectValues } ) }
							/>
							<Notice
								noticeText={
									<>
										{ __( 'Selected:', 'newspack' ) }{ ' ' }
										{ this.state.selectValues.length > 0
											? this.state.selectValues.join( ', ' )
											: __( 'none', 'newspack' ) }
									</>
								}
							/>
						</Grid>
					</Card>
					<Card>
						<h2>{ __( 'Buttons', 'newspack' ) }</h2>
						<Grid columns={ 1 } gutter={ 16 }>
							<p>
								<strong>{ __( 'Default', 'newspack' ) }</strong>
							</p>
							<Card buttonsCard noBorder>
								<Button variant="primary">Primary</Button>
								<Button variant="secondary">Secondary</Button>
								<Button variant="tertiary">Tertiary</Button>
								<Button>Default</Button>
								<Button isLink>isLink</Button>
							</Card>
							<p>
								<strong>{ __( 'Disabled', 'newspack' ) }</strong>
							</p>
							<Card buttonsCard noBorder>
								<Button variant="primary" disabled>
									Primary
								</Button>
								<Button variant="secondary" disabled>
									Secondary
								</Button>
								<Button variant="tertiary" disabled>
									Tertiary
								</Button>
								<Button disabled>Default</Button>
								<Button isLink disabled>
									isLink
								</Button>
							</Card>
							<p>
								<strong>{ __( 'Small', 'newspack' ) }</strong>
							</p>
							<Card buttonsCard noBorder>
								<Button variant="primary" isSmall>
									isPrimary
								</Button>
								<Button variant="secondary" isSmall>
									isSecondary
								</Button>
								<Button variant="tertiary" isSmall>
									isTertiary
								</Button>
								<Button isSmall>Default</Button>
								<Button isLink isSmall>
									isLink
								</Button>
							</Card>
						</Grid>
					</Card>
					<Card>
						<h2>ButtonCard</h2>
						<ButtonCard
							href="admin.php?page=newspack-site-design-wizard"
							title={ __( 'Site Design', 'newspack' ) }
							desc={ __( 'Customize the look and feel of your site', 'newspack' ) }
							icon={ typography }
							chevron
						/>
						<ButtonCard
							href="#"
							title={ __( 'Start a new site', 'newspack' ) }
							desc={ __( "You don't have content to import", 'newspack' ) }
							icon={ plus }
							className="br--top"
							grouped
						/>
						<ButtonCard
							href="#"
							title={ __( 'Migrate an existing site', 'newspack' ) }
							desc={ __( 'You have content to import', 'newspack' ) }
							icon={ reusableBlock }
							className="br--bottom"
							grouped
						/>
						<ButtonCard
							href="#"
							title={ __( 'Add a new Podcast', 'newspack' ) }
							desc={ ( 'Small', 'newspack' ) }
							icon={ audio }
							className="br--top"
							isSmall
							grouped
						/>
						<ButtonCard
							href="#"
							title={ __( 'Add a new Font', 'newspack' ) }
							desc={ ( 'Small + chevron', 'newspack' ) }
							icon={ typography }
							className="br--bottom"
							chevron
							isSmall
							grouped
						/>
					</Card>
					<Card>
						<h2>{ __( 'Plugin Settings Section', 'newspack' ) }</h2>
						<PluginSettings.Section
							sectionKey="example"
							title={ __( 'Example plugin settings', 'newspack' ) }
							description={ __( 'Example plugin settings description', 'newspack' ) }
							active={ true }
							fields={ [
								{
									key: 'example_field',
									type: 'string',
									description: 'Example Text Field',
									help: 'Example text field help text',
									value: 'Example Value',
								},
								{
									key: 'example_checkbox_field',
									type: 'boolean',
									description: 'Example checkbox Field',
									help: 'Example checkbox field help text',
									value: false,
								},
								{
									key: 'example_options_field',
									type: 'string',
									description: 'Example options field',
									help: 'Example options field help text',
									options: [
										{
											value: 'example_value_1',
											name: 'Example Value 1',
										},
										{
											value: 'example_value_2',
											name: 'Example Value 2',
										},
									],
								},
								{
									key: 'example_multi_options_field',
									type: 'string',
									description: 'Example multiple options field',
									help: 'Example multiple options field help text',
									multiple: true,
									options: [
										{
											value: 'example_value_1',
											name: 'Example Value 1',
										},
										{
											value: 'example_value_2',
											name: 'Example Value 2',
										},
									],
								},
							] }
							onUpdate={ data => {
								console.log( 'Plugin Settings Section Updated', data );
							} }
							onChange={ ( key, val ) => {
								console.log( 'Plugin Settings Section Changed', { key, val } );
							} }
						/>
					</Card>
				</div>
				<Footer />
			</Fragment>
		);
	}
}

render( <ComponentsDemo />, document.getElementById( 'newspack-components-demo-wizard' ) );
